import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import { ProcessSubnav } from "@/components/processes/process-subnav";
import { RunCard } from "@/components/processes/run-card";

export const dynamic = "force-dynamic";

export default async function ProcessRunsPage() {
  const t = await getTranslations("processes");
  await requireActiveUser();

  const runs = await prisma.processRun.findMany({
    orderBy: [{ status: "asc" }, { startedAt: "desc" }],
    include: {
      template: { select: { name: true } },
      startedBy: { select: { name: true } },
      project: { select: { name: true } },
      steps: { select: { status: true } },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("run.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("run.subtitle")}</p>
      </div>
      <ProcessSubnav />
      <div className="mt-6 flex flex-col gap-3">
        {runs.map((run) => (
          <RunCard key={run.id} run={run} />
        ))}
      </div>
      {runs.length === 0 && <p className="mt-6 text-sm text-muted-foreground">{t("run.noRuns")}</p>}
    </main>
  );
}
