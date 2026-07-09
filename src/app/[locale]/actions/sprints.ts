"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { sprintFormSchema, type SprintFormValues } from "@/lib/validations/sprint";

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}/planning/backlog`);
  revalidatePath(`/projects/${projectId}/planning/sprint-planning`);
  revalidatePath(`/projects/${projectId}/executing/sprint-board`);
  revalidatePath(`/projects/${projectId}/executing/burndown`);
}

export async function createSprint(projectId: string, values: SprintFormValues) {
  const parsed = sprintFormSchema.parse(values);
  const sprint = await prisma.sprint.create({
    data: {
      projectId,
      name: parsed.name,
      goal: parsed.goal || null,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
    },
  });
  revalidate(projectId);
  return sprint;
}

export async function updateSprint(projectId: string, id: string, values: SprintFormValues) {
  const parsed = sprintFormSchema.parse(values);
  const sprint = await prisma.sprint.update({
    where: { id },
    data: {
      name: parsed.name,
      goal: parsed.goal || null,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
    },
  });
  revalidate(projectId);
  return sprint;
}

export async function deleteSprint(projectId: string, id: string) {
  await prisma.sprint.delete({ where: { id } });
  revalidate(projectId);
}
