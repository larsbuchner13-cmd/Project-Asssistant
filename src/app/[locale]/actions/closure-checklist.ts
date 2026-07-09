"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import {
  closureChecklistItemFormSchema,
  type ClosureChecklistItemFormValues,
} from "@/lib/validations/closure-checklist";

const DEFAULT_ITEMS: { category: string; label: string }[] = [
  { category: "deliverables", label: "closureChecklist.defaults.deliverablesAccepted" },
  { category: "documentation", label: "closureChecklist.defaults.documentationArchived" },
  { category: "resources", label: "closureChecklist.defaults.resourcesReleased" },
  { category: "signoff", label: "closureChecklist.defaults.sponsorSignoff" },
];

export async function ensureDefaultChecklist(projectId: string) {
  await requireProjectAccess(projectId);
  const count = await prisma.closureChecklistItem.count({ where: { projectId } });
  if (count > 0) return;

  await prisma.closureChecklistItem.createMany({
    data: DEFAULT_ITEMS.map((item, index) => ({
      projectId,
      category: item.category,
      label: item.label,
      order: index,
    })),
  });
}

export async function createChecklistItem(projectId: string, values: ClosureChecklistItemFormValues) {
  await requireProjectAccess(projectId);
  const parsed = closureChecklistItemFormSchema.parse(values);
  const count = await prisma.closureChecklistItem.count({ where: { projectId } });
  const item = await prisma.closureChecklistItem.create({
    data: { projectId, ...parsed, order: count },
  });
  revalidatePath(`/projects/${projectId}/closing/checklist`);
  return item;
}

export async function toggleChecklistItem(projectId: string, id: string, done: boolean) {
  await requireProjectAccess(projectId);
  await prisma.closureChecklistItem.update({ where: { id }, data: { done } });
  revalidatePath(`/projects/${projectId}/closing/checklist`);
}

export async function deleteChecklistItem(projectId: string, id: string) {
  await requireProjectAccess(projectId);
  await prisma.closureChecklistItem.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/closing/checklist`);
}
