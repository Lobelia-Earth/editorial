import AuthListener from '@/components/AuthListener';
import StoreProvider from '@/components/providers/StoreProvider';
import { inter } from '@/lib/fonts';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Editorial Admin',
    template: '%s - Editorial Admin',
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-screen">
      <body
        className={`${inter.variable} h-full min-h-screen bg-background font-sans antialiased`}
      >
        <StoreProvider>
          <AuthListener />

          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
