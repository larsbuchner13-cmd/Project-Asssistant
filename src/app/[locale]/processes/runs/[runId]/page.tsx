import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RunStepper } from "@/components/processes/run-stepper";
import { CancelRunButton } from "@/components/processes/cancel-run-button";
import { formatDate } from "@/lib/pm";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const statusVariant = { ACTIVE: "amber", COMPLETED: "green", CANCELLED: "outline" } as const;

export default async function ProcessRunDetailPage({
  params,
}: {
  params: { runId: string; locale: string };
}) {
  const { runId, locale } = params;
  const t = await getTranslations("processes.run");
  await requireActiveUser();

  const run = await prisma.processRun.findUnique({
    where: { id: runId },
    include: {
      template: { select: { id: true, name: true } },
      startedBy: { select: { name: true } },
      project: { select: { name: true } },
      steps: {
        orderBy: { order: "asc" },
        include: { assignee: true, approver: true, checklistItems: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!run) notFound();

  const doneCount = run.steps.filter((s) => s.status === "DONE").length;
  const progress = run.steps.length > 0 ? Math.round((doneCount / run.steps.length) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
        <Link href="/processes/runs">
          <ChevronLeft className="h-4 w-4" />
          {t("title")}
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{run.name}</h1>
            <Badge variant={statusVariant[run.status]}>{t(`status.${run.status}`)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/processes/${run.template.id}`} className="underline underline-offset-2">
              {run.template.name}
            </Link>
            {run.project && ` · ${run.project.name}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("startedBy")}: {run.startedBy.name} · {t("startedAt")}: {formatDate(run.startedAt, locale)}
            {run.completedAt && ` · ${t("completedAt")}: ${formatDate(run.completedAt, locale)}`}
          </p>
        </div>
        {run.status === "ACTIVE" && <CancelRunButton runId={run.id} />}
      </div>

      <div className="mt-4">
        <Progress value={progress} />
        <p className="mt-1 text-xs text-muted-foreground">
          {doneCount}/{run.steps.length} {t("progress")}
        </p>
      </div>

      <div className="mt-6">
        <RunStepper steps={run.steps} runCancelled={run.status !== "ACTIVE"} />
      </div>
    </main>
  );
}
