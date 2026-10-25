# Jobora AI — Supabase Database Integration & Setup Guide

This guide documents the architecture, environment variables, migrations, and storage configuration required to connect Supabase / PostgreSQL to Jobora AI.

> [!NOTE]
> **Status:** Pending Database Configuration.  
> Jobora AI currently runs locally using in-memory session stores and browser `localStorage` fallbacks. When you provision your Supabase project and provide the credentials below, the database integration layer connects seamlessly.

---

## 1. Required Supabase Services

To support full multi-tenant durability and pgvector semantic matching, your Supabase project needs:
1. **PostgreSQL 15+ Database** with `pgvector` enabled.
2. **Supabase Auth** (Email/Password + JWT tokens).
3. **Supabase Storage** (Private bucket: `career-documents`).
4. **Row-Level Security (RLS)** (Ensures User B cannot read User A's CVs, applications, or notes).

---

## 2. Environment Variables Configuration

Add the following variables to your local `.env.local` (which is git-ignored):

```env
# ==============================================================================
# SUPABASE / DATABASE CREDENTIALS (PENDING USER CONFIGURATION)
# ==============================================================================
# Find these in Supabase Dashboard -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Connection String (Direct PostgreSQL / pgvector connection)
# Find in Supabase Dashboard -> Project Settings -> Database -> Connection String (URI)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.<your-project-ref>.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.<your-project-ref>.supabase.co:5432/postgres

# Storage Bucket Name
SUPABASE_STORAGE_BUCKET=career-documents
```

---

## 3. Applying Migrations

You can apply the initial schema migration using either the **Supabase Dashboard SQL Editor** or the **Supabase CLI**:

### Method A: Supabase Dashboard (Recommended for Quick Setup)
1. Navigate to your Supabase Project Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab in the left sidebar.
3. Click **New Query**.
4. Copy the entire contents of [`supabase/migrations/0001_initial_schema.sql`](file:///c:/Users/Lenovo/OneDrive/Desktop/jobora/supabase/migrations/0001_initial_schema.sql).
5. Paste into the query editor and click **Run**.
6. Verify that tables `profiles`, `resumes`, `resume_versions`, `jobs`, `job_matches`, `applications`, `cover_letters`, `interviews`, and `audit_logs` are created with RLS enabled.

### Method B: Supabase CLI
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your local repository to your remote project
supabase link --project-ref <your-project-ref>

# Push the migration
supabase db push
```

---

## 4. Supabase Storage Bucket Setup

1. In Supabase Dashboard, navigate to **Storage**.
2. Click **New Bucket**.
3. Name: `career-documents`.
4. Public bucket: **Disabled** (Private).
5. Add Storage RLS Policy:
   - **Allowed operations:** `SELECT`, `INSERT`, `UPDATE`, `DELETE`
   - **Target roles:** `authenticated`
   - **Policy definition:** `(bucket_id = 'career-documents' AND (storage.foldername(name))[1] = auth.uid()::text)`
   - This ensures users can only upload and read files within their own user folder: `career-documents/<userId>/...`.

---

## 5. Persistence Mode Traceability

| Feature / Domain | Local / Unconfigured Mode (Today) | Connected Supabase Mode (When Configured) |
| :--- | :--- | :--- |
| **User Authentication** | In-Memory `__jobora_users` + HttpOnly JWT | Supabase Auth (`auth.users`) + Row-Level Security |
| **Candidate Profile** | In-Memory `__jobora_profiles` + `localStorage` | PostgreSQL `public.profiles` |
| **Master & Tailored CVs** | In-Memory `__jobora_resumes` + Local FS | PostgreSQL `public.resumes` + Supabase Storage |
| **Job Discovery & Matching** | Live Provider APIs + In-Memory 3m Cache | PostgreSQL `public.jobs` + `pgvector` HNSW index |
| **Application Tracker** | In-Memory `__jobora_applications` + CSV export | PostgreSQL `public.applications` |
| **Cover Letters** | Browser `localStorage` (`jobora_cover_letter_drafts`)| PostgreSQL `public.cover_letters` |
| **Interview Prep Notes** | In-Memory state + Practice History | PostgreSQL `public.interviews` |
| **Audit Logs** | Client Activity Stream + Console telemetry | PostgreSQL `public.audit_logs` |
