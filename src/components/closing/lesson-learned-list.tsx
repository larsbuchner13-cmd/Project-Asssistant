"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import type { LessonLearned } from "@prisma/client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LessonLearnedFormDialog } from "@/components/closing/lesson-learned-form-dialog";
import { deleteLessonLearned } from "@/app/[locale]/actions/lessons-learned";

export function LessonLearnedList({ projectId, lessons }: { projectId: string; lessons: LessonLearned[] }) {
  const t = useTranslations();

  if (lessons.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("common.noData")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {lessons.map((lesson) => (
        <Card key={lesson.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <Badge variant="outline">{t(`knowledgeArea.${lesson.knowledgeArea}`)}</Badge>
            <div className="flex gap-1">
              <LessonLearnedFormDialog
                projectId={projectId}
                lesson={lesson}
                trigger={
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
              <form action={deleteLessonLearned.bind(null, projectId, lesson.id)}>
                <Button variant="ghost" size="icon" type="submit">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("lessonsLearned.whatWentWell")}
              </p>
              <p>{lesson.whatWentWell || "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("lessonsLearned.whatDidnt")}
              </p>
              <p>{lesson.whatDidnt || "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("lessonsLearned.recommendations")}
              </p>
              <p>{lesson.recommendations || "—"}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
