import { NextResponse } from "next/server";

import { requireApiSession } from "@/auth/session";
import { ensureDocumentsBelongToUser } from "@/lib/services/documents/repository";
import { generateAnswerFromDocuments } from "@/lib/services/documents/query";
import { queryDocumentsSchema } from "@/lib/validations/query";
import { handleRouteError } from "@/server/http";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const payload = queryDocumentsSchema.parse(await request.json());

    if (payload.documentIds?.length) {
      const ownsAllDocuments = await ensureDocumentsBelongToUser(
        session.user.id,
        payload.documentIds,
      );

      if (!ownsAllDocuments) {
        return NextResponse.json(
          { error: "One or more requested documents do not belong to the current user." },
          { status: 403 },
        );
      }
    }

    const result = await generateAnswerFromDocuments(
      payload.documentIds
        ? {
            userId: session.user.id,
            question: payload.question,
            documentIds: payload.documentIds,
          }
        : {
            userId: session.user.id,
            question: payload.question,
          },
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
