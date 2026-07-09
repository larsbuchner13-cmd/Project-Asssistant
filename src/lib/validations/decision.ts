import { z } from "zod";

export const actionItemSchema = z.object({
  description: z.string().min(1, "validation.required"),
  owner: z.string().min(1, "validation.required"),
  dueDate: z.string().optional(),
});

export const decisionFormSchema = z.object({
  meetingDate: z.string().min(1, "validation.required"),
  attendees: z.string().min(1, "validation.required"),
  notes: z.string().optional(),
  decisionText: z.string().min(1, "validation.required"),
  actionItems: z.array(actionItemSchema).default([]),
});

export type DecisionFormValues = z.infer<typeof decisionFormSchema>;
