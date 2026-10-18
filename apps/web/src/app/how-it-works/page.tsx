'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HowItWorksRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/#how-it-works');
  }, [router]);
  return null;
}
