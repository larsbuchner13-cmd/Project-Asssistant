import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { LessonLearnedList } from "@/components/closing/lesson-learned-list";
import { LessonLearnedFormDialog } from "@/components/closing/lesson-learned-form-dialog";
import { Button } from "@/components/ui/button";

export default async function LessonsLearnedPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("lessonsLearned");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const lessons = await prisma.lessonLearned.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <LessonLearnedFormDialog
            projectId={project.id}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                {t("addLesson")}
              </Button>
            }
          />
        </div>
        <LessonLearnedList projectId={project.id} lessons={lessons} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
