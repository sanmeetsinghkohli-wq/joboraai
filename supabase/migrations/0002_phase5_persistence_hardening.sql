-- ==============================================================================
-- JOBORA AI — SUPABASE / POSTGRESQL MIGRATION 0002
-- Phase 5 Persistence Hardening & Saved Jobs Table
-- ==============================================================================

-- 1. SAVED JOBS (CANDIDATE BOOKMARKS)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT DEFAULT 'Remote',
    salary_range TEXT DEFAULT '',
    source TEXT DEFAULT 'Aggregator',
    url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_created ON public.saved_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_updated ON public.applications(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_user_created ON public.resumes(user_id, created_at DESC);

-- 2. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE POLICY "saved_jobs_owner_access" ON public.saved_jobs
        FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
