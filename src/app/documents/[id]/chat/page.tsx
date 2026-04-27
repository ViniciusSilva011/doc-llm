import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePageSession } from "@/auth/session";
import { DocumentChat } from "@/components/documents/document-chat";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listDocumentChatMessages } from "@/lib/services/documents/chat";
import { getDocumentForUser } from "@/lib/services/documents/repository";
import { formatBytes, formatDateTime } from "@/lib/utils";

function parseDocumentId(value: string) {
  const documentId = Number(value);

  return Number.isInteger(documentId) && documentId > 0 ? documentId : null;
}

export default async function DocumentChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageSession();
  const { id } = await params;
  const documentId = parseDocumentId(id);

  if (!documentId) {
    notFound();
  }

  const document = await getDocumentForUser(documentId, session.user.id);

  if (!document) {
    notFound();
  }

  const messages = await listDocumentChatMessages({
    documentId: document.id,
    userId: session.user.id,
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
      <section className="space-y-4">
        <Link
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
        <div className="space-y-3">
          <Badge>PDF chat</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">{document.title}</h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Ask questions against this PDF. Messages are saved for this document.
          </p>
        </div>
      </section>

      <Card className="border-border/70 bg-card shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle>Document details</CardTitle>
          <CardDescription>
            {document.originalFilename} | {formatBytes(document.byteSize)} | Uploaded{" "}
            {formatDateTime(document.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={document.status === "processed" ? "default" : "secondary"}>
            {document.status}
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>
            Answers are generated from chunks retrieved from this PDF only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentChat
            canSend={document.status === "processed"}
            documentId={document.id}
            initialMessages={messages.map((message) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              createdAt: message.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
