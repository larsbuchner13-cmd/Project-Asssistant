"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import { sprintFormSchema, type SprintFormValues } from "@/lib/validations/sprint";
import { createSprint, updateSprint } from "@/app/[locale]/actions/sprints";

export function SprintFormDialog({
  projectId,
  sprint,
  trigger,
}: {
  projectId: string;
  sprint?: Sprint;
  trigger: React.ReactNode;
}) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: sprint
      ? {
          name: sprint.name,
          goal: sprint.goal ?? "",
          startDate: sprint.startDate.toString().slice(0, 10),
          endDate: sprint.endDate.toString().slice(0, 10),
        }
      : { name: "", goal: "", startDate: "", endDate: "" },
  });

  async function onSubmit(values: SprintFormValues) {
    if (sprint) {
      await updateSprint(projectId, sprint.id, values);
    } else {
      await createSprint(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sprintPlanning.addSprint")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{t(errors.name.message as never)}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal">{t("sprintPlanning.goal")}</Label>
            <Textarea id="goal" rows={2} {...register("goal")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">{t("common.startDate")}</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-xs text-destructive">{t(errors.startDate.message as never)}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">{t("common.endDate")}</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate && <p className="text-xs text-destructive">{t(errors.endDate.message as never)}</p>}
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
