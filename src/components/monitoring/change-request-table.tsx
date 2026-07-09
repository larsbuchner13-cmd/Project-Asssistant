"use client";

import { useTranslations, useLocale } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import type { ChangeRequest } from "@prisma/client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChangeRequestFormDialog } from "@/components/monitoring/change-request-form-dialog";
import { deleteChangeRequest } from "@/app/[locale]/actions/change-requests";
import { formatDate } from "@/lib/pm";

const STATUS_VARIANT: Record<string, "green" | "red" | "amber" | "outline"> = {
  APPROVED: "green",
  IMPLEMENTED: "green",
  REJECTED: "red",
  DEFERRED: "amber",
  PROPOSED: "outline",
};

export function ChangeRequestTable({
  projectId,
  changeRequests,
}: {
  projectId: string;
  changeRequests: ChangeRequest[];
}) {
  const t = useTranslations();
  const locale = useLocale();

  if (changeRequests.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("common.noData")}</p>;
  }

  return (
    <Table className="min-w-[880px]">
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">{t("common.description")}</TableHead>
          <TableHead className="whitespace-nowrap">{t("changeRequests.impactScope")}</TableHead>
          <TableHead className="whitespace-nowrap">{t("changeRequests.impactTime")}</TableHead>
          <TableHead className="whitespace-nowrap">{t("changeRequests.impactCost")}</TableHead>
          <TableHead className="whitespace-nowrap">{t("changeRequests.decisionDate")}</TableHead>
          <TableHead className="whitespace-nowrap">{t("common.status")}</TableHead>
          <TableHead className="whitespace-nowrap text-right">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changeRequests.map((cr) => (
          <TableRow key={cr.id}>
            <TableCell className="max-w-xs truncate" title={cr.description}>
              {cr.description}
            </TableCell>
            <TableCell className="max-w-[140px] truncate text-muted-foreground">{cr.impactScope ?? "—"}</TableCell>
            <TableCell className="max-w-[140px] truncate text-muted-foreground">{cr.impactTime ?? "—"}</TableCell>
            <TableCell className="max-w-[140px] truncate text-muted-foreground">{cr.impactCost ?? "—"}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {cr.decisionDate ? formatDate(cr.decisionDate, locale) : "—"}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <Badge variant={STATUS_VARIANT[cr.status]}>{t(`changeRequests.crStatus.${cr.status}`)}</Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <div className="flex justify-end gap-1">
                <ChangeRequestFormDialog
                  projectId={projectId}
                  changeRequest={cr}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <form action={deleteChangeRequest.bind(null, projectId, cr.id)}>
                  <Button variant="ghost" size="icon" type="submit">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
