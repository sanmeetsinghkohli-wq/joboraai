import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export const metadata = { title: 'Reset password' };

/**
 * Password reset needs an email service, which is not set up yet.
 * Say so plainly rather than showing a form that cannot work.
 */
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory px-4 py-6 sm:px-10">
      <Link href="/" aria-label="Jobora home" className="self-start">
        <Logo />
      </Link>
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-coral-50 text-coral-700">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-serif text-3xl text-plum">Reset your password</h1>
        <p className="mt-3 text-ink-muted">
          Resetting a password by email is not available yet. If you cannot remember your password, create a new account
          with a different email address for now.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <ButtonLink href="/auth?tab=login">Back to log in</ButtonLink>
          <ButtonLink href="/auth?tab=signup" variant="secondary">
            Create an account
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
