"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatResponse {
  message: ChatMessage;
  matches: Array<{
    id: number;
    documentId: number;
    content: string;
    score: number;
  }>;
  error?: string;
}

export function DocumentChat({
  documentId,
  initialMessages,
  canSend,
}: {
  documentId: number;
  initialMessages: ChatMessage[];
  canSend: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matches, setMatches] = useState<ChatResponse["matches"]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || !canSend) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/documents/${documentId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: trimmedMessage }),
    });

    const payload = (await response.json()) as ChatResponse;

    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "Failed to send message.");
      return;
    }

    const userMessage: ChatMessage = {
      id: -Date.now(),
      role: "user",
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage, payload.message]);
    setMatches(payload.matches);
    setMessage("");
  }

  return (
    <div className="space-y-5">
      <div className="max-h-[34rem] space-y-4 overflow-y-auto rounded-md border border-border/80 bg-muted/20 p-4">
        {messages.length > 0 ? (
          messages.map((chatMessage) => (
            <article
              className={
                chatMessage.role === "user"
                  ? "ml-auto max-w-[85%] rounded-md bg-primary p-4 text-primary-foreground"
                  : "mr-auto max-w-[85%] rounded-md border border-border/80 bg-background p-4"
              }
              key={`${chatMessage.role}-${chatMessage.id}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-xs opacity-80">
                <span className="font-medium">
                  {chatMessage.role === "user" ? "You" : "Assistant"}
                </span>
                <time>{formatDateTime(chatMessage.createdAt)}</time>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7">
                {chatMessage.content}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No messages yet. Ask a question when the PDF has finished processing.
          </p>
        )}
      </div>

      {matches.length > 0 ? (
        <details className="rounded-md border border-border/80 bg-background p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Latest sources
          </summary>
          <ul className="mt-3 space-y-3">
            {matches.map((match) => (
              <li className="text-sm text-muted-foreground" key={match.id}>
                <span className="font-medium text-foreground">
                  Chunk {match.id}
                </span>{" "}
                score {match.score.toFixed(3)}
                <p className="mt-1 line-clamp-3">{match.content}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {!canSend ? (
        <p className="text-sm text-muted-foreground">
          This PDF is not indexed yet. The chat unlocks after ingestion finishes.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Textarea
          disabled={!canSend || isSubmitting}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask a question about this PDF"
          rows={4}
          value={message}
        />
        <Button disabled={!canSend || isSubmitting || !message.trim()} type="submit">
          {isSubmitting ? "Sending..." : "Send message"}
        </Button>
      </form>
    </div>
  );
}
