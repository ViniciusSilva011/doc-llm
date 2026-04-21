"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function DocumentUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const response = await fetch("/api/ingestion-jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        mimeType: "text/plain",
      }),
    });

    const payload = (await response.json()) as { error?: string };

    setIsSubmitting(false);

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Failed to create ingestion job.");
      return;
    }

    setTitle("");
    setContent("");
    setStatusMessage("Document queued for ingestion.");
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
          placeholder="Quarterly support review"
          required
        />
      </div>

      <div className="stack-xs">
        <label className="label" htmlFor="content">
          Source text
        </label>
        <textarea
          id="content"
          className="textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Paste source text here to enqueue an ingestion job."
          rows={10}
          required
        />
      </div>

      {statusMessage ? <p className="muted-text">{statusMessage}</p> : null}

      <button className="button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Queueing..." : "Create ingestion job"}
      </button>
    </form>
  );
}
