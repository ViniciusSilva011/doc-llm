import { requirePageSession } from "@/auth/session";
import { DocumentQueryForm } from "@/components/query/document-query-form";
import { listDocumentsForUser } from "@/lib/services/documents/repository";

export default async function DocumentsPage() {
  const session = await requirePageSession();
  const documents = await listDocumentsForUser(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4">
      <DocumentQueryForm
        documents={documents.map((document) => ({
          id: document.id,
          title: document.title,
          originalFilename: document.originalFilename,
          contentType: document.contentType,
          status: document.status,
          createdAt: document.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
