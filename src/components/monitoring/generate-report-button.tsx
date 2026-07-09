"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateStatusReport } from "@/app/[locale]/actions/status-reports";

export function GenerateReportButton({ projectId }: { projectId: string }) {
  const t = useTranslations("statusReport");
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await generateStatusReport(projectId, locale);
        setPending(false);
      }}
    >
      <FileText className="h-4 w-4" />
      {t("generate")}
    </Button>
  );
}
