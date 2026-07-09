import type { RagStatus, StakeholderLevel, EngagementStrategy } from "@prisma/client";

export function riskScore(probability: number, impact: number) {
  return probability * impact;
}

export function riskScoreVariant(score: number): "green" | "amber" | "red" {
  if (score <= 6) return "green";
  if (score <= 14) return "amber";
  return "red";
}

export function ragVariant(rag: RagStatus): "green" | "amber" | "red" {
  if (rag === "GREEN") return "green";
  if (rag === "AMBER") return "amber";
  return "red";
}

const levelRank: Record<StakeholderLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

export function suggestEngagementStrategy(
  influence: StakeholderLevel,
  interest: StakeholderLevel
): EngagementStrategy {
  const highInfluence = levelRank[influence] >= 1;
  const highInterest = levelRank[interest] >= 1;
  if (highInfluence && highInterest) return "MANAGE_CLOSELY";
  if (highInfluence && !highInterest) return "KEEP_SATISFIED";
  if (!highInfluence && highInterest) return "KEEP_INFORMED";
  return "MONITOR";
}

export function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string, locale: string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}
