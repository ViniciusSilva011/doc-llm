import { requirePageSession } from "@/auth/session";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { listDocumentsForUser } from "@/lib/services/documents/repository";
import { formatBytes, formatDateTime } from "@/lib/utils";

export default async function DocumentsPage() {
  const session = await requirePageSession();
  const documents = await listDocumentsForUser(session.user.id);

  return (
    <div className="container page-grid">
      <section className="stack-sm">
        <p className="pill">Documents</p>
        <h1>Upload PDF documents for ingestion.</h1>
        <p className="muted-text">
          Upload a PDF and the app will persist it through the configured storage
          backend, create a document record, and queue it for the worker.
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
                  <th>Filename</th>
                  <th>Backend</th>
                  <th>Size</th>
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
                      <td>{document.originalFilename}</td>
                      <td>{document.storageBackend}</td>
                      <td>{formatBytes(document.byteSize)}</td>
                      <td>{document.status}</td>
                      <td>{document.chunkCount}</td>
                      <td>{formatDateTime(document.updatedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="muted-text" colSpan={7}>
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
