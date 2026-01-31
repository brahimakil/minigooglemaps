'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MapPinIcon, UsersIcon, CalendarIcon, ActivityIcon, TagIcon, MapIcon, UserIcon } from '@/components/icons';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Import the map component dynamically to avoid SSR issues
const MapPreview = dynamic(() => import('@/components/dashboard/MapPreview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <MapPinIcon className="h-8 w-8 text-gray-400" />
    </div>
  ),
});

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    activities: 0,
    locations: 0,
    tracks: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch stats
        const appUsersSnapshot = await getCountFromServer(collection(db, 'appUsers'));
        const activitiesSnapshot = await getCountFromServer(collection(db, 'activities'));
        const locationsSnapshot = await getCountFromServer(collection(db, 'locations'));
        const tracksSnapshot = await getCountFromServer(collection(db, 'tracks'));

        setStats({
          users: appUsersSnapshot.data().count,
          activities: activitiesSnapshot.data().count,
          locations: locationsSnapshot.data().count,
          tracks: tracksSnapshot.data().count,
        });

        // Fetch recent activities
        const recentActivitiesQuery = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentActivitiesSnapshot = await getDocs(recentActivitiesQuery);
        const recentActivitiesData = recentActivitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRecentActivities(recentActivitiesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        
        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-3">
          {/* <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Users</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.users}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/users" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  View all
                </Link>
              </div>
            </div>
          </div> */}

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActivityIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Activities</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.activities}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/activities" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  View all
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Locations</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.locations}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/locations" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  View all
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Tracks</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.tracks}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/tracks" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  View all
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Location Map</h2>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="p-1">
              <MapPreview />
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activities</h2>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="animate-pulse p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 py-3">
                    <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Link href={`/dashboard/activities/${activity.id}`} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                          <ActivityIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.name || 'Unnamed Activity'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {activity.status || 'No status'} • {activity.price ? `$${activity.price}` : 'No price'}
                        </p>
                      </div>
                      <div>
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 sm:p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">No recent activities found.</p>
              </div>
            )}
          </div>
        </div>

        {/* User Activities */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Activities</h2>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <Link 
                href="/dashboard/user-activities"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <UserIcon className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6" />
                User Activities
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 