"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import type { Stakeholder } from "@prisma/client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StakeholderFormDialog } from "@/components/initiating/stakeholder-form-dialog";
import { deleteStakeholder } from "@/app/[locale]/actions/stakeholders";

export function StakeholderTable({
  projectId,
  stakeholders,
}: {
  projectId: string;
  stakeholders: Stakeholder[];
}) {
  const t = useTranslations();

  if (stakeholders.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("common.noData")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("common.name")}</TableHead>
          <TableHead>{t("stakeholders.role")}</TableHead>
          <TableHead>{t("stakeholders.influence")}</TableHead>
          <TableHead>{t("stakeholders.interest")}</TableHead>
          <TableHead>{t("stakeholders.engagementStrategy")}</TableHead>
          <TableHead className="text-right">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stakeholders.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell>{s.role}</TableCell>
            <TableCell>
              <Badge variant="outline">{t(`stakeholders.level.${s.influence}`)}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{t(`stakeholders.level.${s.interest}`)}</Badge>
            </TableCell>
            <TableCell>{t(`stakeholders.strategy.${s.engagementStrategy}`)}</TableCell>
            <TableCell className="flex justify-end gap-1">
              <StakeholderFormDialog projectId={projectId} stakeholder={s} />
              <form action={deleteStakeholder.bind(null, projectId, s.id)}>
                <Button variant="ghost" size="icon" type="submit">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
