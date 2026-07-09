"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import type { z } from "zod";
import type { Decision, ActionItem } from "@prisma/client";

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
import { decisionFormSchema, type DecisionFormValues } from "@/lib/validations/decision";
import { createDecision, updateDecision } from "@/app/[locale]/actions/decisions";

type DecisionWithItems = Decision & { actionItems: ActionItem[] };

export function DecisionFormDialog({
  projectId,
  decision,
  trigger,
}: {
  projectId: string;
  decision?: DecisionWithItems;
  trigger: React.ReactNode;
}) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof decisionFormSchema>, unknown, DecisionFormValues>({
    resolver: zodResolver(decisionFormSchema),
    defaultValues: decision
      ? {
          meetingDate: decision.meetingDate.toString().slice(0, 10),
          attendees: decision.attendees.join(", "),
          notes: decision.notes,
          decisionText: decision.decisionText,
          actionItems: decision.actionItems.map((item) => ({
            description: item.description,
            owner: item.owner,
            dueDate: item.dueDate ? item.dueDate.toString().slice(0, 10) : "",
          })),
        }
      : {
          meetingDate: new Date().toISOString().slice(0, 10),
          attendees: "",
          notes: "",
          decisionText: "",
          actionItems: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "actionItems" });

  async function onSubmit(values: DecisionFormValues) {
    if (decision) {
      await updateDecision(projectId, decision.id, values);
    } else {
      await createDecision(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("decisions.addDecision")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meetingDate">{t("common.date")}</Label>
              <Input id="meetingDate" type="date" {...register("meetingDate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="attendees">{t("decisions.attendees")}</Label>
              <Input id="attendees" placeholder={t("decisions.attendeesPlaceholder")} {...register("attendees")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="decisionText">{t("decisions.decisionText")}</Label>
            <Textarea id="decisionText" rows={2} {...register("decisionText")} />
            {errors.decisionText && (
              <p className="text-xs text-destructive">{t(errors.decisionText.message as never)}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">{t("decisions.notes")}</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>{t("decisions.actionItems")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", owner: "", dueDate: "" })}
              >
                <Plus className="h-4 w-4" />
                {t("common.add")}
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_140px_140px_auto] items-start gap-2">
                <Input placeholder={t("decisions.actionDescription")} {...register(`actionItems.${index}.description`)} />
                <Input placeholder={t("common.owner")} {...register(`actionItems.${index}.owner`)} />
                <Input type="date" {...register(`actionItems.${index}.dueDate`)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
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
