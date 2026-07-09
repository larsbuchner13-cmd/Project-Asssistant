"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { LessonLearned } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  lessonLearnedFormSchema,
  knowledgeAreas,
  type LessonLearnedFormValues,
} from "@/lib/validations/lesson-learned";
import { createLessonLearned, updateLessonLearned } from "@/app/[locale]/actions/lessons-learned";

export function LessonLearnedFormDialog({
  projectId,
  lesson,
  trigger,
}: {
  projectId: string;
  lesson?: LessonLearned;
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
  } = useForm<LessonLearnedFormValues>({
    resolver: zodResolver(lessonLearnedFormSchema),
    defaultValues: lesson
      ? {
          whatWentWell: lesson.whatWentWell ?? "",
          whatDidnt: lesson.whatDidnt ?? "",
          recommendations: lesson.recommendations ?? "",
          knowledgeArea: lesson.knowledgeArea,
        }
      : { knowledgeArea: "INTEGRATION" },
  });

  const knowledgeArea = watch("knowledgeArea");

  async function onSubmit(values: LessonLearnedFormValues) {
    if (lesson) {
      await updateLessonLearned(projectId, lesson.id, values);
    } else {
      await createLessonLearned(projectId, values);
      reset();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("lessonsLearned.addLesson")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("lessonsLearned.knowledgeArea")}</Label>
            <Select
              value={knowledgeArea}
              onValueChange={(v) => setValue("knowledgeArea", v as LessonLearnedFormValues["knowledgeArea"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {knowledgeAreas.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`knowledgeArea.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatWentWell">{t("lessonsLearned.whatWentWell")}</Label>
            <Textarea id="whatWentWell" rows={2} {...register("whatWentWell")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatDidnt">{t("lessonsLearned.whatDidnt")}</Label>
            <Textarea id="whatDidnt" rows={2} {...register("whatDidnt")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recommendations">{t("lessonsLearned.recommendations")}</Label>
            <Textarea id="recommendations" rows={2} {...register("recommendations")} />
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
