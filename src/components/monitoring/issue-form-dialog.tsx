"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { Issue } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { issueFormSchema, type IssueFormValues } from "@/lib/validations/issue";
import { createIssue, updateIssue } from "@/app/[locale]/actions/issues";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export function IssueFormDialog({
  projectId,
  issue,
  trigger,
}: {
  projectId: string;
  issue?: Issue;
  trigger: React.ReactNode;
}) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: issue
      ? { description: issue.description, impact: issue.impact ?? "", status: issue.status, owner: issue.owner ?? "" }
      : { status: "OPEN" },
  });

  const status = watch("status");

  async function onSubmit(values: IssueFormValues) {
    if (issue) {
      await updateIssue(projectId, issue.id, values);
    } else {
      await createIssue(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("raid.addIssue")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("common.description")}</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="impact">{t("raid.impact")}</Label>
            <Textarea id="impact" rows={2} {...register("impact")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="owner">{t("common.owner")}</Label>
              <Input id="owner" {...register("owner")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("common.status")}</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as IssueFormValues["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`raid.issueStatus.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
