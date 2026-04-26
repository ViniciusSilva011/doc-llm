declare module "sbd" {
  export interface SentenceOptions {
    abbreviations?: string[];
    html_boundaries?: boolean;
    html_boundaries_tags?: string[];
    newline_boundaries?: boolean;
    preserve_whitespace?: boolean;
    sanitize?: boolean;
  }

  export function sentences(text?: string, options?: SentenceOptions): string[];
}
