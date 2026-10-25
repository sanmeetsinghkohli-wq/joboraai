import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getAuthenticatedUserId, resumesStore } from '../auth/_lib';

export const dynamic = 'force-dynamic';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt'];

function sanitizeFileName(rawName: string): string {
  const base = path.basename(String(rawName || 'Candidate_Resume.pdf'));
  return base.replace(/[\r\n\0]/g, '').trim() || 'Candidate_Resume.pdf';
}

function validateFileBuffer(
  buffer: Buffer,
  ext: string
): { valid: boolean; error?: string; status?: number } {
  if (buffer.length === 0) {
    return {
      valid: false,
      error: 'File is empty (0 bytes). Please upload a valid CV document.',
      status: 400,
    };
  }

  if (buffer.length > 10 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit',
      status: 400,
    };
  }

  if (ext === 'pdf') {
    const header = buffer.subarray(0, 1024).toString('latin1');
    if (!header.includes('%PDF-')) {
      return {
        valid: false,
        error: 'Invalid PDF format: Missing %PDF- file header signature.',
        status: 422,
      };
    }
    const fullContent = buffer.toString('latin1');
    if (header.includes('/Encrypt') || fullContent.includes('/Encrypt')) {
      return {
        valid: false,
        error: 'Document appears to be password-protected or encrypted. Please upload an unencrypted PDF.',
        status: 422,
      };
    }
  } else if (ext === 'docx') {
    const isZip =
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);
    if (!isZip) {
      return {
        valid: false,
        error: 'Invalid DOCX format: Missing ZIP package signature (PK).',
        status: 422,
      };
    }

    const archiveContent = buffer.toString('latin1');
    if (archiveContent.includes('../') || archiveContent.includes('..\\')) {
      return {
        valid: false,
        error: 'Security violation: Archive contains relative path traversal (zip-slip).',
        status: 400,
      };
    }

    const hasDocxStructure =
      archiveContent.includes('[Content_Types].xml') || archiveContent.includes('word/');
    if (!hasDocxStructure) {
      return {
        valid: false,
        error: 'Invalid DOCX package: Missing Office Open XML structure ([Content_Types].xml or word/).',
        status: 422,
      };
    }
  } else if (ext === 'doc') {
    const isOle =
      buffer.length >= 4 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0;
    if (!isOle) {
      return {
        valid: false,
        error: 'Invalid DOC format: Missing OLE2 compound document signature.',
        status: 422,
      };
    }
  } else if (ext === 'txt') {
    if (buffer.includes(0x00)) {
      return {
        valid: false,
        error: 'Invalid text file: File contains binary null bytes.',
        status: 422,
      };
    }
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let fileName = 'Candidate_Resume.pdf';
    let fileType = 'application/pdf';
    let fileSize = 142000;
    let rawText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
      }

      fileName = sanitizeFileName(file.name);
      const ext = (fileName.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported file extension. Only .pdf, .docx, .doc, and .txt files are accepted.',
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const validation = validateFileBuffer(buffer, ext);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: validation.status || 400 }
        );
      }

      fileType =
        file.type ||
        (ext === 'pdf'
          ? 'application/pdf'
          : ext === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : ext === 'doc'
              ? 'application/msword'
              : 'text/plain');
      fileSize = file.size;

      // Extract text representation if available
      if (ext === 'txt') {
        rawText = buffer.toString('utf-8');
      } else if (ext === 'docx') {
        // Look for extracted document.xml text fragments if present
        const latin = buffer.toString('latin1');
        const docXmlMatch = latin.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        if (docXmlMatch && docXmlMatch.length > 0) {
          rawText = docXmlMatch.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
        }
      } else {
        try {
          rawText = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000));
        } catch {
          rawText = '';
        }
      }
    } else {
      const body = await request.json().catch(() => ({}));
      if (!body?.fileName && !body?.rawText && !body?.rawBase64) {
        return NextResponse.json(
          { success: false, error: 'fileName or rawText is required' },
          { status: 400 }
        );
      }

      fileName = sanitizeFileName(body.fileName || 'Candidate_Resume.pdf');
      const ext = (fileName.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported file extension. Only .pdf, .docx, .doc, and .txt files are accepted.',
          },
          { status: 400 }
        );
      }

      if (body.rawBase64 && typeof body.rawBase64 === 'string') {
        const buffer = Buffer.from(body.rawBase64, 'base64');
        const validation = validateFileBuffer(buffer, ext);
        if (!validation.valid) {
          return NextResponse.json(
            { success: false, error: validation.error },
            { status: validation.status || 400 }
          );
        }
        fileSize = buffer.length;
        rawText = buffer.toString('utf-8', 0, 50000);
      } else {
        fileSize =
          typeof body.fileSize === 'number'
            ? body.fileSize
            : (body.rawText ? String(body.rawText).length : 0);
        rawText = String(body.rawText || '');

        if (fileSize === 0 || !rawText.trim()) {
          return NextResponse.json(
            { success: false, error: 'File is empty (0 bytes). Please provide valid resume text.' },
            { status: 400 }
          );
        }

        if (fileSize > 10 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'File size exceeds 10MB limit' },
            { status: 400 }
          );
        }

        // Null byte check for text
        if (rawText.includes('\x00')) {
          return NextResponse.json(
            { success: false, error: 'Invalid text format: Document contains null bytes.' },
            { status: 422 }
          );
        }

        // PDF encryption check
        if (ext === 'pdf' && rawText.includes('/Encrypt')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Document appears to be password-protected or encrypted. Please upload an unencrypted PDF.',
            },
            { status: 422 }
          );
        }

        // Zip-slip check for serialized docx payloads
        if (ext === 'docx' && (rawText.includes('../') || rawText.includes('..\\'))) {
          return NextResponse.json(
            {
              success: false,
              error: 'Security violation: Archive contains relative path traversal (zip-slip).',
            },
            { status: 400 }
          );
        }
      }

      fileType = String(
        body.fileType ||
          (ext === 'pdf'
            ? 'application/pdf'
            : ext === 'docx'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : ext === 'doc'
                ? 'application/msword'
                : 'text/plain')
      );
    }

    const safeExt = (fileName.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/gi, '');
    const resumeId = `resume-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newResume = {
      id: resumeId,
      userId,
      fileName,
      fileType,
      fileSize,
      rawText,
      filePath: `/uploads/resumes/${resumeId}.${safeExt}`,
      isMaster: true,
      status: 'uploaded',
      parsedProfile: null,
      previewUrl: null,
      createdAt: new Date().toISOString(),
    };

    resumesStore.set(newResume.id, newResume);

    return NextResponse.json(
      {
        success: true,
        message: 'CV uploaded successfully.',
        resume: newResume,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const userResumes = Array.from(resumesStore.values()).filter((r) => r.userId === userId);
    return NextResponse.json({
      success: true,
      resumes: userResumes,
    });
  } catch (error) {
    console.error('List resumes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
