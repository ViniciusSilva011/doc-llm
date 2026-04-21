"use client";

import { FormEvent, useState } from "react";

interface QueryResponse {
  answer: string;
  matches: Array<{
    id: string;
    documentId: string;
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
    <section className="surface stack-md">
      <div className="stack-xs">
        <h2>Query indexed content</h2>
        <p className="muted-text">
          This starter already routes queries through embeddings, pgvector search,
          and a centralized OpenAI service.
        </p>
      </div>

      <form className="stack-md" onSubmit={handleSubmit}>
        <textarea
          className="textarea"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What are the main themes in the ingested documents?"
          rows={4}
          required
        />
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Running query..." : "Ask"}
        </button>
      </form>

      {error ? <p className="text-error">{error}</p> : null}

      {response ? (
        <div className="stack-md">
          <div className="stack-xs">
            <h3>Answer</h3>
            <p>{response.answer}</p>
          </div>

          <div className="stack-xs">
            <h3>Matched chunks</h3>
            <ul className="stack-sm list-reset">
              {response.matches.map((match) => (
                <li className="match-card" key={match.id}>
                  <p className="muted-text">
                    Document {match.documentId} | score {match.score.toFixed(3)}
                  </p>
                  <p>{match.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
