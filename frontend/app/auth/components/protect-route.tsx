'use client';

import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { authControllerGetProfile } from '@/client/sdk.gen';
import React, { useLayoutEffect, useState } from 'react';
import { useAuthStore } from '@/app/store/use-auth-store';

export const ProtectRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { setAuth } = useAuthStore();

  useLayoutEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authControllerGetProfile();

        if (res.error) {
          const errMsg = getApiErrorMessage(res.error);
          throw new Error(`API error ${errMsg}`);
        }

        const userData = res.data as any;
        
        setAuth({
          id: userData?.id,
          email: userData?.email || '',
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          isEmailVerified: userData?.isEmailVerified,
          createdAt: userData?.createdAt,
          roles: userData?.roles,
          permissions: userData?.permissions,
        });

        // Check if user has admin role
        const hasAdminRole = userData?.roles?.some((role: any) => 
          role.name === 'admin' || role === 'admin'
        );

        if (hasAdminRole) {
          setIsAuthenticated(true);
        } else {
          // Redirect non-admin users to user dashboard
          window.location.href = '/user/overview';
        }
      } catch (error) {
        console.log(error);
        window.location.href = '/auth/login';
      }
    };

    checkAuth();
  }, [setAuth]);

  if (isAuthenticated === null) {
    return null;
  }

  return isAuthenticated ? <>{children}</> : null;
};
