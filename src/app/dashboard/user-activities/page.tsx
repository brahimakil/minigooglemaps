'use client';

import { useState, useEffect, Fragment } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ActivityIcon, UserIcon, TrashIcon } from '@/components/icons';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';

interface Activity {
  id: string;
  name: string;
  description?: string;
  status: string;
  type?: string;
  mainImage?: string;
  activityDate?: any;
}

interface AppUser {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  uid?: string;
  isGoogleUser?: boolean;
}

interface Registration {
  id: string;
  userId: string;
  activityId: string;
  registeredAt: any;
}

export default function UserActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [activityUsers, setActivityUsers] = useState<AppUser[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log("Fetching data...");
        
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
            activityDate: data.activityDate
          } as Activity;
        });
        
        console.log(`Fetched ${activitiesData.length} activities`);
        
        // Fetch all users
        const usersCollection = collection(db, 'appUsers');
        const usersSnapshot = await getDocs(usersCollection);
        
        console.log(`Fetched ${usersSnapshot.docs.length} users`);
        
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          
          return {
            id: doc.id,
            displayName: data.displayName || 'No Name',
            email: data.email || 'No Email',
            photoURL: data.photoURL || data.photoUrl,
            uid: data.uid,
            isGoogleUser: !!data.photoUrl || data.providerId === 'google.com' || !!data.uid
          } as AppUser;
        });
        
        // Fetch registrations
        const registrationsQuery = query(collection(db, 'registrations'));
        const registrationsSnapshot = await getDocs(registrationsQuery);
        
        console.log(`Fetched ${registrationsSnapshot.docs.length} registrations`);
        
        const registrationsData = registrationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            activityId: data.activityId,
            registeredAt: data.registeredAt
          } as Registration;
        });
        
        setActivities(activitiesData);
        setUsers(usersData);
        setRegistrations(registrationsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const getRegisteredUsersCount = (activityId: string) => {
    return registrations.filter(reg => reg.activityId === activityId).length;
  };

  const openViewModal = async (activity: Activity) => {
    setCurrentActivity(activity);
    
    // Get registrations for this activity
    const activityRegistrations = registrations.filter(reg => reg.activityId === activity.id);
    console.log(`Found ${activityRegistrations.length} registrations for activity ${activity.id}`);
    
    // Get user IDs from registrations
    const userIds = activityRegistrations.map(reg => reg.userId);
    console.log("User IDs for activity:", userIds);
    
    // Match users by both ID and UID
    const activityUsersList = users.filter(user => 
      userIds.includes(user.id) || 
      (user.uid && userIds.includes(user.uid))
    );
    
    console.log("Matched users:", activityUsersList);
    
    setActivityUsers(activityUsersList);
    setIsViewOpen(true);
  };

  const handleRemoveRegistration = async (userId: string) => {
    if (!currentActivity) return;
    
    try {
      setDeleteLoading(userId);
      console.log(`Removing user ${userId} from activity ${currentActivity.id}`);
      
      // Find the registration to delete
      const registrationToDelete = registrations.find(
        reg => reg.activityId === currentActivity.id && 
        (reg.userId === userId || users.find(u => u.uid === userId)?.id === reg.userId)
      );
      
      if (!registrationToDelete) {
        console.error("Registration not found");
        alert("Registration not found");
        return;
      }
      
      // Delete the registration
      await deleteDoc(doc(db, 'registrations', registrationToDelete.id));
      
      console.log("Registration removed successfully");
      
      // Update local state
      setRegistrations(registrations.filter(reg => reg.id !== registrationToDelete.id));
      setActivityUsers(activityUsers.filter(user => 
        user.id !== userId && user.uid !== userId
      ));
      
      // If no users left, close the modal
      if (activityUsers.length <= 1) {
        setIsViewOpen(false);
      }
    } catch (error) {
      console.error('Error removing registration:', error);
      alert('Failed to remove registration. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">User Activities</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            View which users are registered for which activities.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : (
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
                        Registered Users
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">View</span>
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
                                <div className="h-10 w-10 rounded-full overflow-hidden">
                                  <img src={activity.mainImage} alt="" className="h-10 w-10 object-cover" />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <ActivityIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900 dark:text-white">{activity.name}</div>
                              {activity.description && (
                                <div className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {activity.description}
                                </div>
                              )}
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
                          {getRegisteredUsersCount(activity.id)} users
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => openViewModal(activity)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            View<span className="sr-only">, {activity.name}</span>
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
      )}

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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Registered Users for {currentActivity?.name}
                  </Dialog.Title>
                  
                  <div className="mt-4">
                    {activityUsers.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        No users registered for this activity
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {activityUsers.map((user) => (
                          <li key={user.id || user.uid} className="py-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0">
                                {user.photoURL ? (
                                  <div className="h-8 w-8 rounded-full overflow-hidden">
                                    <img src={user.photoURL} alt="" className="h-8 w-8 object-cover" />
                                  </div>
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                {user.isGoogleUser && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Google
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveRegistration(user.uid || user.id)}
                              disabled={!!deleteLoading}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              {deleteLoading === (user.uid || user.id) ? (
                                <div className="w-5 h-5 border-t-2 border-b-2 border-red-500 rounded-full animate-spin"></div>
                              ) : (
                                <TrashIcon className="h-5 w-5" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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