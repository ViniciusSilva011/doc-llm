import Link from "next/link";

import { getOptionalSession } from "@/auth/session";

export default async function LandingPage() {
  const session = await getOptionalSession();

  return (
    <div className="container page-grid">
      <section className="hero">
        <div className="hero-grid">
          <div className="stack-lg">
            <div className="stack-sm">
              <p className="pill">Starter foundation</p>
              <h1>Build your SaaS product on a retrieval-ready core.</h1>
              <p className="muted-text">
                This base app gives you a clean App Router setup, database-backed
                auth, typed APIs, a worker for ingestion, pgvector search, and a
                single OpenAI integration layer you can extend safely.
              </p>
            </div>

            <div className="nav">
              <Link className="button" href={session?.user ? "/dashboard" : "/sign-in"}>
                {session?.user ? "Open dashboard" : "Sign in"}
              </Link>
              <Link className="button button-secondary" href="/documents">
                View documents
              </Link>
            </div>
          </div>

          <div className="surface stack-md">
            <h2>Included from day one</h2>
            <ul className="list-reset stack-sm">
              <li>Next.js App Router with strict TypeScript</li>
              <li>Credentials-first Auth.js structure ready for OAuth expansion</li>
              <li>PostgreSQL schema with pgvector-backed chunk storage</li>
              <li>Worker process for ingestion and embeddings</li>
              <li>Unit, integration, and Playwright test foundation</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="surface stack-sm">
          <h3>Modular services</h3>
          <p className="muted-text">
            Auth, storage, ingestion, and OpenAI are isolated behind typed service
            boundaries so you can extend each piece independently.
          </p>
        </article>

        <article className="surface stack-sm">
          <h3>Real worker topology</h3>
          <p className="muted-text">
            The worker can run independently from the web app and already follows
            the lifecycle you need for queued document processing.
          </p>
        </article>

        <article className="surface stack-sm">
          <h3>Lean by default</h3>
          <p className="muted-text">
            The starter stays small on purpose, with real extension points and TODOs
            only where the product-specific implementation should go next.
          </p>
        </article>
      </section>
    </div>
  );
}
