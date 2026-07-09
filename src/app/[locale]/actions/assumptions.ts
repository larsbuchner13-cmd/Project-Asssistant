"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { assumptionFormSchema, type AssumptionFormValues } from "@/lib/validations/assumption";

export async function createAssumption(projectId: string, values: AssumptionFormValues) {
  await requireProjectAccess(projectId);
  const parsed = assumptionFormSchema.parse(values);
  const assumption = await prisma.assumption.create({ data: { projectId, ...parsed } });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
  return assumption;
}

export async function updateAssumption(projectId: string, id: string, values: AssumptionFormValues) {
  await requireProjectAccess(projectId);
  const parsed = assumptionFormSchema.parse(values);
  const assumption = await prisma.assumption.update({ where: { id }, data: parsed });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
  return assumption;
}

export async function deleteAssumption(projectId: string, id: string) {
  await requireProjectAccess(projectId);
  await prisma.assumption.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
}
