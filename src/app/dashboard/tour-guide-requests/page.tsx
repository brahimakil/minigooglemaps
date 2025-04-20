'use client';

import { useState, useEffect, Fragment } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Dialog, Transition } from '@headlessui/react';
import SafeImage from '@/components/SafeImageComponent';

interface TourGuideRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  regions: string[];
  bio: string;
  idCardUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export default function TourGuideRequestsPage() {
  const [requests, setRequests] = useState<TourGuideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingRequest, setViewingRequest] = useState<TourGuideRequest | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [showAll]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching tour guide requests...');
      
      let requestsQuery;
      
      if (showAll) {
        // Show all requests
        requestsQuery = query(
          collection(db, 'tourGuideRequests'),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Show only pending requests
        requestsQuery = query(
          collection(db, 'tourGuideRequests'),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(requestsQuery);
      console.log(`Found ${snapshot.docs.length} tour guide requests`);
      
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TourGuideRequest[];
      
      console.log('Processed tour guide requests:', requestsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching tour guide requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: TourGuideRequest) => {
    setViewingRequest(request);
    setViewOpen(true);
  };

  const handleApprove = async () => {
    if (!viewingRequest) return;
    
    setActionLoading(true);
    try {
      // Update the status in tourGuideRequests collection
      await updateDoc(doc(db, 'tourGuideRequests', viewingRequest.id), {
        status: 'approved'
      });
      
      console.log(`Tour guide request ${viewingRequest.id} approved successfully`);
      
      // Refresh the requests list
      fetchRequests();
      
      // Close the modal
      setViewOpen(false);
    } catch (error) {
      console.error('Error approving tour guide request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!viewingRequest) return;
    
    setActionLoading(true);
    try {
      // Update the status to rejected
      await updateDoc(doc(db, 'tourGuideRequests', viewingRequest.id), {
        status: 'rejected'
      });
      
      // Refresh the requests list
      fetchRequests();
      
      // Close the modal
      setViewOpen(false);
    } catch (error) {
      console.error('Error rejecting tour guide request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'tourGuideRequests', id));
        setRequests(requests.filter(request => request.id !== id));
      } catch (error) {
        console.error('Error deleting tour guide request:', error);
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Tour Guide Requests</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Review and manage tour guide applications
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex items-center">
            <label className="text-sm text-gray-700 dark:text-gray-300 mr-2">
              Show all requests:
            </label>
            <button
              onClick={() => setShowAll(!showAll)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                showAll 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {showAll ? 'Showing All' : 'Pending Only'}
            </button>
          </div>
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
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No tour guide requests found
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            {request.fullName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {request.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {request.phone}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              request.status === 'approved'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {request.createdAt?.toDate().toLocaleDateString() || 'Unknown'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleViewRequest(request)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(request.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
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
      )}
      
      {/* View Request Modal */}
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Tour Guide Request Details
                  </Dialog.Title>
                  
                  {viewingRequest && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h4>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingRequest.fullName}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h4>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingRequest.email}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</h4>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingRequest.phone}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Regions</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {viewingRequest.regions.map((region, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            >
                              {region}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</h4>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {viewingRequest.bio || 'No bio provided'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Card</h4>
                        <div className="mt-2 flex justify-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                          <SafeImage
                            src={viewingRequest.idCardUrl}
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
                    
                    {viewingRequest && viewingRequest.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={actionLoading}
                          className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50"
                        >
                          {actionLoading ? 'Processing...' : 'Reject'}
                        </button>
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={actionLoading}
                          className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50"
                        >
                          {actionLoading ? 'Processing...' : 'Approve'}
                        </button>
                      </>
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