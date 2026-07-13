"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Check, Lock, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/pm";
import {
  startProcessRunStep,
  toggleRunChecklistItem,
  completeProcessRunStep,
  approveProcessRunStep,
} from "@/app/[locale]/actions/process-runs";

export type RunStepData = {
  id: string;
  order: number;
  name: string;
  description: string | null;
  responsibleRole: string | null;
  status: "LOCKED" | "READY" | "IN_PROGRESS" | "DONE";
  requiresApproval: boolean;
  approvalStatus: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
  approvalComment: string | null;
  approvedAt: Date | null;
  completedAt: Date | null;
  assignee: { id: string; name: string } | null;
  approver: { id: string; name: string } | null;
  checklistItems: { id: string; label: string; done: boolean }[];
};

const statusStyles: Record<RunStepData["status"], string> = {
  LOCKED: "bg-secondary text-muted-foreground",
  READY: "border-2 border-primary text-primary",
  IN_PROGRESS: "bg-rag-amber text-white",
  DONE: "bg-rag-green text-white",
};

export function RunStepper({ steps, runCancelled }: { steps: RunStepData[]; runCancelled: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => (
        <StepCard key={step.id} step={step} disabled={runCancelled} />
      ))}
    </div>
  );
}

function StepCard({ step, disabled }: { step: RunStepData; disabled: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [comment, setComment] = React.useState("");

  const allChecked = step.checklistItems.every((i) => i.done);
  const isApprover = session?.user && (session.user.role === "ADMIN" || session.user.id === step.approver?.id);

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${statusStyles[step.status]}`}>
          {step.status === "DONE" ? <Check className="h-4 w-4" /> : step.status === "LOCKED" ? <Lock className="h-3.5 w-3.5" /> : step.order + 1}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{step.name}</p>
            <Badge variant="outline">{t(`processes.run.stepStatus.${step.status}`)}</Badge>
            {step.requiresApproval && step.approvalStatus !== "NOT_REQUIRED" && (
              <Badge variant={step.approvalStatus === "APPROVED" ? "green" : step.approvalStatus === "REJECTED" ? "red" : "amber"}>
                {t(`processes.run.approvalStatus.${step.approvalStatus}`)}
              </Badge>
            )}
          </div>
          {step.description && <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {(step.responsibleRole || step.assignee) && (
              <span>
                {t("processes.run.assignedTo")}: {step.assignee?.name ?? step.responsibleRole}
              </span>
            )}
            {step.requiresApproval && step.approver && (
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {step.approver.name}
              </span>
            )}
            {step.completedAt && <span>{formatDate(step.completedAt, locale)}</span>}
          </div>
        </div>
      </CardHeader>

      {step.status !== "LOCKED" && (
        <CardContent className="flex flex-col gap-3">
          {step.checklistItems.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {step.checklistItems.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={item.done}
                    disabled={disabled || step.status === "DONE"}
                    onCheckedChange={(checked) => toggleRunChecklistItem(step.id, item.id, !!checked)}
                  />
                  <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                </label>
              ))}
            </div>
          ) : (
            step.status !== "DONE" && <p className="text-xs text-muted-foreground">{t("processes.run.noChecklist")}</p>
          )}

          {step.approvalStatus === "REJECTED" && (
            <p className="text-xs text-rag-red">
              {t("processes.run.rejectedNotice")}
              {step.approvalComment && ` „${step.approvalComment}“`}
            </p>
          )}

          {!disabled && step.status === "READY" && (
            <Button size="sm" onClick={() => startProcessRunStep(step.id)}>
              {t("processes.run.start")}
            </Button>
          )}

          {!disabled && step.status === "IN_PROGRESS" && step.approvalStatus !== "PENDING" && (
            <Button size="sm" disabled={!allChecked} onClick={() => completeProcessRunStep(step.id)} title={!allChecked ? t("processes.run.checklistIncomplete") : undefined}>
              {step.requiresApproval ? t("processes.run.submitForApproval") : t("processes.run.complete")}
            </Button>
          )}

          {!disabled && step.approvalStatus === "PENDING" && isApprover && (
            <div className="flex flex-col gap-2">
              {rejectOpen && (
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("processes.run.rejectComment")}
                  rows={2}
                />
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approveProcessRunStep(step.id, true)}>
                  {t("processes.run.approve")}
                </Button>
                {rejectOpen ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      approveProcessRunStep(step.id, false, comment);
                      setRejectOpen(false);
                      setComment("");
                    }}
                  >
                    {t("processes.run.reject")}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}>
                    {t("processes.run.reject")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {!disabled && step.approvalStatus === "PENDING" && !isApprover && (
            <p className="text-xs text-muted-foreground">{t("processes.run.approvalStatus.PENDING")}</p>
          )}
        </CardContent>
      )}

      {step.status === "LOCKED" && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{t("processes.run.waitingForPredecessor")}</p>
        </CardContent>
      )}
    </Card>
  );
}
