import { redirect } from 'next/navigation';

/** Old URL for settings. */
export default function Page() {
  redirect('/settings');
}
