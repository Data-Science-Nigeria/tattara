'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { client } from '@/client/client.gen';
import { AuthConfigProvider } from './AuthConfigProvider';

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: 1000,
        staleTime: 90000,
      },
    },
  });

  // Initial client configuration
  client.setConfig({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: 'include',
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthConfigProvider>{children}</AuthConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
