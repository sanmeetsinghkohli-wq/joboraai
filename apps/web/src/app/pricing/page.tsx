import { redirect } from 'next/navigation';

/** There is no paid plan. */
export default function Page() {
  redirect('/');
}
