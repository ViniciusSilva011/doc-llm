import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  FileUp,
  LoaderCircle,
  XCircle,
} from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { formatBytes, formatDateTime, formatRelativeTime } from "@/lib/utils";

interface DocumentTableRowProps {
  document: {
    id: number;
    title: string;
    originalFilename: string;
    status: "uploaded" | "queued" | "processing" | "processed" | "failed";
    storageBackend: "local" | "s3";
    byteSize: number;
    chunkCount: number;
    updatedAt: string;
  };
}

function DocumentStatusIcon({
  status,
}: {
  status: DocumentTableRowProps["document"]["status"];
}) {
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
        <LoaderCircle className={`${iconClassName} animate-spin`} aria-hidden="true" />
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

export function DocumentTableRow({ document }: DocumentTableRowProps) {
  const chatHref = `/documents/${document.id}/chat`;
  const cellLinkClass = "block p-4";

  return (
    <TableRow
      aria-label={`Open chat for ${document.title}`}
      className="cursor-pointer"
    >
      <TableCell className="p-0 text-muted-foreground">
        <Link className={cellLinkClass} href={chatHref}>
          {document.id}
        </Link>
      </TableCell>
      <TableCell className="p-0 font-medium">
        <Link className={cellLinkClass} href={chatHref}>
          {document.title}
        </Link>
      </TableCell>
      <TableCell className="p-0">
        <Link className={cellLinkClass} href={chatHref}>
          {document.originalFilename}
        </Link>
      </TableCell>
      <TableCell className="p-0 uppercase text-muted-foreground">
        <Link className={cellLinkClass} href={chatHref}>
          {document.storageBackend}
        </Link>
      </TableCell>
      <TableCell className="p-0 whitespace-nowrap">
        <Link className={cellLinkClass} href={chatHref}>
          {formatBytes(document.byteSize)}
        </Link>
      </TableCell>
      <TableCell className="p-0">
        <Link
          aria-label={`Status: ${document.status}`}
          className={`${cellLinkClass} inline-flex items-center`}
          href={chatHref}
        >
          <DocumentStatusIcon status={document.status} />
        </Link>
      </TableCell>
      <TableCell className="p-0">
        <Link className={cellLinkClass} href={chatHref}>
          {document.chunkCount}
        </Link>
      </TableCell>
      <TableCell className="p-0">
        <Link
          className={`${cellLinkClass} whitespace-nowrap`}
          href={chatHref}
          title={formatDateTime(document.updatedAt)}
        >
          {formatRelativeTime(document.updatedAt)}
        </Link>
      </TableCell>
    </TableRow>
  );
}
