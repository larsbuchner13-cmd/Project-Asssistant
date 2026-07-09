"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { Button, type ButtonProps } from "@/components/ui/button";

export function SignOutButton(props: ButtonProps) {
  const t = useTranslations();
  return (
    <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })} {...props}>
      {t("auth.signOut")}
    </Button>
  );
}
