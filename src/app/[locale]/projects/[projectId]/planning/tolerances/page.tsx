import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { ToleranceForm } from "@/components/prince2/tolerance-form";

export default async function TolerancesPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("tolerances");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tolerance: true },
  });

  if (!project) notFound();

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <ToleranceForm projectId={project.id} initialData={project.tolerance} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
