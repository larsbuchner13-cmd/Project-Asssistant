import { z } from "zod";

export const backlogItemFormSchema = z.object({
  title: z.string().min(1, "validation.required"),
  description: z.string().optional(),
  storyPoints: z.coerce.number().min(0).optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"]),
  sprintId: z.string().optional(),
});

export type BacklogItemFormValues = z.infer<typeof backlogItemFormSchema>;
