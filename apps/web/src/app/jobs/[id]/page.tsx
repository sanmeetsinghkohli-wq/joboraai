'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function JobDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  useEffect(() => {
    const id = params?.id ? String(params.id) : '';
    router.replace(id ? `/jobs?selected=${encodeURIComponent(id)}` : '/jobs');
  }, [router, params]);
  return null;
}
