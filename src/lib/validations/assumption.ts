import { z } from "zod";

export const assumptionFormSchema = z.object({
  description: z.string().min(1, "validation.required"),
  status: z.enum(["UNVALIDATED", "VALIDATED", "INVALIDATED"]),
  owner: z.string().optional(),
});

export type AssumptionFormValues = z.infer<typeof assumptionFormSchema>;
