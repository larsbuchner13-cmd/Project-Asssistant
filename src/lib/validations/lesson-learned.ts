import { z } from "zod";

export const knowledgeAreas = [
  "INTEGRATION",
  "SCOPE",
  "SCHEDULE",
  "COST",
  "QUALITY",
  "RESOURCE",
  "COMMUNICATION",
  "RISK",
  "PROCUREMENT",
  "STAKEHOLDER",
] as const;

export const lessonLearnedFormSchema = z.object({
  whatWentWell: z.string().optional(),
  whatDidnt: z.string().optional(),
  recommendations: z.string().optional(),
  knowledgeArea: z.enum(knowledgeAreas),
});

export type LessonLearnedFormValues = z.infer<typeof lessonLearnedFormSchema>;
