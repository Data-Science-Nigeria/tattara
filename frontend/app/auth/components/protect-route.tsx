'use client';

import React, { useLayoutEffect, useState } from 'react';
import { useAuthStore } from '@/app/store/use-auth-store';

interface ProtectRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

export const ProtectRoute = ({
  children,
  requiredRole = 'admin',
}: ProtectRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { auth, clearAuth } = useAuthStore();

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      const checkAuth = () => {
        if (!auth.token) {
          clearAuth();
          window.location.href = '/auth/login';
          return;
        }

        if (!auth.roles || auth.roles.length === 0) {
          return;
        }

        const hasAdminRole = auth.roles.some(
          (role: string | { name: string }) =>
            role === 'admin' ||
            (typeof role === 'object' && role.name === 'admin')
        );

        if (requiredRole === 'admin') {
          if (hasAdminRole) {
            setIsAuthenticated(true);
          } else {
            window.location.href = '/user/overview';
          }
        } else {
          if (hasAdminRole) {
            window.location.href = '/admin/dashboard';
          } else {
            setIsAuthenticated(true);
          }
        }
      };

      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [auth, clearAuth, requiredRole]);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};
