import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { RiskTable } from "@/components/planning/risk-table";
import { RiskFormDialog } from "@/components/planning/risk-form-dialog";
import { Card, CardContent } from "@/components/ui/card";

export default async function RisksPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("risks");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { risks: { orderBy: { createdAt: "desc" } } },
  });

  if (!project) notFound();

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <RiskFormDialog projectId={project.id} />
        </div>
        <Card>
          <CardContent className="pt-6">
            <RiskTable projectId={project.id} risks={project.risks} />
          </CardContent>
        </Card>
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
