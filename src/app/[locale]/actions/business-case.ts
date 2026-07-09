"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { businessCaseFormSchema, type BusinessCaseFormValues } from "@/lib/validations/business-case";

export async function upsertBusinessCase(projectId: string, values: BusinessCaseFormValues) {
  const parsed = businessCaseFormSchema.parse(values);

  const data = {
    reasons: parsed.reasons,
    options: parsed.options,
    expectedBenefits: parsed.expectedBenefits,
    expectedDisBenefits: parsed.expectedDisBenefits || null,
    costsSummary: parsed.costsSummary,
    majorRisks: parsed.majorRisks || null,
  };

  const businessCase = await prisma.businessCase.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });

  revalidatePath(`/projects/${projectId}/initiating/business-case`);
  return businessCase;
}
