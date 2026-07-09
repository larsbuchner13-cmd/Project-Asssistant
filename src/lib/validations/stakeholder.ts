import { z } from "zod";

export const stakeholderFormSchema = z.object({
  name: z.string().min(1, "validation.required"),
  role: z.string().min(1, "validation.required"),
  influence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  interest: z.enum(["LOW", "MEDIUM", "HIGH"]),
  engagementStrategy: z.enum(["MONITOR", "KEEP_INFORMED", "KEEP_SATISFIED", "MANAGE_CLOSELY"]),
  notes: z.string().optional(),
});

export type StakeholderFormValues = z.infer<typeof stakeholderFormSchema>;
