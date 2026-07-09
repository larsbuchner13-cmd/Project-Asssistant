"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import type { Sprint } from "@prisma/client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BacklogItemFormDialog } from "@/components/scrum/backlog-item-form-dialog";
import { deleteBacklogItem } from "@/app/[locale]/actions/backlog-items";
import type { BacklogItemWithSprint } from "@/components/scrum/types";

export function BacklogTable({
  projectId,
  items,
  sprints,
}: {
  projectId: string;
  items: BacklogItemWithSprint[];
  sprints: Sprint[];
}) {
  const t = useTranslations();

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("common.noData")}</p>;
  }

  const totalPoints = items.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("backlog.totalStoryPoints")}: <span className="font-medium text-foreground">{totalPoints}</span>
      </p>
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead className="whitespace-nowrap">{t("backlog.storyPoints")}</TableHead>
            <TableHead className="whitespace-nowrap">{t("taskboard.priority")}</TableHead>
            <TableHead className="whitespace-nowrap">{t("common.status")}</TableHead>
            <TableHead className="whitespace-nowrap">{t("backlog.sprint")}</TableHead>
            <TableHead className="whitespace-nowrap text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="max-w-xs truncate" title={item.title}>
                {item.title}
              </TableCell>
              <TableCell className="whitespace-nowrap">{item.storyPoints ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={item.priority === "CRITICAL" ? "red" : item.priority === "HIGH" ? "amber" : "outline"}>
                  {t(`priority.${item.priority}`)}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">{t(`taskboard.column.${item.status}`)}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {item.sprint?.name ?? t("backlog.noSprint")}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex justify-end gap-1">
                  <BacklogItemFormDialog
                    projectId={projectId}
                    sprints={sprints}
                    item={item}
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <form action={deleteBacklogItem.bind(null, projectId, item.id)}>
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
    </div>
  );
}
