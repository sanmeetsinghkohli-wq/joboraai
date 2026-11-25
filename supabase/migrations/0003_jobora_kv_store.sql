-- Durable store for Jobora's server-side data (accounts, profiles, applications,
-- saved jobs, resumes, private roles). One JSON document per key, e.g.
--   user:<id>, email:<address> -> user id, profile:<id>, apps:<id>, ...
-- Only the server's secret key may touch it: RLS is on and no policies are
-- granted, so the public/publishable key can neither read nor write.

CREATE TABLE IF NOT EXISTS public.jobora_kv (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobora_kv ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.jobora_kv FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS jobora_kv_prefix_idx ON public.jobora_kv (key text_pattern_ops);
