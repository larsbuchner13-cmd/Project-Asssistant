export type HealthInput = {
  framework: string;
  deadlines: { dueDate: Date; done: boolean }[];
  plannedCost: number;
  actualCost: number;
  risks: { probability: number; impact: number; status: string }[];
  issues: { status: string }[];
};

export const healthWeights = { schedule: 35, budget: 25, risks: 20, issues: 20 } as const;
export type HealthDimension = keyof typeof healthWeights;
const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));

/** Version 1 heuristic, not a probability of project success or completion. */
export function computeProjectHealth(input: HealthInput, now = new Date()) {
  // Stored deadlines are calendar dates. Today is not overdue; use UTC consistently.
  const today = now.toISOString().slice(0, 10);
  const overdue = input.deadlines.filter(d => !d.done && d.dueDate.toISOString().slice(0, 10) < today).length;
  const activeRisks = input.risks.filter(r => r.status === "OPEN" || r.status === "OCCURRED");
  const exposure = activeRisks.reduce((sum, r) => sum + r.probability * r.impact, 0);
  const openIssues = input.issues.filter(i => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
  const scores: Record<HealthDimension, number | null> = {
    schedule: input.deadlines.length ? clamp(100 * (1 - overdue / input.deadlines.length)) : null,
    budget: input.plannedCost > 0 ? clamp(100 - Math.max(0, input.actualCost / input.plannedCost - 1) * 100) : null,
    risks: input.risks.length ? clamp(100 - exposure * 2) : null,
    issues: input.issues.length ? clamp(100 - openIssues * 10) : null,
  };
  const dimensions = (Object.keys(healthWeights) as HealthDimension[]).map(key => ({ key, weight: healthWeights[key], score: scores[key] }));
  const coverage = dimensions.reduce((sum, d) => sum + (d.score === null ? 0 : d.weight), 0);
  const score = coverage ? clamp(dimensions.reduce((sum, d) => sum + (d.score ?? 0) * d.weight, 0) / coverage) : null;
  return {
    version: 1, assessedAt: now.toISOString(), framework: input.framework,
    score, coverage, dimensions,
    status: score === null ? "unknown" : score >= 80 ? "healthy" : score >= 50 ? "attention" : "critical",
    evidence: { deadlines: input.deadlines.length, overdue, plannedCost: input.plannedCost, actualCost: input.actualCost, activeRisks: activeRisks.length, exposure, openIssues },
  };
}
export type ProjectHealth = ReturnType<typeof computeProjectHealth>;
