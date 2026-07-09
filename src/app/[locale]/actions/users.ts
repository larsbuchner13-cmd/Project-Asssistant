"use server";

import { revalidatePath } from "next/cache";
import type { Role, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function setUserStatus(userId: string, status: UserStatus) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("admin.cannotModifySelf");

  await prisma.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin/users");
}

export async function setUserRole(userId: string, role: Role) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("admin.cannotModifySelf");

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}
