import React, { Suspense } from 'react';
import { Screen } from './screen';

export default function Page() {
  return (
    <>
      <Suspense>
        <Screen />
      </Suspense>
    </>
  );
}
