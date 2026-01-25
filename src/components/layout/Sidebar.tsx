'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  // UserIcon, 
  ActivityIcon,
  TagIcon,
  MapIcon,
  LayersIcon,
  CalendarIcon,
  BarChartIcon,
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

function ChevronDownIcon({ className }: Readonly<{ className?: string }>) {
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

function ChevronRightIcon({ className }: Readonly<{ className?: string }>) {
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

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

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
    {
      name: 'Tour Guides',
      icon: TourGuideIcon,
      children: [
        { name: 'Tour Guides', href: '/dashboard/tour-guides', icon: TourGuideIcon },
        { name: 'Guide Requests', href: '/dashboard/tour-guide-requests', icon: TourGuideIcon },
      ]
    },
    {
      name: 'Statistics',
      icon: BarChartIcon,
      children: [
        { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarIcon },
        { name: 'Statistics', href: '/dashboard/statistics', icon: BarChartIcon },
      ]
    },
    {
      name: 'Users',
      icon: UsersIcon,
      children: [
        { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
        { name: 'User Activities', href: '/dashboard/user-activities', icon: ActivityIcon },
      ]
    },
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

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-xl font-semibold dark:text-white">AdminDash</span>
            </Link>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              if (item.children) {
                const isOpen = openMenus.includes(item.name);
                const isActiveParent = item.children.some(child => pathname === child.href || pathname?.startsWith(child.href + '/'));

                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md ${isActiveParent
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-200'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                    >
                      <div className="flex items-center">
                        <Icon
                          className={`mr-3 flex-shrink-0 h-5 w-5 ${isActiveParent
                              ? 'text-indigo-500 dark:text-indigo-300'
                              : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                            }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </div>
                      {isOpen ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="space-y-1 pl-10">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;

                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isChildActive
                                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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

              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive
                        ? 'text-indigo-500 dark:text-indigo-300'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                      }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}