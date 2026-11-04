import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuthzError } from "@/lib/authz";

export const recordIdsSchema = z.array(z.string().min(1).max(100)).max(500)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate record IDs");
export const taskStatusSchema = z.enum(["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"]);

export async function assertWorkPackageIds(db: Prisma.TransactionClient, projectId: string, ids: string[]) {
  const unique = [...new Set(recordIdsSchema.parse(ids))];
  if (!unique.length) return;
  const count = await db.workPackage.count({ where: { projectId, id: { in: unique } } });
  if (count !== unique.length) throw new AuthzError("Work packages must belong to this project.");
}

export async function assertSprintId(db: Prisma.TransactionClient, projectId: string, id?: string | null) {
  if (id) await db.sprint.findUniqueOrThrow({ where: { id, projectId }, select: { id: true } });
}
