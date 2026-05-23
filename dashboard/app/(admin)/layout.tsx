'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Sidebar} from '@/components/Sidebar';
import {getToken} from '@/lib/api';

export default function AdminLayout({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return null;
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
}
