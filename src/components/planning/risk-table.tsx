"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import type { Risk } from "@prisma/client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskFormDialog } from "@/components/planning/risk-form-dialog";
import { deleteRisk } from "@/app/[locale]/actions/risks";
import { riskScore, riskScoreVariant } from "@/lib/pm";

export function RiskTable({ projectId, risks }: { projectId: string; risks: Risk[] }) {
  const t = useTranslations();

  if (risks.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("common.noData")}</p>;
  }

  const sorted = [...risks].sort(
    (a, b) => riskScore(b.probability, b.impact) - riskScore(a.probability, a.impact)
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("common.description")}</TableHead>
          <TableHead>{t("risks.probability")}</TableHead>
          <TableHead>{t("risks.impact")}</TableHead>
          <TableHead>{t("risks.score")}</TableHead>
          <TableHead>{t("common.owner")}</TableHead>
          <TableHead>{t("common.status")}</TableHead>
          <TableHead className="text-right">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((r) => {
          const score = riskScore(r.probability, r.impact);
          return (
            <TableRow key={r.id}>
              <TableCell className="max-w-xs truncate" title={r.description}>
                {r.description}
              </TableCell>
              <TableCell>{r.probability}</TableCell>
              <TableCell>{r.impact}</TableCell>
              <TableCell>
                <Badge variant={riskScoreVariant(score) as never}>{score}</Badge>
              </TableCell>
              <TableCell>{r.owner ?? "—"}</TableCell>
              <TableCell>{t(`risks.riskStatus.${r.status}`)}</TableCell>
              <TableCell className="flex justify-end gap-1">
                <RiskFormDialog projectId={projectId} risk={r} />
                <form action={deleteRisk.bind(null, projectId, r.id)}>
                  <Button variant="ghost" size="icon" type="submit">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
