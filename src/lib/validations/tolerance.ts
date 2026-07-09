import { z } from "zod";

export const toleranceFormSchema = z.object({
  time: z.string().optional(),
  cost: z.string().optional(),
  scope: z.string().optional(),
  risk: z.string().optional(),
  quality: z.string().optional(),
  benefits: z.string().optional(),
});

export type ToleranceFormValues = z.infer<typeof toleranceFormSchema>;
