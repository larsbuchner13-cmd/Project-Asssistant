import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { DecisionList } from "@/components/executing/decision-list";
import { DecisionFormDialog } from "@/components/executing/decision-form-dialog";
import { Button } from "@/components/ui/button";

export default async function DecisionsPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("decisions");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const decisions = await prisma.decision.findMany({
    where: { projectId },
    include: { actionItems: true },
    orderBy: { meetingDate: "desc" },
  });

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <DecisionFormDialog
            projectId={project.id}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                {t("addDecision")}
              </Button>
            }
          />
        </div>
        <DecisionList projectId={project.id} decisions={decisions} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
