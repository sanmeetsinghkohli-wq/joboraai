/** The single list of application stages used by every page and the API. */
export const APPLICATION_STATUSES = [
  'Interested',
  'Preparing',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Stages after the application has actually been sent. */
export const SENT_STATUSES: ApplicationStatus[] = ['Applied', 'Assessment', 'Interview', 'Offer', 'Accepted', 'Rejected'];

/** Stages that count as reaching an interview or better. */
export const INTERVIEW_OR_BETTER: ApplicationStatus[] = ['Interview', 'Offer', 'Accepted'];

/** Short helper text shown with each stage. */
export const STATUS_HINT: Record<ApplicationStatus, string> = {
  Interested: 'Saved to look at',
  Preparing: 'Tailoring CV and letter',
  Applied: 'Application sent',
  Assessment: 'Test, task or screening',
  Interview: 'Interviewing',
  Offer: 'Offer received',
  Accepted: 'Offer accepted',
  Rejected: 'Closed',
};

/**
 * Older records used other words ("Saved", "Sent Today", "screen",
 * "Interviewing"). Map anything we receive onto the real stages.
 */
export function normalizeStatus(raw: string | undefined | null): ApplicationStatus {
  const s = String(raw || '').toLowerCase();
  if (s.includes('accept') || s.includes('hired')) return 'Accepted';
  if (s.includes('offer')) return 'Offer';
  if (s.includes('reject') || s.includes('withdraw') || s.includes('closed') || s.includes('declin')) return 'Rejected';
  if (s.includes('interview')) return 'Interview';
  if (s.includes('assess') || s.includes('screen') || s.includes('test') || s.includes('task')) return 'Assessment';
  if (s.includes('prepar') || s.includes('ready') || s.includes('draft')) return 'Preparing';
  if (s.includes('interest') || s.includes('saved') || s.includes('discover') || s.includes('wish')) return 'Interested';
  return 'Applied';
}

export const STATUS_TONE: Record<ApplicationStatus, 'neutral' | 'plum' | 'coral' | 'success' | 'muted'> = {
  Interested: 'neutral',
  Preparing: 'neutral',
  Applied: 'plum',
  Assessment: 'coral',
  Interview: 'coral',
  Offer: 'success',
  Accepted: 'success',
  Rejected: 'muted',
};
