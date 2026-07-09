"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { StageGate } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { StageGateFormDialog } from "@/components/prince2/stage-gate-form-dialog";
import {
  deleteStageGate,
  toggleStageGateApproved,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
} from "@/app/[locale]/actions/stage-gates";
import { formatDate } from "@/lib/pm";
import type { ChecklistItem } from "@/lib/validations/stage-gate";

export function StageGateList({ projectId, stageGates }: { projectId: string; stageGates: StageGate[] }) {
  const t = useTranslations("stageGates");

  if (stageGates.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noStageGates")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {stageGates.map((gate) => (
        <StageGateCard key={gate.id} projectId={projectId} gate={gate} />
      ))}
    </div>
  );
}

function StageGateCard({ projectId, gate }: { projectId: string; gate: StageGate }) {
  const t = useTranslations();
  const locale = useLocale();
  const [newLabel, setNewLabel] = React.useState("");
  const checklist = (gate.checklist as ChecklistItem[]) ?? [];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{gate.name}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("stageGates.endDate")}: {formatDate(gate.endDate, locale)} · {doneCount}/{checklist.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={gate.approved ? "green" : "outline"}>
            {gate.approved ? t("stageGates.approved") : t("stageGates.pending")}
          </Badge>
          <StageGateFormDialog
            projectId={projectId}
            stageGate={gate}
            trigger={
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <form action={deleteStageGate.bind(null, projectId, gate.id)}>
            <Button variant="ghost" size="icon" type="submit">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={gate.approved}
            onCheckedChange={(checked) => toggleStageGateApproved(projectId, gate.id, !!checked)}
          />
          {t("stageGates.approveGate")}
        </label>

        <div className="flex flex-col gap-1.5">
          {checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={item.done}
                onCheckedChange={(checked) => toggleChecklistItem(projectId, gate.id, index, !!checked)}
              />
              <span className={`flex-1 ${item.done ? "text-muted-foreground line-through" : ""}`}>{item.label}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeChecklistItem(projectId, gate.id, index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newLabel.trim()) return;
            addChecklistItem(projectId, gate.id, newLabel.trim());
            setNewLabel("");
          }}
        >
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={t("stageGates.addChecklistItem")}
            className="h-8 text-sm"
          />
          <Button type="submit" size="sm" variant="outline">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
