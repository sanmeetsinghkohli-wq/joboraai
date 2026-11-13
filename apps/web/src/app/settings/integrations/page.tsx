import { redirect } from 'next/navigation';

/** Mailbox connection is not built yet; email opens in your own mail app. */
export default function Page() {
  redirect('/settings');
}
