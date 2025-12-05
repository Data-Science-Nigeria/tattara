'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { programControllerGetProgramsOptions } from '@/client/@tanstack/react-query.gen';

interface ApiResponse {
  data?: {
    programs?: Array<{ id: string }>;
  };
}

export default function ProgramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const { data: programsData, isLoading } = useQuery({
    ...programControllerGetProgramsOptions({
      query: { page: 1, limit: 1000000 },
    }),
  });

  const programs = useMemo(
    () => (programsData as ApiResponse)?.data?.programs || [],
    [programsData]
  );
  const programExists = programs.find((p) => p.id === programId);

  useEffect(() => {
    if (!programId || programId === 'undefined' || programId === 'null') {
      router.push('/admin/dashboard');
      return;
    }

    if (!isLoading && programs.length > 0 && !programExists) {
      router.push('/admin/dashboard');
    }
  }, [programId, router, isLoading, programs, programExists]);

  if (!programId || programId === 'undefined' || programId === 'null') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  if (!programExists) {
    return null;
  }

  return <>{children}</>;
}
