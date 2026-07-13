import { z } from "zod";

export const startProcessRunFormSchema = z.object({
  name: z.string().min(2, "validation.minLength"),
  projectId: z.string().optional(),
});

export type StartProcessRunFormValues = z.infer<typeof startProcessRunFormSchema>;

export const approveStepFormSchema = z.object({
  approved: z.boolean(),
  comment: z.string().optional(),
});

export type ApproveStepFormValues = z.infer<typeof approveStepFormSchema>;
