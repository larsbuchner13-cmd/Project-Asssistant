import { requireProjectAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import { AuthzError } from "@/lib/authz";
import { loadProjectHealth } from "@/lib/project-health-data";
import { ProjectHealthView } from "@/components/monitoring/project-health-view";

export const dynamic = "force-dynamic";

export default async function HealthCheckPage({ params, }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await requireProjectAccess(projectId);
  const health = await loadProjectHealth(projectId).catch(error => {
    if (error instanceof AuthzError || error?.code === "P2025") notFound();
    throw error;
  });
  return <ProjectHealthView projectId={projectId} initialHealth={health} aiEnabled={Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_HEALTH_MODEL)} />;
}
