'use client';
import React, { useState } from 'react';
import Sidebar from './components/sidebar';
import { ProtectUserRoute } from '../auth/components/protect-user-route';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectUserRoute>
      <div>
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main
          className={`relative min-h-screen bg-[#F5F5FF] transition-all duration-300 ${
            isSidebarOpen ? 'lg:ml-[280px]' : 'ml-16 lg:ml-[280px]'
          }`}
        >
          <div className="lg:pt-auto p-4 pt-20 lg:p-8">{children}</div>
        </main>
      </div>
    </ProtectUserRoute>
  );
}
