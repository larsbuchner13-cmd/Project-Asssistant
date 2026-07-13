import { z } from "zod";

export const processTemplateFormSchema = z.object({
  name: z.string().min(2, "validation.minLength"),
  description: z.string().optional(),
  category: z.string().optional(),
});

export type ProcessTemplateFormValues = z.infer<typeof processTemplateFormSchema>;

export const processStepFormSchema = z.object({
  name: z.string().min(1, "validation.required"),
  description: z.string().optional(),
  responsibleRole: z.string().optional(),
  assigneeId: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  approverId: z.string().optional(),
  targetDays: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().min(0).optional()),
  checklistLabels: z.array(z.string().min(1)).default([]),
});

export type ProcessStepFormValues = z.infer<typeof processStepFormSchema>;
