"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { stageGateFormSchema, type StageGateFormValues, type ChecklistItem } from "@/lib/validations/stage-gate";

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}/planning/stage-gates`);
}

export async function createStageGate(projectId: string, values: StageGateFormValues) {
  const parsed = stageGateFormSchema.parse(values);
  const count = await prisma.stageGate.count({ where: { projectId } });
  const gate = await prisma.stageGate.create({
    data: {
      projectId,
      name: parsed.name,
      endDate: new Date(parsed.endDate),
      checklist: [],
      order: count,
    },
  });
  revalidate(projectId);
  return gate;
}

export async function updateStageGate(projectId: string, id: string, values: StageGateFormValues) {
  const parsed = stageGateFormSchema.parse(values);
  const gate = await prisma.stageGate.update({
    where: { id },
    data: { name: parsed.name, endDate: new Date(parsed.endDate) },
  });
  revalidate(projectId);
  return gate;
}

export async function deleteStageGate(projectId: string, id: string) {
  await prisma.stageGate.delete({ where: { id } });
  revalidate(projectId);
}

export async function toggleStageGateApproved(projectId: string, id: string, approved: boolean) {
  await prisma.stageGate.update({ where: { id }, data: { approved } });
  revalidate(projectId);
}

export async function addChecklistItem(projectId: string, id: string, label: string) {
  const gate = await prisma.stageGate.findUniqueOrThrow({ where: { id } });
  const checklist = (gate.checklist as ChecklistItem[]) ?? [];
  checklist.push({ label, done: false });
  await prisma.stageGate.update({ where: { id }, data: { checklist } });
  revalidate(projectId);
}

export async function toggleChecklistItem(projectId: string, id: string, index: number, done: boolean) {
  const gate = await prisma.stageGate.findUniqueOrThrow({ where: { id } });
  const checklist = [...((gate.checklist as ChecklistItem[]) ?? [])];
  if (checklist[index]) checklist[index] = { ...checklist[index], done };
  await prisma.stageGate.update({ where: { id }, data: { checklist } });
  revalidate(projectId);
}

export async function removeChecklistItem(projectId: string, id: string, index: number) {
  const gate = await prisma.stageGate.findUniqueOrThrow({ where: { id } });
  const checklist = ((gate.checklist as ChecklistItem[]) ?? []).filter((_, i) => i !== index);
  await prisma.stageGate.update({ where: { id }, data: { checklist } });
  revalidate(projectId);
}
