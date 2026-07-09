import { z } from "zod";

export const issueFormSchema = z.object({
  description: z.string().min(1, "validation.required"),
  impact: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  owner: z.string().optional(),
});

export type IssueFormValues = z.infer<typeof issueFormSchema>;
