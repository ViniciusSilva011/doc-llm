import { requirePageSession } from "@/auth/session";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { listDocumentsForUser } from "@/lib/services/documents/repository";
import { formatDateTime } from "@/lib/utils";

export default async function DocumentsPage() {
  const session = await requirePageSession();
  const documents = await listDocumentsForUser(session.user.id);

  return (
    <div className="container page-grid">
      <section className="stack-sm">
        <p className="pill">Documents</p>
        <h1>Queue source content for ingestion.</h1>
        <p className="muted-text">
          The current UI accepts pasted text for local development, but the storage
          layer is already abstracted so file uploads and external object sources can
          slot in next.
        </p>
      </section>

      <section className="split-grid">
        <DocumentUploadForm />

        <div className="surface stack-md">
          <div className="stack-xs">
            <h2>Tracked documents</h2>
            <p className="muted-text">
              Status updates come from the worker after extraction, chunking, and
              embedding generation complete.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Chunks</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? (
                  documents.map((document) => (
                    <tr key={document.id}>
                      <td>{document.title}</td>
                      <td>{document.status}</td>
                      <td>{document.chunkCount}</td>
                      <td>{formatDateTime(document.updatedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="muted-text" colSpan={4}>
                      No documents have been submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
