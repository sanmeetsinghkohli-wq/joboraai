/** The single list of application stages used by every page and the API. */
export const APPLICATION_STATUSES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Older records were saved with free-text statuses ("Sent Today", "screen",
 * "Interviewing"). Map anything we receive onto the five real stages.
 */
export function normalizeStatus(raw: string | undefined | null): ApplicationStatus {
  const s = String(raw || '').toLowerCase();
  if (s.includes('offer')) return 'Offer';
  if (s.includes('reject') || s.includes('withdraw') || s.includes('closed')) return 'Rejected';
  if (s.includes('interview') || s.includes('screen') || s.includes('assessment')) return 'Interview';
  if (s.includes('saved') || s.includes('discover') || s.includes('prepar') || s.includes('ready')) return 'Saved';
  return 'Applied';
}

export const STATUS_TONE: Record<ApplicationStatus, 'neutral' | 'plum' | 'coral' | 'success' | 'muted'> = {
  Saved: 'neutral',
  Applied: 'plum',
  Interview: 'coral',
  Offer: 'success',
  Rejected: 'muted',
};
