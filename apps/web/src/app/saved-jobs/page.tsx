import { redirect } from 'next/navigation';

/** Saved roles now live on the Jobs page. */
export default function Page() {
  redirect('/jobs?view=saved');
}
