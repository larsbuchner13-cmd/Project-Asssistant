"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerFormSchema, type RegisterFormValues } from "@/lib/validations/auth";

export async function registerUser(values: RegisterFormValues) {
  const parsed = registerFormSchema.parse(values);
  const email = parsed.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("auth.emailTaken");
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

  return { isFirstUser };
}
