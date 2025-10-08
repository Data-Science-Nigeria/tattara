import React from 'react';
import Sidebar from './components/sidebar';
import { ProtectUserRoute } from '../auth/components/protect-user-route';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectUserRoute>
      <div>
        <Sidebar />
        <main className="relative min-h-screen bg-[#F5F5FF] lg:ml-[280px]">
          <div className="lg:pt-auto p-4 pt-20 lg:p-8">{children}</div>
        </main>
      </div>
    </ProtectUserRoute>
  );
}
