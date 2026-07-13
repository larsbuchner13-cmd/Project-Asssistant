"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { processStepFormSchema, type ProcessStepFormValues } from "@/lib/validations/process-template";
import { createProcessStep, updateProcessStep } from "@/app/[locale]/actions/process-templates";

export type EditableStep = {
  id: string;
  name: string;
  description: string | null;
  responsibleRole: string | null;
  assigneeId: string | null;
  requiresApproval: boolean;
  approverId: string | null;
  targetDays: number | null;
  checklistItems: { label: string }[];
};

export function StepFormDialog({
  templateId,
  users,
  step,
  trigger,
}: {
  templateId: string;
  users: { id: string; name: string }[];
  step?: EditableStep;
  trigger: React.ReactNode;
}) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [checklist, setChecklist] = React.useState<string[]>(step?.checklistItems.map((i) => i.label) ?? []);
  const [newItem, setNewItem] = React.useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof processStepFormSchema>, unknown, ProcessStepFormValues>({
    resolver: zodResolver(processStepFormSchema),
    defaultValues: step
      ? {
          name: step.name,
          description: step.description ?? "",
          responsibleRole: step.responsibleRole ?? "",
          assigneeId: step.assigneeId ?? "",
          requiresApproval: step.requiresApproval,
          approverId: step.approverId ?? "",
          targetDays: step.targetDays ?? "",
          checklistLabels: step.checklistItems.map((i) => i.label),
        }
      : { requiresApproval: false, checklistLabels: [] },
  });

  const requiresApproval = watch("requiresApproval");
  const assigneeId = watch("assigneeId");
  const approverId = watch("approverId");

  React.useEffect(() => {
    setValue("checklistLabels", checklist);
  }, [checklist, setValue]);

  function addChecklistItem() {
    if (!newItem.trim()) return;
    setChecklist((c) => [...c, newItem.trim()]);
    setNewItem("");
  }

  async function onSubmit(values: ProcessStepFormValues) {
    if (step) {
      await updateProcessStep(templateId, step.id, values);
    } else {
      await createProcessStep(templateId, values);
      reset();
      setChecklist([]);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step ? t("processes.template.editStep") : t("processes.template.addStep")}</DialogTitle>
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
              <Label htmlFor="responsibleRole">{t("processes.template.responsibleRole")}</Label>
              <Input id="responsibleRole" {...register("responsibleRole")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("processes.template.responsiblePerson")}</Label>
              <Select value={assigneeId || "none"} onValueChange={(v) => setValue("assigneeId", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("processes.template.noPersonAssigned")}</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="targetDays">{t("processes.template.targetDays")}</Label>
            <Input id="targetDays" type="number" step="0.5" min="0" className="w-40" {...register("targetDays")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={requiresApproval}
              onCheckedChange={(checked) => setValue("requiresApproval", !!checked)}
            />
            {t("processes.template.requiresApproval")}
          </label>
          {requiresApproval && (
            <div className="flex flex-col gap-1.5">
              <Label>{t("processes.template.approver")}</Label>
              <Select value={approverId || "none"} onValueChange={(v) => setValue("approverId", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("processes.template.noPersonAssigned")}</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>{t("processes.template.checklist")}</Label>
            <div className="flex flex-col gap-1.5">
              {checklist.map((label, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 rounded-md border border-input px-2 py-1">{label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setChecklist((c) => c.filter((_, i) => i !== index))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
                placeholder={t("processes.template.checklistPlaceholder")}
                className="h-8 text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={addChecklistItem}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
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
