import type { Metadata } from 'next';
import './globals.css';
import { inter } from '@/lib/fonts';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/appSidebar';

export const metadata: Metadata = {
  title: {
    default: 'Editorial Admin',
    template: '%s - Editorial Admin',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <SidebarProvider>
          <AppSidebar />

          <main>
            <SidebarTrigger />
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
