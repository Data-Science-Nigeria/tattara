'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProgramPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  useEffect(() => {
    // Redirect to overview by default
    router.replace(`/admin/programs/${programId}/overview`);
  }, [programId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
    </div>
  );
}
