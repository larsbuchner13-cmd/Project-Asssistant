"use client";

import { useTranslations, useLocale } from "next-intl";
import { Pencil, Trash2, Users } from "lucide-react";
import type { Decision, ActionItem } from "@prisma/client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DecisionFormDialog } from "@/components/executing/decision-form-dialog";
import { deleteDecision, toggleActionItem } from "@/app/[locale]/actions/decisions";
import { formatDate } from "@/lib/pm";

type DecisionWithItems = Decision & { actionItems: ActionItem[] };

export function DecisionList({ projectId, decisions }: { projectId: string; decisions: DecisionWithItems[] }) {
  const t = useTranslations();
  const locale = useLocale();

  if (decisions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("common.noData")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {decisions.map((decision) => (
        <Card key={decision.id}>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <p className="font-medium">{formatDate(decision.meetingDate, locale)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {decision.attendees.join(", ") || "—"}
              </p>
            </div>
            <div className="flex gap-1">
              <DecisionFormDialog
                projectId={projectId}
                decision={decision}
                trigger={
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
              <form action={deleteDecision.bind(null, projectId, decision.id)}>
                <Button variant="ghost" size="icon" type="submit">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>{decision.decisionText}</p>
            {decision.notes && <p className="text-muted-foreground">{decision.notes}</p>}
            {decision.actionItems.length > 0 && (
              <div className="mt-1 flex flex-col gap-1.5 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("decisions.actionItems")}
                </p>
                {decision.actionItems.map((item) => (
                  <label key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={(checked) => toggleActionItem(projectId, item.id, !!checked)}
                    />
                    <span className={item.done ? "text-muted-foreground line-through" : ""}>
                      {item.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      — {item.owner}
                      {item.dueDate ? `, ${formatDate(item.dueDate, locale)}` : ""}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
