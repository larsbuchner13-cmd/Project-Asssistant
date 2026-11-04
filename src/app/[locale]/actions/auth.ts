"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import { consumeRateLimit } from "@/lib/rate-limit";
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
  await consumeRateLimit("register-global", "all", 30, 60 * 60_000);
  await consumeRateLimit("register", email, 5, 60 * 60_000);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "auth.emailTaken" };
  }

  const hashedPassword = await bcrypt.hash(parsed.password, 12);

  // First registered user becomes an active admin so there is always
  // someone able to approve the accounts that follow.
  try {
  return await prisma.$transaction(async (tx) => {
    // Serialize empty-database bootstrap across concurrent registrations.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(71023001)`;
    const isFirstUser = (await tx.user.count()) === 0;
    await tx.user.create({
    data: {
      name: parsed.name,
      email,
      password: hashedPassword,
      role: isFirstUser ? "ADMIN" : "USER",
      status: isFirstUser ? "ACTIVE" : "PENDING",
    },
    });
    return { ok: true as const, isFirstUser };
  });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, error: "auth.emailTaken" };
    }
    throw error;
  }
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
  await prisma.user.update({
    where: { id: sessionUser.id, password: user.password },
    data: { password: hashedPassword, sessionVersion: { increment: 1 } },
  });

  return { ok: true };
}
