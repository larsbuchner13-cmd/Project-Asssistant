"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { backlogItemFormSchema, type BacklogItemFormValues } from "@/lib/validations/backlog-item";
import { assertSprintId, recordIdsSchema, taskStatusSchema } from "@/lib/project-references";

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
  await requireProjectAccess(projectId);
  const parsed = backlogItemFormSchema.parse(values);
  const count = await prisma.backlogItem.count({ where: { projectId } });
  const item = await prisma.$transaction(async (tx) => {
    await assertSprintId(tx, projectId, parsed.sprintId);
    return tx.backlogItem.create({ data: { projectId, order: count, ...toData(parsed) } });
  });
  revalidate(projectId);
  return item;
}

export async function updateBacklogItem(projectId: string, id: string, values: BacklogItemFormValues) {
  await requireProjectAccess(projectId);
  const parsed = backlogItemFormSchema.parse(values);
  const item = await prisma.$transaction(async (tx) => {
    await assertSprintId(tx, projectId, parsed.sprintId);
    return tx.backlogItem.update({ where: { id, projectId }, data: toData(parsed) });
  });
  revalidate(projectId);
  return item;
}

export async function deleteBacklogItem(projectId: string, id: string) {
  await requireProjectAccess(projectId);
  await prisma.backlogItem.delete({ where: { id, projectId } });
  revalidate(projectId);
}

export async function assignToSprint(projectId: string, id: string, sprintId: string | null) {
  await requireProjectAccess(projectId);
  await prisma.$transaction(async (tx) => {
    await assertSprintId(tx, projectId, sprintId);
    await tx.backlogItem.update({ where: { id, projectId }, data: { sprintId } });
  });
  revalidate(projectId);
}

export async function moveBacklogItemStatus(
  projectId: string,
  id: string,
  status: BacklogItemFormValues["status"],
  orderedIdsInColumn: string[]
) {
  await requireProjectAccess(projectId);
  const nextStatus = taskStatusSchema.parse(status);
  const ids = recordIdsSchema.parse(orderedIdsInColumn);
  await prisma.$transaction(async (tx) => {
    await tx.backlogItem.update({
      where: { id, projectId },
      data: { status: nextStatus, completedAt: nextStatus === "DONE" ? new Date() : null },
    });
    for (const [index, itemId] of ids.entries()) {
      await tx.backlogItem.update({ where: { id: itemId, projectId, status: nextStatus }, data: { order: index } });
    }
  });
  revalidate(projectId);
}
