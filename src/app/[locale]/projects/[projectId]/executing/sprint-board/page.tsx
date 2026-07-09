import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { SprintBoard } from "@/components/scrum/sprint-board";
import { SprintSelector } from "@/components/scrum/sprint-selector";

export default async function SprintBoardPage({
  params: { projectId },
  searchParams,
}: {
  params: { projectId: string };
  searchParams: { sprintId?: string };
}) {
  const t = await getTranslations("sprintBoard");
  const tp = await getTranslations("sprintPlanning");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const sprints = await prisma.sprint.findMany({ where: { projectId }, orderBy: { startDate: "desc" } });
  const selectedSprintId = searchParams.sprintId ?? sprints[0]?.id;

  const items = selectedSprintId
    ? await prisma.backlogItem.findMany({
        where: { projectId, sprintId: selectedSprintId },
        include: { sprint: true },
        orderBy: { order: "asc" },
      })
    : [];

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          {selectedSprintId && <SprintSelector sprints={sprints} selectedId={selectedSprintId} />}
        </div>
        {selectedSprintId ? (
          <SprintBoard projectId={project.id} items={items} sprints={sprints} />
        ) : (
          <p className="text-sm text-muted-foreground">{tp("noSprints")}</p>
        )}
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
