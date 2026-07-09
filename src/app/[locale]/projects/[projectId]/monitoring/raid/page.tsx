import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { RaidLog } from "@/components/monitoring/raid-log";
import { Card, CardContent } from "@/components/ui/card";

export default async function RaidPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("raid");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [risks, assumptions, issues, dependencies] = await Promise.all([
    prisma.risk.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),
    prisma.assumption.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),
    prisma.issue.findMany({ where: { projectId }, orderBy: { raisedDate: "desc" } }),
    prisma.dependency.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <Card>
          <CardContent className="pt-6">
            <RaidLog
              projectId={project.id}
              risks={risks}
              assumptions={assumptions}
              issues={issues}
              dependencies={dependencies}
            />
          </CardContent>
        </Card>
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
