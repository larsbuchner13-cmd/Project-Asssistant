import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import { ProcessSubnav } from "@/components/processes/process-subnav";
import { TemplateCard } from "@/components/processes/template-card";
import { NewTemplateDialog } from "@/components/processes/new-template-dialog";

export const dynamic = "force-dynamic";

export default async function ProcessesPage() {
  const t = await getTranslations("processes");
  await requireActiveUser();

  const templates = await prisma.processTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      steps: { select: { id: true } },
      _count: { select: { runs: true } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <NewTemplateDialog />
      </div>
      <ProcessSubnav />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
      {templates.length === 0 && <p className="mt-6 text-sm text-muted-foreground">{t("noTemplates")}</p>}
    </main>
  );
}
