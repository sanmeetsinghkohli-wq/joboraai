import { NextRequest, NextResponse } from 'next/server';
import { getCookie } from '../auth/_lib';

// In-memory store for demo
const resumes = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const token = getCookie(request, 'session');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // In a real app, this would use a storage service like Supabase Storage
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
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

    // In a real app, this would upload to storage and trigger a parse job
    const resumeId = `resume-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newResume = {
      id: resumeId,
      userId: 'user-1',
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath: `/uploads/resumes/${resumeId}.${file.name.split('.').pop()}`, // Server-side only
      isMaster: false,
      status: 'uploaded',
      parsedProfile: null,
      previewUrl: null,
      createdAt: new Date().toISOString(),
    };
    resumes.set(newResume.id, newResume);

    return NextResponse.json({
      success: true,
      message: 'CV uploaded successfully. Parsing...',
      resume: newResume,
    });
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
    const token = getCookie(request, 'session');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      resumes: Array.from(resumes.values()),
    });
  } catch (error) {
    console.error('List resumes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
