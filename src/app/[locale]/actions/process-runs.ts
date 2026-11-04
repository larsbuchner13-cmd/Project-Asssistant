"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthzError, requireActiveUser, requireProjectAccess } from "@/lib/authz";
import { serializableTransaction } from "@/lib/transaction";
import { startProcessRunFormSchema, type StartProcessRunFormValues } from "@/lib/validations/process-run";

function revalidateRun(runId: string) {
  revalidatePath("/[locale]/processes/runs", "page");
  revalidatePath(`/de/processes/runs/${runId}`);
  revalidatePath(`/en/processes/runs/${runId}`);
  revalidatePath("/[locale]/processes/dashboard", "page");
}

async function loadActiveStep(tx: Prisma.TransactionClient, id: string) {
  const step = await tx.processRunStep.findUniqueOrThrow({
    where: { id }, include: { run: { select: { status: true } }, checklistItems: true },
  });
  if (step.run.status !== "ACTIVE") throw new AuthzError("This workflow is no longer active.");
  return step;
}

export async function startProcessRun(templateId: string, values: StartProcessRunFormValues) {
  const user = await requireActiveUser();
  const parsed = startProcessRunFormSchema.parse(values);
  if (parsed.projectId) await requireProjectAccess(parsed.projectId);
  const run = await serializableTransaction(async (tx) => {
    const template = await tx.processTemplate.findUniqueOrThrow({
      where: { id: templateId, isActive: true },
      include: { steps: { orderBy: { order: "asc" }, include: { checklistItems: { orderBy: { order: "asc" } } } } },
    });
    if (!template.steps.length) throw new Error("Diese Vorlage hat noch keine Schritte.");
    return tx.processRun.create({ data: {
      templateId, name: parsed.name, projectId: parsed.projectId || null, startedById: user.id,
      steps: { create: template.steps.map((step, index) => ({
        stepTemplateId: step.id, order: index, name: step.name, description: step.description,
        responsibleRole: step.responsibleRole, assigneeId: step.assigneeId,
        requiresApproval: step.requiresApproval, approverId: step.approverId,
        approvalStatus: "NOT_REQUIRED", targetDays: step.targetDays,
        status: index === 0 ? "READY" : "LOCKED",
        checklistItems: { create: step.checklistItems.map((item) => ({ label: item.label, order: item.order })) },
      })) },
    } });
  });
  revalidateRun(run.id);
  return run;
}

export async function startProcessRunStep(runStepId: string) {
  await requireActiveUser();
  const runId = await serializableTransaction(async (tx) => {
    const step = await loadActiveStep(tx, runStepId);
    if (step.status !== "READY") throw new Error("Dieser Schritt ist nicht freigeschaltet.");
    await tx.processRunStep.update({ where: { id: runStepId, status: "READY" }, data: { status: "IN_PROGRESS", startedAt: new Date() } });
    return step.runId;
  });
  revalidateRun(runId);
}

export async function toggleRunChecklistItem(runStepId: string, itemId: string, done: boolean) {
  await requireActiveUser();
  z.boolean().parse(done);
  const runId = await serializableTransaction(async (tx) => {
    const step = await loadActiveStep(tx, runStepId);
    if (step.status === "LOCKED" || step.status === "DONE" || step.approvalStatus === "PENDING") {
      throw new AuthzError("Dieser Schritt kann gerade nicht bearbeitet werden.");
    }
    await tx.processRunChecklistItem.update({
      where: { id: itemId, runStepId }, data: { done, doneAt: done ? new Date() : null },
    });
    return step.runId;
  });
  revalidateRun(runId);
}

export async function completeProcessRunStep(runStepId: string) {
  await requireActiveUser();
  const runId = await serializableTransaction(async (tx) => {
    const step = await loadActiveStep(tx, runStepId);
    if (step.status === "LOCKED") throw new AuthzError("Vorheriger Schritt ist noch nicht abgeschlossen.");
    if (step.status === "DONE") return step.runId;
    if (step.checklistItems.some((item) => !item.done)) throw new Error("Nicht alle Checklistenpunkte sind abgehakt.");
    if (step.requiresApproval) {
      await tx.processRunStep.update({ where: { id: runStepId }, data: { status: "IN_PROGRESS", approvalStatus: "PENDING" } });
    } else {
      await finishStep(tx, step.runId, runStepId, step.order);
    }
    return step.runId;
  });
  revalidateRun(runId);
}

export async function approveProcessRunStep(runStepId: string, approved: boolean, comment?: string) {
  const user = await requireActiveUser();
  z.boolean().parse(approved);
  const parsedComment = z.string().max(4000).optional().parse(comment);
  const runId = await serializableTransaction(async (tx) => {
    const step = await loadActiveStep(tx, runStepId);
    if (step.approvalStatus !== "PENDING" || step.status !== "IN_PROGRESS" || !step.requiresApproval) {
      throw new Error("Für diesen Schritt ist aktuell keine Freigabe ausstehend.");
    }
    if (user.role !== "ADMIN" && step.approverId !== user.id) throw new AuthzError("Nur die zuständige freigebende Person kann diesen Schritt genehmigen.");
    if (approved && step.checklistItems.some((item) => !item.done)) throw new Error("Nicht alle Checklistenpunkte sind abgehakt.");
    await tx.processRunStep.update({ where: { id: runStepId }, data: {
      approvalStatus: approved ? "APPROVED" : "REJECTED", approvalComment: parsedComment || null,
      approvedAt: approved ? new Date() : null,
    } });
    if (approved) await finishStep(tx, step.runId, runStepId, step.order);
    return step.runId;
  });
  revalidateRun(runId);
}

async function finishStep(tx: Prisma.TransactionClient, runId: string, id: string, order: number) {
  const completedAt = new Date();
  await tx.processRunStep.update({ where: { id, runId }, data: { status: "DONE", completedAt } });
  const next = await tx.processRunStep.findFirst({ where: { runId, order: { gt: order } }, orderBy: { order: "asc" } });
  if (next) {
    await tx.processRunStep.update({ where: { id: next.id, runId, status: "LOCKED" }, data: { status: "READY" } });
  } else {
    await tx.processRun.update({ where: { id: runId, status: "ACTIVE" }, data: { status: "COMPLETED", completedAt } });
  }
}

export async function cancelProcessRun(runId: string) {
  const user = await requireActiveUser();
  await serializableTransaction(async (tx) => {
    const run = await tx.processRun.findUniqueOrThrow({ where: { id: runId, status: "ACTIVE" } });
    if (user.role !== "ADMIN" && run.startedById !== user.id) throw new AuthzError("Nur die startende Person oder ein Admin kann diesen Workflow abbrechen.");
    await tx.processRun.update({ where: { id: runId, status: "ACTIVE" }, data: { status: "CANCELLED" } });
  });
  revalidateRun(runId);
}
