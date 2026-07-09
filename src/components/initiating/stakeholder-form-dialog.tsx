"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus, Pencil } from "lucide-react";
import type { Stakeholder } from "@prisma/client";

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
import { stakeholderFormSchema, type StakeholderFormValues } from "@/lib/validations/stakeholder";
import { createStakeholder, updateStakeholder } from "@/app/[locale]/actions/stakeholders";
import { suggestEngagementStrategy } from "@/lib/pm";

const LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
const STRATEGIES = ["MONITOR", "KEEP_INFORMED", "KEEP_SATISFIED", "MANAGE_CLOSELY"] as const;

export function StakeholderFormDialog({
  projectId,
  stakeholder,
}: {
  projectId: string;
  stakeholder?: Stakeholder;
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
  } = useForm<StakeholderFormValues>({
    resolver: zodResolver(stakeholderFormSchema),
    defaultValues: stakeholder
      ? {
          name: stakeholder.name,
          role: stakeholder.role,
          influence: stakeholder.influence,
          interest: stakeholder.interest,
          engagementStrategy: stakeholder.engagementStrategy,
          notes: stakeholder.notes ?? "",
        }
      : { influence: "MEDIUM", interest: "MEDIUM", engagementStrategy: "MONITOR" },
  });

  const influence = watch("influence");
  const interest = watch("interest");

  React.useEffect(() => {
    setValue("engagementStrategy", suggestEngagementStrategy(influence, interest));
  }, [influence, interest, setValue]);

  async function onSubmit(values: StakeholderFormValues) {
    if (stakeholder) {
      await updateStakeholder(projectId, stakeholder.id, values);
    } else {
      await createStakeholder(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {stakeholder ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus />
            {t("stakeholders.addStakeholder")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("stakeholders.addStakeholder")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input id="name" required {...register("name")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">{t("stakeholders.role")}</Label>
              <Input id="role" required {...register("role")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("stakeholders.influence")}</Label>
              <Select value={influence} onValueChange={(v) => setValue("influence", v as StakeholderFormValues["influence"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {t(`stakeholders.level.${l}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("stakeholders.interest")}</Label>
              <Select value={interest} onValueChange={(v) => setValue("interest", v as StakeholderFormValues["interest"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {t(`stakeholders.level.${l}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("stakeholders.engagementStrategy")}</Label>
            <Select
              value={watch("engagementStrategy")}
              onValueChange={(v) => setValue("engagementStrategy", v as StakeholderFormValues["engagementStrategy"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`stakeholders.strategy.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">{t("stakeholders.notes")}</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
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
