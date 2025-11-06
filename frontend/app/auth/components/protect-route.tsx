'use client';

import React, { useLayoutEffect, useState } from 'react';
import { useAuthStore } from '@/app/store/use-auth-store';

export const ProtectRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { auth, clearAuth } = useAuthStore();

  useLayoutEffect(() => {
    // Add delay to allow rehydration to complete
    const timer = setTimeout(() => {
      const checkAuth = () => {
        // Check if we have a token and user data
        if (!auth.token) {
          clearAuth();
          window.location.href = '/auth/login';
          return;
        }

        // Wait for roles to load during rehydration
        if (!auth.roles || auth.roles.length === 0) {
          return; // Don't clear auth, just wait
        }

        // Check if user has admin role
        const hasAdminRole = auth.roles.some(
          (role: string | { name: string }) =>
            role === 'admin' ||
            (typeof role === 'object' && role.name === 'admin')
        );

        if (hasAdminRole) {
          setIsAuthenticated(true);
        } else {
          window.location.href = '/user/overview';
        }
      };

      checkAuth();
    }, 100); // Small delay for rehydration

    return () => clearTimeout(timer);
  }, [auth, clearAuth]);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};
