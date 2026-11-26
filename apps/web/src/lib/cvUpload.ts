import { extractCvText } from './cv-parse';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['pdf', 'docx', 'txt'];

export type CvUploadResult = { text: string } | { error: string; status: number };

/** Validates an uploaded CV (type, size, file signature) and extracts its text. */
export async function readCvFile(file: FormDataEntryValue | null | undefined): Promise<CvUploadResult> {
  if (!file || typeof file === 'string') return { error: 'Choose a CV file to upload.', status: 400 };
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (!ALLOWED.includes(ext)) return { error: 'Upload a PDF, DOCX or TXT file.', status: 400 };
  if (file.size === 0 || file.size > MAX_BYTES) return { error: 'The file must be between 1 byte and 5 MB.', status: 400 };

  const buffer = Buffer.from(await file.arrayBuffer());
  // Cheap signature checks so a renamed file cannot slip through.
  if (ext === 'pdf' && buffer.subarray(0, 5).toString('latin1') !== '%PDF-') return { error: 'That file is not a valid PDF.', status: 400 };
  if (ext === 'docx' && buffer.subarray(0, 2).toString('latin1') !== 'PK') return { error: 'That file is not a valid Word document.', status: 400 };

  let text = '';
  try {
    text = (await extractCvText(file.name, buffer)).replace(/\u0000/g, '').trim();
  } catch {
    return { error: 'We could not read text from that file.', status: 422 };
  }
  if (text.length < 80) {
    return {
      error: 'This file has almost no selectable text. If it is a scanned image, export your CV from Word or Google Docs as a PDF and try again.',
      status: 422,
    };
  }
  return { text };
}
