"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import {
  registerFormSchema,
  changePasswordFormSchema,
  type RegisterFormValues,
  type ChangePasswordFormValues,
} from "@/lib/validations/auth";

export type RegisterResult =
  | { ok: true; isFirstUser: boolean }
  | { ok: false; error: "auth.emailTaken" };

// Returns a result object instead of throwing: Next.js redacts thrown Error
// messages from Server Actions in production, so a translation-key message
// like "auth.emailTaken" would never reach the client.
export async function registerUser(values: RegisterFormValues): Promise<RegisterResult> {
  const parsed = registerFormSchema.parse(values);
  const email = parsed.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "auth.emailTaken" };
  }

  const hashedPassword = await bcrypt.hash(parsed.password, 12);

  // First registered user becomes an active admin so there is always
  // someone able to approve the accounts that follow.
  const userCount = await prisma.user.count();
  const isFirstUser = userCount === 0;

  await prisma.user.create({
    data: {
      name: parsed.name,
      email,
      password: hashedPassword,
      role: isFirstUser ? "ADMIN" : "USER",
      status: isFirstUser ? "ACTIVE" : "PENDING",
    },
  });

  return { ok: true, isFirstUser };
}

export type ChangePasswordResult = { ok: true } | { ok: false; error: "auth.currentPasswordWrong" };

export async function changePassword(values: ChangePasswordFormValues): Promise<ChangePasswordResult> {
  const sessionUser = await requireActiveUser();
  const parsed = changePasswordFormSchema.parse(values);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  const currentPasswordValid = await bcrypt.compare(parsed.currentPassword, user.password);
  if (!currentPasswordValid) {
    return { ok: false, error: "auth.currentPasswordWrong" };
  }

  const hashedPassword = await bcrypt.hash(parsed.newPassword, 12);
  await prisma.user.update({ where: { id: sessionUser.id }, data: { password: hashedPassword } });

  return { ok: true };
}
