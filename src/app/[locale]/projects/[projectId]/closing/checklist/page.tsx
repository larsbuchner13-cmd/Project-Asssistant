import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { ClosureChecklist } from "@/components/closing/closure-checklist";
import { ensureDefaultChecklist } from "@/app/[locale]/actions/closure-checklist";

export default async function ClosureChecklistPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("closureChecklist");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  await ensureDefaultChecklist(projectId);

  const items = await prisma.closureChecklistItem.findMany({ where: { projectId }, orderBy: { order: "asc" } });

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <ClosureChecklist projectId={project.id} items={items} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
