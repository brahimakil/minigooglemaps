'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/context/theme-context';
import { useAuth } from '@/lib/context/auth-context';
import { signOut } from '@/lib/firebase/auth';
import { 
  SunIcon, 
  MoonIcon, 
  MenuIcon, 
  XIcon, 
  LogOutIcon, 
  UserIcon, 
  MapIcon, 
  CalendarIcon, 
  BarChartIcon, 
  ActivityIcon, 
  HomeIcon, 
  LayersIcon, 
  TagIcon,
  UsersIcon
} from '@/components/icons';

// Add a tour guide icon
function TourGuideIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
      <path d="M14 18h5a2 2 0 002-2V8a2 2 0 00-2-2h-5" />
    </svg>
  );
}

// Add a track icon
function TrackIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 9l-6-6-6 6" />
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  children?: { name: string; href: string; icon: any }[];
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { 
      name: 'Activities', 
      icon: ActivityIcon,
      children: [
        { name: 'Activities', href: '/dashboard/activities', icon: ActivityIcon },
        { name: 'Activity Types', href: '/dashboard/activity-types', icon: TagIcon },
      ]
    },
    { 
      name: 'Locations', 
      icon: MapIcon,
      children: [
        { name: 'Locations', href: '/dashboard/locations', icon: MapIcon },
        { name: 'Location Categories', href: '/dashboard/location-categories', icon: LayersIcon },
        { name: 'Tracks', href: '/dashboard/tracks', icon: TrackIcon },
      ]
    },
    // { 
    //   name: 'Tour Guides', 
    //   icon: TourGuideIcon,
    //   children: [
    //     { name: 'Tour Guides', href: '/dashboard/tour-guides', icon: TourGuideIcon },
    //     { name: 'Guide Requests', href: '/dashboard/tour-guide-requests', icon: TourGuideIcon },
    //   ]
    // },
    { 
      name: 'Statistics', 
      icon: BarChartIcon,
      children: [
        { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarIcon },
        { name: 'Statistics', href: '/dashboard/statistics', icon: BarChartIcon },
      ]
    },
    // { 
    //   name: 'Users', 
    //   icon: UsersIcon, 
    //   children: [
    //     { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
    //     { name: 'User Activities', href: '/dashboard/user-activities', icon: ActivityIcon },
    //   ]
    // },
  ];

  // Automatically open menus if a child is active
  useEffect(() => {
    const newOpenMenus = [...openMenus];
    for (const item of navigation) {
      if (item.children) {
        const hasActiveChild = item.children.some(child => pathname === child.href || pathname?.startsWith(child.href + '/'));
        if (hasActiveChild && !newOpenMenus.includes(item.name)) {
          newOpenMenus.push(item.name);
        }
      }
    }
    if (newOpenMenus.length !== openMenus.length) {
      setOpenMenus(newOpenMenus);
    }
  }, [pathname]);

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                Admin Dashboard
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <button
              type="button"
              className="rounded-full bg-white dark:bg-gray-800 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
            
            <div className="relative">
              <button
                type="button"
                className="flex rounded-full bg-white dark:bg-gray-800 text-sm focus:outline-none"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                  <UserIcon className="h-5 w-5" />
                </div>
              </button>
              
              {profileMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <LogOutIcon className="mr-2 h-5 w-5" />
                      Sign out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XIcon className="block h-6 w-6" />
              ) : (
                <MenuIcon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pt-2 pb-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              
              if (item.children) {
                const isOpen = openMenus.includes(item.name);
                const isActiveParent = item.children.some(child => pathname === child.href || pathname?.startsWith(child.href + '/'));
                
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full group flex items-center justify-between pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                        isActiveParent
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100'
                          : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </div>
                      {isOpen ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {isOpen && (
                      <div className="space-y-1 pl-8">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`block pl-3 pr-4 py-2 border-l-4 text-sm font-medium ${
                                isChildActive
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100'
                                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={`${
                    pathname === item.href
                      ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-700 dark:text-indigo-100'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                  <UserIcon className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                  {user?.email || 'Admin User'}
                </div>
              </div>
              <button
                type="button"
                className="ml-auto flex-shrink-0 rounded-full bg-white dark:bg-gray-800 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <div className="flex items-center">
                  <LogOutIcon className="mr-3 h-5 w-5" />
                  Sign out
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 