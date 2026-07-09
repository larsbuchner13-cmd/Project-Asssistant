"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { changeRequestFormSchema, type ChangeRequestFormValues } from "@/lib/validations/change-request";

function toData(parsed: ChangeRequestFormValues) {
  return {
    description: parsed.description,
    impactScope: parsed.impactScope || null,
    impactTime: parsed.impactTime || null,
    impactCost: parsed.impactCost || null,
    status: parsed.status,
    requestedBy: parsed.requestedBy || null,
    decisionDate: parsed.decisionDate ? new Date(parsed.decisionDate) : null,
  };
}

export async function createChangeRequest(projectId: string, values: ChangeRequestFormValues) {
  const parsed = changeRequestFormSchema.parse(values);
  const cr = await prisma.changeRequest.create({ data: { projectId, ...toData(parsed) } });
  revalidatePath(`/projects/${projectId}/monitoring/change-requests`);
  return cr;
}

export async function updateChangeRequest(projectId: string, id: string, values: ChangeRequestFormValues) {
  const parsed = changeRequestFormSchema.parse(values);
  const cr = await prisma.changeRequest.update({ where: { id }, data: toData(parsed) });
  revalidatePath(`/projects/${projectId}/monitoring/change-requests`);
  return cr;
}

export async function deleteChangeRequest(projectId: string, id: string) {
  await prisma.changeRequest.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/monitoring/change-requests`);
}
