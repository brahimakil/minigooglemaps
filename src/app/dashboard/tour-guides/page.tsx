'use client';

import { useState, useEffect, Fragment } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImageComponent';

interface TourGuide {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  regions: string[];
  bio: string;
  idCardUrl: string;
  photoUrl?: string;
  status: 'approved';
  active?: boolean;
  createdAt: any;
}

export default function TourGuidesPage() {
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingGuide, setViewingGuide] = useState<TourGuide | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTourGuides();
  }, []);

  const fetchTourGuides = async () => {
    try {
      setLoading(true);
      console.log('Fetching tour guides...');
      
      const guidesQuery = query(
        collection(db, 'tourGuideRequests'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(guidesQuery);
      console.log(`Found ${snapshot.docs.length} tour guides`);
      
      const guidesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TourGuide[];
      
      console.log('Processed tour guides:', guidesData);
      setGuides(guidesData);
    } catch (error) {
      console.error('Error fetching tour guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGuide = (guide: TourGuide) => {
    setViewingGuide(guide);
    setViewOpen(true);
  };

  const handleDeactivate = async () => {
    if (!viewingGuide) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'tourGuideRequests', viewingGuide.id), {
        active: false
      });
      
      // Refresh the guides list
      fetchTourGuides();
      
      // Close the modal
      setViewOpen(false);
    } catch (error) {
      console.error('Error deactivating tour guide:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!viewingGuide) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'tourGuideRequests', viewingGuide.id), {
        active: true
      });
      
      // Refresh the guides list
      fetchTourGuides();
      
      // Close the modal
      setViewOpen(false);
    } catch (error) {
      console.error('Error activating tour guide:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Tour Guides</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage tour guides and their assignments
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center mt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Phone
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Regions
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {guides.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No tour guides found
                        </td>
                      </tr>
                    ) : (
                      guides.map((guide) => (
                        <tr key={guide.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0">
                                {guide.photoUrl ? (
                                  <SafeImage
                                    src={guide.photoUrl}
                                    alt={guide.fullName}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                                      {guide.fullName.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">{guide.fullName}</div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {guide.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {guide.phone}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-wrap gap-1">
                              {guide.regions.slice(0, 2).map((region, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                >
                                  {region}
                                </span>
                              ))}
                              {guide.regions.length > 2 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  +{guide.regions.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              guide.active !== false
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {guide.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleViewGuide(guide)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                            >
                              View
                            </button>
                            {/* <Link
                              href={`/dashboard/tour-guides/${guide.id}/assignments`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Assignments
                            </Link> */}
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
      )}
      
      {/* View Guide Modal */}
      <Transition appear show={viewOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setViewOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Tour Guide Profile: {viewingGuide?.fullName}
                  </Dialog.Title>
                  
                  {viewingGuide && (
                    <div className="mt-4">
                      <div className="flex items-center mb-6">
                        <div className="h-16 w-16 flex-shrink-0 mr-4">
                          {viewingGuide.photoUrl ? (
                            <SafeImage
                              src={viewingGuide.photoUrl}
                              alt={viewingGuide.fullName}
                              className="h-16 w-16 rounded-full object-cover border-2 border-indigo-500"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <span className="text-2xl font-medium text-indigo-600 dark:text-indigo-300">
                                {viewingGuide.fullName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xl font-medium text-gray-900 dark:text-white">
                            {viewingGuide.fullName}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {viewingGuide.email}
                          </p>
                          <div className="mt-1">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              viewingGuide.active !== false
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {viewingGuide.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Contact Information</h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">Phone:</span> {viewingGuide.phone}
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Regions</h4>
                        <div className="flex flex-wrap gap-2">
                          {viewingGuide.regions.map((region, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            >
                              {region}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bio</h4>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {viewingGuide.bio || 'No bio provided'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Card</h4>
                        <div className="mt-2 flex justify-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                          <SafeImage
                            src={viewingGuide.idCardUrl}
                            alt="ID Card"
                            className="max-h-64 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setViewOpen(false)}
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    >
                      Close
                    </button>
                    
                    {viewingGuide?.active !== false ? (
                      <button
                        type="button"
                        onClick={handleDeactivate}
                        disabled={actionLoading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Deactivate'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleActivate}
                        disabled={actionLoading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Activate'}
                      </button>
                    )}
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