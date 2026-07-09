import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { StakeholderMatrix } from "@/components/initiating/stakeholder-matrix";
import { StakeholderTable } from "@/components/initiating/stakeholder-table";
import { StakeholderFormDialog } from "@/components/initiating/stakeholder-form-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StakeholdersPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  const t = await getTranslations("stakeholders");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { stakeholders: { orderBy: { createdAt: "asc" } } },
  });

  if (!project) notFound();

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <StakeholderFormDialog projectId={project.id} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("matrix")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StakeholderMatrix stakeholders={project.stakeholders} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <StakeholderTable projectId={project.id} stakeholders={project.stakeholders} />
          </CardContent>
        </Card>
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
