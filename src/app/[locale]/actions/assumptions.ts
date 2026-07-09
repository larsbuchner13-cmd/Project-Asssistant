"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { assumptionFormSchema, type AssumptionFormValues } from "@/lib/validations/assumption";

export async function createAssumption(projectId: string, values: AssumptionFormValues) {
  const parsed = assumptionFormSchema.parse(values);
  const assumption = await prisma.assumption.create({ data: { projectId, ...parsed } });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
  return assumption;
}

export async function updateAssumption(projectId: string, id: string, values: AssumptionFormValues) {
  const parsed = assumptionFormSchema.parse(values);
  const assumption = await prisma.assumption.update({ where: { id }, data: parsed });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
  return assumption;
}

export async function deleteAssumption(projectId: string, id: string) {
  await prisma.assumption.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
}
