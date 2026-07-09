import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";

import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const t = await getTranslations();
  const session = await getServerSession(authOptions);
  const disabled = session?.user.status === "DISABLED";

  return (
    <main className="mx-auto flex max-w-sm flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>{disabled ? t("auth.disabledTitle") : t("auth.pendingTitle")}</CardTitle>
          <CardDescription>
            {disabled ? t("auth.disabledSubtitle") : t("auth.pendingSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton className="w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
