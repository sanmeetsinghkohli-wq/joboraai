'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmailRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth?tab=verify');
  }, [router]);
  return null;
}
