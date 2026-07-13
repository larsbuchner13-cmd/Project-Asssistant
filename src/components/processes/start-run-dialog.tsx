"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startProcessRunFormSchema, type StartProcessRunFormValues } from "@/lib/validations/process-run";
import { startProcessRun } from "@/app/[locale]/actions/process-runs";
import { useRouter } from "@/i18n/navigation";

export function StartRunDialog({
  templateId,
  templateName,
  projects,
}: {
  templateId: string;
  templateName: string;
  projects: { id: string; name: string }[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StartProcessRunFormValues>({
    resolver: zodResolver(startProcessRunFormSchema),
    defaultValues: { name: templateName },
  });

  const projectId = watch("projectId");

  async function onSubmit(values: StartProcessRunFormValues) {
    const run = await startProcessRun(templateId, values);
    setOpen(false);
    reset();
    router.push(`/processes/runs/${run.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Play />
          {t("processes.startWorkflow")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("processes.startDialog.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("processes.startDialog.name")}</Label>
            <Input id="name" placeholder={t("processes.startDialog.namePlaceholder")} {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{t(errors.name.message as never)}</p>}
          </div>
          {projects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>{t("processes.startDialog.linkedProject")}</Label>
              <Select value={projectId || "none"} onValueChange={(v) => setValue("projectId", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("processes.startDialog.noProject")}</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {t("processes.startDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
