"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { processTemplateFormSchema, type ProcessTemplateFormValues } from "@/lib/validations/process-template";
import { createProcessTemplate } from "@/app/[locale]/actions/process-templates";
import { useRouter } from "@/i18n/navigation";

export function NewTemplateDialog() {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProcessTemplateFormValues>({
    resolver: zodResolver(processTemplateFormSchema),
  });

  async function onSubmit(values: ProcessTemplateFormValues) {
    const template = await createProcessTemplate(values);
    setOpen(false);
    reset();
    router.push(`/processes/${template.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {t("processes.newTemplate")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("processes.newTemplate")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{t(errors.name.message as never)}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("common.description")}</Label>
            <Textarea id="description" {...register("description")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">{t("processes.category")}</Label>
            <Input id="category" placeholder={t("processes.categoryPlaceholder")} {...register("category")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
