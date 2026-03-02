'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

// This component wraps pages that require authentication.
export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // We only want to enforce authentication in the production environment.
  // In development, we can bypass it to allow easier access to pages.
  const isProduction = process.env.NODE_ENV === 'production';

  useEffect(() => {
    // If we're in production, loading is finished, and there's no user, redirect to login.
    // We allow access to the /login page itself to avoid a redirect loop.
    if (isProduction && !loading && !user && pathname !== '/login') {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [user, loading, router, pathname, isProduction]);

  // While loading authentication status in production, show a loader.
  if (isProduction && loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading application...</p>
      </div>
    );
  }

  // If we are in production and there's no user (and not on login page), don't render children
  // to prevent a flash of content before the redirect happens.
  if (isProduction && !user && pathname !== '/login') {
    return null;
  }
  
  // In development, or if the user is logged in (in production), show the content.
  return <>{children}</>;
}
