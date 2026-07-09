import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { ProjectCard } from "@/components/projects/project-card";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      milestones: { where: { achieved: false }, orderBy: { dueDate: "asc" }, take: 1 },
      risks: { where: { status: "OPEN" } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <NewProjectDialog />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </main>
  );
}
