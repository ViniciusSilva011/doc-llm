import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { UnauthorizedError } from "@/auth/session";
import { DocumentUploadValidationError } from "@/server/documents/errors";
import {
  StorageConfigurationError,
  StorageObjectNotFoundError,
  StoragePathError,
} from "@/server/storage";

export function handleRouteError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof DocumentUploadValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof StorageObjectNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof StorageConfigurationError || error instanceof StoragePathError) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
