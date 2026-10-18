import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, resumesStore } from '../auth/_lib';

export const dynamic = 'force-dynamic';

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
      const acceptedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!acceptedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Unsupported file type. Please upload PDF or DOCX.' },
          { status: 400 }
        );
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds 10MB limit' },
          { status: 400 }
        );
      }
      fileName = file.name;
      fileType = file.type;
      fileSize = file.size;
      rawText = await file.text().catch(() => '');
    } else {
      const body = await request.json();
      if (!body?.fileName && !body?.rawText) {
        return NextResponse.json(
          { success: false, error: 'fileName or rawText is required' },
          { status: 400 }
        );
      }
      fileName = String(body.fileName || 'Candidate_Resume.pdf');
      fileType = String(body.fileType || 'application/pdf');
      fileSize = Number(body.fileSize || (body.rawText ? String(body.rawText).length : 142000));
      rawText = String(body.rawText || '');
    }

    const resumeId = `resume-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newResume = {
      id: resumeId,
      userId,
      fileName,
      fileType,
      fileSize,
      rawText,
      filePath: `/uploads/resumes/${resumeId}.${fileName.split('.').pop()}`,
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
