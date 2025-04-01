'use client';

import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, query, orderBy, limit, deleteDoc, doc, addDoc, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserIcon, PlusIcon, PencilIcon, TrashIcon } from '@/components/icons';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface AppUser {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: any;
  isGoogleUser: boolean;
  uid: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  // Form state
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      console.log("Fetching users...");
      
      // First, get all documents from the appUsers collection without any ordering
      const usersCollection = collection(db, 'appUsers');
      const snapshot = await getDocs(usersCollection);
      
      console.log(`Found ${snapshot.size} users in appUsers collection`);
      
      // Log the first document to see its structure
      if (snapshot.docs.length > 0) {
        console.log("First user document data:", snapshot.docs[0].data());
      }
      
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Processing user ${doc.id}:`, data);
        
        return {
          id: doc.id,
          displayName: data.displayName || 'No Name',
          email: data.email || 'No Email',
          photoURL: data.photoURL || data.photoUrl, // Handle both property names
          phoneNumber: data.phoneNumber || '',
          createdAt: data.createdAt || null,
          isGoogleUser: !!data.photoUrl || !!data.providerId === 'google.com' || data.uid !== undefined,
          uid: data.uid || doc.id // Use the provided UID or fallback to doc ID
        };
      }) as AppUser[];
      
      // Sort the users client-side, with users having createdAt first
      usersData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds; // Descending order
        } else if (a.createdAt) {
          return -1; // a comes first
        } else if (b.createdAt) {
          return 1; // b comes first
        }
        return 0; // Keep original order for users without createdAt
      });
      
      console.log(`Processed ${usersData.length} users for display`);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'appUsers', id));
        setUsers(users.filter(user => user.id !== id));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentUserId(null);
    setDisplayName('');
    setEmail('');
    setPhoneNumber('');
    setPhotoURL(null);
    setProfileImage(null);
    setFormError(null);
    setIsOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setIsEditMode(true);
    setCurrentUserId(user.id);
    setDisplayName(user.displayName || '');
    setEmail(user.email || '');
    setPhoneNumber(user.phoneNumber || '');
    setPhotoURL(user.photoURL || null);
    setProfileImage(null);
    setFormError(null);
    setIsOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Basic validation
    if (!displayName) {
      setFormError('Name is required');
      return;
    }
    
    if (!email) {
      setFormError('Email is required');
      return;
    }
    
    if (!isEditMode && !email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    setFormLoading(true);
    
    try {
      let imageUrl = photoURL;
      
      if (profileImage) {
        // Convert image to base64 for storage in Firestore
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('Error reading file'));
          reader.readAsDataURL(profileImage);
        });
        
        // Check if the base64 string is too large (Firestore has a 1MB document limit)
        if (imageUrl && imageUrl.length > 900000) {
          throw new Error('Image is too large. Please use a smaller image or compress it first.');
        }
      }
      
      if (isEditMode && currentUserId) {
        // Update existing user
        await updateDoc(doc(db, 'appUsers', currentUserId), {
          displayName,
          email,
          phoneNumber: phoneNumber || null,
          photoURL: imageUrl,
          updatedAt: serverTimestamp()
        });
        
        // Update the user in the local state
        setUsers(users.map(user => 
          user.id === currentUserId 
            ? { ...user, displayName, email, phoneNumber, photoURL: imageUrl as string } 
            : user
        ));
      } else {
        // Create new user
        const newUser = {
          displayName,
          email,
          phoneNumber: phoneNumber || null,
          photoURL: imageUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'appUsers'), newUser);
        
        // Add the new user to the local state
        setUsers([
          {
            id: docRef.id,
            ...newUser,
            createdAt: new Date() // Temporary date for UI until refresh
          } as AppUser,
          ...users
        ]);
      }
      
      setIsOpen(false);
    } catch (err) {
      console.error('Error saving user:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save user. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            A list of all users in your application.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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
                        User
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Auth Type
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        UID
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {user.photoURL ? (
                                <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900 dark:text-white">{user.displayName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {user.isGoogleUser ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                              Google
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                              Email
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-mono text-xs">{user.uid?.substring(0, 10)}...</span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteLoading === user.id}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          >
                            {deleteLoading === user.id ? (
                              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                            <span className="sr-only">Delete</span>
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

      {/* Add/Edit User Modal */}
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
                    {isEditMode ? 'Edit User' : 'Add New User'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmit} className="mt-4">
                    {formError && (
                      <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                        {formError}
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </label>
                      <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Full Name"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="user@example.com"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Profile Photo
                      </label>
                      <div className="mt-1 flex items-center">
                        {(photoURL || profileImage) ? (
                          <div className="relative inline-block">
                            <Image
                              src={profileImage ? URL.createObjectURL(profileImage) : photoURL!}
                              alt="Profile preview"
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoURL(null);
                                setProfileImage(null);
                              }}
                              className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1 w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <label
                          htmlFor="profile-upload"
                          className="ml-5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-sm font-medium leading-4 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                        >
                          Change
                        </label>
                        <input
                          id="profile-upload"
                          name="profile-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG or GIF up to 1MB
                      </p>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {formLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 