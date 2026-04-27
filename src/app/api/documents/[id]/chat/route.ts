import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/auth/session";
import {
  createDocumentChatJob,
  createDocumentChatMessage,
} from "@/lib/services/documents/chat";
import { getDocumentForUser } from "@/lib/services/documents/repository";
import { handleRouteError } from "@/server/http";

const chatMessageSchema = z.object({
  message: z.string().trim().min(1),
});

function parseDocumentId(value: string) {
  const documentId = Number(value);

  return Number.isInteger(documentId) && documentId > 0 ? documentId : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireApiSession();
    const { id } = await context.params;
    const documentId = parseDocumentId(id);

    if (!documentId) {
      return NextResponse.json({ error: "Invalid document ID." }, { status: 400 });
    }

    const document = await getDocumentForUser(documentId, session.user.id);

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (document.status !== "processed") {
      return NextResponse.json(
        { error: "This document is not ready for chat yet." },
        { status: 409 },
      );
    }

    const payload = chatMessageSchema.parse(await request.json());

    const userMessage = await createDocumentChatMessage({
      documentId: document.id,
      userId: session.user.id,
      role: "user",
      content: payload.message,
    });

    const job = await createDocumentChatJob({
      documentId: document.id,
      userId: session.user.id,
      userMessageId: userMessage.id,
    });

    return NextResponse.json({
      jobId: job.id,
      message: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
