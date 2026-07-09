import { useTranslations, useLocale } from "next-intl";
import { Trash2 } from "lucide-react";
import type { Risk, Milestone, StatusReport } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ragVariant, riskScore, riskScoreVariant, formatDate } from "@/lib/pm";
import { deleteStatusReport } from "@/app/[locale]/actions/status-reports";
import type { Project } from "@prisma/client";

export function StatusReportView({
  project,
  risks,
  milestones,
  openIssueCount,
  budgetBurnPct,
  history,
}: {
  project: Project;
  risks: Risk[];
  milestones: Milestone[];
  openIssueCount: number;
  budgetBurnPct: number;
  history: StatusReport[];
}) {
  const t = useTranslations();
  const locale = useLocale();

  const topRisks = [...risks]
    .sort((a, b) => riskScore(b.probability, b.impact) - riskScore(a.probability, a.impact))
    .slice(0, 5);
  const achieved = milestones.filter((m) => m.achieved).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("dashboard.status")} (RAG)</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={ragVariant(project.ragStatus)} className="text-sm">
              {t(`rag.${project.ragStatus}`)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("statusReport.milestoneProgress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {achieved}/{milestones.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("statusReport.openIssues")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{openIssueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("statusReport.budgetBurn")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-1.5 text-lg font-semibold">{budgetBurnPct}%</p>
            <Progress value={Math.min(budgetBurnPct, 100)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("statusReport.topRisks")}</CardTitle>
        </CardHeader>
        <CardContent>
          {topRisks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.description")}</TableHead>
                  <TableHead>{t("risks.score")}</TableHead>
                  <TableHead>{t("common.owner")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topRisks.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-sm truncate">{r.description}</TableCell>
                    <TableCell>
                      <Badge variant={riskScoreVariant(riskScore(r.probability, r.impact)) as never}>
                        {riskScore(r.probability, r.impact)}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.owner ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("statusReport.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 font-medium">{formatDate(report.weekOf, locale)}</span>
                    <Badge variant={ragVariant(report.ragStatus)}>{t(`rag.${report.ragStatus}`)}</Badge>
                    <span className="truncate text-muted-foreground">{report.summary}</span>
                  </div>
                  <form action={deleteStatusReport.bind(null, project.id, report.id)}>
                    <Button variant="ghost" size="icon" type="submit" className="shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
