"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { dependencyFormSchema, type DependencyFormValues } from "@/lib/validations/dependency";

export async function createDependency(projectId: string, values: DependencyFormValues) {
  const parsed = dependencyFormSchema.parse(values);
  const dependency = await prisma.dependency.create({ data: { projectId, ...parsed } });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
  return dependency;
}

export async function updateDependency(projectId: string, id: string, values: DependencyFormValues) {
  const parsed = dependencyFormSchema.parse(values);
  const dependency = await prisma.dependency.update({ where: { id }, data: parsed });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
  return dependency;
}

export async function deleteDependency(projectId: string, id: string) {
  await prisma.dependency.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
}
