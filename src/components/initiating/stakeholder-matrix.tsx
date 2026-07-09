"use client";

import { useTranslations } from "next-intl";
import type { Stakeholder, StakeholderLevel } from "@prisma/client";

const positionPct: Record<StakeholderLevel, number> = { LOW: 15, MEDIUM: 50, HIGH: 85 };

export function StakeholderMatrix({ stakeholders }: { stakeholders: Stakeholder[] }) {
  const t = useTranslations("stakeholders");

  return (
    <div className="relative aspect-square w-full max-w-md rounded-lg border border-border">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <div className="border-b border-r border-border/60 bg-amber-500/5 p-2 text-xs text-muted-foreground">
          {t("strategy.KEEP_SATISFIED")}
        </div>
        <div className="border-b border-border/60 bg-rag-red/5 p-2 text-right text-xs text-muted-foreground">
          {t("strategy.MANAGE_CLOSELY")}
        </div>
        <div className="border-r border-border/60 p-2 text-xs text-muted-foreground">
          {t("strategy.MONITOR")}
        </div>
        <div className="p-2 text-right text-xs text-muted-foreground">{t("strategy.KEEP_INFORMED")}</div>
      </div>

      {stakeholders.map((s) => (
        <div
          key={s.id}
          title={`${s.name} (${s.role})`}
          className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-primary text-[10px] font-semibold text-primary-foreground shadow"
          style={{
            left: `${positionPct[s.interest]}%`,
            top: `${100 - positionPct[s.influence]}%`,
          }}
        >
          {s.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </div>
      ))}

      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">
        {t("interest")} →
      </span>
      <span className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground">
        {t("influence")} →
      </span>
    </div>
  );
}
