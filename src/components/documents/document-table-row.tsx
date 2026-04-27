import Link from "next/link";

import { TableCell, TableRow } from "@/components/ui/table";
import { formatBytes, formatDateTime } from "@/lib/utils";

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

export function DocumentTableRow({ document }: DocumentTableRowProps) {
  const chatHref = `/documents/${document.id}/chat`;
  const cellLinkClass = "block p-4";

  return (
    <TableRow
      aria-label={`Open chat for ${document.title}`}
      className="cursor-pointer"
    >
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
      <TableCell className="p-0">
        <Link className={cellLinkClass} href={chatHref}>
          {formatBytes(document.byteSize)}
        </Link>
      </TableCell>
      <TableCell className="p-0">
        <Link className={cellLinkClass} href={chatHref}>
          {document.status}
        </Link>
      </TableCell>
      <TableCell className="p-0">
        <Link className={cellLinkClass} href={chatHref}>
          {document.chunkCount}
        </Link>
      </TableCell>
      <TableCell className="p-0">
        <Link className={cellLinkClass} href={chatHref}>
          {formatDateTime(document.updatedAt)}
        </Link>
      </TableCell>
      <TableCell className="p-0">
        <Link
          className="block p-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
          href={chatHref}
        >
          Chat
        </Link>
      </TableCell>
    </TableRow>
  );
}
