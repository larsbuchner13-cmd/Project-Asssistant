"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

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
import { taskFormSchema, type TaskFormValues } from "@/lib/validations/task";
import { createTask, updateTask } from "@/app/[locale]/actions/tasks";
import type { TaskWithWorkPackage } from "@/components/executing/types";
import type { WorkPackage } from "@prisma/client";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const STATUSES = ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export function TaskFormDialog({
  projectId,
  workPackages,
  task,
  defaultStatus,
  trigger,
}: {
  projectId: string;
  workPackages: WorkPackage[];
  task?: TaskWithWorkPackage;
  defaultStatus?: TaskFormValues["status"];
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
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description ?? "",
          workPackageId: task.workPackageId ?? "",
          assignee: task.assignee ?? "",
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.toString().slice(0, 10) : "",
          status: task.status,
        }
      : { priority: "MEDIUM", status: defaultStatus ?? "BACKLOG", workPackageId: "" },
  });

  const priority = watch("priority");
  const status = watch("status");
  const workPackageId = watch("workPackageId");

  async function onSubmit(values: TaskFormValues) {
    if (task) {
      await updateTask(projectId, task.id, values);
    } else {
      await createTask(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? t("common.edit") : t("taskboard.addTask")}</DialogTitle>
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
          {workPackages.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>{t("taskboard.workPackage")}</Label>
              <Select
                value={workPackageId || "none"}
                onValueChange={(v) => setValue("workPackageId", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {workPackages.map((wp) => (
                    <SelectItem key={wp.id} value={wp.id}>
                      {wp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignee">{t("taskboard.assignee")}</Label>
              <Input id="assignee" {...register("assignee")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">{t("taskboard.dueDate")}</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("taskboard.priority")}</Label>
              <Select value={priority} onValueChange={(v) => setValue("priority", v as TaskFormValues["priority"])}>
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
            <div className="flex flex-col gap-1.5">
              <Label>{t("common.status")}</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as TaskFormValues["status"])}>
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
