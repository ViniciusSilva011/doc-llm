"use client";

import { FormEvent, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QueryResponse {
  answer: string;
  matches: Array<{
    id: number;
    documentId: number;
    content: string;
    score: number;
  }>;
}

export function DocumentQueryForm() {
  const [question, setQuestion] = useState("");
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
      body: JSON.stringify({ question }),
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

  return (
    <Card className="border-border/70 bg-card shadow-xl backdrop-blur">
      <CardHeader>
        <CardTitle>Query indexed content</CardTitle>
        <CardDescription>
          Ask a question and route it through embeddings, pgvector search, and the
          shared OpenAI service layer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
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
