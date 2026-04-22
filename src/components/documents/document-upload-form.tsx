"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
    <form className="stack-md surface" onSubmit={handleSubmit}>
      <div className="stack-xs">
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="input"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional display title"
        />
      </div>

      <div className="stack-xs">
        <label className="label" htmlFor="file">
          PDF file
        </label>
        <input
          id="file"
          className="input"
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
      </div>

      {statusMessage ? <p className="muted-text">{statusMessage}</p> : null}
      {errorMessage ? <p className="text-error">{errorMessage}</p> : null}

      <button className="button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading..." : "Upload PDF"}
      </button>
    </form>
  );
}
