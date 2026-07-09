import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, Flag } from "lucide-react";
import type { Project, Milestone, Risk } from "@prisma/client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ragVariant, riskScore, riskScoreVariant, formatDate } from "@/lib/pm";

type ProjectCardData = Project & {
  milestones: Milestone[];
  risks: Risk[];
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const t = useTranslations();
  const locale = useLocale();

  const nextMilestone = project.milestones[0];
  const highRiskCount = project.risks.filter(
    (r) => riskScoreVariant(riskScore(r.probability, r.impact)) === "red"
  ).length;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{project.name}</CardTitle>
          <Badge variant={ragVariant(project.ragStatus)}>{t(`rag.${project.ragStatus}`)}</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="secondary">{t(`framework.${project.framework}`)}</Badge>
          <Badge variant="outline">{t(`projectStatus.${project.status}`)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 text-sm">
        {project.description && (
          <p className="line-clamp-2 text-muted-foreground">{project.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Flag className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t("dashboard.nextMilestone")}:</span>
          <span className="font-medium">
            {nextMilestone ? `${nextMilestone.name} (${formatDate(nextMilestone.dueDate, locale)})` : t("dashboard.noMilestone")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${highRiskCount > 0 ? "text-rag-red" : "text-muted-foreground"}`} />
          <span className="text-muted-foreground">{t("dashboard.openHighRisks")}:</span>
          <span className="font-medium">{highRiskCount}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/projects/${project.id}/initiating/charter`}>{t("dashboard.openProject")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
