import AppSidebar from '@/components/appSidebar';
import Breadcrumbs from '@/components/breadcrumbs';
import StoreProvider from '@/components/providers/StoreProvider';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { inter } from '@/lib/fonts';
import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="min-h-screen">
      <body
        className={`${inter.variable} h-full min-h-screen bg-background font-sans antialiased`}
      >
        <StoreProvider>
          <SidebarProvider className="flex h-full">
            <AppSidebar />

            <main className="flex flex-col flex-1 h-full w-0">
              <header className="flex sticky bg-white z-40 top-0 h-14 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-3">
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="h-4" />
                  <Breadcrumbs />
                </div>
              </header>

              {children}
            </main>
          </SidebarProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
