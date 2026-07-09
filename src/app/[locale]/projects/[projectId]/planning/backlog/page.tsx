import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { BacklogTable } from "@/components/scrum/backlog-table";
import { BacklogItemFormDialog } from "@/components/scrum/backlog-item-form-dialog";
import { Button } from "@/components/ui/button";

export default async function BacklogPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("backlog");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [items, sprints] = await Promise.all([
    prisma.backlogItem.findMany({
      where: { projectId },
      include: { sprint: true },
      orderBy: [{ sprintId: "asc" }, { order: "asc" }],
    }),
    prisma.sprint.findMany({ where: { projectId }, orderBy: { startDate: "desc" } }),
  ]);

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <BacklogItemFormDialog
            projectId={project.id}
            sprints={sprints}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                {t("addItem")}
              </Button>
            }
          />
        </div>
        <BacklogTable projectId={project.id} items={items} sprints={sprints} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
