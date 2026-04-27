import Link from "next/link";

import { requirePageSession } from "@/auth/session";
import { DocumentQueryForm } from "@/components/query/document-query-form";
import { Badge } from "@/components/ui/badge";
import { listDocumentsForUser } from "@/lib/services/documents/repository";

export default async function QueryPage() {
  const session = await requirePageSession();
  const documents = await listDocumentsForUser(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4">
      <section className="space-y-4">
        <Link
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
        <div className="space-y-3">
          <Badge>Query</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">
            Query indexed content.
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Ask questions across all indexed PDFs or select specific documents to
            scope retrieval.
          </p>
        </div>
      </section>

      <DocumentQueryForm
        documents={documents.map((document) => ({
          id: document.id,
          title: document.title,
          originalFilename: document.originalFilename,
          status: document.status,
          createdAt: document.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
