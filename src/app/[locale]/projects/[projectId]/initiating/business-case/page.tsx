import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { BusinessCaseForm } from "@/components/prince2/business-case-form";

export default async function BusinessCasePage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("businessCase");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { businessCase: true },
  });

  if (!project) notFound();

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <h1 className="no-print text-xl font-semibold">{t("title")}</h1>
        <BusinessCaseForm projectId={project.id} projectName={project.name} initialData={project.businessCase} />
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
