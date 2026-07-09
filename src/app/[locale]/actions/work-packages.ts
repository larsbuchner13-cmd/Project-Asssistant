"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { workPackageFormSchema, type WorkPackageFormValues } from "@/lib/validations/work-package";

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

async function setDependencies(workPackageId: string, dependencyIds: string[]) {
  await prisma.workPackageDependency.deleteMany({ where: { successorId: workPackageId } });
  if (dependencyIds.length > 0) {
    await prisma.workPackageDependency.createMany({
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
  const parsed = workPackageFormSchema.parse(values);

  const parent = parentId ? await prisma.workPackage.findUnique({ where: { id: parentId } }) : null;
  const level = parent ? parent.level + 1 : 1;

  const siblingCount = await prisma.workPackage.count({ where: { projectId, parentId } });

  const workPackage = await prisma.workPackage.create({
    data: {
      projectId,
      parentId,
      level,
      order: siblingCount,
      ...toWorkPackageData(parsed),
    },
  });

  await setDependencies(workPackage.id, parsed.dependencyIds);

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
  const parsed = workPackageFormSchema.parse(values);

  const workPackage = await prisma.workPackage.update({
    where: { id: workPackageId },
    data: toWorkPackageData(parsed),
  });

  await setDependencies(workPackageId, parsed.dependencyIds);

  revalidatePath(`/projects/${projectId}/planning/wbs`);
  revalidatePath(`/projects/${projectId}/planning/schedule`);
  revalidatePath(`/projects/${projectId}/planning/budget`);
  return workPackage;
}

export async function deleteWorkPackage(projectId: string, workPackageId: string) {
  await prisma.workPackage.delete({ where: { id: workPackageId } });
  revalidatePath(`/projects/${projectId}/planning/wbs`);
  revalidatePath(`/projects/${projectId}/planning/schedule`);
  revalidatePath(`/projects/${projectId}/planning/budget`);
}

async function updateDescendantLevels(workPackageId: string, newLevel: number) {
  const children = await prisma.workPackage.findMany({ where: { parentId: workPackageId } });
  for (const child of children) {
    await prisma.workPackage.update({ where: { id: child.id }, data: { level: newLevel + 1 } });
    await updateDescendantLevels(child.id, newLevel + 1);
  }
}

export async function moveWorkPackage(
  projectId: string,
  activeId: string,
  newParentId: string | null,
  orderedSiblingIds: string[]
) {
  const parent = newParentId ? await prisma.workPackage.findUnique({ where: { id: newParentId } }) : null;
  const newLevel = parent ? parent.level + 1 : 1;

  await prisma.workPackage.update({
    where: { id: activeId },
    data: { parentId: newParentId, level: newLevel },
  });

  await Promise.all(
    orderedSiblingIds.map((id, index) =>
      prisma.workPackage.update({ where: { id }, data: { order: index } })
    )
  );

  await updateDescendantLevels(activeId, newLevel);

  revalidatePath(`/projects/${projectId}/planning/wbs`);
  revalidatePath(`/projects/${projectId}/planning/schedule`);
}
