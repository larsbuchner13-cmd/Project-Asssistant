"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { taskFormSchema, type TaskFormValues } from "@/lib/validations/task";
import { assertWorkPackageIds, recordIdsSchema, taskStatusSchema } from "@/lib/project-references";

function toTaskData(parsed: TaskFormValues) {
  return {
    title: parsed.title,
    description: parsed.description || null,
    workPackageId: parsed.workPackageId || null,
    assignee: parsed.assignee || null,
    priority: parsed.priority,
    dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
    status: parsed.status,
  };
}

export async function createTask(projectId: string, values: TaskFormValues) {
  await requireProjectAccess(projectId);
  const parsed = taskFormSchema.parse(values);
  const count = await prisma.task.count({ where: { projectId, status: parsed.status } });
  const task = await prisma.$transaction(async (tx) => {
    await assertWorkPackageIds(tx, projectId, parsed.workPackageId ? [parsed.workPackageId] : []);
    return tx.task.create({ data: { projectId, order: count, ...toTaskData(parsed) } });
  });
  revalidatePath(`/projects/${projectId}/executing/taskboard`);
  return task;
}

export async function updateTask(projectId: string, taskId: string, values: TaskFormValues) {
  await requireProjectAccess(projectId);
  const parsed = taskFormSchema.parse(values);
  const task = await prisma.$transaction(async (tx) => {
    await assertWorkPackageIds(tx, projectId, parsed.workPackageId ? [parsed.workPackageId] : []);
    return tx.task.update({ where: { id: taskId, projectId }, data: toTaskData(parsed) });
  });
  revalidatePath(`/projects/${projectId}/executing/taskboard`);
  return task;
}

export async function deleteTask(projectId: string, taskId: string) {
  await requireProjectAccess(projectId);
  await prisma.task.delete({ where: { id: taskId, projectId } });
  revalidatePath(`/projects/${projectId}/executing/taskboard`);
}

export async function moveTask(
  projectId: string,
  taskId: string,
  status: TaskFormValues["status"],
  orderedIdsInColumn: string[]
) {
  await requireProjectAccess(projectId);
  const nextStatus = taskStatusSchema.parse(status);
  const ids = recordIdsSchema.parse(orderedIdsInColumn);
  await prisma.$transaction(async (tx) => {
    await tx.task.update({ where: { id: taskId, projectId }, data: { status: nextStatus } });
    for (const [index, id] of ids.entries()) {
      await tx.task.update({ where: { id, projectId, status: nextStatus }, data: { order: index } });
    }
  });
  revalidatePath(`/projects/${projectId}/executing/taskboard`);
}
