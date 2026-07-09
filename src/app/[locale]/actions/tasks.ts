"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { taskFormSchema, type TaskFormValues } from "@/lib/validations/task";

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
  const task = await prisma.task.create({
    data: { projectId, order: count, ...toTaskData(parsed) },
  });
  revalidatePath(`/projects/${projectId}/executing/taskboard`);
  return task;
}

export async function updateTask(projectId: string, taskId: string, values: TaskFormValues) {
  await requireProjectAccess(projectId);
  const parsed = taskFormSchema.parse(values);
  const task = await prisma.task.update({ where: { id: taskId }, data: toTaskData(parsed) });
  revalidatePath(`/projects/${projectId}/executing/taskboard`);
  return task;
}

export async function deleteTask(projectId: string, taskId: string) {
  await requireProjectAccess(projectId);
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/projects/${projectId}/executing/taskboard`);
}

export async function moveTask(
  projectId: string,
  taskId: string,
  status: TaskFormValues["status"],
  orderedIdsInColumn: string[]
) {
  await requireProjectAccess(projectId);
  await prisma.task.update({ where: { id: taskId }, data: { status } });
  await Promise.all(
    orderedIdsInColumn.map((id, index) => prisma.task.update({ where: { id }, data: { order: index } }))
  );
  revalidatePath(`/projects/${projectId}/executing/taskboard`);
}
