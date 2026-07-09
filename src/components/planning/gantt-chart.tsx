import { differenceInCalendarDays } from "date-fns";
import { useTranslations, useLocale } from "next-intl";

import { flatten, INDENT_WIDTH } from "@/lib/tree";
import { formatDate } from "@/lib/pm";
import type { WorkPackageWithDeps } from "@/components/planning/types";

const DAY_WIDTH = 14;
const ROW_HEIGHT = 40;
const LABEL_WIDTH = 260;

export function GanttChart({ workPackages }: { workPackages: WorkPackageWithDeps[] }) {
  const t = useTranslations("schedule");
  const locale = useLocale();

  const dated = workPackages.filter((wp) => wp.startDate && wp.endDate);

  if (dated.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noDates")}</p>;
  }

  const items = flatten(workPackages);
  const rows = items.filter((i) => dated.some((d) => d.id === i.id));

  const minDate = new Date(Math.min(...dated.map((d) => new Date(d.startDate!).getTime())));
  const maxDate = new Date(Math.max(...dated.map((d) => new Date(d.endDate!).getTime())));
  const totalDays = differenceInCalendarDays(maxDate, minDate) + 1;
  const chartWidth = Math.max(totalDays * DAY_WIDTH, 300);

  const rowIndex = new Map(rows.map((r, idx) => [r.id, idx]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = differenceInCalendarDays(today, minDate) * DAY_WIDTH;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div style={{ width: LABEL_WIDTH + chartWidth }}>
        <div className="flex border-b border-border bg-muted/40 text-xs text-muted-foreground">
          <div style={{ width: LABEL_WIDTH }} className="shrink-0 px-3 py-2 font-medium">
            {t("title")}
          </div>
          <div style={{ width: chartWidth }} className="relative px-3 py-2">
            {formatDate(minDate, locale)} → {formatDate(maxDate, locale)}
          </div>
        </div>

        <div className="relative">
          <svg
            className="pointer-events-none absolute z-10"
            style={{ left: LABEL_WIDTH, top: 0, width: chartWidth, height: rows.length * ROW_HEIGHT }}
          >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" className="fill-muted-foreground" />
              </marker>
            </defs>
            {dated.flatMap((wp) =>
              wp.successorOf
                .filter((dep) => rowIndex.has(dep.predecessorId) && rowIndex.has(wp.id))
                .map((dep) => {
                  const pred = dated.find((d) => d.id === dep.predecessorId);
                  if (!pred) return null;
                  const predEndX =
                    differenceInCalendarDays(new Date(pred.endDate!), minDate) * DAY_WIDTH + DAY_WIDTH;
                  const predY = (rowIndex.get(pred.id) ?? 0) * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const succStartX = differenceInCalendarDays(new Date(wp.startDate!), minDate) * DAY_WIDTH;
                  const succY = (rowIndex.get(wp.id) ?? 0) * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const midX = predEndX + Math.max((succStartX - predEndX) / 2, 6);
                  return (
                    <path
                      key={dep.id}
                      d={`M ${predEndX} ${predY} H ${midX} V ${succY} H ${succStartX}`}
                      className="fill-none stroke-muted-foreground"
                      strokeWidth={1.5}
                      markerEnd="url(#arrow)"
                    />
                  );
                })
            )}
          </svg>

          {todayOffset >= 0 && todayOffset <= chartWidth && (
            <div
              className="absolute z-0 border-l border-dashed border-primary/60"
              style={{ left: LABEL_WIDTH + todayOffset, top: 0, height: rows.length * ROW_HEIGHT }}
              title={t("today")}
            />
          )}

          {rows.map((wp) => {
            const startOffset = differenceInCalendarDays(new Date(wp.startDate!), minDate) * DAY_WIDTH;
            const duration = differenceInCalendarDays(new Date(wp.endDate!), new Date(wp.startDate!)) + 1;
            const barColor =
              wp.status === "DONE" ? "bg-rag-green" : wp.status === "BLOCKED" ? "bg-rag-red" : "bg-primary";

            return (
              <div key={wp.id} className="flex items-center border-b border-border/60 last:border-b-0" style={{ height: ROW_HEIGHT }}>
                <div
                  style={{ width: LABEL_WIDTH, paddingLeft: 12 + wp.depth * INDENT_WIDTH }}
                  className="shrink-0 truncate pr-2 text-sm"
                  title={wp.name}
                >
                  {wp.name}
                </div>
                <div style={{ width: chartWidth }} className="relative h-full">
                  <div
                    className={`absolute top-1/2 h-5 -translate-y-1/2 rounded ${barColor} opacity-90`}
                    style={{ left: startOffset, width: Math.max(duration * DAY_WIDTH - 2, 4) }}
                    title={`${formatDate(wp.startDate!, locale)} → ${formatDate(wp.endDate!, locale)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
