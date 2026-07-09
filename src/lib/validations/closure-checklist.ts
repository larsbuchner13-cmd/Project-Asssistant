import { z } from "zod";

export const closureChecklistItemFormSchema = z.object({
  label: z.string().min(1, "validation.required"),
  category: z.string().min(1, "validation.required"),
});

export type ClosureChecklistItemFormValues = z.infer<typeof closureChecklistItemFormSchema>;

export const defaultClosureCategories = ["deliverables", "documentation", "resources", "signoff"] as const;
