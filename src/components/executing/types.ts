import type { Prisma } from "@prisma/client";

export type TaskWithWorkPackage = Prisma.TaskGetPayload<{
  include: { workPackage: true };
}>;
