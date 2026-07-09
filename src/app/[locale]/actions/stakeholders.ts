"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { stakeholderFormSchema, type StakeholderFormValues } from "@/lib/validations/stakeholder";

export async function createStakeholder(projectId: string, values: StakeholderFormValues) {
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
  const parsed = stakeholderFormSchema.parse(values);
  const stakeholder = await prisma.stakeholder.update({
    where: { id: stakeholderId },
    data: parsed,
  });
  revalidatePath(`/projects/${projectId}/initiating/stakeholders`);
  return stakeholder;
}

export async function deleteStakeholder(projectId: string, stakeholderId: string) {
  await prisma.stakeholder.delete({ where: { id: stakeholderId } });
  revalidatePath(`/projects/${projectId}/initiating/stakeholders`);
}
