"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import type { BusinessCase } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { businessCaseFormSchema, type BusinessCaseFormValues } from "@/lib/validations/business-case";
import { upsertBusinessCase } from "@/app/[locale]/actions/business-case";

export function BusinessCaseForm({
  projectId,
  projectName,
  initialData,
}: {
  projectId: string;
  projectName: string;
  initialData: BusinessCase | null;
}) {
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<BusinessCaseFormValues>({
    resolver: zodResolver(businessCaseFormSchema),
    defaultValues: {
      reasons: initialData?.reasons ?? "",
      options: initialData?.options ?? "",
      expectedBenefits: initialData?.expectedBenefits ?? "",
      expectedDisBenefits: initialData?.expectedDisBenefits ?? "",
      costsSummary: initialData?.costsSummary ?? "",
      majorRisks: initialData?.majorRisks ?? "",
    },
  });

  const values = watch();

  async function onSubmit(data: BusinessCaseFormValues) {
    await upsertBusinessCase(projectId, data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="no-print">
        <CardHeader>
          <CardTitle>{t("businessCase.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field
              id="reasons"
              label={t("businessCase.reasons")}
              error={errors.reasons && t(errors.reasons.message as never)}
            >
              <Textarea id="reasons" rows={2} {...register("reasons")} />
            </Field>
            <Field
              id="options"
              label={t("businessCase.options")}
              error={errors.options && t(errors.options.message as never)}
            >
              <Textarea id="options" rows={2} {...register("options")} />
            </Field>
            <Field
              id="expectedBenefits"
              label={t("businessCase.expectedBenefits")}
              error={errors.expectedBenefits && t(errors.expectedBenefits.message as never)}
            >
              <Textarea id="expectedBenefits" rows={2} {...register("expectedBenefits")} />
            </Field>
            <Field id="expectedDisBenefits" label={t("businessCase.expectedDisBenefits")}>
              <Textarea id="expectedDisBenefits" rows={2} {...register("expectedDisBenefits")} />
            </Field>
            <Field
              id="costsSummary"
              label={t("businessCase.costsSummary")}
              error={errors.costsSummary && t(errors.costsSummary.message as never)}
            >
              <Textarea id="costsSummary" rows={2} {...register("costsSummary")} />
            </Field>
            <Field id="majorRisks" label={t("businessCase.majorRisks")}>
              <Textarea id="majorRisks" rows={2} {...register("majorRisks")} />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {t("common.save")}
              </Button>
              {isSubmitSuccessful && <span className="text-sm text-muted-foreground">{t("common.saved")}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t("businessCase.documentTitle")}</CardTitle>
          <Button variant="outline" size="sm" type="button" className="no-print" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {t("charter.print")}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <h3 className="font-semibold">{projectName}</h3>
          <DocSection title={t("businessCase.reasons")} text={values.reasons} />
          <DocSection title={t("businessCase.options")} text={values.options} />
          <DocSection title={t("businessCase.expectedBenefits")} text={values.expectedBenefits} />
          <DocSection title={t("businessCase.expectedDisBenefits")} text={values.expectedDisBenefits ?? ""} />
          <DocSection title={t("businessCase.costsSummary")} text={values.costsSummary} />
          <DocSection title={t("businessCase.majorRisks")} text={values.majorRisks ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | false | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function DocSection({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <p className="whitespace-pre-wrap">{text || "—"}</p>
    </div>
  );
}
