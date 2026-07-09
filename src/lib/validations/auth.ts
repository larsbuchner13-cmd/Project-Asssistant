import { z } from "zod";

export const registerFormSchema = z
  .object({
    name: z.string().min(2, "validation.minLength"),
    email: z.string().email("validation.email"),
    password: z.string().min(8, "validation.minLength8"),
    confirmPassword: z.string().min(1, "validation.required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().email("validation.email"),
  password: z.string().min(1, "validation.required"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
