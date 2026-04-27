import { requirePageSession } from "@/auth/session";
import { DocumentTableRow } from "@/components/documents/document-table-row";
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
import { getDashboardData } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const session = await requirePageSession();
  const dashboard = await getDashboardData(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
      <section className="space-y-4">
        <Badge>Protected dashboard</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">
          Welcome back, {session.user.name ?? session.user.email}.
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          The dashboard is protected via server-side session checks and uses shared
          services instead of page-local database calls.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl">{dashboard.stats.documentCount}</CardTitle>
            <CardDescription>Documents tracked</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl">
              {dashboard.stats.processedDocumentCount}
            </CardTitle>
            <CardDescription>Documents indexed</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl">{dashboard.stats.ingestionJobCount}</CardTitle>
            <CardDescription>Ingestion jobs created</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section>
        <Card className="border-border/70 bg-card shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Tracked documents</CardTitle>
            <CardDescription>
              Recent uploads with their current ingestion status and chat actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Backend</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.documents.length > 0 ? (
                    dashboard.documents.map((document) => (
                      <DocumentTableRow
                        document={{
                          id: document.id,
                          title: document.title,
                          originalFilename: document.originalFilename,
                          status: document.status,
                          storageBackend: document.storageBackend,
                          byteSize: document.byteSize,
                          chunkCount: document.chunkCount,
                          updatedAt: document.updatedAt.toISOString(),
                        }}
                        key={document.id}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="text-muted-foreground" colSpan={8}>
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
