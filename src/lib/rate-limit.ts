import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export class RateLimitError extends Error {
  constructor() { super("Too many requests. Please try again later."); }
}

/** Atomic, shared fixed-window counter. Store a digest rather than user identifiers. */
export async function consumeRateLimit(scope: string, subject: string, limit: number, windowMs: number) {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const digest = createHash("sha256").update(`${scope}:${subject}`).digest("hex");
  const id = `${scope}:${window}:${digest}`;
  // Old windows cannot affect current counters. Indexed cleanup bounds retention.
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });
  const quota = await prisma.rateLimit.upsert({
    where: { id }, create: { id, count: 1, expiresAt: new Date((window + 1) * windowMs) },
    update: { count: { increment: 1 } }, select: { count: true },
  });
  if (quota.count > limit) throw new RateLimitError();
}
