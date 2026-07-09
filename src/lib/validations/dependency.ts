import { z } from "zod";

export const dependencyFormSchema = z.object({
  description: z.string().min(1, "validation.required"),
  dependsOn: z.string().min(1, "validation.required"),
  status: z.enum(["PENDING", "AT_RISK", "RESOLVED"]),
  owner: z.string().optional(),
});

export type DependencyFormValues = z.infer<typeof dependencyFormSchema>;
