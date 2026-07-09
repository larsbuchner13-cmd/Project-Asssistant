"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { charterFormSchema, type CharterFormValues } from "@/lib/validations/charter";

export async function upsertCharter(projectId: string, values: CharterFormValues) {
  const parsed = charterFormSchema.parse(values);

  const charter = await prisma.projectCharter.upsert({
    where: { projectId },
    create: { projectId, ...parsed },
    update: { ...parsed },
  });

  revalidatePath(`/projects/${projectId}/initiating/charter`);
  return charter;
}
