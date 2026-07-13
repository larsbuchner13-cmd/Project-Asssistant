import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TemplateHeader } from "@/components/processes/template-header";
import { StepList } from "@/components/processes/step-list";
import { StepFormDialog } from "@/components/processes/step-form-dialog";
import { StartRunDialog } from "@/components/processes/start-run-dialog";
import { ChevronLeft, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({ params }: { params: { templateId: string } }) {
  const t = await getTranslations("processes");
  const user = await requireActiveUser();

  const template = await prisma.processTemplate.findUnique({
    where: { id: params.templateId },
    include: {
      createdBy: { select: { name: true } },
      steps: {
        orderBy: { order: "asc" },
        include: { checklistItems: { orderBy: { order: "asc" } }, assignee: true, approver: true },
      },
    },
  });
  if (!template) notFound();

  const [users, projects] = await Promise.all([
    prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({
      where: user.role === "ADMIN" ? undefined : { ownerId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const usersForSelect = users.map((u) => ({ id: u.id, name: u.name }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
        <Link href="/processes">
          <ChevronLeft className="h-4 w-4" />
          {t("template.backToLibrary")}
        </Link>
      </Button>
      <TemplateHeader template={template} />

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("steps")}</h2>
        <div className="flex items-center gap-2">
          <StepFormDialog
            templateId={template.id}
            users={usersForSelect}
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                {t("template.addStep")}
              </Button>
            }
          />
          {template.steps.length > 0 && (
            <StartRunDialog templateId={template.id} templateName={template.name} projects={projects} />
          )}
        </div>
      </div>
      <div className="mt-4">
        <StepList templateId={template.id} steps={template.steps} users={usersForSelect} />
      </div>
    </main>
  );
}
