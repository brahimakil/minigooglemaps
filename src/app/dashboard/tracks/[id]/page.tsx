'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import { PencilIcon, ChevronLeftIcon, MapPinIcon, ActivityIcon, UserIcon, ClockIcon, CalendarIcon } from '@/components/icons';

interface Activity {
  id: string;
  name: string;
  description?: string;
}

interface Location {
  id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

interface TourGuide {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  regions?: string[];
}

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
  updatedAt?: any;
}

export default function ViewTrack() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  // Track data
  const [track, setTrack] = useState<Track | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tourGuide, setTourGuide] = useState<TourGuide | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchTrackData();
  }, [id]);
  
  const fetchTrackData = async () => {
    try {
      setLoading(true);
      
      // Fetch track
      const trackDoc = await getDoc(doc(db, 'tracks', id));
      
      if (!trackDoc.exists()) {
        setError('Track not found');
        return;
      }
      
      const trackData = { id: trackDoc.id, ...trackDoc.data() } as Track;
      setTrack(trackData);
      
      // Fetch related activities
      if (trackData.activityIds && trackData.activityIds.length > 0) {
        const activitiesQuery = query(collection(db, 'activities'));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs
          .filter(doc => trackData.activityIds.includes(doc.id))
          .map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Unnamed Activity',
            description: doc.data().description || ''
          }));
        setActivities(activitiesData);
      }
      
      // Fetch related locations
      if (trackData.locationIds && trackData.locationIds.length > 0) {
        const locationsQuery = query(collection(db, 'locations'));
        const locationsSnapshot = await getDocs(locationsQuery);
        const locationsData = locationsSnapshot.docs
          .filter(doc => trackData.locationIds.includes(doc.id))
          .map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Unnamed Location',
            description: doc.data().description || '',
            latitude: doc.data().latitude,
            longitude: doc.data().longitude
          }));
        setLocations(locationsData);
      }
      
      // Fetch tour guide
      if (trackData.tourGuideId) {
        const guideDoc = await getDoc(doc(db, 'tourGuideRequests', trackData.tourGuideId));
        if (guideDoc.exists()) {
          const guideData = guideDoc.data();
          setTourGuide({
            id: guideDoc.id,
            fullName: guideData.fullName || 'Unknown Guide',
            email: guideData.email || '',
            phone: guideData.phone || '',
            regions: guideData.regions || []
          });
        }
      }
      
    } catch (error) {
      console.error('Error fetching track data:', error);
      setError('Failed to load track data');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'Not scheduled';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
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
    
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error || !track) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error || 'Track not found'}</h3>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/tracks"
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            ← Back to Tracks
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/dashboard/tracks"
              className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{track.name}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track Details</p>
            </div>
          </div>
          <Link
            href={`/dashboard/tracks/${track.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Track
          </Link>
        </div>
      </div>
      
      {/* Status Badge */}
      <div className="mb-6">
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(track.status)}`}>
          {track.status.charAt(0).toUpperCase() + track.status.slice(1)}
        </span>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Track Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
            <p className="text-gray-700 dark:text-gray-300">
              {track.description || 'No description provided'}
            </p>
          </div>
          
          {/* Activities */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <ActivityIcon className="h-5 w-5 text-indigo-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activities</h2>
            </div>
            {activities.length > 0 ? (
              <ul className="space-y-3">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex items-start">
                    <span className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-indigo-500 mr-3"></span>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{activity.name}</p>
                      {activity.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No activities assigned</p>
            )}
          </div>
          
          {/* Locations */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MapPinIcon className="h-5 w-5 text-red-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Locations</h2>
            </div>
            {locations.length > 0 ? (
              <ul className="space-y-3">
                {locations.map((location) => (
                  <li key={location.id} className="flex items-start">
                    <span className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-red-500 mr-3"></span>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{location.name}</p>
                      {location.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{location.description}</p>
                      )}
                      {location.latitude && location.longitude && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No locations assigned</p>
            )}
          </div>
        </div>
        
        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          {/* Schedule Info */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schedule</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</p>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(track.startTime)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="text-gray-900 dark:text-white">{formatDuration(track.duration)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tour Guide Info */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <UserIcon className="h-5 w-5 text-green-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tour Guide</h2>
            </div>
            {tourGuide ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-gray-900 dark:text-white">{tourGuide.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{tourGuide.email}</p>
                </div>
                {tourGuide.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white">{tourGuide.phone}</p>
                  </div>
                )}
                {tourGuide.regions && tourGuide.regions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Regions</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tourGuide.regions.map((region, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No tour guide assigned</p>
            )}
          </div>
          
          {/* Metadata */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-gray-900 dark:text-white">{formatDateTime(track.createdAt)}</p>
              </div>
              {track.updatedAt && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(track.updatedAt)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 dark:text-gray-400">Track ID</p>
                <p className="text-gray-900 dark:text-white font-mono text-xs break-all">{track.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Actions */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
        <Link
          href="/dashboard/tracks"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ← Back to Tracks
        </Link>
        <Link
          href={`/dashboard/tracks/${track.id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Track
        </Link>
      </div>
    </div>
  );
}
