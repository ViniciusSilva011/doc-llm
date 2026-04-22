import { requirePageSession } from "@/auth/session";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listDocumentsForUser } from "@/lib/services/documents/repository";
import { formatBytes, formatDateTime } from "@/lib/utils";

export default async function DocumentsPage() {
  const session = await requirePageSession();
  const documents = await listDocumentsForUser(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
      <section className="space-y-4">
        <Badge>Documents</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">
          Upload PDF documents for ingestion.
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          Upload a PDF and the app will persist it through the configured storage
          backend, create a document record, and queue it for the worker.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
        <DocumentUploadForm />

        <Card className="border-border/70 bg-card shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Tracked documents</CardTitle>
            <CardDescription>
              Status updates come from the worker after extraction, chunking, and
              embedding generation complete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Backend</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length > 0 ? (
                    documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">{document.title}</TableCell>
                        <TableCell>{document.originalFilename}</TableCell>
                        <TableCell className="uppercase text-muted-foreground">
                          {document.storageBackend}
                        </TableCell>
                        <TableCell>{formatBytes(document.byteSize)}</TableCell>
                        <TableCell>{document.status}</TableCell>
                        <TableCell>{document.chunkCount}</TableCell>
                        <TableCell>{formatDateTime(document.updatedAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="text-muted-foreground" colSpan={7}>
                        No documents have been submitted yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
