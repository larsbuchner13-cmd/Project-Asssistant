import { useTranslations, useLocale } from "next-intl";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { flatten, INDENT_WIDTH } from "@/lib/tree";
import { formatCurrency } from "@/lib/pm";
import type { WorkPackageWithDeps } from "@/components/planning/types";

export function BudgetTable({ workPackages }: { workPackages: WorkPackageWithDeps[] }) {
  const t = useTranslations("budget");
  const locale = useLocale();

  const items = flatten(workPackages);
  const totalPlanned = workPackages.reduce((sum, wp) => sum + wp.plannedCost, 0);
  const totalActual = workPackages.reduce((sum, wp) => sum + wp.actualCost, 0);
  const burnPct = totalPlanned > 0 ? Math.min((totalActual / totalPlanned) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 rounded-lg border border-border p-4">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("totalActual")}: {formatCurrency(totalActual, locale)}
            </span>
            <span className="text-muted-foreground">
              {t("totalPlanned")}: {formatCurrency(totalPlanned, locale)}
            </span>
          </div>
          <Progress value={burnPct} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("label")}</TableHead>
            <TableHead className="text-right">{t("plannedCost")}</TableHead>
            <TableHead className="text-right">{t("actualCost")}</TableHead>
            <TableHead className="text-right">{t("variance")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((wp) => {
            const variance = wp.actualCost - wp.plannedCost;
            return (
              <TableRow key={wp.id}>
                <TableCell style={{ paddingLeft: 8 + wp.depth * INDENT_WIDTH }}>{wp.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(wp.plannedCost, locale)}</TableCell>
                <TableCell className="text-right">{formatCurrency(wp.actualCost, locale)}</TableCell>
                <TableCell
                  className={`text-right ${variance > 0 ? "text-rag-red" : variance < 0 ? "text-rag-green" : ""}`}
                >
                  {variance > 0 ? "+" : ""}
                  {formatCurrency(variance, locale)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>{t("totalPlanned")}</TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(totalPlanned, locale)}</TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(totalActual, locale)}</TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(totalActual - totalPlanned, locale)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
