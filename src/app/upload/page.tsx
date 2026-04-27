import { requirePageSession } from "@/auth/session";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { Badge } from "@/components/ui/badge";
import { listDocumentsForUser } from "@/lib/services/documents/repository";

export default async function UploadPage() {
  const session = await requirePageSession();
  const documents = await listDocumentsForUser(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4">
      <section className="space-y-4">
        <Badge>Upload</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">
          Upload PDF documents for ingestion.
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          Upload a PDF and the app will persist it through the configured storage
          backend, create a document record, and queue it for the worker.
        </p>
      </section>

      <DocumentUploadForm
        recentDocuments={documents.slice(0, 3).map((document) => ({
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
