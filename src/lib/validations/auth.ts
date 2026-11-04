import { z } from "zod";

// bcrypt ignores bytes after 72. Reject oversized passwords instead of truncating.
const passwordSchema = z.string().min(8, "validation.minLength8").max(72, "validation.passwordTooLong")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "validation.passwordTooLong");

export const registerFormSchema = z
  .object({
    name: z.string().min(2, "validation.minLength").max(200),
    email: z.string().max(254).email("validation.email"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "validation.required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().max(254).email("validation.email"),
  password: z.string().min(1, "validation.required").max(1000),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.required").max(1000),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "validation.required"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
