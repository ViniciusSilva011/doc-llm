import { NextResponse } from "next/server";

import { requireApiSession } from "@/auth/session";
import { enqueueIngestionJob } from "@/lib/services/ingestion/service";
import { createIngestionJobSchema } from "@/lib/validations/ingestion";
import { handleRouteError } from "@/server/http";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const payload = createIngestionJobSchema.parse(await request.json());
    const result = await enqueueIngestionJob(session.user.id, payload);

    return NextResponse.json(
      {
        document: result.document,
        job: result.job,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
