"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireActiveUser, requireProjectAccess } from "@/lib/authz";
import { projectFormSchema, type ProjectFormValues } from "@/lib/validations/project";

export async function createProject(values: ProjectFormValues) {
  const user = await requireActiveUser();
  const parsed = projectFormSchema.parse(values);

  const project = await prisma.project.create({
    data: {
      name: parsed.name,
      description: parsed.description || null,
      framework: parsed.framework,
      sponsor: parsed.sponsor || null,
      startDate: new Date(parsed.startDate),
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      ownerId: user.id,
    },
  });

  revalidatePath("/", "layout");
  return project;
}

export async function deleteProject(projectId: string) {
  await requireProjectAccess(projectId);
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/", "layout");
}
