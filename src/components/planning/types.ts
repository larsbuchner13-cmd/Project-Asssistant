import type { Prisma } from "@prisma/client";

export type WorkPackageWithDeps = Prisma.WorkPackageGetPayload<{
  include: {
    successorOf: { include: { predecessor: true } };
  };
}>;
