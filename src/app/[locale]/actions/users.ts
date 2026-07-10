"use server";

import { revalidatePath } from "next/cache";
import type { Role, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export type AdminActionResult = { ok: true } | { ok: false; error: "admin.cannotModifySelf" };

// Returns a result object instead of throwing: Next.js redacts thrown Error
// messages from Server Actions in production, so a translation-key message
// would never reach the client.
export async function setUserStatus(userId: string, status: UserStatus): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false, error: "admin.cannotModifySelf" };

  await prisma.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserRole(userId: string, role: Role): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false, error: "admin.cannotModifySelf" };

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { ok: true };
}
