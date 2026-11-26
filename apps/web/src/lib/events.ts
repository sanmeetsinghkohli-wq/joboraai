import { kvSetShared } from './db/kv';

/**
 * First-party product events for the admin funnel. Each event is one row
 * (`event:<name>:<time>:<random>`) holding only the time and an optional
 * short tag, never a user id, email or CV text. Writes are flushed with the
 * request like any other persistence write.
 */
export const EVENTS = ['cv_check', 'cv_check_cta', 'signup', 'ai_tool', 'application_tracked'] as const;
export type EventName = (typeof EVENTS)[number];

export function recordEvent(name: EventName, tag = ''): void {
  const at = new Date().toISOString();
  kvSetShared(`event:${name}:${at}:${Math.random().toString(36).slice(2, 8)}`, {
    at,
    tag: tag.replace(/[^a-z0-9_-]/gi, '').slice(0, 40),
  });
}
