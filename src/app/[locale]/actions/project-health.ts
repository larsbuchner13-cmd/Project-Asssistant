"use server";

import { z } from "zod";
import { loadProjectHealth } from "@/lib/project-health-data";
import { requestHealthAnalysis } from "@/lib/project-health-ai";
import { consumeRateLimit } from "@/lib/rate-limit";
import { requireActiveUser } from "@/lib/authz";

export async function analyzeProjectHealth(projectId: string, locale: string) {
  z.string().min(1).max(100).parse(projectId);
  const language = z.enum(["de", "en"]).parse(locale);
  // Always authorize and reload trusted database values; never accept a client score.
  const health = await loadProjectHealth(projectId);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_HEALTH_MODEL;
  if (!apiKey || !model) return { status: "unconfigured" as const };
  if (health.score === null) return { status: "empty" as const };
  try {
    const user = await requireActiveUser();
    await consumeRateLimit("health-ai", user.id, 10, 60 * 60_000);
    const analysis = await requestHealthAnalysis(health, language, { apiKey, model });
    return { status: "success" as const, health, analysis };
  } catch {
    // Do not expose provider messages or credentials to the browser.
    return { status: "error" as const };
  }
}
