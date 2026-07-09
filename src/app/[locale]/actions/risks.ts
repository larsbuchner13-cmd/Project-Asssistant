"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { riskFormSchema, type RiskFormValues } from "@/lib/validations/risk";

export async function createRisk(projectId: string, values: RiskFormValues) {
  const parsed = riskFormSchema.parse(values);
  const risk = await prisma.risk.create({ data: { projectId, ...parsed } });
  revalidatePath(`/projects/${projectId}/planning/risks`);
  return risk;
}

export async function updateRisk(projectId: string, riskId: string, values: RiskFormValues) {
  const parsed = riskFormSchema.parse(values);
  const risk = await prisma.risk.update({ where: { id: riskId }, data: parsed });
  revalidatePath(`/projects/${projectId}/planning/risks`);
  return risk;
}

export async function deleteRisk(projectId: string, riskId: string) {
  await prisma.risk.delete({ where: { id: riskId } });
  revalidatePath(`/projects/${projectId}/planning/risks`);
}
