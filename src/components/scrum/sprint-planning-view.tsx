"use client";

import { useTranslations, useLocale } from "next-intl";
import { Pencil, Trash2, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SprintFormDialog } from "@/components/scrum/sprint-form-dialog";
import { deleteSprint } from "@/app/[locale]/actions/sprints";
import { assignToSprint } from "@/app/[locale]/actions/backlog-items";
import { formatDate } from "@/lib/pm";
import type { BacklogItemWithSprint, SprintWithItems } from "@/components/scrum/types";

export function SprintPlanningView({
  projectId,
  sprints,
  unassigned,
}: {
  projectId: string;
  sprints: SprintWithItems[];
  unassigned: BacklogItemWithSprint[];
}) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-4">
      {sprints.map((sprint) => {
        const points = sprint.items.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
        return (
          <Card key={sprint.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{sprint.name}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(sprint.startDate, locale)} → {formatDate(sprint.endDate, locale)} ·{" "}
                  {t("sprintPlanning.totalPoints")}: {points}
                </p>
                {sprint.goal && <p className="mt-1 text-sm">{sprint.goal}</p>}
              </div>
              <div className="flex gap-1">
                <SprintFormDialog
                  projectId={projectId}
                  sprint={sprint}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <form action={deleteSprint.bind(null, projectId, sprint.id)}>
                  <Button variant="ghost" size="icon" type="submit">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent>
              {sprint.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("sprintPlanning.noItems")}</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {sprint.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      <Badge variant="outline" className="shrink-0">
                        {item.storyPoints ?? 0} SP
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => assignToSprint(projectId, item.id, null)}
                        title={t("sprintPlanning.unassign")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sprintPlanning.unassignedItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          {unassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {unassigned.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <Badge variant="outline" className="shrink-0">
                    {item.storyPoints ?? 0} SP
                  </Badge>
                  <Select onValueChange={(v) => assignToSprint(projectId, item.id, v)}>
                    <SelectTrigger className="w-48 shrink-0">
                      <SelectValue placeholder={t("sprintPlanning.assignTo")} />
                    </SelectTrigger>
                    <SelectContent>
                      {sprints.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
