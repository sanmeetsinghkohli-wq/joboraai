'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { ButtonLink } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export function LandingNav() {
  const { authStatus } = useAppData();
  const signedIn = authStatus === 'authenticated';

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Jobora home">
          <Logo />
        </Link>
        <nav aria-label="Page sections" className="hidden items-center gap-7 text-sm font-medium text-ink-muted md:flex">
          <a href="#features" className="hover:text-plum">
            Features
          </a>
          <a href="#how" className="hover:text-plum">
            How it works
          </a>
          <a href="#principles" className="hover:text-plum">
            Our approach
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <ButtonLink href="/dashboard" size="sm">
              Open workspace
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/auth?tab=login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log in
              </ButtonLink>
              <ButtonLink href="/auth?tab=signup" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
