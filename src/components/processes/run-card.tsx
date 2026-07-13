import { useTranslations, useLocale } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/pm";

export type RunCardData = {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startedAt: Date;
  template: { name: string };
  startedBy: { name: string };
  project: { name: string } | null;
  steps: { status: string }[];
};

const statusVariant = { ACTIVE: "amber", COMPLETED: "green", CANCELLED: "outline" } as const;

export function RunCard({ run }: { run: RunCardData }) {
  const t = useTranslations();
  const locale = useLocale();
  const doneCount = run.steps.filter((s) => s.status === "DONE").length;
  const progress = run.steps.length > 0 ? Math.round((doneCount / run.steps.length) * 100) : 0;

  return (
    <Link href={`/processes/runs/${run.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{run.name}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {run.template.name}
              {run.project && ` · ${run.project.name}`}
            </p>
          </div>
          <Badge variant={statusVariant[run.status]}>{t(`processes.run.status.${run.status}`)}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Progress value={progress} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {doneCount}/{run.steps.length} {t("processes.steps")}
            </span>
            <span>
              {t("processes.run.startedBy")}: {run.startedBy.name} · {formatDate(run.startedAt, locale)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
