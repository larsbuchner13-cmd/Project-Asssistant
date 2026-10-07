import assert from "node:assert/strict";
import test from "node:test";
import { computeProjectHealth, type HealthInput } from "./project-health";
import { requestHealthAnalysis } from "./project-health-ai";

const now = new Date("2026-10-07T15:00:00Z");
const empty: HealthInput = { framework: "PMBOK", deadlines: [], plannedCost: 0, actualCost: 0, risks: [], issues: [] };
test("empty project is unknown, not 100% healthy", () => {
  const h = computeProjectHealth(empty, now);
  assert.equal(h.score, null);
  assert.equal(h.coverage, 0);
  assert.equal(h.status, "unknown");
});
test("today and completed deadlines are not overdue; missing dimensions are excluded", () => {
  const h = computeProjectHealth({ ...empty, deadlines: [
    { dueDate: new Date("2026-10-06"), done: false },
    { dueDate: new Date("2026-10-07"), done: false },
    { dueDate: new Date("2026-10-01"), done: true },
    { dueDate: new Date("2026-10-08"), done: false },
  ] }, now);
  assert.equal(h.evidence.overdue, 1);
  assert.equal(h.score, 75);
  assert.equal(h.coverage, 35);
});
test("weighted score penalizes overspend, occurred risks and active issues", () => {
  const h = computeProjectHealth({ ...empty,
    deadlines: [{ dueDate: new Date("2026-10-08"), done: false }],
    plannedCost: 100, actualCost: 150,
    risks: [{ probability: 5, impact: 5, status: "OCCURRED" }, { probability: 5, impact: 5, status: "CLOSED" }],
    issues: [{ status: "OPEN" }, { status: "IN_PROGRESS" }, { status: "RESOLVED" }],
  }, now);
  assert.equal(h.score, 74); // 35 + 12.5 + 10 + 16
  assert.equal(h.coverage, 100);
  assert.equal(h.evidence.exposure, 25);
});
test("extreme losses clamp to zero; actual cost without budget remains unknown", () => {
  assert.equal(computeProjectHealth({ ...empty, plannedCost: 1, actualCost: 1000 }, now).score, 0);
  assert.equal(computeProjectHealth({ ...empty, actualCost: 1000 }, now).score, null);
});
test("closed registers support healthy scores", () => {
  const h = computeProjectHealth({ ...empty, risks: [{ probability: 5, impact: 5, status: "CLOSED" }], issues: [{ status: "CLOSED" }] }, now);
  assert.equal(h.score, 100);
  assert.equal(h.coverage, 40);
});
const config = { apiKey: "test-only", model: "configured-model" };
const health = computeProjectHealth({ ...empty, plannedCost: 100 }, now);
test("AI request uses configured model and non-stored aggregated data", async () => {
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(init!.body as string);
    assert.equal(body.store, false);
    assert.equal(body.model, config.model);
    assert.deepEqual(JSON.parse(body.input), health);
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ summary: "Limited data.", recommendations: ["Add deadlines."] }) }] }] });
  };
  const result = await requestHealthAnalysis(health, "en", config, fetcher);
  assert.deepEqual(result.recommendations, ["Add deadlines."]);
});
test("provider failures, refusals and invalid structures fail safely", async () => {
  const responses = [
    new Response("unavailable", { status: 429 }),
    Response.json({ status: "incomplete", output: [] }),
    Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "No" }] }] }),
    Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: '{"score":100}' }] }] }),
  ];
  for (const response of responses) await assert.rejects(requestHealthAnalysis(health, "de", config, async () => response));
  await assert.rejects(requestHealthAnalysis(health, "de", config, async () => { throw new Error("timeout"); }));
});
