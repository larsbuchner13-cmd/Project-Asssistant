import { z } from "zod";
import type { ProjectHealth } from "./project-health";

const analysisSchema = z.object({
  summary: z.string().min(1).max(2000),
  recommendations: z.array(z.string().min(1).max(700)).min(1).max(3),
}).strict();
export type HealthAnalysis = z.infer<typeof analysisSchema>;

export async function requestHealthAnalysis(health: ProjectHealth, locale: "de" | "en", config: { apiKey: string; model: string }, fetcher: typeof fetch = fetch): Promise<HealthAnalysis> {
  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify({
      model: config.model, store: false, max_output_tokens: 1500,
      instructions: `You are a project management analyst. Respond in ${locale === "de" ? "German" : "English"}. Explain the supplied deterministic health score and give 1-3 concrete next actions grounded only in the supplied metrics. Never invent facts, names, causes, deadlines or a new score. Score is a heuristic, not completion or success probability. Explicitly mention missing dimensions and limited coverage. Budget only measures recorded overspend, not forecast. No overdue records does not prove the project is on track.`,
      input: JSON.stringify(health),
      text: { format: { type: "json_schema", name: "project_health", strict: true, schema: {
        type: "object", additionalProperties: false,
        properties: { summary: { type: "string" }, recommendations: { type: "array", items: { type: "string" } } },
        required: ["summary", "recommendations"],
      } } },
    }),
  });
  if (!response.ok) throw new Error("Health analysis provider failed");
  const data = await response.json();
  if (data.status !== "completed" || !Array.isArray(data.output)) throw new Error("Incomplete health analysis");
  const text = data.output.flatMap((item: { type: string; content?: { type: string; text?: string }[] }) => item.type === "message" ? item.content ?? [] : [])
    .filter((item: { type: string }) => item.type === "output_text")
    .map((item: { text?: string }) => item.text ?? "").join("");
  return analysisSchema.parse(JSON.parse(text));
}
