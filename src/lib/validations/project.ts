import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().min(2, "validation.minLength"),
  description: z.string().optional(),
  framework: z.enum(["PMBOK", "PRINCE2", "SCRUM"]),
  sponsor: z.string().optional(),
  startDate: z.string().min(1, "validation.required"),
  endDate: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
