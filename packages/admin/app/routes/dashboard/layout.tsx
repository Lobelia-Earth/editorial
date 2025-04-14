import AppSidebar from "@/components/appSidebar";
import AuthGuard from "@/components/AuthGuard";
import Breadcrumbs from "@/components/breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
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

          <Outlet />
        </main>
      </SidebarProvider>
    </AuthGuard>
  );
}
