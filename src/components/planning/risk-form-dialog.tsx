"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus, Pencil } from "lucide-react";
import type { z } from "zod";
import type { Risk } from "@prisma/client";

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
import { riskFormSchema, type RiskFormValues } from "@/lib/validations/risk";
import { createRisk, updateRisk } from "@/app/[locale]/actions/risks";
import { riskScore, riskScoreVariant } from "@/lib/pm";
import { Badge } from "@/components/ui/badge";

const SCALE = [1, 2, 3, 4, 5] as const;
const STATUSES = ["OPEN", "MITIGATED", "OCCURRED", "CLOSED"] as const;

export function RiskFormDialog({ projectId, risk }: { projectId: string; risk?: Risk }) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof riskFormSchema>, unknown, RiskFormValues>({
    resolver: zodResolver(riskFormSchema),
    defaultValues: risk
      ? {
          description: risk.description,
          probability: risk.probability,
          impact: risk.impact,
          status: risk.status,
          mitigationPlan: risk.mitigationPlan ?? "",
          contingencyPlan: risk.contingencyPlan ?? "",
          owner: risk.owner ?? "",
        }
      : { probability: 3, impact: 3, status: "OPEN" },
  });

  const probability = watch("probability");
  const impact = watch("impact");
  const status = watch("status");
  const score = riskScore(Number(probability) || 0, Number(impact) || 0);

  async function onSubmit(values: RiskFormValues) {
    if (risk) {
      await updateRisk(projectId, risk.id, values);
    } else {
      await createRisk(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {risk ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus />
            {t("risks.addRisk")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("risks.addRisk")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("common.description")}</Label>
            <Textarea id="description" rows={2} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{t(errors.description.message as never)}</p>
            )}
          </div>
          <div className="grid grid-cols-3 items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("risks.probability")}</Label>
              <Select value={String(probability)} onValueChange={(v) => setValue("probability", Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCALE.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("risks.impact")}</Label>
              <Select value={String(impact)} onValueChange={(v) => setValue("impact", Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCALE.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("risks.score")}</Label>
              <Badge variant={riskScoreVariant(score) as never} className="w-fit text-sm">
                {score}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mitigationPlan">{t("risks.mitigationPlan")}</Label>
            <Textarea id="mitigationPlan" rows={2} {...register("mitigationPlan")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contingencyPlan">{t("risks.contingencyPlan")}</Label>
            <Textarea id="contingencyPlan" rows={2} {...register("contingencyPlan")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="owner">{t("common.owner")}</Label>
              <Input id="owner" {...register("owner")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("common.status")}</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as RiskFormValues["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`risks.riskStatus.${s}`)}
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
