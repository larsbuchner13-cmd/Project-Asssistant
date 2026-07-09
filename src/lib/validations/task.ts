import { z } from "zod";

export const taskFormSchema = z.object({
  title: z.string().min(1, "validation.required"),
  description: z.string().optional(),
  workPackageId: z.string().optional(),
  assignee: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dueDate: z.string().optional(),
  status: z.enum(["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"]),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
