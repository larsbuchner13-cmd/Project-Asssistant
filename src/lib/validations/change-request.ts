import { z } from "zod";

export const changeRequestFormSchema = z.object({
  description: z.string().min(1, "validation.required"),
  impactScope: z.string().optional(),
  impactTime: z.string().optional(),
  impactCost: z.string().optional(),
  status: z.enum(["PROPOSED", "APPROVED", "REJECTED", "DEFERRED", "IMPLEMENTED"]),
  requestedBy: z.string().optional(),
  decisionDate: z.string().optional(),
});

export type ChangeRequestFormValues = z.infer<typeof changeRequestFormSchema>;
