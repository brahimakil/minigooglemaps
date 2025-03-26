'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ActivityIcon, UserIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Activity {
  id: string;
  name: string;
  description?: string;
  status: string;
  type?: string;
  mainImage?: string;
  activityDate?: any;
  userIds?: string[];
}

interface AppUser {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export default function UserActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activityUsers, setActivityUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch activities
        const activitiesQuery = query(collection(db, 'activities'), orderBy('name'));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description,
            status: data.status || 'draft',
            type: data.type,
            mainImage: data.mainImage,
            activityDate: data.activityDate,
            userIds: []
          } as Activity;
        });
        
        // Fetch users
        const usersQuery = query(collection(db, 'appUsers'), orderBy('displayName'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AppUser));
        
        // Fetch activity-user relationships
        const activityUsersQuery = query(collection(db, 'activityUsers'));
        const activityUsersSnapshot = await getDocs(activityUsersQuery);
        
        // Update activities with user IDs
        activityUsersSnapshot.forEach(doc => {
          const activityId = doc.id;
          const data = doc.data();
          const activity = activitiesData.find(a => a.id === activityId);
          if (activity && data.userIds) {
            activity.userIds = data.userIds;
          }
        });
        
        setActivities(activitiesData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const openAssignModal = (activity: Activity) => {
    setCurrentActivity(activity);
    setSelectedUserIds(activity.userIds || []);
    setIsOpen(true);
  };

  const openViewModal = async (activity: Activity) => {
    setCurrentActivity(activity);
    setIsViewOpen(true);
    
    try {
      // Get users for this activity
      if (activity.userIds && activity.userIds.length > 0) {
        const activityUsersData = users.filter(user => 
          activity.userIds?.includes(user.id)
        );
        setActivityUsers(activityUsersData);
      } else {
        setActivityUsers([]);
      }
    } catch (error) {
      console.error('Error fetching activity users:', error);
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSaveAssignments = async () => {
    if (!currentActivity) return;
    
    try {
      // Update the activity-users relationship in Firestore
      await setDoc(doc(db, 'activityUsers', currentActivity.id), {
        userIds: selectedUserIds
      });
      
      // Update local state
      setActivities(activities.map(activity => {
        if (activity.id === currentActivity.id) {
          return {
            ...activity,
            userIds: selectedUserIds
          };
        }
        return activity;
      }));
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving user assignments:', error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!currentActivity) return;
    
    try {
      // Remove user from activity
      await updateDoc(doc(db, 'activityUsers', currentActivity.id), {
        userIds: arrayRemove(userId)
      });
      
      // Update local state
      setActivityUsers(activityUsers.filter(user => user.id !== userId));
      setActivities(activities.map(activity => {
        if (activity.id === currentActivity.id) {
          return {
            ...activity,
            userIds: (activity.userIds || []).filter(id => id !== userId)
          };
        }
        return activity;
      }));
    } catch (error) {
      console.error('Error removing user from activity:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'No date';
    
    const date = timestamp.toDate ? 
      timestamp.toDate() : 
      timestamp instanceof Date ? 
        timestamp : 
        new Date(timestamp.seconds * 1000);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">User Activities</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage user assignments to activities
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/dashboard/activities/new">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Activity
            </button>
          </Link>
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
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Assigned Users
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {activity.mainImage ? (
                              <Image
                                src={activity.mainImage}
                                alt={activity.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <ActivityIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-white">{activity.name}</div>
                            <div className="text-gray-500 dark:text-gray-400">{activity.type || 'No type'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {activity.activityDate ? formatDate(activity.activityDate) : 'No date'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          activity.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : activity.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {activity.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {activity.userIds?.length || 0} users
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => openAssignModal(activity)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                        >
                          Edit Users
                        </button>
                        <button
                          onClick={() => openViewModal(activity)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View Users
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Assign Users Modal */}
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Assign Users to {currentActivity?.name}
                  </Dialog.Title>
                  
                  <div className="mt-4">
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                      />
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map((user) => (
                          <li key={user.id} className="py-3 flex items-center">
                            <input
                              type="checkbox"
                              id={`user-${user.id}`}
                              checked={selectedUserIds.includes(user.id)}
                              onChange={() => handleUserSelection(user.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`user-${user.id}`} className="ml-3 flex items-center cursor-pointer">
                              <div className="h-8 w-8 flex-shrink-0">
                                {user.photoURL ? (
                                  <Image
                                    src={user.photoURL}
                                    alt={user.displayName}
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={handleSaveAssignments}
                    >
                      Save
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      {/* View Users Modal */}
      <Transition appear show={isViewOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsViewOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Users in {currentActivity?.name}
                  </Dialog.Title>
                  
                  <div className="mt-4">
                    {activityUsers.length > 0 ? (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                        {activityUsers.map((user) => (
                          <li key={user.id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0">
                                {user.photoURL ? (
                                  <Image
                                    src={user.photoURL}
                                    alt={user.displayName}
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveUser(user.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          No users are assigned to this activity yet.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => setIsViewOpen(false)}
                    >
                      Close
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