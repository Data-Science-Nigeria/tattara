import React, { PropsWithChildren, Suspense } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div>
      <Suspense>{children}</Suspense>
    </div>
  );
}
