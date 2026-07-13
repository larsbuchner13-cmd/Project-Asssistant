"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { AuthzError, requireActiveUser } from "@/lib/authz";
import { startProcessRunFormSchema, type StartProcessRunFormValues } from "@/lib/validations/process-run";

function revalidateRun(runId: string) {
  revalidatePath("/processes/runs");
  revalidatePath(`/processes/runs/${runId}`);
  revalidatePath("/processes/dashboard");
}

export async function startProcessRun(templateId: string, values: StartProcessRunFormValues) {
  const user = await requireActiveUser();
  const parsed = startProcessRunFormSchema.parse(values);

  const template = await prisma.processTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: { steps: { orderBy: { order: "asc" }, include: { checklistItems: { orderBy: { order: "asc" } } } } },
  });

  if (template.steps.length === 0) {
    throw new Error("Diese Vorlage hat noch keine Schritte.");
  }

  const run = await prisma.processRun.create({
    data: {
      templateId,
      name: parsed.name,
      projectId: parsed.projectId || null,
      startedById: user.id,
      steps: {
        create: template.steps.map((step, index) => ({
          stepTemplateId: step.id,
          order: step.order,
          name: step.name,
          description: step.description,
          responsibleRole: step.responsibleRole,
          assigneeId: step.assigneeId,
          requiresApproval: step.requiresApproval,
          approverId: step.approverId,
          approvalStatus: "NOT_REQUIRED",
          targetDays: step.targetDays,
          status: index === 0 ? "READY" : "LOCKED",
          checklistItems: {
            create: step.checklistItems.map((item) => ({ label: item.label, order: item.order })),
          },
        })),
      },
    },
  });

  revalidateRun(run.id);
  return run;
}

export async function startProcessRunStep(runStepId: string) {
  await requireActiveUser();
  const step = await prisma.processRunStep.findUniqueOrThrow({ where: { id: runStepId } });
  if (step.status !== "READY") {
    throw new Error("Dieser Schritt ist nicht freigeschaltet.");
  }
  await prisma.processRunStep.update({
    where: { id: runStepId },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });
  revalidateRun(step.runId);
}

export async function toggleRunChecklistItem(runStepId: string, itemId: string, done: boolean) {
  await requireActiveUser();
  const step = await prisma.processRunStep.findUniqueOrThrow({ where: { id: runStepId } });
  if (step.status === "LOCKED" || step.status === "DONE") {
    throw new Error("Dieser Schritt kann gerade nicht bearbeitet werden.");
  }
  await prisma.processRunChecklistItem.update({
    where: { id: itemId },
    data: { done, doneAt: done ? new Date() : null },
  });
  revalidateRun(step.runId);
}

/**
 * Marks a step complete once its checklist is fully checked off and the
 * predecessor gate has already unlocked it. If the step requires approval,
 * this submits it for approval instead of finishing it outright — the
 * approver's decision (approveProcessRunStep) is what actually unlocks the
 * next step.
 */
export async function completeProcessRunStep(runStepId: string) {
  await requireActiveUser();
  const step = await prisma.processRunStep.findUniqueOrThrow({
    where: { id: runStepId },
    include: { checklistItems: true },
  });

  if (step.status === "LOCKED") throw new Error("Vorheriger Schritt ist noch nicht abgeschlossen.");
  if (step.status === "DONE") return;
  if (step.checklistItems.some((item) => !item.done)) {
    throw new Error("Nicht alle Checklistenpunkte sind abgehakt.");
  }

  if (step.requiresApproval) {
    await prisma.processRunStep.update({
      where: { id: runStepId },
      data: { status: "IN_PROGRESS", approvalStatus: "PENDING" },
    });
    revalidateRun(step.runId);
    return;
  }

  await finishStep(step.runId, runStepId);
}

export async function approveProcessRunStep(runStepId: string, approved: boolean, comment?: string) {
  const user = await requireActiveUser();
  const step = await prisma.processRunStep.findUniqueOrThrow({ where: { id: runStepId } });

  if (step.approvalStatus !== "PENDING") {
    throw new Error("Für diesen Schritt ist aktuell keine Freigabe ausstehend.");
  }
  if (user.role !== "ADMIN" && step.approverId !== user.id) {
    throw new AuthzError("Nur die zuständige freigebende Person kann diesen Schritt genehmigen.");
  }

  if (!approved) {
    await prisma.processRunStep.update({
      where: { id: runStepId },
      data: { approvalStatus: "REJECTED", approvalComment: comment || null },
    });
    revalidateRun(step.runId);
    return;
  }

  await prisma.processRunStep.update({
    where: { id: runStepId },
    data: { approvalStatus: "APPROVED", approvalComment: comment || null, approvedAt: new Date() },
  });
  await finishStep(step.runId, runStepId);
}

async function finishStep(runId: string, runStepId: string) {
  const completedAt = new Date();
  const step = await prisma.processRunStep.update({
    where: { id: runStepId },
    data: { status: "DONE", completedAt },
  });

  const nextStep = await prisma.processRunStep.findFirst({
    where: { runId, order: step.order + 1 },
  });

  if (nextStep) {
    if (nextStep.status === "LOCKED") {
      await prisma.processRunStep.update({ where: { id: nextStep.id }, data: { status: "READY" } });
    }
  } else {
    await prisma.processRun.update({
      where: { id: runId },
      data: { status: "COMPLETED", completedAt },
    });
  }

  revalidateRun(runId);
}

export async function cancelProcessRun(runId: string) {
  const user = await requireActiveUser();
  const run = await prisma.processRun.findUniqueOrThrow({ where: { id: runId } });
  if (user.role !== "ADMIN" && run.startedById !== user.id) {
    throw new AuthzError("Nur die startende Person oder ein Admin kann diesen Workflow abbrechen.");
  }
  await prisma.processRun.update({ where: { id: runId }, data: { status: "CANCELLED" } });
  revalidateRun(runId);
}
