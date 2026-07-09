import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { BudgetTable } from "@/components/planning/budget-table";

export default async function BudgetPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("budget");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const workPackages = await prisma.workPackage.findMany({
    where: { projectId },
    include: { successorOf: { include: { predecessor: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <BudgetTable workPackages={workPackages} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
