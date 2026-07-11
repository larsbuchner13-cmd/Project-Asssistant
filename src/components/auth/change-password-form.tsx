"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/lib/validations/auth";
import { changePassword } from "@/app/[locale]/actions/auth";

export function ChangePasswordForm() {
  const t = useTranslations();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordFormSchema) });

  async function onSubmit(values: ChangePasswordFormValues) {
    setError(null);
    setSuccess(false);

    let result;
    try {
      result = await changePassword(values);
    } catch {
      setError(t("auth.changePasswordFailed"));
      return;
    }

    if (!result.ok) {
      setError(t(result.error));
      return;
    }

    setSuccess(true);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">{t("auth.currentPassword")}</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-xs text-destructive">{t(errors.currentPassword.message as never)}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
        <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
        {errors.newPassword && <p className="text-xs text-destructive">{t(errors.newPassword.message as never)}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmNewPassword">{t("auth.confirmNewPassword")}</Label>
        <Input
          id="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmNewPassword")}
        />
        {errors.confirmNewPassword && (
          <p className="text-xs text-destructive">{t(errors.confirmNewPassword.message as never)}</p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-rag-green">{t("auth.passwordChanged")}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {t("auth.changePassword")}
      </Button>
    </form>
  );
}
