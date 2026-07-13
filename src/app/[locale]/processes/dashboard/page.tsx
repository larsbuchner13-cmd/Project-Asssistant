import { getTranslations } from "next-intl/server";
import { Activity, CheckCircle2, Clock, ShieldAlert, AlertTriangle, ListChecks } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import { computeProcessKpis } from "@/lib/process-kpi";
import { formatDate } from "@/lib/pm";
import { ProcessSubnav } from "@/components/processes/process-subnav";
import { KpiStatCard } from "@/components/processes/kpi-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function ProcessDashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("processes");
  await requireActiveUser();

  const runs = await prisma.processRun.findMany({
    include: {
      template: { select: { id: true, name: true } },
      steps: { include: { checklistItems: true, approver: { select: { name: true } } } },
    },
  });

  const kpi = computeProcessKpis(runs);
  const hasAnyRuns = runs.length > 0;
  const maxWeekCount = Math.max(1, ...kpi.throughputByWeek.map((w) => w.count));

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("kpi.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("kpi.subtitle")}</p>
      </div>
      <ProcessSubnav />

      {!hasAnyRuns ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("kpi.noData")}</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiStatCard icon={Activity} label={t("kpi.activeRuns")} value={String(kpi.activeRunsCount)} />
            <KpiStatCard icon={CheckCircle2} label={t("kpi.completedRuns")} value={String(kpi.completedRunsCount)} />
            <KpiStatCard
              icon={Clock}
              label={t("kpi.avgCycleTime")}
              value={kpi.avgCycleTimeDays != null ? `${kpi.avgCycleTimeDays.toFixed(1)} ${t("kpi.days")}` : "–"}
            />
            <KpiStatCard
              icon={ListChecks}
              label={t("kpi.checklistCompletion")}
              value={kpi.checklistCompletionPct != null ? `${kpi.checklistCompletionPct}%` : "–"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <ShieldAlert className="h-4 w-4 text-rag-amber" />
                <CardTitle className="text-base">{t("kpi.pendingApprovals")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {kpi.pendingApprovals.length === 0 && <p className="text-muted-foreground">–</p>}
                {kpi.pendingApprovals.map((p, i) => (
                  <Link key={i} href={`/processes/runs/${p.runId}`} className="flex justify-between gap-2 hover:underline">
                    <span>
                      {p.runName} · {p.stepName}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{p.approver ?? "–"}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <AlertTriangle className="h-4 w-4 text-rag-red" />
                <CardTitle className="text-base">{t("kpi.overdueSteps")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {kpi.overdueSteps.length === 0 && <p className="text-muted-foreground">–</p>}
                {kpi.overdueSteps.map((o, i) => (
                  <Link key={i} href={`/processes/runs/${o.runId}`} className="flex justify-between gap-2 hover:underline">
                    <span>
                      {o.runName} · {o.stepName}
                    </span>
                    <span className="shrink-0 text-rag-red">
                      {o.elapsedDays}/{o.targetDays} {t("kpi.days")}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("kpi.byTemplate")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {kpi.byTemplate.length === 0 && <p className="text-muted-foreground">–</p>}
              {kpi.byTemplate.map((row) => (
                <div key={row.templateId} className="flex items-center justify-between gap-2">
                  <Link href={`/processes/${row.templateId}`} className="hover:underline">
                    {row.name}
                  </Link>
                  <span className="text-muted-foreground">
                    {row.avgCycleTimeDays.toFixed(1)} {t("kpi.days")} · {row.runsCount} {t("kpi.runsCount")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("kpi.throughput")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {kpi.throughputByWeek.map((w, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-20 shrink-0 text-muted-foreground">{formatDate(w.weekStart, locale)}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(w.count / maxWeekCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 shrink-0 text-right font-medium">{w.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
