'use client';

import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {adminLogout} from '@/lib/auth';

const LINKS = [
  {href: '/', label: 'Overview'},
  {href: '/users', label: 'Users & Agents'},
  {href: '/properties', label: 'Properties'},
  {href: '/reels', label: 'Reels'},
  {href: '/boosts', label: 'Boosts'},
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    adminLogout();
    router.push('/login');
  }

  return (
    <aside className="sidebar">
      <div className="brand">RealReels</div>
      {LINKS.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link ${pathname === l.href ? 'active' : ''}`}>
          {l.label}
        </Link>
      ))}
      <div style={{flex: 1}} />
      <button className="btn outline" onClick={logout}>
        Logout
      </button>
    </aside>
  );
}
