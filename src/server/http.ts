import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { UnauthorizedError } from "@/auth/session";

export function handleRouteError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        issues: error.issues,
      },
      { status: 400 },
    );
  }

  console.error(error);

  return NextResponse.json(
    { error: "An unexpected server error occurred" },
    { status: 500 },
  );
}
