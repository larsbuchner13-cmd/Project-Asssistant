import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { StageGateList } from "@/components/prince2/stage-gate-list";
import { StageGateFormDialog } from "@/components/prince2/stage-gate-form-dialog";
import { Button } from "@/components/ui/button";

export default async function StageGatesPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("stageGates");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const stageGates = await prisma.stageGate.findMany({ where: { projectId }, orderBy: { order: "asc" } });

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <StageGateFormDialog
            projectId={project.id}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                {t("addStageGate")}
              </Button>
            }
          />
        </div>
        <StageGateList projectId={project.id} stageGates={stageGates} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
