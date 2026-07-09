"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { backlogItemFormSchema, type BacklogItemFormValues } from "@/lib/validations/backlog-item";

function toData(parsed: BacklogItemFormValues) {
  return {
    title: parsed.title,
    description: parsed.description || null,
    storyPoints: parsed.storyPoints === "" || parsed.storyPoints == null ? null : Number(parsed.storyPoints),
    priority: parsed.priority,
    status: parsed.status,
    sprintId: parsed.sprintId || null,
    completedAt: parsed.status === "DONE" ? new Date() : null,
  };
}

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}/planning/backlog`);
  revalidatePath(`/projects/${projectId}/planning/sprint-planning`);
  revalidatePath(`/projects/${projectId}/executing/sprint-board`);
  revalidatePath(`/projects/${projectId}/executing/burndown`);
}

export async function createBacklogItem(projectId: string, values: BacklogItemFormValues) {
  const parsed = backlogItemFormSchema.parse(values);
  const count = await prisma.backlogItem.count({ where: { projectId } });
  const item = await prisma.backlogItem.create({
    data: { projectId, order: count, ...toData(parsed) },
  });
  revalidate(projectId);
  return item;
}

export async function updateBacklogItem(projectId: string, id: string, values: BacklogItemFormValues) {
  const parsed = backlogItemFormSchema.parse(values);
  const item = await prisma.backlogItem.update({ where: { id }, data: toData(parsed) });
  revalidate(projectId);
  return item;
}

export async function deleteBacklogItem(projectId: string, id: string) {
  await prisma.backlogItem.delete({ where: { id } });
  revalidate(projectId);
}

export async function assignToSprint(projectId: string, id: string, sprintId: string | null) {
  await prisma.backlogItem.update({ where: { id }, data: { sprintId } });
  revalidate(projectId);
}

export async function moveBacklogItemStatus(
  projectId: string,
  id: string,
  status: BacklogItemFormValues["status"],
  orderedIdsInColumn: string[]
) {
  await prisma.backlogItem.update({
    where: { id },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });
  await Promise.all(
    orderedIdsInColumn.map((itemId, index) =>
      prisma.backlogItem.update({ where: { id: itemId }, data: { order: index } })
    )
  );
  revalidate(projectId);
}
