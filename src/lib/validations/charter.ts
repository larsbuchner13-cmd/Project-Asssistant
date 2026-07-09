import { z } from "zod";

export const charterFormSchema = z.object({
  businessCase: z.string().min(1, "validation.required"),
  objectives: z.string().min(1, "validation.required"),
  successCriteria: z.string().min(1, "validation.required"),
  highLevelScope: z.string().min(1, "validation.required"),
  budgetEstimate: z.coerce.number().min(0, "validation.min"),
  sponsor: z.string().min(1, "validation.required"),
});

export type CharterFormValues = z.infer<typeof charterFormSchema>;
