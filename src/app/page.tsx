import Link from "next/link";

import { getOptionalSession } from "@/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LandingPage() {
  const session = await getOptionalSession();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4">
      <section className="py-6 md:py-10">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.9fr)] md:items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge>Starter foundation</Badge>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Build your SaaS product on a retrieval-ready core.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                This base app gives you a clean App Router setup, database-backed
                auth, typed APIs, a worker for ingestion, pgvector search, and a
                single OpenAI integration layer you can extend safely.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={session?.user ? "/dashboard" : "/sign-in"}>
                  {session?.user ? "Open dashboard" : "Sign in"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/upload">Upload documents</Link>
              </Button>
            </div>
          </div>

          <Card className="border-border/70 bg-card shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Included from day one</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>Next.js App Router with strict TypeScript</li>
                <li>Credentials-first Auth.js structure ready for OAuth expansion</li>
                <li>PostgreSQL schema with pgvector-backed chunk storage</li>
                <li>Worker process for ingestion and embeddings</li>
                <li>Unit, integration, and Playwright test foundation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Modular services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
            Auth, storage, ingestion, and OpenAI are isolated behind typed service
            boundaries so you can extend each piece independently.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Real worker topology</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
            The worker can run independently from the web app and already follows
            the lifecycle you need for queued document processing.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Lean by default</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
            The starter stays small on purpose, with real extension points and TODOs
            only where the product-specific implementation should go next.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
