import { redirect } from 'next/navigation';

/** Email verification is not implemented; send people to the app. */
export default function Page() {
  redirect('/dashboard');
}
