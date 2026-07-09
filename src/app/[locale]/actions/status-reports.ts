"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { riskScore, riskScoreVariant } from "@/lib/pm";

export async function computeBudgetBurnPct(projectId: string) {
  const workPackages = await prisma.workPackage.findMany({ where: { projectId } });
  const planned = workPackages.reduce((sum, wp) => sum + wp.plannedCost, 0);
  const actual = workPackages.reduce((sum, wp) => sum + wp.actualCost, 0);
  return planned > 0 ? Math.round((actual / planned) * 1000) / 10 : 0;
}

export async function generateStatusReport(projectId: string, locale: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  const [risks, milestones, openIssues, t] = await Promise.all([
    prisma.risk.findMany({ where: { projectId, status: "OPEN" } }),
    prisma.milestone.findMany({ where: { projectId } }),
    prisma.issue.count({ where: { projectId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    getTranslations({ locale, namespace: "statusReport" }),
  ]);
  const tRag = await getTranslations({ locale, namespace: "rag" });

  const budgetBurnPct = await computeBudgetBurnPct(projectId);

  const topRisks = [...risks]
    .sort((a, b) => riskScore(b.probability, b.impact) - riskScore(a.probability, a.impact))
    .slice(0, 5);

  const highRiskCount = topRisks.filter((r) => riskScoreVariant(riskScore(r.probability, r.impact)) === "red").length;
  const achievedMilestones = milestones.filter((m) => m.achieved).length;

  const summary = [
    `RAG: ${tRag(project.ragStatus)}.`,
    `${t("milestoneProgress")}: ${achievedMilestones}/${milestones.length}.`,
    `${t("topRisks")}: ${highRiskCount}.`,
    `${t("openIssues")}: ${openIssues}.`,
    `${t("budgetBurn")}: ${budgetBurnPct}%.`,
  ].join(" ");

  const report = await prisma.statusReport.create({
    data: {
      projectId,
      weekOf: new Date(),
      ragStatus: project.ragStatus,
      summary,
      budgetBurnPct,
    },
  });

  revalidatePath(`/projects/${projectId}/monitoring/status-report`);
  return report;
}

export async function deleteStatusReport(projectId: string, reportId: string) {
  await prisma.statusReport.delete({ where: { id: reportId } });
  revalidatePath(`/projects/${projectId}/monitoring/status-report`);
}
