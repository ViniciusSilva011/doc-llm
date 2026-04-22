"use client";

import { FormEvent, useState } from "react";
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

export function DocumentUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setErrorMessage("Select a PDF file before uploading.");
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
    setStatusMessage("PDF uploaded and queued for ingestion.");
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
