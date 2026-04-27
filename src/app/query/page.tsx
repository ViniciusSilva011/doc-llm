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
