import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { AuthzError, requireProjectAccess } from "@/lib/authz";
import { ProjectSidebar } from "@/components/layout/project-sidebar";

export default async function ProjectLayout({
  children,
  params: { projectId },
}: {
  children: React.ReactNode;
  params: { projectId: string; locale: string };
}) {
  try {
    await requireProjectAccess(projectId);
  } catch (e) {
    if (e instanceof AuthzError) notFound();
    throw e;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, framework: true },
  });

  if (!project) notFound();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <ProjectSidebar projectId={project.id} projectName={project.name} framework={project.framework} />
      <div className="flex-1 overflow-x-auto p-6">{children}</div>
    </div>
  );
}
