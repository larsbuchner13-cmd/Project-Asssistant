import { describe, expect, it } from "vitest";

import { computeProcessKpis } from "./process-kpi";

const now = new Date("2026-07-30T12:00:00.000Z");

function run(overrides: Record<string, unknown> = {}) {
  return {
    id: "run-1",
    name: "Customer onboarding",
    status: "ACTIVE",
    startedAt: new Date("2026-07-28T12:00:00.000Z"),
    completedAt: null,
    template: { id: "template-1", name: "Onboarding" },
    steps: [],
    ...overrides,
  };
}

describe("computeProcessKpis", () => {
  it("returns empty-state metrics without producing NaN", () => {
    const result = computeProcessKpis([], now);

    expect(result.activeRunsCount).toBe(0);
    expect(result.completedRunsCount).toBe(0);
    expect(result.avgCycleTimeDays).toBeNull();
    expect(result.checklistCompletionPct).toBeNull();
    expect(result.byTemplate).toEqual([]);
    expect(result.throughputByWeek).toHaveLength(8);
  });

  it("computes checklist progress and pending approvals", () => {
    const result = computeProcessKpis(
      [
        run({
          steps: [
            {
              name: "Approval",
              status: "IN_PROGRESS",
              requiresApproval: true,
              approvalStatus: "PENDING",
              startedAt: new Date("2026-07-30T06:00:00.000Z"),
              targetDays: 1,
              checklistItems: [{ done: true }, { done: false }],
              approver: { name: "Ada" },
            },
          ],
        }),
      ],
      now
    );

    expect(result.checklistCompletionPct).toBe(50);
    expect(result.pendingApprovals).toEqual([
      { runId: "run-1", runName: "Customer onboarding", stepName: "Approval", approver: "Ada" },
    ]);
  });

  it("honours fractional target days when detecting overdue steps", () => {
    const result = computeProcessKpis(
      [
        run({
          steps: [
            {
              name: "Fast review",
              status: "IN_PROGRESS",
              requiresApproval: false,
              approvalStatus: "NOT_REQUIRED",
              startedAt: new Date("2026-07-29T18:00:00.000Z"),
              targetDays: 0.5,
              checklistItems: [],
              approver: null,
            },
          ],
        }),
      ],
      now
    );

    expect(result.overdueSteps).toEqual([
      {
        runId: "run-1",
        runName: "Customer onboarding",
        stepName: "Fast review",
        elapsedDays: 0.8,
        targetDays: 0.5,
      },
    ]);
  });

  it("aggregates completed cycle time by template", () => {
    const result = computeProcessKpis(
      [
        run({ status: "COMPLETED", completedAt: new Date("2026-07-30T12:00:00.000Z") }),
        run({
          id: "run-2",
          status: "COMPLETED",
          startedAt: new Date("2026-07-26T12:00:00.000Z"),
          completedAt: new Date("2026-07-30T12:00:00.000Z"),
        }),
      ],
      now
    );

    expect(result.avgCycleTimeDays).toBe(3);
    expect(result.byTemplate).toEqual([
      { templateId: "template-1", name: "Onboarding", runsCount: 2, avgCycleTimeDays: 3 },
    ]);
  });
});
