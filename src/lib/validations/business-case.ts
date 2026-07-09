import { z } from "zod";

export const businessCaseFormSchema = z.object({
  reasons: z.string().min(1, "validation.required"),
  options: z.string().min(1, "validation.required"),
  expectedBenefits: z.string().min(1, "validation.required"),
  expectedDisBenefits: z.string().optional(),
  costsSummary: z.string().min(1, "validation.required"),
  majorRisks: z.string().optional(),
});

export type BusinessCaseFormValues = z.infer<typeof businessCaseFormSchema>;
