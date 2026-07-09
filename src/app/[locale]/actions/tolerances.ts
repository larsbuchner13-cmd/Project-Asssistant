"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { toleranceFormSchema, type ToleranceFormValues } from "@/lib/validations/tolerance";

export async function upsertTolerance(projectId: string, values: ToleranceFormValues) {
  const parsed = toleranceFormSchema.parse(values);

  const data = {
    time: parsed.time || null,
    cost: parsed.cost || null,
    scope: parsed.scope || null,
    risk: parsed.risk || null,
    quality: parsed.quality || null,
    benefits: parsed.benefits || null,
  };

  const tolerance = await prisma.prince2Tolerance.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });

  revalidatePath(`/projects/${projectId}/planning/tolerances`);
  return tolerance;
}
