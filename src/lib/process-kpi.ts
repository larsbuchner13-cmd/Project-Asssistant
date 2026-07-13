import { differenceInCalendarDays, startOfWeek, addWeeks, isWithinInterval, endOfWeek } from "date-fns";

type KpiChecklistItem = { done: boolean };
type KpiStep = {
  name: string;
  status: string;
  requiresApproval: boolean;
  approvalStatus: string;
  startedAt: Date | null;
  targetDays: number | null;
  checklistItems: KpiChecklistItem[];
  approver: { name: string } | null;
};
type KpiRun = {
  id: string;
  name: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  template: { id: string; name: string };
  steps: KpiStep[];
};

export function computeProcessKpis(runs: KpiRun[]) {
  const activeRuns = runs.filter((r) => r.status === "ACTIVE");
  const completedRuns = runs.filter((r) => r.status === "COMPLETED");

  const cycleTimes = completedRuns
    .filter((r) => r.completedAt)
    .map((r) => differenceInCalendarDays(r.completedAt as Date, r.startedAt));
  const avgCycleTimeDays = cycleTimes.length > 0 ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length : null;

  const pendingApprovals = activeRuns.flatMap((run) =>
    run.steps
      .filter((s) => s.approvalStatus === "PENDING")
      .map((s) => ({ runId: run.id, runName: run.name, stepName: s.name, approver: s.approver?.name ?? null }))
  );

  const now = new Date();
  const overdueSteps = activeRuns.flatMap((run) =>
    run.steps
      .filter((s) => (s.status === "READY" || s.status === "IN_PROGRESS") && s.targetDays != null)
      .map((s) => ({
        run,
        s,
        elapsedDays: differenceInCalendarDays(now, s.startedAt ?? run.startedAt),
      }))
      .filter(({ elapsedDays, s }) => elapsedDays > (s.targetDays as number))
      .map(({ run, s, elapsedDays }) => ({
        runId: run.id,
        runName: run.name,
        stepName: s.name,
        elapsedDays,
        targetDays: s.targetDays as number,
      }))
  );

  let checklistDone = 0;
  let checklistTotal = 0;
  for (const run of activeRuns) {
    for (const step of run.steps) {
      checklistDone += step.checklistItems.filter((i) => i.done).length;
      checklistTotal += step.checklistItems.length;
    }
  }
  const checklistCompletionPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : null;

  const byTemplateMap = new Map<string, { name: string; cycleTimes: number[] }>();
  for (const run of completedRuns) {
    if (!run.completedAt) continue;
    const entry = byTemplateMap.get(run.template.id) ?? { name: run.template.name, cycleTimes: [] };
    entry.cycleTimes.push(differenceInCalendarDays(run.completedAt, run.startedAt));
    byTemplateMap.set(run.template.id, entry);
  }
  const byTemplate = Array.from(byTemplateMap.entries())
    .map(([templateId, { name, cycleTimes }]) => ({
      templateId,
      name,
      runsCount: cycleTimes.length,
      avgCycleTimeDays: cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length,
    }))
    .sort((a, b) => b.runsCount - a.runsCount);

  const weeks: { weekStart: Date; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(addWeeks(now, -i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const count = completedRuns.filter(
      (r) => r.completedAt && isWithinInterval(r.completedAt, { start: weekStart, end: weekEnd })
    ).length;
    weeks.push({ weekStart, count });
  }

  return {
    activeRunsCount: activeRuns.length,
    completedRunsCount: completedRuns.length,
    avgCycleTimeDays,
    pendingApprovals,
    overdueSteps,
    checklistCompletionPct,
    byTemplate,
    throughputByWeek: weeks,
  };
}
