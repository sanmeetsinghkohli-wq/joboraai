/**
 * Turns an uploaded CV into the HTML that career-ops' `auditAts` scores.
 *
 * career-ops was written to score a CV's HTML before it becomes a PDF, so it
 * looks for real structure: headings, <table> layouts, CSS columns, images and
 * hidden text. Flattening an upload to plain text would hide all of that, so:
 *
 * - Word files keep their real structure (tables, images, bold headings) via mammoth.
 * - PDFs have no HTML, so the page layout is measured from the text positions,
 *   and a genuinely multi-column PDF is marked with the same CSS columns
 *   career-ops checks for. Nothing is added that is not in the file.
 *
 * The career-ops scorer itself is used unmodified.
 */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

/**
 * A line that reads like a section heading: short, not a sentence and not
 * contact details. Works for any script, so Arabic or Hindi headings count too;
 * career-ops decides which headings are the standard sections.
 */
export function looksLikeHeading(line: string): boolean {
  const l = line.trim().replace(/[:：]$/, '');
  if (!l || l.length > 40) return false;
  if (l.split(/\s+/).length > 5) return false;
  if (/[@|•·]|https?:|www\.|\d{3,}/.test(l)) return false;
  if (/[.!?]$/.test(l)) return false;
  return true;
}

/** Plain text (pasted, or extracted from a PDF/TXT) to simple, single-column HTML. */
export function textToAtsHtml(text: string, opts: { columns?: number } = {}): string {
  const body = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (looksLikeHeading(l) ? `<h2>${esc(l.replace(/[:：]$/, ''))}</h2>` : `<p>${esc(l)}</p>`))
    .join('\n');
  const wrapped = opts.columns && opts.columns > 1 ? `<div style="column-count:${opts.columns}">${body}</div>` : body;
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${wrapped}</body></html>`;
}

/** Word document to HTML that keeps its tables, images and headings. */
export async function docxToAtsHtml(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.convertToHtml({ buffer });
  // Many CVs style headings as a bold paragraph rather than a Heading style;
  // treat a paragraph that is entirely bold and heading-shaped as a heading.
  const html = (value || '').replace(/<p>\s*<strong>([^<]{1,60})<\/strong>\s*<\/p>/g, (m, inner: string) =>
    looksLikeHeading(inner) ? `<h2>${inner}</h2>` : m
  );
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
}

type PdfItem = { str: string; transform: number[]; width: number };

/**
 * Share of text lines that are split into a left and a right block with a wide
 * gap near the middle of the page. High values mean a multi-column layout.
 */
export function splitLineRatio(pages: Array<{ width: number; items: PdfItem[] }>): { lines: number; split: number } {
  let lines = 0;
  let split = 0;
  for (const page of pages) {
    const rows = new Map<number, PdfItem[]>();
    for (const it of page.items) {
      if (!it.str?.trim()) continue;
      const y = Math.round(it.transform[5] / 3);
      rows.set(y, [...(rows.get(y) ?? []), it]);
    }
    for (const row of rows.values()) {
      lines++;
      const sorted = row.sort((a, b) => a.transform[4] - b.transform[4]);
      for (let i = 1; i < sorted.length; i++) {
        const prevEnd = sorted[i - 1].transform[4] + sorted[i - 1].width;
        const start = sorted[i].transform[4];
        const gap = start - prevEnd;
        const mid = start / page.width;
        if (gap > page.width * 0.06 && mid > 0.25 && mid < 0.75) {
          split++;
          break;
        }
      }
    }
  }
  return { lines, split };
}

/** PDF text plus a measured column count, for career-ops' layout check. */
export async function pdfToAtsHtml(buffer: Buffer, text: string): Promise<{ html: string; multiColumn: boolean }> {
  let multiColumn = false;
  try {
    const { getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const pages: Array<{ width: number; items: PdfItem[] }> = [];
    for (let n = 1; n <= Math.min(pdf.numPages, 4); n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      pages.push({ width: page.getViewport({ scale: 1 }).width, items: content.items as PdfItem[] });
    }
    const { lines, split } = splitLineRatio(pages);
    multiColumn = lines >= 15 && split / lines >= 0.3;
  } catch {
    // Layout could not be measured; score the text alone rather than guess.
  }
  return { html: textToAtsHtml(text, { columns: multiColumn ? 2 : 1 }), multiColumn };
}
