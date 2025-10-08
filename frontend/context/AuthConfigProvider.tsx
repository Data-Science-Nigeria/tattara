'use client';

import { client } from '@/client/client.gen';
import { useAuthStore } from '@/app/store/use-auth-store';
import { useEffect } from 'react';

export const AuthConfigProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { auth } = useAuthStore();

  useEffect(() => {
    client.setConfig({
      baseUrl: process.env.NEXT_PUBLIC_API_URL,
      credentials: 'include',
      headers: {
        ...(auth.token && { Authorization: `Bearer ${auth.token}` }),
      },
    });
  }, [auth.token]);

  return <>{children}</>;
};
