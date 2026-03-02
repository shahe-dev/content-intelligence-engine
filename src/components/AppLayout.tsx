
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/nav/SidebarNav';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Temporarily disable auth requirements for immediate access
  const isProduction = process.env.NODE_ENV === 'production';
  const authRequired = false; // Set to true later when password protection is implemented

  useEffect(() => {
    if (authRequired && isProduction && !loading && !user && pathname !== '/login') {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [user, loading, router, pathname, isProduction, authRequired]);

  // Don't render the main app layout on the login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // While loading auth status in production, show a loader and prevent layout flash
  if (authRequired && isProduction && loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }
  
  // In production, if there's no user and we're not on the login page, return null to prevent content flash before redirect.
  if (authRequired && isProduction && !user && pathname !== '/login') {
    return null;
  }

  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <SidebarInset>
           <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger className="sm:hidden" />
            <div className="flex items-center sm:hidden">
              <Logo showText={false} className="ml-2" />
            </div>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px] h-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}
