import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RealReels Admin',
  description: 'Admin dashboard for RealReels',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
