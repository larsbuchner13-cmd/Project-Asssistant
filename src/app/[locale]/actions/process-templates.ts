"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireActiveUser, requireTemplateEditAccess } from "@/lib/authz";
import {
  processTemplateFormSchema,
  processStepFormSchema,
  type ProcessTemplateFormValues,
  type ProcessStepFormValues,
} from "@/lib/validations/process-template";

function revalidate(templateId?: string) {
  revalidatePath("/processes");
  if (templateId) revalidatePath(`/processes/${templateId}`);
}

export async function createProcessTemplate(values: ProcessTemplateFormValues) {
  const user = await requireActiveUser();
  const parsed = processTemplateFormSchema.parse(values);
  const template = await prisma.processTemplate.create({
    data: {
      name: parsed.name,
      description: parsed.description || null,
      category: parsed.category || null,
      createdById: user.id,
    },
  });
  revalidate();
  return template;
}

export async function updateProcessTemplate(templateId: string, values: ProcessTemplateFormValues) {
  await requireTemplateEditAccess(templateId);
  const parsed = processTemplateFormSchema.parse(values);
  const template = await prisma.processTemplate.update({
    where: { id: templateId },
    data: {
      name: parsed.name,
      description: parsed.description || null,
      category: parsed.category || null,
    },
  });
  revalidate(templateId);
  return template;
}

export async function deleteProcessTemplate(templateId: string) {
  await requireTemplateEditAccess(templateId);
  await prisma.processTemplate.delete({ where: { id: templateId } });
  revalidate();
}

export async function toggleProcessTemplateActive(templateId: string, isActive: boolean) {
  await requireTemplateEditAccess(templateId);
  await prisma.processTemplate.update({ where: { id: templateId }, data: { isActive } });
  revalidate(templateId);
}

function toStepData(parsed: ProcessStepFormValues) {
  return {
    name: parsed.name,
    description: parsed.description || null,
    responsibleRole: parsed.responsibleRole || null,
    assigneeId: parsed.assigneeId || null,
    requiresApproval: parsed.requiresApproval,
    approverId: parsed.requiresApproval ? parsed.approverId || null : null,
    targetDays: parsed.targetDays ?? null,
  };
}

export async function createProcessStep(templateId: string, values: ProcessStepFormValues) {
  await requireTemplateEditAccess(templateId);
  const parsed = processStepFormSchema.parse(values);
  const count = await prisma.processStepTemplate.count({ where: { templateId } });
  const step = await prisma.processStepTemplate.create({
    data: {
      templateId,
      order: count,
      ...toStepData(parsed),
      checklistItems: {
        create: parsed.checklistLabels.map((label, index) => ({ label, order: index })),
      },
    },
  });
  revalidate(templateId);
  return step;
}

export async function updateProcessStep(templateId: string, stepId: string, values: ProcessStepFormValues) {
  await requireTemplateEditAccess(templateId);
  const parsed = processStepFormSchema.parse(values);
  await prisma.$transaction([
    prisma.processChecklistTemplateItem.deleteMany({ where: { stepId } }),
    prisma.processStepTemplate.update({
      where: { id: stepId },
      data: {
        ...toStepData(parsed),
        checklistItems: {
          create: parsed.checklistLabels.map((label, index) => ({ label, order: index })),
        },
      },
    }),
  ]);
  revalidate(templateId);
}

export async function deleteProcessStep(templateId: string, stepId: string) {
  await requireTemplateEditAccess(templateId);
  await prisma.processStepTemplate.delete({ where: { id: stepId } });
  const remaining = await prisma.processStepTemplate.findMany({
    where: { templateId },
    orderBy: { order: "asc" },
  });
  await Promise.all(
    remaining.map((step, index) =>
      step.order === index ? null : prisma.processStepTemplate.update({ where: { id: step.id }, data: { order: index } })
    )
  );
  revalidate(templateId);
}

export async function moveProcessStep(templateId: string, stepId: string, direction: "up" | "down") {
  await requireTemplateEditAccess(templateId);
  const steps = await prisma.processStepTemplate.findMany({
    where: { templateId },
    orderBy: { order: "asc" },
  });
  const index = steps.findIndex((s) => s.id === stepId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= steps.length) return;

  await prisma.$transaction([
    prisma.processStepTemplate.update({ where: { id: steps[index].id }, data: { order: steps[swapWith].order } }),
    prisma.processStepTemplate.update({ where: { id: steps[swapWith].id }, data: { order: steps[index].order } }),
  ]);
  revalidate(templateId);
}
