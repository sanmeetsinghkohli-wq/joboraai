-- Jobora relational schema for the app's own authentication.
--
-- Why not 0001/0002: those tables reference auth.users and check auth.uid(),
-- i.e. Supabase Auth. Jobora signs users in itself (bcrypt + its own JWT) and
-- uses text ids such as "user-1732...-k3j9x", so its tables key off app_users.
--
-- Access model: the Next.js server is the only client. It uses the secret key,
-- which bypasses RLS. RLS is enabled with NO policies, so the publishable key
-- (shipped to browsers) can read or write nothing.
--
-- NOT YET APPLIED. 0003 (jobora_kv) is what the code uses today; this is the
-- target design to migrate to. See docs/database-design.md.

CREATE EXTENSION IF NOT EXISTS citext;

-- ── Accounts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_users (
  id                  text PRIMARY KEY,
  email               citext NOT NULL UNIQUE,
  password_hash       text   NOT NULL,
  first_name          text   NOT NULL,
  last_name           text   NOT NULL DEFAULT '',
  email_verified      boolean NOT NULL DEFAULT false,
  email_verified_at   timestamptz,
  verification_token  text UNIQUE,
  reset_token         text UNIQUE,
  reset_token_expires timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

-- ── Profile (1:1 with a user) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_profiles (
  user_id            text PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
  full_name          text NOT NULL DEFAULT '',
  phone              text NOT NULL DEFAULT '',
  location           text NOT NULL DEFAULT '',
  target_role        text NOT NULL DEFAULT '',
  summary            text NOT NULL DEFAULT '',
  experience         text NOT NULL DEFAULT '',
  university         text NOT NULL DEFAULT '',
  degree             text NOT NULL DEFAULT '',
  gpa                text NOT NULL DEFAULT '',
  graduation_year    text NOT NULL DEFAULT '',
  github             text NOT NULL DEFAULT '',
  linkedin           text NOT NULL DEFAULT '',
  skills             text[] NOT NULL DEFAULT '{}',
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ── Applications tracker ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_applications (
  id               text PRIMARY KEY,
  user_id          text NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  job_id           text NOT NULL,
  title            text NOT NULL,
  company          text NOT NULL,
  location         text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'Saved'
                   CHECK (status IN ('Saved', 'Applied', 'Interview', 'Offer', 'Rejected')),
  next_action      text NOT NULL DEFAULT '',
  recruiter_name   text NOT NULL DEFAULT '',
  recruiter_email  text NOT NULL DEFAULT '',
  applied_at       timestamptz,
  timeline         jsonb NOT NULL DEFAULT '[]',   -- append-only event list, read with the row
  version          integer NOT NULL DEFAULT 1,    -- optimistic locking for board drags
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);
CREATE INDEX IF NOT EXISTS app_applications_user_status_idx
  ON public.app_applications (user_id, status, updated_at DESC);

-- ── Saved jobs (a snapshot, because live listings disappear) ───────────────
CREATE TABLE IF NOT EXISTS public.app_saved_jobs (
  user_id    text NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  job_id     text NOT NULL,
  job        jsonb NOT NULL,
  saved_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);

-- ── Roles a user adds by hand (private to that user) ───────────────────────
CREATE TABLE IF NOT EXISTS public.app_user_jobs (
  id         text PRIMARY KEY,
  user_id    text NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  job        jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_user_jobs_user_idx ON public.app_user_jobs (user_id, created_at DESC);

-- ── Uploaded CVs (file bytes live in Storage; this is the metadata) ────────
CREATE TABLE IF NOT EXISTS public.app_resumes (
  id            text PRIMARY KEY,
  user_id       text NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  file_name     text NOT NULL,
  mime_type     text NOT NULL,
  size_bytes    integer NOT NULL CHECK (size_bytes > 0),
  storage_path  text,
  extracted     jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_resumes_user_idx ON public.app_resumes (user_id, created_at DESC);

-- ── Keep updated_at honest ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['app_users', 'app_profiles', 'app_applications'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_touch ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- ── Lock down: server-only access ──────────────────────────────────────────
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['app_users', 'app_profiles', 'app_applications',
                           'app_saved_jobs', 'app_user_jobs', 'app_resumes'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;
