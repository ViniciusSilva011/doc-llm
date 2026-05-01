import { NextResponse } from "next/server";

import { requireApiSession } from "@/auth/session";
import {
  type DocumentChatEvent,
  subscribeToDocumentChatEvents,
} from "@/lib/services/documents/chat";
import { getDocumentForUser } from "@/lib/services/documents/repository";
import { handleRouteError } from "@/server/http";

export const runtime = "nodejs";

function parseDocumentId(value: string) {
  const documentId = Number(value);

  return Number.isInteger(documentId) && documentId > 0 ? documentId : null;
}

function encodeSseEvent(eventName: string, data: unknown) {
  return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
}

function isControllerAlreadyClosedError(error: unknown) {
  return (
    error instanceof TypeError &&
    ((error as { code?: string }).code === "ERR_INVALID_STATE" ||
      error.message.includes("Controller is already closed"))
  );
}

export async function GET(
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

    const encoder = new TextEncoder();
    let closeStream: (() => Promise<void>) | undefined;
    let closeRequested = false;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let closed = false;
        let removeAbortListener = () => {};

        function enqueue(value: string) {
          if (!closed) {
            controller.enqueue(encoder.encode(value));
          }
        }

        function closeController() {
          try {
            controller.close();
          } catch (error) {
            if (!isControllerAlreadyClosedError(error)) {
              throw error;
            }
          }
        }

        const subscription = await subscribeToDocumentChatEvents(
          (event: DocumentChatEvent) => {
            if (event.documentId !== document.id || event.userId !== session.user.id) {
              return;
            }

            enqueue(encodeSseEvent(event.type, event));
          },
        );
        const heartbeat = setInterval(() => {
          enqueue(": keepalive\n\n");
        }, 25_000);

        async function close() {
          if (closed) {
            return;
          }

          closed = true;
          closeRequested = true;
          removeAbortListener();

          clearInterval(heartbeat);

          try {
            await subscription.close();
          } finally {
            closeController();
          }
        }

        closeStream = close;

        function handleAbort() {
          void close().catch((error: unknown) => {
            console.error("Failed to close document chat event stream.", error);
          });
        }

        request.signal.addEventListener("abort", handleAbort);
        removeAbortListener = () => {
          request.signal.removeEventListener("abort", handleAbort);
        };

        if (closeRequested || request.signal.aborted) {
          await close();
          return;
        }

        enqueue(encodeSseEvent("chat.connected", { documentId: document.id }));
      },
      cancel() {
        closeRequested = true;
        return closeStream?.();
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
