'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Dialog, Transition } from '@headlessui/react';
import { ActivityIcon, UserIcon } from '@/components/icons';
import Link from 'next/link';

interface Activity {
  id: string;
  name: string;
  description?: string;
  status: string;
  type?: string;
  mainImage?: string;
  activityDate?: any;
  guideIds?: string[];
}

interface TourGuide {
  id: string;
  fullName: string;
  email: string;
  photoURL?: string;
  regions: string[];
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function TourGuideAssignmentsPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  
  const [guide, setGuide] = useState<TourGuide | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch guide data
      const guideDoc = await getDoc(doc(db, 'appUsers', id));
      if (!guideDoc.exists()) {
        router.push('/dashboard/tour-guides');
        return;
      }
      
      const guideData = guideDoc.data() as TourGuide;
      guideData.id = guideDoc.id;
      setGuide(guideData);
      
      // Fetch all activities
      const activitiesSnapshot = await getDocs(query(collection(db, 'activities')));
      const allActivities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      
      // Fetch activities where this guide is already assigned
      const guideActivitiesSnapshot = await getDocs(
        query(collection(db, 'activityGuides'), where('guideIds', 'array-contains', id))
      );
      
      const guideActivityIds = guideActivitiesSnapshot.docs.map(doc => doc.id);
      
      // Filter activities to only show ones this guide is assigned to
      const assignedActivities = allActivities.filter(activity => 
        guideActivityIds.includes(activity.id)
      );
      
      // Set available activities (those not assigned to this guide)
      const unassignedActivities = allActivities.filter(activity => 
        !guideActivityIds.includes(activity.id)
      );
      
      setActivities(assignedActivities);
      setAvailableActivities(unassignedActivities);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = () => {
    setSelectedActivityIds([]);
    setIsOpen(true);
  };

  const handleActivitySelection = (activityId: string) => {
    setSelectedActivityIds(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
  };

  const handleSaveAssignments = async () => {
    if (!guide) return;
    
    setSaveLoading(true);
    try {
      // For each selected activity, add the guide
      for (const activityId of selectedActivityIds) {
        const activityGuideRef = doc(db, 'activityGuides', activityId);
        const activityGuideDoc = await getDoc(activityGuideRef);
        
        if (activityGuideDoc.exists()) {
          // Update existing document
          await updateDoc(activityGuideRef, {
            guideIds: arrayUnion(id)
          });
        } else {
          // Create new document
          await setDoc(activityGuideRef, {
            guideIds: [id]
          });
        }
      }
      
      // Refresh data
      await fetchData();
      
      // Close modal
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving assignments:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRemoveAssignment = async (activityId: string) => {
    if (!guide) return;
    
    if (confirm('Are you sure you want to remove this tour guide from this activity?')) {
      try {
        // Remove guide from activity
        await updateDoc(doc(db, 'activityGuides', activityId), {
          guideIds: arrayRemove(id)
        });
        
        // Refresh data
        await fetchData();
      } catch (error) {
        console.error('Error removing assignment:', error);
      }
    }
  };

  const filteredActivities = availableActivities.filter(activity => 
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-300">Tour guide not found</p>
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/tour-guides"
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            ← Back to tour guides
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/dashboard/tour-guides"
          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          ← Back to tour guides
        </Link>
      </div>
      
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Activity Assignments for {guide.fullName}
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage which activities this tour guide is assigned to lead
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={openAssignModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Assign Activities
          </button>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                      Activity
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No activities assigned to this tour guide yet
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-8 w-8 flex-shrink-0">
                              {activity.mainImage ? (
                                <img
                                  src={activity.mainImage}
                                  alt={activity.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                  <ActivityIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              {activity.name}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {activity.type || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            activity.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {activity.status || 'draft'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {activity.activityDate?.toDate?.().toLocaleDateString() || 'Not scheduled'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleRemoveAssignment(activity.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Assign Activities Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Assign Activities to {guide.fullName}
                  </Dialog.Title>
                  
                  <div className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="search" className="sr-only">Search</label>
                      <input
                        type="text"
                        id="search"
                        placeholder="Search activities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {filteredActivities.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                          No unassigned activities found
                        </p>
                      ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredActivities.map((activity) => (
                            <li key={activity.id} className="py-3 flex items-center">
                              <input
                                type="checkbox"
                                id={`activity-${activity.id}`}
                                checked={selectedActivityIds.includes(activity.id)}
                                onChange={() => handleActivitySelection(activity.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`activity-${activity.id}`} className="ml-3 flex items-center cursor-pointer">
                                <div className="h-8 w-8 flex-shrink-0">
                                  {activity.mainImage ? (
                                    <img
                                      src={activity.mainImage}
                                      alt={activity.name}
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                      <ActivityIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.type || 'No type'}</p>
                                </div>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAssignments}
                      disabled={saveLoading || selectedActivityIds.length === 0}
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      {saveLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 