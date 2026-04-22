import { requirePageSession } from "@/auth/session";
import { DocumentQueryForm } from "@/components/query/document-query-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardData } from "@/lib/services/dashboard";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requirePageSession();
  const dashboard = await getDashboardData(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
      <section className="space-y-4">
        <Badge>Protected dashboard</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">
          Welcome back, {session.user.name ?? session.user.email}.
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          The dashboard is protected via server-side session checks and uses shared
          services instead of page-local database calls.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl">{dashboard.stats.documentCount}</CardTitle>
            <CardDescription>Documents tracked</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl">
              {dashboard.stats.processedDocumentCount}
            </CardTitle>
            <CardDescription>Documents indexed</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl">{dashboard.stats.ingestionJobCount}</CardTitle>
            <CardDescription>Ingestion jobs created</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="border-border/70 bg-card shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Recent jobs</CardTitle>
            <CardDescription>
              The worker claims pending jobs from PostgreSQL and updates status as it
              processes source objects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dashboard.recentJobs.length > 0 ? (
                dashboard.recentJobs.map((job) => (
                  <li
                    className="rounded-xl border border-border/80 bg-muted/35 p-4"
                    key={job.id}
                  >
                    <p className="text-sm">
                      <strong>Status:</strong> {job.status}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Document {job.documentId} | Created {formatDateTime(job.createdAt)}
                    </p>
                    {job.errorMessage ? (
                      <p className="mt-2 text-sm text-destructive">{job.errorMessage}</p>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No ingestion jobs yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <DocumentQueryForm />
      </section>
    </div>
  );
}
