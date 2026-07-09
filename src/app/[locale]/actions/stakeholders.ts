"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { stakeholderFormSchema, type StakeholderFormValues } from "@/lib/validations/stakeholder";

export async function createStakeholder(projectId: string, values: StakeholderFormValues) {
  await requireProjectAccess(projectId);
  const parsed = stakeholderFormSchema.parse(values);
  const stakeholder = await prisma.stakeholder.create({ data: { projectId, ...parsed } });
  revalidatePath(`/projects/${projectId}/initiating/stakeholders`);
  return stakeholder;
}

export async function updateStakeholder(
  projectId: string,
  stakeholderId: string,
  values: StakeholderFormValues
) {
  await requireProjectAccess(projectId);
  const parsed = stakeholderFormSchema.parse(values);
  const stakeholder = await prisma.stakeholder.update({
    where: { id: stakeholderId },
    data: parsed,
  });
  revalidatePath(`/projects/${projectId}/initiating/stakeholders`);
  return stakeholder;
}

export async function deleteStakeholder(projectId: string, stakeholderId: string) {
  await requireProjectAccess(projectId);
  await prisma.stakeholder.delete({ where: { id: stakeholderId } });
  revalidatePath(`/projects/${projectId}/initiating/stakeholders`);
}
