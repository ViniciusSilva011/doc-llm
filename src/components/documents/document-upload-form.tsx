"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UPLOAD_SUCCESS_MESSAGE = "PDF uploaded and queued for ingestion.";
const UPLOAD_FLASH_KEY = "document-upload-flash-message";

export function DocumentUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const flashMessage = window.sessionStorage.getItem(UPLOAD_FLASH_KEY);

    if (!flashMessage) {
      return;
    }

    setStatusMessage(flashMessage);
    window.sessionStorage.removeItem(UPLOAD_FLASH_KEY);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setErrorMessage("Select a PDF file before uploading.");
      return;
    }

    if (!isPdfFile(file)) {
      setStatusMessage(null);
      setErrorMessage("Only PDF files are accepted.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    if (title.trim()) {
      formData.append("title", title.trim());
    }

    const response = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as { error?: string };

    setIsSubmitting(false);

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Failed to upload the PDF.");
      return;
    }

    setTitle("");
    setFile(null);
    setStatusMessage(UPLOAD_SUCCESS_MESSAGE);
    window.sessionStorage.setItem(UPLOAD_FLASH_KEY, UPLOAD_SUCCESS_MESSAGE);
    router.refresh();
  }

  return (
    <Card className="border-border/70 bg-card shadow-xl backdrop-blur">
      <CardHeader>
        <CardTitle>Upload PDF</CardTitle>
        <CardDescription>
          Store a document, create the record, and queue ingestion in one step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional display title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">PDF file</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </div>

          {statusMessage ? (
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          ) : null}
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Upload PDF"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function isPdfFile(file: File) {
  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
  const hasAcceptedMimeType = file.type === "" || file.type === "application/pdf";

  return hasPdfExtension && hasAcceptedMimeType;
}
