"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { z } from "zod";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { workPackageFormSchema, type WorkPackageFormValues } from "@/lib/validations/work-package";
import { createWorkPackage, updateWorkPackage } from "@/app/[locale]/actions/work-packages";
import type { WorkPackageWithDeps } from "@/components/planning/types";

const STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE", "BLOCKED"] as const;

export function WorkPackageFormDialog({
  projectId,
  parentId,
  allWorkPackages,
  workPackage,
  trigger,
}: {
  projectId: string;
  parentId: string | null;
  allWorkPackages: WorkPackageWithDeps[];
  workPackage?: WorkPackageWithDeps;
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
  } = useForm<z.input<typeof workPackageFormSchema>, unknown, WorkPackageFormValues>({
    resolver: zodResolver(workPackageFormSchema),
    defaultValues: workPackage
      ? {
          name: workPackage.name,
          description: workPackage.description ?? "",
          owner: workPackage.owner ?? "",
          effortEstimate: workPackage.effortEstimate ?? "",
          plannedCost: workPackage.plannedCost,
          actualCost: workPackage.actualCost,
          startDate: workPackage.startDate ? workPackage.startDate.toString().slice(0, 10) : "",
          endDate: workPackage.endDate ? workPackage.endDate.toString().slice(0, 10) : "",
          status: workPackage.status,
          dependencyIds: workPackage.successorOf.map((d) => d.predecessorId),
        }
      : { status: "NOT_STARTED", plannedCost: 0, actualCost: 0, dependencyIds: [] },
  });

  const status = watch("status");
  const dependencyIds = watch("dependencyIds");

  const candidateDependencies = allWorkPackages.filter((wp) => wp.id !== workPackage?.id);

  async function onSubmit(values: WorkPackageFormValues) {
    if (workPackage) {
      await updateWorkPackage(projectId, workPackage.id, values);
    } else {
      await createWorkPackage(projectId, parentId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{workPackage ? t("common.edit") : t("wbs.addWorkPackage")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{t(errors.name.message as never)}</p>}
          </div>
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
              <Label htmlFor="effortEstimate">{t("wbs.effortEstimate")}</Label>
              <Input id="effortEstimate" type="number" step="0.5" {...register("effortEstimate")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plannedCost">{t("wbs.plannedCost")}</Label>
              <Input id="plannedCost" type="number" step="100" {...register("plannedCost")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="actualCost">{t("wbs.actualCost")}</Label>
              <Input id="actualCost" type="number" step="100" {...register("actualCost")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">{t("common.startDate")}</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">{t("common.endDate")}</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("common.status")}</Label>
            <Select value={status} onValueChange={(v) => setValue("status", v as WorkPackageFormValues["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {candidateDependencies.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>{t("wbs.dependencies")}</Label>
              <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-md border border-input p-2">
                {candidateDependencies.map((wp) => (
                  <label key={wp.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={dependencyIds?.includes(wp.id)}
                      onCheckedChange={(checked) => {
                        const current = dependencyIds ?? [];
                        setValue(
                          "dependencyIds",
                          checked ? [...current, wp.id] : current.filter((id) => id !== wp.id)
                        );
                      }}
                    />
                    {wp.name}
                  </label>
                ))}
              </div>
            </div>
          )}
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
