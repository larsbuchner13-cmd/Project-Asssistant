"use client";

import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Moon, Sun, ShieldCheck, UserCog, Workflow } from "lucide-react";

import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { locales } from "@/i18n/config";

export function Topbar() {
  const t = useTranslations("app");
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="no-print flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold">{t("name")}</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">{t("tagline")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded-md border border-input text-xs">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => router.replace(pathname, { locale: l })}
              className={`px-2 py-1 uppercase ${
                l === locale ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        {session?.user && (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/processes">
                <Workflow />
                {tNav("processes")}
              </Link>
            </Button>
            {session.user.role === "ADMIN" && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/users">
                  <ShieldCheck />
                  {tAuth("adminArea")}
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/account">
                <UserCog />
                {tAuth("account")}
              </Link>
            </Button>
            <span className="hidden text-sm text-muted-foreground sm:inline">{session.user.email}</span>
            <SignOutButton size="sm" />
          </>
        )}
      </div>
    </header>
  );
}
