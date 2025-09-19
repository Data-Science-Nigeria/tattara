'use client';
import React, { useState } from 'react';
import Sidebar from './components/sidebar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="relative min-h-screen bg-[#F5F5FF] lg:ml-[280px]">
        <div className="lg:pt-auto p-4 pt-20 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
