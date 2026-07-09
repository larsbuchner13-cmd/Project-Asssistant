"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Risk, Assumption, Issue, Dependency } from "@prisma/client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { riskScore, riskScoreVariant } from "@/lib/pm";
import { RiskFormDialog } from "@/components/planning/risk-form-dialog";
import { AssumptionFormDialog } from "@/components/monitoring/assumption-form-dialog";
import { IssueFormDialog } from "@/components/monitoring/issue-form-dialog";
import { DependencyFormDialog } from "@/components/monitoring/dependency-form-dialog";
import { deleteAssumption } from "@/app/[locale]/actions/assumptions";
import { deleteIssue } from "@/app/[locale]/actions/issues";
import { deleteDependency } from "@/app/[locale]/actions/dependencies";
import { deleteRisk } from "@/app/[locale]/actions/risks";

type Row = {
  id: string;
  type: "RISK" | "ASSUMPTION" | "ISSUE" | "DEPENDENCY";
  description: string;
  statusLabel: string;
  owner: string;
  extra?: React.ReactNode;
  editTrigger: React.ReactNode;
  deleteAction?: () => Promise<void>;
};

export function RaidLog({
  projectId,
  risks,
  assumptions,
  issues,
  dependencies,
}: {
  projectId: string;
  risks: Risk[];
  assumptions: Assumption[];
  issues: Issue[];
  dependencies: Dependency[];
}) {
  const t = useTranslations();

  const riskRows: Row[] = risks.map((r) => ({
    id: r.id,
    type: "RISK",
    description: r.description,
    statusLabel: t(`risks.riskStatus.${r.status}`),
    owner: r.owner ?? "—",
    extra: (
      <Badge variant={riskScoreVariant(riskScore(r.probability, r.impact)) as never}>
        {riskScore(r.probability, r.impact)}
      </Badge>
    ),
    editTrigger: <RiskFormDialog projectId={projectId} risk={r} />,
    deleteAction: () => deleteRisk(projectId, r.id),
  }));

  const assumptionRows: Row[] = assumptions.map((a) => ({
    id: a.id,
    type: "ASSUMPTION",
    description: a.description,
    statusLabel: t(`raid.assumptionStatus.${a.status}`),
    owner: a.owner ?? "—",
    editTrigger: (
      <AssumptionFormDialog
        projectId={projectId}
        assumption={a}
        trigger={
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
    ),
    deleteAction: () => deleteAssumption(projectId, a.id),
  }));

  const issueRows: Row[] = issues.map((i) => ({
    id: i.id,
    type: "ISSUE",
    description: i.description,
    statusLabel: t(`raid.issueStatus.${i.status}`),
    owner: i.owner ?? "—",
    editTrigger: (
      <IssueFormDialog
        projectId={projectId}
        issue={i}
        trigger={
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
    ),
    deleteAction: () => deleteIssue(projectId, i.id),
  }));

  const dependencyRows: Row[] = dependencies.map((d) => ({
    id: d.id,
    type: "DEPENDENCY",
    description: d.description,
    statusLabel: t(`raid.dependencyStatus.${d.status}`),
    owner: d.owner ?? "—",
    extra: <span className="text-xs text-muted-foreground">{d.dependsOn}</span>,
    editTrigger: (
      <DependencyFormDialog
        projectId={projectId}
        dependency={d}
        trigger={
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
    ),
    deleteAction: () => deleteDependency(projectId, d.id),
  }));

  const allRows = [...riskRows, ...assumptionRows, ...issueRows, ...dependencyRows];

  return (
    <Tabs defaultValue="all">
      <div className="flex flex-col gap-3">
        <TabsList className="w-fit">
          <TabsTrigger value="all">{t("raid.all")}</TabsTrigger>
          <TabsTrigger value="risks">{t("nav.risks")}</TabsTrigger>
          <TabsTrigger value="assumptions">{t("raid.assumptions")}</TabsTrigger>
          <TabsTrigger value="issues">{t("raid.issues")}</TabsTrigger>
          <TabsTrigger value="dependencies">{t("raid.dependenciesTab")}</TabsTrigger>
        </TabsList>
        <div className="flex flex-wrap gap-2">
          <AssumptionFormDialog
            projectId={projectId}
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                {t("raid.addAssumption")}
              </Button>
            }
          />
          <IssueFormDialog
            projectId={projectId}
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                {t("raid.addIssue")}
              </Button>
            }
          />
          <DependencyFormDialog
            projectId={projectId}
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                {t("raid.addDependency")}
              </Button>
            }
          />
        </div>
      </div>
      <TabsContent value="all">
        <RaidTable rows={allRows} showType />
      </TabsContent>
      <TabsContent value="risks">
        <RaidTable rows={riskRows} />
      </TabsContent>
      <TabsContent value="assumptions">
        <RaidTable rows={assumptionRows} />
      </TabsContent>
      <TabsContent value="issues">
        <RaidTable rows={issueRows} />
      </TabsContent>
      <TabsContent value="dependencies">
        <RaidTable rows={dependencyRows} />
      </TabsContent>
    </Tabs>
  );
}

function RaidTable({ rows, showType }: { rows: Row[]; showType?: boolean }) {
  const t = useTranslations();

  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">{t("common.noData")}</p>;
  }

  return (
    <Table className="min-w-[700px]">
      <TableHeader>
        <TableRow>
          {showType && <TableHead className="whitespace-nowrap">{t("raid.type")}</TableHead>}
          <TableHead>{t("common.description")}</TableHead>
          <TableHead className="whitespace-nowrap">{t("common.status")}</TableHead>
          <TableHead className="whitespace-nowrap">{t("common.owner")}</TableHead>
          <TableHead />
          <TableHead className="whitespace-nowrap text-right">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.type}-${row.id}`}>
            {showType && (
              <TableCell className="whitespace-nowrap">
                <Badge variant="outline">{t(`raid.typeLabel.${row.type}`)}</Badge>
              </TableCell>
            )}
            <TableCell className="max-w-sm truncate">{row.description}</TableCell>
            <TableCell className="whitespace-nowrap">{row.statusLabel}</TableCell>
            <TableCell className="whitespace-nowrap">{row.owner}</TableCell>
            <TableCell className="whitespace-nowrap">{row.extra}</TableCell>
            <TableCell className="whitespace-nowrap">
              <div className="flex justify-end gap-1">
                {row.editTrigger}
                {row.deleteAction && (
                  <form action={row.deleteAction}>
                    <Button variant="ghost" size="icon" type="submit">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
