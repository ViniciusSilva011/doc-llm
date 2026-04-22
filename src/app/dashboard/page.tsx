import { requirePageSession } from "@/auth/session";
import { DocumentQueryForm } from "@/components/query/document-query-form";
import { getDashboardData } from "@/lib/services/dashboard";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requirePageSession();
  const dashboard = await getDashboardData(session.user.id);

  return (
    <div className="container page-grid">
      <section className="stack-sm">
        <p className="pill">Protected dashboard</p>
        <h1>Welcome back, {session.user.name ?? session.user.email}.</h1>
        <p className="muted-text">
          The dashboard is protected via server-side session checks and uses shared
          services instead of page-local database calls.
        </p>
      </section>

      <section className="stats-grid">
        <article className="surface stack-xs">
          <h2>{dashboard.stats.documentCount}</h2>
          <p className="muted-text">Documents tracked</p>
        </article>
        <article className="surface stack-xs">
          <h2>{dashboard.stats.processedDocumentCount}</h2>
          <p className="muted-text">Documents indexed</p>
        </article>
        <article className="surface stack-xs">
          <h2>{dashboard.stats.ingestionJobCount}</h2>
          <p className="muted-text">Ingestion jobs created</p>
        </article>
      </section>

      <section className="split-grid">
        <div className="surface stack-md">
          <div className="stack-xs">
            <h2>Recent jobs</h2>
            <p className="muted-text">
              The worker claims pending jobs from PostgreSQL and updates status as it
              processes source objects.
            </p>
          </div>

          <ul className="list-reset stack-sm">
            {dashboard.recentJobs.length > 0 ? (
              dashboard.recentJobs.map((job) => (
                <li className="match-card" key={job.id}>
                  <p>
                    <strong>Status:</strong> {job.status}
                  </p>
                  <p className="muted-text">
                    Document {job.documentId} | Created {formatDateTime(job.createdAt)}
                  </p>
                  {job.errorMessage ? (
                    <p className="text-error">{job.errorMessage}</p>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="muted-text">No ingestion jobs yet.</li>
            )}
          </ul>
        </div>

        <DocumentQueryForm />
      </section>
    </div>
  );
}
