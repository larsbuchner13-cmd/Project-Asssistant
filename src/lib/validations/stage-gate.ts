import { z } from "zod";

export const stageGateFormSchema = z.object({
  name: z.string().min(1, "validation.required"),
  endDate: z.string().min(1, "validation.required"),
});

export type StageGateFormValues = z.infer<typeof stageGateFormSchema>;

export type ChecklistItem = { label: string; done: boolean };
