"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { processTemplateFormSchema, type ProcessTemplateFormValues } from "@/lib/validations/process-template";
import {
  updateProcessTemplate,
  deleteProcessTemplate,
  toggleProcessTemplateActive,
} from "@/app/[locale]/actions/process-templates";
import { useRouter } from "@/i18n/navigation";

export type TemplateHeaderData = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdBy: { name: string };
};

export function TemplateHeader({ template }: { template: TemplateHeaderData }) {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{template.name}</h1>
          <Badge variant={template.isActive ? "green" : "outline"}>
            {template.isActive ? t("processes.active") : t("processes.inactive")}
          </Badge>
          {template.category && <Badge variant="secondary">{template.category}</Badge>}
        </div>
        {template.description && <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          {t("processes.createdBy")}: {template.createdBy.name}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <EditTemplateDialog template={template} />
        <Button
          variant="outline"
          size="icon"
          onClick={() => toggleProcessTemplateActive(template.id, !template.isActive)}
          title={template.isActive ? t("processes.archive") : t("processes.activate")}
        >
          {template.isActive ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (window.confirm(t("processes.deleteTemplateConfirm"))) {
              deleteProcessTemplate(template.id);
              router.push("/processes");
              router.refresh();
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EditTemplateDialog({ template }: { template: TemplateHeaderData }) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProcessTemplateFormValues>({
    resolver: zodResolver(processTemplateFormSchema),
    defaultValues: {
      name: template.name,
      description: template.description ?? "",
      category: template.category ?? "",
    },
  });

  async function onSubmit(values: ProcessTemplateFormValues) {
    await updateProcessTemplate(template.id, values);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title={t("processes.template.editDetails")}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("processes.template.editDetails")}</DialogTitle>
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
            <Input id="category" {...register("category")} />
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
