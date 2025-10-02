'use client';
import React from 'react';
import { sidebarItems } from './sidebar-items';
import { SidebarItem } from './sidebar-item';
import { LogOut, PanelLeft, PanelRight } from 'lucide-react';
import Logo from '../../components/logo';
//import { useLogout } from '../../hooks/use-logout';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar = ({ isOpen = false, onToggle = () => {} }: SidebarProps) => {
  //const { handleLogout } = useLogout();
  
  const handleItemSelect = () => {
    // Auto-close sidebar on md screens and below (1024px)
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white z-40 overflow-y-auto border-r border-gray-100
          transition-all duration-300 ease-in-out flex flex-col
          ${
            isOpen
              ? "w-full xs:w-64 sm:w-72 md:w-[280px] lg:w-[280px]"
              : "w-16 lg:w-[280px]"
          }
        `}
      >
        {/* Header */}
        <div className="flex flex-col items-start px-4 md:px-6 pt-6">
          <div className={`flex items-center w-full ${
            isOpen ? 'justify-between' : 'justify-center lg:justify-between'
          }`}>
            <div className={`${isOpen ? 'block' : 'hidden lg:block'}`}>
              <Logo className="h-12 md:h-16 w-auto" />
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Toggle clicked, isOpen:', isOpen);
                if (onToggle) onToggle();
              }}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-500 lg:hidden relative z-50"
            >
              {isOpen ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelRight className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <div className={`mt-6 md:mt-10 ${isOpen ? 'block' : 'hidden lg:block'}`}>
            <h2 className="text-lg font-semibold">Abeni Coker</h2>
            <p className="text-sm text-[#707180]">No: 123445</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className={`mt-6 md:mt-6 space-y-3 flex-1 ${
          isOpen ? "px-4 md:px-0" : "flex flex-col items-center px-2 lg:px-4 lg:block lg:space-y-3"
        }`}>
          {sidebarItems.map((item) => (
            <div key={item.href} onClick={handleItemSelect}>
              <div className={isOpen ? 'block' : 'hidden lg:block'}>
                <SidebarItem
                  name={item.name}
                  icon={item.icon}
                  href={item.href}
                />
              </div>
              <div className={isOpen ? 'hidden' : 'block lg:hidden'}>
                <button className="p-3 rounded-md hover:bg-gray-100 text-gray-500">
                  <item.icon size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className={`p-4 md:p-6 pb-16 ${
          !isOpen ? "flex justify-center lg:block" : ""
        }`}>
          <div className={isOpen ? 'block' : 'hidden lg:block'}>
            <button 
            //  onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
          <div className={isOpen ? 'hidden' : 'block lg:hidden'}>
            <button 
            //  onClick={handleLogout}
              className="p-3 rounded-md hover:bg-red-50 text-red-500"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;

