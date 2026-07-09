"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import type { ClosureChecklistItem } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  closureChecklistItemFormSchema,
  defaultClosureCategories,
  type ClosureChecklistItemFormValues,
} from "@/lib/validations/closure-checklist";
import { createChecklistItem, deleteChecklistItem, toggleChecklistItem } from "@/app/[locale]/actions/closure-checklist";

function itemLabel(t: ReturnType<typeof useTranslations>, label: string) {
  return label.startsWith("closureChecklist.defaults.") ? t(label as never) : label;
}

export function ClosureChecklist({ projectId, items }: { projectId: string; items: ClosureChecklistItem[] }) {
  const t = useTranslations();

  const grouped = defaultClosureCategories.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  }));
  const otherItems = items.filter((i) => !(defaultClosureCategories as readonly string[]).includes(i.category));

  const totalDone = items.filter((i) => i.done).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalDone}/{items.length} {t("closureChecklist.completed")}
        </p>
        <AddChecklistItemDialog projectId={projectId} />
      </div>

      {grouped.map(
        (group) =>
          group.items.length > 0 && (
            <Card key={group.category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t(`closureChecklist.category.${group.category}`)}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <ChecklistRow key={item.id} projectId={projectId} item={item} />
                ))}
              </CardContent>
            </Card>
          )
      )}

      {otherItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("closureChecklist.category.other")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {otherItems.map((item) => (
              <ChecklistRow key={item.id} projectId={projectId} item={item} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChecklistRow({ projectId, item }: { projectId: string; item: ClosureChecklistItem }) {
  const t = useTranslations();
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={item.done}
        onCheckedChange={(checked) => toggleChecklistItem(projectId, item.id, !!checked)}
      />
      <span className={`flex-1 text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}>
        {itemLabel(t, item.label)}
      </span>
      <form action={deleteChecklistItem.bind(null, projectId, item.id)}>
        <Button variant="ghost" size="icon" type="submit" className="h-7 w-7">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}

function AddChecklistItemDialog({ projectId }: { projectId: string }) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<ClosureChecklistItemFormValues>({
    resolver: zodResolver(closureChecklistItemFormSchema),
    defaultValues: { category: "deliverables", label: "" },
  });

  const category = watch("category");

  async function onSubmit(values: ClosureChecklistItemFormValues) {
    await createChecklistItem(projectId, values);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          {t("closureChecklist.addItem")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("closureChecklist.addItem")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label">{t("common.description")}</Label>
            <Input id="label" {...register("label")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("closureChecklist.categoryLabel")}</Label>
            <Select value={category} onValueChange={(v) => setValue("category", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {defaultClosureCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`closureChecklist.category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {t("common.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
