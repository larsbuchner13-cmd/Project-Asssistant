import { z } from "zod";

export const riskFormSchema = z.object({
  description: z.string().min(1, "validation.required"),
  probability: z.coerce.number().min(1).max(5),
  impact: z.coerce.number().min(1).max(5),
  status: z.enum(["OPEN", "MITIGATED", "OCCURRED", "CLOSED"]),
  mitigationPlan: z.string().optional(),
  contingencyPlan: z.string().optional(),
  owner: z.string().optional(),
});

export type RiskFormValues = z.infer<typeof riskFormSchema>;
