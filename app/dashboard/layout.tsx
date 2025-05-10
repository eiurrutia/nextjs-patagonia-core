'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import SideNav from '@/app/ui/dashboard/sidenav';
import HoverTrigger from '@/app/ui/dashboard/hover-trigger';
 
export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  
  // Check if we're on the home page
  const isHomePage = pathname === '/home' || pathname === '/dashboard';
  
  // Reset sidebar state when navigating to home page
  useEffect(() => {
    if (isHomePage) {
      setShowSidebar(false);
      setSidebarPinned(false);
    }
  }, [isHomePage]);

  // Don't show sidebar or trigger on home page
  if (isHomePage) {
    return <div className="flex-grow p-4 md:p-0">{children}</div>;
  }
  
  return (
    <div className="relative min-h-screen">
      {/* Side navigation - visible when hovering or pinned */}
      <div 
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 transform ${
          showSidebar || sidebarPinned ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseLeave={() => !sidebarPinned && setShowSidebar(false)}
      >
        <div className="w-64 h-full">
          <SideNav onPin={() => setSidebarPinned(!sidebarPinned)} isPinned={sidebarPinned} />
        </div>
      </div>
      
      {/* Hover trigger area */}
      {!sidebarPinned && (
        <HoverTrigger onHover={() => setShowSidebar(true)} />
      )}
      
      {/* Main content - shifts right when sidebar appears */}
      <div 
        className={`w-full transition-all duration-300 ${
          (showSidebar || sidebarPinned) ? 'md:pl-64' : 'pl-0'
        }`}
      >
        <div className="p-4 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}