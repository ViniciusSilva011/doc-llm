import Link from "next/link";

import { DocumentStatusIcon } from "@/components/documents/document-status-icon";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  formatBytes,
  formatDateTime,
  formatFileType,
  formatRelativeTime,
} from "@/lib/utils";

interface DocumentTableRowProps {
  document: {
    id: number;
    title: string;
    originalFilename: string;
    contentType: string;
    status: "uploaded" | "queued" | "processing" | "processed" | "failed";
    byteSize: number;
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
          {formatFileType(document)}
        </Link>
      </TableCell>
      <TableCell className="p-0 whitespace-nowrap">
        <Link className={cellLinkClass} href={chatHref}>
          {formatBytes(document.byteSize)}
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
      <TableCell className="p-0 text-center">
        <Link
          aria-label={`Status: ${document.status}`}
          className={`${cellLinkClass} inline-flex items-center`}
          href={chatHref}
        >
          <DocumentStatusIcon status={document.status} />
        </Link>
      </TableCell>
    </TableRow>
  );
}
