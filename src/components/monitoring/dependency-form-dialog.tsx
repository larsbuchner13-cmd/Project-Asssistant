"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { Dependency } from "@prisma/client";

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
import { dependencyFormSchema, type DependencyFormValues } from "@/lib/validations/dependency";
import { createDependency, updateDependency } from "@/app/[locale]/actions/dependencies";

const STATUSES = ["PENDING", "AT_RISK", "RESOLVED"] as const;

export function DependencyFormDialog({
  projectId,
  dependency,
  trigger,
}: {
  projectId: string;
  dependency?: Dependency;
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
  } = useForm<DependencyFormValues>({
    resolver: zodResolver(dependencyFormSchema),
    defaultValues: dependency
      ? {
          description: dependency.description,
          dependsOn: dependency.dependsOn,
          status: dependency.status,
          owner: dependency.owner ?? "",
        }
      : { status: "PENDING" },
  });

  const status = watch("status");

  async function onSubmit(values: DependencyFormValues) {
    if (dependency) {
      await updateDependency(projectId, dependency.id, values);
    } else {
      await createDependency(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("raid.addDependency")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("common.description")}</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dependsOn">{t("raid.dependsOn")}</Label>
            <Input id="dependsOn" {...register("dependsOn")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="owner">{t("common.owner")}</Label>
              <Input id="owner" {...register("owner")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("common.status")}</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as DependencyFormValues["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`raid.dependencyStatus.${s}`)}
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
