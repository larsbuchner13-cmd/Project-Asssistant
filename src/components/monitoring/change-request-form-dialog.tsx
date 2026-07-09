"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ChangeRequest } from "@prisma/client";

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
import { changeRequestFormSchema, type ChangeRequestFormValues } from "@/lib/validations/change-request";
import { createChangeRequest, updateChangeRequest } from "@/app/[locale]/actions/change-requests";

const STATUSES = ["PROPOSED", "APPROVED", "REJECTED", "DEFERRED", "IMPLEMENTED"] as const;

export function ChangeRequestFormDialog({
  projectId,
  changeRequest,
  trigger,
}: {
  projectId: string;
  changeRequest?: ChangeRequest;
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
  } = useForm<ChangeRequestFormValues>({
    resolver: zodResolver(changeRequestFormSchema),
    defaultValues: changeRequest
      ? {
          description: changeRequest.description,
          impactScope: changeRequest.impactScope ?? "",
          impactTime: changeRequest.impactTime ?? "",
          impactCost: changeRequest.impactCost ?? "",
          status: changeRequest.status,
          requestedBy: changeRequest.requestedBy ?? "",
          decisionDate: changeRequest.decisionDate ? changeRequest.decisionDate.toString().slice(0, 10) : "",
        }
      : { status: "PROPOSED" },
  });

  const status = watch("status");

  async function onSubmit(values: ChangeRequestFormValues) {
    if (changeRequest) {
      await updateChangeRequest(projectId, changeRequest.id, values);
    } else {
      await createChangeRequest(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("changeRequests.addChangeRequest")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("common.description")}</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="impactScope">{t("changeRequests.impactScope")}</Label>
              <Input id="impactScope" {...register("impactScope")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="impactTime">{t("changeRequests.impactTime")}</Label>
              <Input id="impactTime" {...register("impactTime")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="impactCost">{t("changeRequests.impactCost")}</Label>
              <Input id="impactCost" {...register("impactCost")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="requestedBy">{t("changeRequests.requestedBy")}</Label>
              <Input id="requestedBy" {...register("requestedBy")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="decisionDate">{t("changeRequests.decisionDate")}</Label>
              <Input id="decisionDate" type="date" {...register("decisionDate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("common.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => setValue("status", v as ChangeRequestFormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`changeRequests.crStatus.${s}`)}
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
