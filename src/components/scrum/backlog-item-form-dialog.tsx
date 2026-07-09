"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import type { Sprint } from "@prisma/client";

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
import { backlogItemFormSchema, type BacklogItemFormValues } from "@/lib/validations/backlog-item";
import { createBacklogItem, updateBacklogItem } from "@/app/[locale]/actions/backlog-items";
import type { BacklogItemWithSprint } from "@/components/scrum/types";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const STATUSES = ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export function BacklogItemFormDialog({
  projectId,
  sprints,
  item,
  trigger,
}: {
  projectId: string;
  sprints: Sprint[];
  item?: BacklogItemWithSprint;
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
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof backlogItemFormSchema>, unknown, BacklogItemFormValues>({
    resolver: zodResolver(backlogItemFormSchema),
    defaultValues: item
      ? {
          title: item.title,
          description: item.description ?? "",
          storyPoints: item.storyPoints ?? "",
          priority: item.priority,
          status: item.status,
          sprintId: item.sprintId ?? "",
        }
      : { priority: "MEDIUM", status: "BACKLOG", sprintId: "" },
  });

  const priority = watch("priority");
  const status = watch("status");
  const sprintId = watch("sprintId");

  async function onSubmit(values: BacklogItemFormValues) {
    if (item) {
      await updateBacklogItem(projectId, item.id, values);
    } else {
      await createBacklogItem(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("backlog.addItem")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">{t("common.name")}</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{t(errors.title.message as never)}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("common.description")}</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="storyPoints">{t("backlog.storyPoints")}</Label>
              <Input id="storyPoints" type="number" step="1" {...register("storyPoints")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("taskboard.priority")}</Label>
              <Select value={priority} onValueChange={(v) => setValue("priority", v as BacklogItemFormValues["priority"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("common.status")}</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as BacklogItemFormValues["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`taskboard.column.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("backlog.sprint")}</Label>
              <Select value={sprintId || "none"} onValueChange={(v) => setValue("sprintId", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("backlog.noSprint")}</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
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
