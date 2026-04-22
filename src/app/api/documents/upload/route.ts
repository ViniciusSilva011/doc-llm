import { NextResponse } from "next/server";

import { requireApiSession } from "@/auth/session";
import { DocumentUploadValidationError } from "@/server/documents/errors";
import { uploadPdfDocument } from "@/server/documents/upload-service";
import { handleRouteError } from "@/server/http";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const formData = await request.formData();
    const fileField = formData.get("file");

    if (!(fileField instanceof File)) {
      throw new DocumentUploadValidationError("A PDF file is required.");
    }

    const titleField = formData.get("title");
    const uploadParams: {
      ownerId: string;
      file: File;
      title?: string;
    } = {
      ownerId: session.user.id,
      file: fileField,
    };

    if (typeof titleField === "string") {
      uploadParams.title = titleField;
    }

    const result = await uploadPdfDocument(uploadParams);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
