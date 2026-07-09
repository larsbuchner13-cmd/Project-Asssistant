"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { riskFormSchema, type RiskFormValues } from "@/lib/validations/risk";

export async function createRisk(projectId: string, values: RiskFormValues) {
  await requireProjectAccess(projectId);
  const parsed = riskFormSchema.parse(values);
  const risk = await prisma.risk.create({ data: { projectId, ...parsed } });
  revalidatePath(`/projects/${projectId}/planning/risks`);
  return risk;
}

export async function updateRisk(projectId: string, riskId: string, values: RiskFormValues) {
  await requireProjectAccess(projectId);
  const parsed = riskFormSchema.parse(values);
  const risk = await prisma.risk.update({ where: { id: riskId }, data: parsed });
  revalidatePath(`/projects/${projectId}/planning/risks`);
  return risk;
}

export async function deleteRisk(projectId: string, riskId: string) {
  await requireProjectAccess(projectId);
  await prisma.risk.delete({ where: { id: riskId } });
  revalidatePath(`/projects/${projectId}/planning/risks`);
}
