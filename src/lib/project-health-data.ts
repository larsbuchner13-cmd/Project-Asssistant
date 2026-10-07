import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { computeProjectHealth } from "@/lib/project-health";

export async function loadProjectHealth(projectId: string) {
  await requireProjectAccess(projectId);
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: {
      framework: true,
      workPackages: { select: { plannedCost: true, actualCost: true, endDate: true, status: true } },
      tasks: { select: { dueDate: true, status: true } },
      milestones: { select: { dueDate: true, achieved: true } },
      backlogItems: { select: { status: true, sprint: { select: { endDate: true } } } },
      risks: { select: { probability: true, impact: true, status: true } },
      issues: { select: { status: true } },
    },
  });
  const deadlines = project.milestones.map(m => ({ dueDate: m.dueDate, done: m.achieved }));
  if (project.framework === "SCRUM") {
    for (const item of project.backlogItems) {
      if (item.sprint) deadlines.push({ dueDate: item.sprint.endDate, done: item.status === "DONE" });
    }
  } else {
    for (const item of [...project.tasks.map(t => ({ date: t.dueDate, status: t.status })), ...project.workPackages.map(w => ({ date: w.endDate, status: w.status }))]) {
      if (item.date) deadlines.push({ dueDate: item.date, done: item.status === "DONE" });
    }
  }
  return computeProjectHealth({
    framework: project.framework, deadlines,
    plannedCost: project.workPackages.reduce((sum, w) => sum + w.plannedCost, 0),
    actualCost: project.workPackages.reduce((sum, w) => sum + w.actualCost, 0),
    risks: project.risks, issues: project.issues,
  });
}
