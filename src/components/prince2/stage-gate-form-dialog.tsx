"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { StageGate } from "@prisma/client";

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
import { stageGateFormSchema, type StageGateFormValues } from "@/lib/validations/stage-gate";
import { createStageGate, updateStageGate } from "@/app/[locale]/actions/stage-gates";

export function StageGateFormDialog({
  projectId,
  stageGate,
  trigger,
}: {
  projectId: string;
  stageGate?: StageGate;
  trigger: React.ReactNode;
}) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StageGateFormValues>({
    resolver: zodResolver(stageGateFormSchema),
    defaultValues: stageGate
      ? { name: stageGate.name, endDate: stageGate.endDate.toString().slice(0, 10) }
      : { name: "", endDate: "" },
  });

  async function onSubmit(values: StageGateFormValues) {
    if (stageGate) {
      await updateStageGate(projectId, stageGate.id, values);
    } else {
      await createStageGate(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("stageGates.addStageGate")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{t(errors.name.message as never)}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endDate">{t("stageGates.endDate")}</Label>
            <Input id="endDate" type="date" {...register("endDate")} />
            {errors.endDate && <p className="text-xs text-destructive">{t(errors.endDate.message as never)}</p>}
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
