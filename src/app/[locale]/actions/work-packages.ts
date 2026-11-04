"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { workPackageFormSchema, type WorkPackageFormValues } from "@/lib/validations/work-package";
import { assertWorkPackageIds, recordIdsSchema } from "@/lib/project-references";
import { serializableTransaction } from "@/lib/transaction";

function toWorkPackageData(parsed: WorkPackageFormValues) {
  return {
    name: parsed.name,
    description: parsed.description || null,
    owner: parsed.owner || null,
    effortEstimate: parsed.effortEstimate === "" || parsed.effortEstimate == null ? null : Number(parsed.effortEstimate),
    plannedCost: parsed.plannedCost,
    actualCost: parsed.actualCost,
    startDate: parsed.startDate ? new Date(parsed.startDate) : null,
    endDate: parsed.endDate ? new Date(parsed.endDate) : null,
    status: parsed.status,
  };
}

async function setDependencies(tx: Prisma.TransactionClient, projectId: string, workPackageId: string, dependencyIds: string[]) {
  await assertWorkPackageIds(tx, projectId, dependencyIds);
  if (dependencyIds.includes(workPackageId)) throw new Error("A work package cannot depend on itself.");
  await tx.workPackageDependency.deleteMany({ where: { successorId: workPackageId, successor: { projectId } } });
  if (dependencyIds.length > 0) {
    await tx.workPackageDependency.createMany({
      data: dependencyIds.map((predecessorId) => ({ predecessorId, successorId: workPackageId })),
      skipDuplicates: true,
    });
  }
}

export async function createWorkPackage(
  projectId: string,
  parentId: string | null,
  values: WorkPackageFormValues
) {
  await requireProjectAccess(projectId);
  const parsed = workPackageFormSchema.parse(values);

  const workPackage = await serializableTransaction(async (tx) => {
  const parent = parentId ? await tx.workPackage.findUniqueOrThrow({ where: { id: parentId, projectId } }) : null;
  const level = parent ? parent.level + 1 : 1;

  const siblingCount = await tx.workPackage.count({ where: { projectId, parentId } });

  const workPackage = await tx.workPackage.create({
    data: {
      projectId,
      parentId,
      level,
      order: siblingCount,
      ...toWorkPackageData(parsed),
    },
  });

  await setDependencies(tx, projectId, workPackage.id, parsed.dependencyIds);
  return workPackage;
  });

  revalidatePath(`/projects/${projectId}/planning/wbs`);
  revalidatePath(`/projects/${projectId}/planning/schedule`);
  revalidatePath(`/projects/${projectId}/planning/budget`);
  return workPackage;
}

export async function updateWorkPackage(
  projectId: string,
  workPackageId: string,
  values: WorkPackageFormValues
) {
  await requireProjectAccess(projectId);
  const parsed = workPackageFormSchema.parse(values);

  const workPackage = await serializableTransaction(async (tx) => {
  const workPackage = await tx.workPackage.update({
    where: { id: workPackageId, projectId },
    data: toWorkPackageData(parsed),
  });

  await setDependencies(tx, projectId, workPackageId, parsed.dependencyIds);
  return workPackage;
  });

  revalidatePath(`/projects/${projectId}/planning/wbs`);
  revalidatePath(`/projects/${projectId}/planning/schedule`);
  revalidatePath(`/projects/${projectId}/planning/budget`);
  return workPackage;
}

export async function deleteWorkPackage(projectId: string, workPackageId: string) {
  await requireProjectAccess(projectId);
  await prisma.workPackage.delete({ where: { id: workPackageId, projectId } });
  revalidatePath(`/projects/${projectId}/planning/wbs`);
  revalidatePath(`/projects/${projectId}/planning/schedule`);
  revalidatePath(`/projects/${projectId}/planning/budget`);
}

async function updateDescendantLevels(tx: Prisma.TransactionClient, projectId: string, workPackageId: string, newLevel: number, visited = new Set<string>()) {
  if (visited.has(workPackageId)) throw new Error("Cyclic work package hierarchy.");
  visited.add(workPackageId);
  const children = await tx.workPackage.findMany({ where: { parentId: workPackageId, projectId } });
  for (const child of children) {
    await tx.workPackage.update({ where: { id: child.id, projectId }, data: { level: newLevel + 1 } });
    await updateDescendantLevels(tx, projectId, child.id, newLevel + 1, visited);
  }
}

export async function moveWorkPackage(
  projectId: string,
  activeId: string,
  newParentId: string | null,
  orderedSiblingIds: string[]
) {
  await requireProjectAccess(projectId);
  const ids = recordIdsSchema.parse(orderedSiblingIds);
  await serializableTransaction(async (tx) => {
  await tx.workPackage.findUniqueOrThrow({ where: { id: activeId, projectId } });
  const parent = newParentId ? await tx.workPackage.findUniqueOrThrow({ where: { id: newParentId, projectId } }) : null;
  const visited = new Set<string>([activeId]);
  let ancestor = parent;
  while (ancestor) {
    if (visited.has(ancestor.id)) throw new Error("Cyclic work package hierarchy.");
    visited.add(ancestor.id);
    ancestor = ancestor.parentId ? await tx.workPackage.findUniqueOrThrow({ where: { id: ancestor.parentId, projectId } }) : null;
  }
  const newLevel = parent ? parent.level + 1 : 1;

  await tx.workPackage.update({
    where: { id: activeId, projectId },
    data: { parentId: newParentId, level: newLevel },
  });

  for (const [index, id] of ids.entries()) {
    await tx.workPackage.update({ where: { id, projectId, parentId: newParentId }, data: { order: index } });
  }
  await updateDescendantLevels(tx, projectId, activeId, newLevel);
  });

  revalidatePath(`/projects/${projectId}/planning/wbs`);
  revalidatePath(`/projects/${projectId}/planning/schedule`);
}
