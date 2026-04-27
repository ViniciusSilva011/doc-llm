import { requirePageSession } from "@/auth/session";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { listDocumentsForUser } from "@/lib/services/documents/repository";

export default async function UploadPage() {
  const session = await requirePageSession();
  const documents = await listDocumentsForUser(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4">
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
