
'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function TermsAndConditionsPage() {
  useEffect(() => {
    redirect('/auth/login');
  }, []);

  return null;
}
