-- ==============================================================================
-- JOBORA AI — SUPABASE / POSTGRESQL INITIAL DATABASE SCHEMA & RLS POLICIES
-- Version: 1.1 (Production-Ready Migration)
-- Date: October 2026
-- Description: Sets up pgvector extension, entity tables, indexes, storage buckets,
--              and Row-Level Security (RLS) policies for Jobora AI.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. CANDIDATE PROFILES
-- Note: 'id' references auth.users(id) to bind profile directly to Supabase Auth identity
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    full_name TEXT DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    location TEXT DEFAULT '',
    target_role TEXT DEFAULT '',
    summary TEXT DEFAULT '',
    university TEXT DEFAULT '',
    degree TEXT DEFAULT '',
    gpa TEXT DEFAULT '',
    graduation_year TEXT DEFAULT '',
    github TEXT DEFAULT '',
    linkedin TEXT DEFAULT '',
    skills TEXT[] DEFAULT '{}',
    cv_decisions JSONB DEFAULT '{}'::jsonb,
    ats_score INTEGER DEFAULT 0,
    resume_file_name TEXT DEFAULT '',
    resume_size TEXT DEFAULT '',
    resume_uploaded_at TEXT DEFAULT '',
    connected_email TEXT DEFAULT '',
    email_provider TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RESUMES & ATTACHMENTS
-- Note: ID uses TEXT with UUID default to support both UUIDs and prefixed IDs ('resume-...')
CREATE TABLE IF NOT EXISTS public.resumes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    raw_text TEXT DEFAULT '',
    storage_path TEXT NOT NULL,
    is_master BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'uploaded', -- uploaded, parsed, archived
    parsed_profile JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RESUME VERSIONS (TAILORED CVS)
CREATE TABLE IF NOT EXISTS public.resume_versions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    resume_id TEXT NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id TEXT, -- external or internal job reference
    version_label TEXT NOT NULL,
    tailored_content TEXT NOT NULL,
    accepted_diffs JSONB DEFAULT '[]'::jsonb,
    rejected_diffs JSONB DEFAULT '[]'::jsonb,
    ats_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. JOBS (SHARED NORMALIZED CATALOG)
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY, -- provider-prefixed or UUID
    source TEXT NOT NULL, -- remotive, arbeitnow, greenhouse, himalayas, jobicy, etc.
    source_url TEXT NOT NULL,
    application_url TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    work_mode TEXT DEFAULT 'Remote', -- Remote, Hybrid, Onsite
    employment_type TEXT DEFAULT 'Full-time',
    salary_currency TEXT DEFAULT 'USD',
    salary_min NUMERIC,
    salary_max NUMERIC,
    description TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    embedding vector(1536), -- semantic embedding vector for pgvector matching
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. JOB MATCHES
CREATE TABLE IF NOT EXISTS public.job_matches (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    match_score INTEGER NOT NULL,
    matched_skills TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    explanation TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- 7. APPLICATIONS
-- Note: ID uses TEXT with UUID default to support both UUIDs and prefixed IDs ('app-...')
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id TEXT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Saved', -- Discovered, Saved, Preparing, Ready to Apply, Applied, Assessment, Interview, Offer, Rejected, Withdrawn, Closed
    match_score INTEGER DEFAULT 80,
    sync_channel TEXT DEFAULT 'Direct Portal',
    next_action TEXT DEFAULT '',
    recruiter_name TEXT DEFAULT '',
    recruiter_email TEXT DEFAULT '',
    applied_at TIMESTAMPTZ,
    timeline JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COVER LETTERS
CREATE TABLE IF NOT EXISTS public.cover_letters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    application_id TEXT REFERENCES public.applications(id) ON DELETE SET NULL,
    job_id TEXT,
    role_title TEXT NOT NULL,
    company TEXT NOT NULL,
    tone TEXT DEFAULT 'Editorial & Professional',
    length_mode TEXT DEFAULT 'Standard',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INTERVIEWS
CREATE TABLE IF NOT EXISTS public.interviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    application_id TEXT REFERENCES public.applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    interview_type TEXT DEFAULT 'STAR Behavioral', -- Technical, System Design, STAR Behavioral, Executive
    interview_date TIMESTAMPTZ,
    feedback_notes TEXT DEFAULT '',
    rubric_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    tool TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_resumes_user ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON public.resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user ON public.cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user ON public.interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON public.jobs(posted_at DESC);

-- HNSW Vector Index for Semantic Matching (cosine distance)
CREATE INDEX IF NOT EXISTS idx_jobs_embedding ON public.jobs USING hnsw (embedding vector_cosine_ops);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Principle: Private user data is strictly isolated to the authenticated user.
-- ==============================================================================

-- Enable RLS on all private tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can view and edit only their own profile
CREATE POLICY "profiles_owner_access" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- 2. Resumes: Users can view and manage only their own CVs
CREATE POLICY "resumes_owner_access" ON public.resumes
    FOR ALL USING (auth.uid() = user_id);

-- 3. Resume Versions: Users can view and manage only their own versions
CREATE POLICY "resume_versions_owner_access" ON public.resume_versions
    FOR ALL USING (auth.uid() = user_id);

-- 4. Applications: Users can view and manage only their own applications
CREATE POLICY "applications_owner_access" ON public.applications
    FOR ALL USING (auth.uid() = user_id);

-- 5. Job Matches: Users can view only their own match scores
CREATE POLICY "job_matches_owner_access" ON public.job_matches
    FOR ALL USING (auth.uid() = user_id);

-- 6. Cover Letters: Users can manage only their own cover letters
CREATE POLICY "cover_letters_owner_access" ON public.cover_letters
    FOR ALL USING (auth.uid() = user_id);

-- 7. Interviews: Users can manage only their own interview notes
CREATE POLICY "interviews_owner_access" ON public.interviews
    FOR ALL USING (auth.uid() = user_id);

-- 8. Audit Logs: Users can view only their own audit logs
CREATE POLICY "audit_logs_owner_access" ON public.audit_logs
    FOR ALL USING (auth.uid() = user_id);

-- 9. Jobs: Publicly searchable catalog (Read-only for all authenticated users)
CREATE POLICY "jobs_authenticated_read" ON public.jobs
    FOR SELECT TO authenticated USING (true);

-- ==============================================================================
-- SUPABASE STORAGE BUCKET & RLS POLICIES
-- ==============================================================================
-- Note: The following blocks configure the 'career-documents' storage bucket
--       and isolate user document folders so User B cannot view User A's files.

DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('career-documents', 'career-documents', false)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN undefined_table THEN
        -- Storage extension not yet initialized on target instance
        NULL;
END $$;

-- Storage object policies for authenticated users
DO $$
BEGIN
    -- Select own documents
    CREATE POLICY "career_docs_select_own" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'career-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

    -- Insert own documents
    CREATE POLICY "career_docs_insert_own" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'career-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

    -- Update own documents
    CREATE POLICY "career_docs_update_own" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = 'career-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

    -- Delete own documents
    CREATE POLICY "career_docs_delete_own" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'career-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
    WHEN undefined_table THEN
        NULL;
END $$;
