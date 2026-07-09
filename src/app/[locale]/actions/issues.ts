"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { issueFormSchema, type IssueFormValues } from "@/lib/validations/issue";

export async function createIssue(projectId: string, values: IssueFormValues) {
  const parsed = issueFormSchema.parse(values);
  const issue = await prisma.issue.create({
    data: { projectId, description: parsed.description, impact: parsed.impact || null, status: parsed.status, owner: parsed.owner || null },
  });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
  return issue;
}

export async function updateIssue(projectId: string, id: string, values: IssueFormValues) {
  const parsed = issueFormSchema.parse(values);
  const issue = await prisma.issue.update({
    where: { id },
    data: {
      description: parsed.description,
      impact: parsed.impact || null,
      status: parsed.status,
      owner: parsed.owner || null,
      resolvedDate: parsed.status === "RESOLVED" || parsed.status === "CLOSED" ? new Date() : null,
    },
  });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
  return issue;
}

export async function deleteIssue(projectId: string, id: string) {
  await prisma.issue.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/monitoring/raid`);
}
