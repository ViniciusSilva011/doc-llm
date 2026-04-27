import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";

import { getOptionalSession } from "@/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const workflow = [
  {
    icon: UploadCloud,
    title: "Upload PDFs",
    description: "Add source documents and queue ingestion in a few clicks.",
  },
  {
    icon: Database,
    title: "Index knowledge",
    description: "Chunking, embeddings, and pgvector search prepare every file.",
  },
  {
    icon: MessageSquareText,
    title: "Ask questions",
    description: "Chat against individual documents or query your full library.",
  },
  {
    icon: CheckCircle2,
    title: "Review sources",
    description: "Answers stay grounded in retrieved document chunks.",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Private document workspace",
    description:
      "Authenticated users only see their own documents, messages, and retrieval results.",
  },
  {
    icon: Zap,
    title: "Async answers",
    description:
      "Questions run through worker jobs and stream back when processing finishes.",
  },
  {
    icon: Search,
    title: "Search that explains itself",
    description:
      "Every generated answer can expose the matched chunks that shaped it.",
  },
];

export default async function LandingPage() {
  const session = await getOptionalSession();
  const primaryHref = session?.user ? "/dashboard" : "/sign-in";
  const primaryLabel = session?.user ? "Open dashboard" : "Sign in";
  const secondaryHref = session?.user ? "/upload" : "#workflow";
  const secondaryLabel = session?.user ? "Upload PDF" : "See workflow";

  return (
    <div className="flex flex-col gap-14 pb-8">
      <section className="px-4">
        <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-6xl items-center gap-10 py-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(420px,1.04fr)]">
          <div className="space-y-8">
            <div className="space-y-5">
              <Badge className="w-fit">Document AI workspace</Badge>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Turn PDFs into searchable answers your team can trust.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Upload documents, index them in the background, ask natural-language
                questions, and review grounded answers with source matches.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            </div>

            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {["Worker jobs", "pgvector search", "SSE updates"].map((item) => (
                <div
                  className="rounded-md border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-border/70 bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                <div>
                  <p className="text-sm font-medium">Quarterly reports.pdf</p>
                  <p className="text-xs text-muted-foreground">Processed just now</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  indexed
                </span>
              </div>

              <div className="grid gap-0 md:grid-cols-[0.82fr_1.18fr]">
                <div className="border-b border-border/70 p-5 md:border-b-0 md:border-r">
                  <div className="space-y-3">
                    {[
                      "Revenue summary",
                      "Retention notes",
                      "Risk assessment",
                    ].map((title, index) => (
                      <div
                        className="rounded-md border border-border/70 bg-muted/25 p-3"
                        key={title}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <p className="truncate text-sm font-medium">{title}</p>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-muted" />
                        <div
                          className="mt-2 h-2 rounded-full bg-muted"
                          style={{ width: `${72 - index * 12}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-md bg-muted/35 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="size-4 text-amber-300" />
                      Ask your documents
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Which customer segments expanded fastest this quarter?
                    </p>
                  </div>

                  <div className="rounded-md border border-border/70 bg-background p-4">
                    <p className="text-sm leading-7">
                      Enterprise accounts drove the largest expansion, led by renewals
                      and add-on seats in regulated industries.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                        <p className="text-xs font-medium">Source 1</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Revenue summary, score 0.91
                        </p>
                      </div>
                      <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                        <p className="text-xs font-medium">Source 2</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Retention notes, score 0.87
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4" id="workflow">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="max-w-3xl space-y-3">
            <Badge>Workflow</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">
              From raw PDFs to cited answers.
            </h2>
            <p className="text-muted-foreground">
              The core loop is built for teams that need retrieval, background
              processing, and document-specific chat without stitching tools together.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {workflow.map((step) => {
              const Icon = step.icon;

              return (
                <Card className="border-border/70 bg-card" key={step.title}>
                  <CardHeader>
                    <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-5 text-foreground" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4">
        <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <Card className="border-border/70 bg-card" key={benefit.title}>
                <CardHeader>
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
