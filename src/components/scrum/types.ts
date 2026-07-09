import type { Prisma } from "@prisma/client";

export type BacklogItemWithSprint = Prisma.BacklogItemGetPayload<{
  include: { sprint: true };
}>;

export type SprintWithItems = Prisma.SprintGetPayload<{
  include: { items: true };
}>;
