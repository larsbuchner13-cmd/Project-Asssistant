"use client";

import { useTranslations } from "next-intl";
import { ArrowUp, ArrowDown, Pencil, Trash2, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepFormDialog, type EditableStep } from "@/components/processes/step-form-dialog";
import { deleteProcessStep, moveProcessStep } from "@/app/[locale]/actions/process-templates";

export type StepWithUsers = EditableStep & {
  assignee: { name: string } | null;
  approver: { name: string } | null;
};

export function StepList({
  templateId,
  steps,
  users,
}: {
  templateId: string;
  steps: StepWithUsers[];
  users: { id: string; name: string }[];
}) {
  const t = useTranslations();

  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("processes.template.noSteps")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <Card key={step.id}>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                {index + 1}
              </div>
              <div>
                <p className="font-medium">{step.name}</p>
                {step.description && <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === 0}
                onClick={() => moveProcessStep(templateId, step.id, "up")}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === steps.length - 1}
                onClick={() => moveProcessStep(templateId, step.id, "down")}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <StepFormDialog
                templateId={templateId}
                users={users}
                step={step}
                trigger={
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  if (window.confirm(t("processes.template.deleteStepConfirm"))) {
                    deleteProcessStep(templateId, step.id);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              {step.responsibleRole && <Badge variant="secondary">{step.responsibleRole}</Badge>}
              {step.assignee && <Badge variant="outline">{step.assignee.name}</Badge>}
              {!step.responsibleRole && !step.assignee && (
                <span className="text-xs text-muted-foreground">{t("processes.template.noPersonAssigned")}</span>
              )}
              {step.requiresApproval && (
                <Badge variant="amber">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {step.approver ? step.approver.name : t("processes.template.approver")}
                </Badge>
              )}
              {step.targetDays != null && (
                <span className="text-xs text-muted-foreground">
                  {step.targetDays} {t("processes.kpi.days")}
                </span>
              )}
            </div>
            {step.checklistItems.length > 0 && (
              <ul className="list-inside list-disc text-xs text-muted-foreground">
                {step.checklistItems.map((item, i) => (
                  <li key={i}>{item.label}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
