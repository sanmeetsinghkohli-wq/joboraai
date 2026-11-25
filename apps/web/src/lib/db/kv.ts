/**
 * Durable key-value persistence on Supabase (table public.jobora_kv).
 *
 * The app's stores stay as in-memory Maps for fast synchronous reads, but each
 * one is a PersistentMap: writes go through to Supabase, and request handlers
 * call `load()` before reading so a fresh serverless instance sees the data a
 * different instance wrote. Without Supabase credentials it behaves exactly
 * like a plain Map (local development).
 *
 * Uses the server-only secret key; it must never be exposed to the browser.
 */

const URL_ = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const kvEnabled = Boolean(URL_ && KEY);

const headers = () => ({
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
});

const pending = new Set<Promise<unknown>>();

function track<T>(p: Promise<T>): Promise<T> {
  pending.add(p);
  p.finally(() => pending.delete(p)).catch(() => {});
  return p;
}

/** Wait for every write started so far. Call before a handler returns. */
export async function flushPersistence(): Promise<void> {
  while (pending.size) await Promise.allSettled([...pending]);
}

const quote = (k: string) => `"${k.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

async function kvFetch(query: string): Promise<Array<{ key: string; value: unknown }>> {
  const res = await fetch(`${URL_}/rest/v1/jobora_kv?select=key,value&${query}`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  return res.json();
}

/** One cheap read to confirm the database answers. Used by /api/status for uptime checks. */
export async function kvPing(): Promise<'ok' | 'unavailable' | 'not_configured'> {
  if (!kvEnabled) return 'not_configured';
  try {
    await kvFetch('limit=1');
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

async function kvUpsert(key: string, value: unknown): Promise<void> {
  const res = await fetch(`${URL_}/rest/v1/jobora_kv?on_conflict=key`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Supabase write failed (${res.status}): ${await res.text()}`);
}

async function kvDelete(key: string): Promise<void> {
  const res = await fetch(`${URL_}/rest/v1/jobora_kv?key=eq.${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase delete failed (${res.status})`);
}

export class PersistentMap<V> extends Map<string, V> {
  constructor(private readonly ns: string) {
    super();
  }

  private k(key: string) {
    return `${this.ns}:${key}`;
  }

  override set(key: string, value: V): this {
    super.set(key, value);
    if (kvEnabled && this.ns) {
      track(kvUpsert(this.k(key), value)).catch((e) => console.error('[persistence]', e.message));
    }
    return this;
  }

  override delete(key: string): boolean {
    const had = super.delete(key);
    if (kvEnabled) track(kvDelete(this.k(key))).catch((e) => console.error('[persistence]', e.message));
    return had;
  }

  /** Pull the latest copies of these keys from Supabase into the cache. */
  async load(...keys: string[]): Promise<void> {
    const wanted = keys.filter(Boolean);
    if (!kvEnabled || wanted.length === 0) return;
    const rows = await kvFetch(`key=in.(${wanted.map((k) => encodeURIComponent(quote(this.k(k)))).join(',')})`);
    for (const row of rows) super.set(row.key.slice(this.ns.length + 1), row.value as V);
  }

  /** Pull every document in this namespace whose JSON `field` equals `value`. */
  async loadWhere(field: string, value: string): Promise<void> {
    if (!kvEnabled || !value) return;
    const rows = await kvFetch(
      `key=like.${encodeURIComponent(`${this.ns}:*`)}&value->>${encodeURIComponent(field)}=eq.${encodeURIComponent(value)}`
    );
    for (const row of rows) super.set(row.key.slice(this.ns.length + 1), row.value as V);
  }
}
