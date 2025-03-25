'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import { ActivityIcon, PlusIcon, PencilIcon, TrashIcon } from '@/components/icons';

interface Activity {
  id: string;
  name: string;
  description: string;
  price: number;
  status: string;
  type: string;
  location: string;
  mainImage?: string;
  createdAt: any;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(activitiesQuery);
        const activitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];
        
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      setDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'activities', id));
        setActivities(activities.filter(activity => activity.id !== id));
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Failed to delete activity');
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Activities</h1>
          <Link
            href="/dashboard/activities/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Activity
          </Link>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="animate-pulse p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                  <div className="rounded-md bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity) => (
                <li key={activity.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {activity.mainImage ? (
                          <img className="h-12 w-12 rounded-md object-cover" src={activity.mainImage} alt={activity.name} />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <ActivityIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h2 className="text-sm font-medium text-gray-900 dark:text-white">{activity.name}</h2>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {activity.status || 'No status'} • {activity.price ? `$${activity.price}` : 'No price'} • {activity.type || 'No type'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/activities/${activity.id}/edit`}
                        className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        disabled={deleteLoading === activity.id}
                        className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {deleteLoading === activity.id ? (
                          <div className="h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 sm:p-6 text-center">
              <ActivityIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activities</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new activity.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/activities/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Activity
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 