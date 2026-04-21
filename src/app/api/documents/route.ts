import { NextResponse } from "next/server";

import { requireApiSession } from "@/auth/session";
import { listDocumentsForUser } from "@/lib/services/documents/repository";
import { handleRouteError } from "@/server/http";

export async function GET() {
  try {
    const session = await requireApiSession();
    const documents = await listDocumentsForUser(session.user.id);

    return NextResponse.json({ documents });
  } catch (error) {
    return handleRouteError(error);
  }
}
