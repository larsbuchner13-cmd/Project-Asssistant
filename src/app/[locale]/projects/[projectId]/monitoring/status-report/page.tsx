import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { StatusReportView } from "@/components/monitoring/status-report-view";
import { GenerateReportButton } from "@/components/monitoring/generate-report-button";
import { computeBudgetBurnPct } from "@/app/[locale]/actions/status-reports";

export default async function StatusReportPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("statusReport");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [risks, milestones, openIssueCount, history, budgetBurnPct] = await Promise.all([
    prisma.risk.findMany({ where: { projectId, status: "OPEN" } }),
    prisma.milestone.findMany({ where: { projectId } }),
    prisma.issue.count({ where: { projectId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.statusReport.findMany({ where: { projectId }, orderBy: { weekOf: "desc" } }),
    computeBudgetBurnPct(projectId),
  ]);

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <GenerateReportButton projectId={project.id} />
        </div>
        <StatusReportView
          project={project}
          risks={risks}
          milestones={milestones}
          openIssueCount={openIssueCount}
          budgetBurnPct={budgetBurnPct}
          history={history}
        />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
