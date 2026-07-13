"use client";

import { useTranslations } from "next-intl";
import { Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cancelProcessRun } from "@/app/[locale]/actions/process-runs";

export function CancelRunButton({ runId }: { runId: string }) {
  const t = useTranslations("processes.run");

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (window.confirm(t("cancelConfirm"))) {
          cancelProcessRun(runId);
        }
      }}
    >
      <Ban className="h-3.5 w-3.5" />
      {t("cancel")}
    </Button>
  );
}
