'use client';

import { useState, useEffect, Fragment } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

interface Track {
  id: string;
  name: string;
  description: string;
  locationIds: string[];
  activityIds: string[];
  tourGuideId: string;
  startTime: any; // Firebase Timestamp
  duration: number; // Duration in minutes
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: any;
}

interface TourGuide {
  id: string;
  fullName: string;
  email: string;
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [tourGuides, setTourGuides] = useState<Record<string, TourGuide>>({});
  const [activities, setActivities] = useState<Record<string, {name: string}>>({});
  const [locations, setLocations] = useState<Record<string, {name: string}>>({});

  useEffect(() => {
    fetchTracks();
    fetchTourGuides();
    fetchActivities();
    fetchLocations();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      console.log('Fetching tracks...');
      
      const tracksQuery = query(
        collection(db, 'tracks'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(tracksQuery);
      console.log(`Found ${snapshot.docs.length} tracks`);
      
      const tracksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Track[];
      
      setTracks(tracksData);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTourGuides = async () => {
    try {
      const guidesQuery = query(
        collection(db, 'tourGuideRequests'),
        where('status', '==', 'approved')
      );
      
      const snapshot = await getDocs(guidesQuery);
      
      const guidesMap: Record<string, TourGuide> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        guidesMap[doc.id] = {
          id: doc.id,
          fullName: data.fullName || 'Unknown Guide',
          email: data.email || ''
        };
      });
      
      setTourGuides(guidesMap);
    } catch (error) {
      console.error('Error fetching tour guides:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const activitiesQuery = query(collection(db, 'activities'));
      const snapshot = await getDocs(activitiesQuery);
      
      const activitiesMap: Record<string, {name: string}> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        activitiesMap[doc.id] = { name: data.name || 'Unnamed Activity' };
      });
      
      setActivities(activitiesMap);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const locationsQuery = query(collection(db, 'locations'));
      const snapshot = await getDocs(locationsQuery);
      
      const locationsMap: Record<string, {name: string}> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        locationsMap[doc.id] = { name: data.name || 'Unnamed Location' };
      });
      
      setLocations(locationsMap);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this track?')) {
      setDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'tracks', id));
        setTracks(tracks.filter(track => track.id !== id));
      } catch (error) {
        console.error('Error deleting track:', error);
        alert('Failed to delete track');
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'Not scheduled';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'No duration set';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Tracks</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage tour tracks with locations, activities, and guides
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/tracks/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-1" /> Add Track
          </Link>
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
                        Track Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Tour Guide
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Schedule
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
                    {tracks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No tracks found
                        </td>
                      </tr>
                    ) : (
                      tracks.map((track) => (
                        <tr key={track.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            {track.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {tourGuides[track.tourGuideId]?.fullName || 'No guide assigned'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div>{formatDateTime(track.startTime)}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Duration: {formatDuration(track.duration)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(track.status)}`}>
                              {track.status.charAt(0).toUpperCase() + track.status.slice(1)}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link
                              href={`/dashboard/tracks/${track.id}`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                            >
                              <EyeIcon className="h-4 w-4 inline" /> View
                            </Link>
                            <Link
                              href={`/dashboard/tracks/${track.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                            >
                              <PencilIcon className="h-4 w-4 inline" /> Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(track.id)}
                              disabled={deleteLoading === track.id}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              {deleteLoading === track.id ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                              ) : (
                                <TrashIcon className="h-4 w-4 inline" />
                              )}{' '}
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
    </div>
  );
} 