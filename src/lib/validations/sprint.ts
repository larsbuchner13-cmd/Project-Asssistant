import { z } from "zod";

export const sprintFormSchema = z.object({
  name: z.string().min(1, "validation.required"),
  goal: z.string().optional(),
  startDate: z.string().min(1, "validation.required"),
  endDate: z.string().min(1, "validation.required"),
});

export type SprintFormValues = z.infer<typeof sprintFormSchema>;
