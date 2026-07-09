import type { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class AuthzError extends Error {}

export type SessionUser = {
  id: string;
  role: Role;
  status: UserStatus;
};

/** Throws unless the caller is signed in and approved (status ACTIVE). */
export async function requireActiveUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new AuthzError("Not signed in or not yet approved.");
  }
  return session.user;
}

/** Throws unless the caller is an active admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireActiveUser();
  if (user.role !== "ADMIN") {
    throw new AuthzError("Admin privileges required.");
  }
  return user;
}

/**
 * Throws unless the caller is an active user who owns the given project, or
 * an admin. Use at the top of every project-scoped server action / page.
 */
export async function requireProjectAccess(projectId: string): Promise<SessionUser> {
  const user = await requireActiveUser();
  if (user.role === "ADMIN") return user;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project || project.ownerId !== user.id) {
    throw new AuthzError("You do not have access to this project.");
  }
  return user;
}
