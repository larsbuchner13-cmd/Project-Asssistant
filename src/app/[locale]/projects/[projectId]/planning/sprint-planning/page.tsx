import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { SprintPlanningView } from "@/components/scrum/sprint-planning-view";
import { SprintFormDialog } from "@/components/scrum/sprint-form-dialog";
import { Button } from "@/components/ui/button";

export default async function SprintPlanningPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("sprintPlanning");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [sprints, unassigned] = await Promise.all([
    prisma.sprint.findMany({
      where: { projectId },
      include: { items: true },
      orderBy: { startDate: "desc" },
    }),
    prisma.backlogItem.findMany({
      where: { projectId, sprintId: null },
      include: { sprint: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <SprintFormDialog
            projectId={project.id}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                {t("addSprint")}
              </Button>
            }
          />
        </div>
        <SprintPlanningView projectId={project.id} sprints={sprints} unassigned={unassigned} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
