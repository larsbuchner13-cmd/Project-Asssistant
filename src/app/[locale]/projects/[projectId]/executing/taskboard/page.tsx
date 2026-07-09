import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { KanbanBoard } from "@/components/executing/kanban-board";

export default async function TaskboardPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("taskboard");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [tasks, workPackages] = await Promise.all([
    prisma.task.findMany({ where: { projectId }, include: { workPackage: true }, orderBy: { order: "asc" } }),
    prisma.workPackage.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <KanbanBoard projectId={project.id} tasks={tasks} workPackages={workPackages} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
