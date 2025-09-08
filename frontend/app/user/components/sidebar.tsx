'use client';
import React from 'react';
import { sidebarItems } from './sidebar-items';
import { SidebarItem } from './sidebar-item';
import { LogOut } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="fixed hidden h-screen w-[280px] bg-white p-4 lg:block">
      <div className="flex flex-col items-start px-6 pt-6">
        <img src={'/logo.svg'} alt="logo" className="h-16 w-auto" />
        <div className="mt-12">
          <h2 className="text-lg font-semibold">Abeni Coker</h2>
          <p className="text-sm text-[#707180]">No: 123445</p>
        </div>
      </div>
      <div className="mt-16 space-y-3">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.href}
            name={item.name}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </div>
      <div className="absolute bottom-28 left-6">
        <button className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50">
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
