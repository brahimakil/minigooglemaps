'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UserIcon, 
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

export default function Sidebar() {
  const pathname = usePathname();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/dashboard/users', icon: UserIcon },
    { name: 'User Activities', href: '/dashboard/user-activities', icon: UsersIcon },
    { name: 'Activities', href: '/dashboard/activities', icon: ActivityIcon },
    { name: 'Activity Types', href: '/dashboard/activity-types', icon: TagIcon },
    { name: 'Locations', href: '/dashboard/locations', icon: MapIcon },
    { name: 'Location Categories', href: '/dashboard/location-categories', icon: LayersIcon },
    { name: 'Tour Guides', href: '/dashboard/tour-guides', icon: TourGuideIcon },
    { name: 'Guide Requests', href: '/dashboard/tour-guide-requests', icon: TourGuideIcon },
    { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarIcon },
    { name: 'Statistics', href: '/dashboard/statistics', icon: BarChartIcon },
  ];

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
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive
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