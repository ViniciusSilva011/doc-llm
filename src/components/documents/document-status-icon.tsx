import {
  CheckCircle2,
  Clock3,
  FileUp,
  LoaderCircle,
  XCircle,
} from "lucide-react";

export type DocumentStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "processed"
  | "failed";

export function DocumentStatusIcon({ status }: { status: DocumentStatus }) {
  const iconClassName = "size-4";

  if (status === "processed") {
    return (
      <span
        aria-label="processed"
        className="inline-flex items-center text-emerald-500"
        title="processed"
      >
        <CheckCircle2 className={iconClassName} aria-hidden="true" />
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span
        aria-label="failed"
        className="inline-flex items-center text-destructive"
        title="failed"
      >
        <XCircle className={iconClassName} aria-hidden="true" />
      </span>
    );
  }

  if (status === "processing") {
    return (
      <span
        aria-label="processing"
        className="inline-flex items-center text-sky-500"
        title="processing"
      >
        <LoaderCircle
          className={`${iconClassName} animate-spin`}
          aria-hidden="true"
        />
      </span>
    );
  }

  if (status === "queued") {
    return (
      <span
        aria-label="queued"
        className="inline-flex items-center text-amber-500"
        title="queued"
      >
        <Clock3 className={iconClassName} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      aria-label="uploaded"
      className="inline-flex items-center text-muted-foreground"
      title="uploaded"
    >
      <FileUp className={iconClassName} aria-hidden="true" />
    </span>
  );
}
