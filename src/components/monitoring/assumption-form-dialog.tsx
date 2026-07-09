"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { Assumption } from "@prisma/client";

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
import { assumptionFormSchema, type AssumptionFormValues } from "@/lib/validations/assumption";
import { createAssumption, updateAssumption } from "@/app/[locale]/actions/assumptions";

const STATUSES = ["UNVALIDATED", "VALIDATED", "INVALIDATED"] as const;

export function AssumptionFormDialog({
  projectId,
  assumption,
  trigger,
}: {
  projectId: string;
  assumption?: Assumption;
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
  } = useForm<AssumptionFormValues>({
    resolver: zodResolver(assumptionFormSchema),
    defaultValues: assumption
      ? { description: assumption.description, status: assumption.status, owner: assumption.owner ?? "" }
      : { status: "UNVALIDATED" },
  });

  const status = watch("status");

  async function onSubmit(values: AssumptionFormValues) {
    if (assumption) {
      await updateAssumption(projectId, assumption.id, values);
    } else {
      await createAssumption(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("raid.addAssumption")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("common.description")}</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="owner">{t("common.owner")}</Label>
              <Input id="owner" {...register("owner")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("common.status")}</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as AssumptionFormValues["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`raid.assumptionStatus.${s}`)}
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
