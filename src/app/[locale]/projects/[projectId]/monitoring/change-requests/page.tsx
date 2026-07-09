import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { FrameworkGuide } from "@/components/framework-guide";
import { ChangeRequestTable } from "@/components/monitoring/change-request-table";
import { ChangeRequestFormDialog } from "@/components/monitoring/change-request-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function ChangeRequestsPage({ params: { projectId } }: { params: { projectId: string } }) {
  const t = await getTranslations("changeRequests");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const changeRequests = await prisma.changeRequest.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <ChangeRequestFormDialog
            projectId={project.id}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                {t("addChangeRequest")}
              </Button>
            }
          />
        </div>
        <Card>
          <CardContent className="pt-6">
            <ChangeRequestTable projectId={project.id} changeRequests={changeRequests} />
          </CardContent>
        </Card>
      </div>
      <FrameworkGuide text={t("guideText")} />
    </div>
  );
}
