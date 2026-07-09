import { differenceInCalendarDays, addDays } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import type { BacklogItem, Sprint } from "@prisma/client";

import { formatDate } from "@/lib/pm";

const CHART_HEIGHT = 260;
const CHART_WIDTH = 640;
const PADDING = 32;

export function BurndownChart({ sprint, items }: { sprint: Sprint; items: BacklogItem[] }) {
  const t = useTranslations("burndown");
  const locale = useLocale();

  const startDate = new Date(sprint.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(sprint.endDate);
  endDate.setHours(0, 0, 0, 0);

  const totalDays = Math.max(differenceInCalendarDays(endDate, startDate), 1);
  const totalPoints = items.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = Math.min(Math.max(differenceInCalendarDays(today, startDate), 0), totalDays);
  const sprintStarted = today >= startDate;

  const actualSeries: { day: number; remaining: number }[] = [];
  if (sprintStarted) {
    for (let day = 0; day <= lastDay; day++) {
      const cutoff = addDays(startDate, day);
      cutoff.setHours(23, 59, 59, 999);
      const completedPoints = items
        .filter((i) => i.completedAt && new Date(i.completedAt) <= cutoff)
        .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
      actualSeries.push({ day, remaining: totalPoints - completedPoints });
    }
  }

  const plotWidth = CHART_WIDTH - PADDING * 2;
  const plotHeight = CHART_HEIGHT - PADDING * 2;

  function x(day: number) {
    return PADDING + (day / totalDays) * plotWidth;
  }
  function y(points: number) {
    return PADDING + plotHeight - (totalPoints > 0 ? (points / totalPoints) * plotHeight : 0);
  }

  const idealPath = `M ${x(0)} ${y(totalPoints)} L ${x(totalDays)} ${y(0)}`;
  const actualPath = actualSeries.map((p, idx) => `${idx === 0 ? "M" : "L"} ${x(p.day)} ${y(p.remaining)}`).join(" ");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-muted-foreground/50" style={{ borderTop: "2px dashed" }} />
          {t("ideal")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-primary" />
          {t("actual")}
        </span>
        <span className="text-muted-foreground">
          {t("totalPoints")}: {totalPoints} · {formatDate(sprint.startDate, locale)} →{" "}
          {formatDate(sprint.endDate, locale)}
        </span>
      </div>
      {totalPoints === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noPoints")}</p>
      ) : (
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full max-w-2xl">
          <line
            x1={PADDING}
            y1={PADDING}
            x2={PADDING}
            y2={CHART_HEIGHT - PADDING}
            className="stroke-border"
            strokeWidth={1}
          />
          <line
            x1={PADDING}
            y1={CHART_HEIGHT - PADDING}
            x2={CHART_WIDTH - PADDING}
            y2={CHART_HEIGHT - PADDING}
            className="stroke-border"
            strokeWidth={1}
          />
          <text x={PADDING - 6} y={PADDING} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {totalPoints}
          </text>
          <text x={PADDING - 6} y={CHART_HEIGHT - PADDING} textAnchor="end" className="fill-muted-foreground text-[10px]">
            0
          </text>
          <path d={idealPath} className="stroke-muted-foreground/50" strokeWidth={2} strokeDasharray="6 4" fill="none" />
          {actualSeries.length > 0 && <path d={actualPath} className="stroke-primary" strokeWidth={2} fill="none" />}
          {actualSeries.map((p) => (
            <circle key={p.day} cx={x(p.day)} cy={y(p.remaining)} r={2.5} className="fill-primary" />
          ))}
        </svg>
      )}
      {!sprintStarted && <p className="text-sm text-muted-foreground">{t("notStarted")}</p>}
    </div>
  );
}
