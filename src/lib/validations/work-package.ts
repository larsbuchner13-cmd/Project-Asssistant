import { z } from "zod";

export const workPackageFormSchema = z.object({
  name: z.string().min(1, "validation.required"),
  description: z.string().optional(),
  owner: z.string().optional(),
  effortEstimate: z.coerce.number().min(0).optional().or(z.literal("")),
  plannedCost: z.coerce.number().min(0).default(0),
  actualCost: z.coerce.number().min(0).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE", "BLOCKED"]),
  dependencyIds: z.array(z.string()).default([]),
});

export type WorkPackageFormValues = z.infer<typeof workPackageFormSchema>;
