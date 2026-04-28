"use client";

import { FormEvent, useState } from "react";

import { DocumentStatusIcon } from "@/components/documents/document-status-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatFileType } from "@/lib/utils";

interface QueryResponse {
  answer: string;
  matches: Array<{
    id: number;
    documentId: number;
    content: string;
    score: number;
  }>;
}

interface QueryDocumentOption {
  id: number;
  title: string;
  originalFilename: string;
  contentType: string;
  status: "uploaded" | "queued" | "processing" | "processed" | "failed";
  createdAt: string;
}

export function DocumentQueryForm({
  documents = [],
}: {
  documents?: QueryDocumentOption[];
}) {
  const [question, setQuestion] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const apiResponse = await fetch("/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        selectedDocumentIds.length > 0
          ? { question, documentIds: selectedDocumentIds }
          : { question },
      ),
    });

    const payload = (await apiResponse.json()) as QueryResponse & { error?: string };

    setIsSubmitting(false);

    if (!apiResponse.ok) {
      setResponse(null);
      setError(payload.error ?? "Query failed.");
      return;
    }

    setResponse(payload);
  }

  function toggleDocument(documentId: number) {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  }

  return (
    <Card className="border-border/70 bg-card shadow-xl backdrop-blur">
      <CardHeader>
        <CardTitle>Query indexed content</CardTitle>
        <CardDescription>
          Select PDFs to scope retrieval, or leave everything unselected to query all
          indexed documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {documents.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">PDF scope</legend>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-border/80 bg-muted/20 p-3">
                {documents.map((document) => {
                  const isSelected = selectedDocumentIds.includes(document.id);

                  return (
                    <label
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 bg-background/70 p-3 text-sm transition-colors hover:bg-muted/40"
                      key={document.id}
                    >
                      <input
                        checked={isSelected}
                        className="mt-1 size-4 accent-primary"
                        onChange={() => toggleDocument(document.id)}
                        type="checkbox"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {document.title}
                        </span>
                        <span className="block truncate text-muted-foreground">
                          {formatFileType(document)}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <DocumentStatusIcon status={document.status} />
                          <span>Uploaded {formatDateTime(document.createdAt)}</span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected {selectedDocumentIds.length || "all"} PDF
                {selectedDocumentIds.length === 1 ? "" : "s"}.
              </p>
            </fieldset>
          ) : null}

          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What are the main themes in the ingested documents?"
            rows={4}
            required
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Running query..." : "Ask"}
          </Button>
        </form>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {response ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Answer</h3>
              <p className="text-sm leading-7 text-foreground/95">{response.answer}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Matched chunks</h3>
              <ul className="space-y-3">
                {response.matches.map((match) => (
                  <li
                    className="rounded-xl border border-border/80 bg-muted/35 p-4"
                    key={match.id}
                  >
                    <p className="text-sm text-muted-foreground">
                      Document {match.documentId} | score {match.score.toFixed(3)}
                    </p>
                    <p className="mt-2 text-sm leading-7">{match.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
