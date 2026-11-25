/** Comma-separated allowlist in ADMIN_EMAILS. Empty means nobody is an admin. */
export function isAdminEmail(email: string | undefined | null, list = process.env.ADMIN_EMAILS || ''): boolean {
  if (!email) return false;
  return list
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase());
}
