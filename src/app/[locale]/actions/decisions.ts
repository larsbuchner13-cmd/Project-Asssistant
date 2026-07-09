"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { decisionFormSchema, type DecisionFormValues } from "@/lib/validations/decision";

function splitAttendees(attendees: string) {
  return attendees
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

export async function createDecision(projectId: string, values: DecisionFormValues) {
  await requireProjectAccess(projectId);
  const parsed = decisionFormSchema.parse(values);

  const decision = await prisma.decision.create({
    data: {
      projectId,
      meetingDate: new Date(parsed.meetingDate),
      attendees: splitAttendees(parsed.attendees),
      notes: parsed.notes || "",
      decisionText: parsed.decisionText,
      actionItems: {
        create: parsed.actionItems.map((item) => ({
          description: item.description,
          owner: item.owner,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
        })),
      },
    },
  });

  revalidatePath(`/projects/${projectId}/executing/decisions`);
  return decision;
}

export async function updateDecision(projectId: string, decisionId: string, values: DecisionFormValues) {
  await requireProjectAccess(projectId);
  const parsed = decisionFormSchema.parse(values);

  await prisma.actionItem.deleteMany({ where: { decisionId } });

  const decision = await prisma.decision.update({
    where: { id: decisionId },
    data: {
      meetingDate: new Date(parsed.meetingDate),
      attendees: splitAttendees(parsed.attendees),
      notes: parsed.notes || "",
      decisionText: parsed.decisionText,
      actionItems: {
        create: parsed.actionItems.map((item) => ({
          description: item.description,
          owner: item.owner,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
        })),
      },
    },
  });

  revalidatePath(`/projects/${projectId}/executing/decisions`);
  return decision;
}

export async function deleteDecision(projectId: string, decisionId: string) {
  await requireProjectAccess(projectId);
  await prisma.decision.delete({ where: { id: decisionId } });
  revalidatePath(`/projects/${projectId}/executing/decisions`);
}

export async function toggleActionItem(projectId: string, actionItemId: string, done: boolean) {
  await requireProjectAccess(projectId);
  await prisma.actionItem.update({ where: { id: actionItemId }, data: { done } });
  revalidatePath(`/projects/${projectId}/executing/decisions`);
}
