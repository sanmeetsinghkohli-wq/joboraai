import { redirect } from 'next/navigation';

/** Preparing an application now happens from the job detail. */
export default function Page() {
  redirect('/jobs');
}
