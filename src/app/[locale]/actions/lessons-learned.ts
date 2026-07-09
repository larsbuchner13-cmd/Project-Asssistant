"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/authz";
import { lessonLearnedFormSchema, type LessonLearnedFormValues } from "@/lib/validations/lesson-learned";

function toData(parsed: LessonLearnedFormValues) {
  return {
    whatWentWell: parsed.whatWentWell || null,
    whatDidnt: parsed.whatDidnt || null,
    recommendations: parsed.recommendations || null,
    knowledgeArea: parsed.knowledgeArea,
  };
}

export async function createLessonLearned(projectId: string, values: LessonLearnedFormValues) {
  await requireProjectAccess(projectId);
  const parsed = lessonLearnedFormSchema.parse(values);
  const lesson = await prisma.lessonLearned.create({ data: { projectId, ...toData(parsed) } });
  revalidatePath(`/projects/${projectId}/closing/lessons-learned`);
  return lesson;
}

export async function updateLessonLearned(projectId: string, id: string, values: LessonLearnedFormValues) {
  await requireProjectAccess(projectId);
  const parsed = lessonLearnedFormSchema.parse(values);
  const lesson = await prisma.lessonLearned.update({ where: { id }, data: toData(parsed) });
  revalidatePath(`/projects/${projectId}/closing/lessons-learned`);
  return lesson;
}

export async function deleteLessonLearned(projectId: string, id: string) {
  await requireProjectAccess(projectId);
  await prisma.lessonLearned.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/closing/lessons-learned`);
}
