import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { CharterForm } from "@/components/initiating/charter-form";
import { FrameworkGuide } from "@/components/framework-guide";

export default async function CharterPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  const t = await getTranslations("charter");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { charter: true },
  });

  if (!project) notFound();

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <h1 className="no-print text-xl font-semibold">{t("title")}</h1>
        <CharterForm projectId={project.id} projectName={project.name} initialData={project.charter} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
