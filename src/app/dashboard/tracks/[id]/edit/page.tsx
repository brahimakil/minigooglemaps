'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Select, { ClassNamesConfig } from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Force dynamic rendering
export const runtime = 'edge';

interface Activity {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface TourGuide {
  id: string;
  fullName: string;
  email: string;
  regions: string[];
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
}

// Define common classNames for react-select components
const selectClassNames: ClassNamesConfig = {
  control: (state) => `
    ${state.isFocused ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-gray-300 dark:border-gray-700'}
    bg-white dark:bg-gray-800 text-sm
    hover:border-gray-400 dark:hover:border-gray-600
    rounded-md shadow-sm min-h-[38px]
  `,
  valueContainer: () => 'p-1 gap-1',
  input: () => 'm-0 p-0 text-gray-900 dark:text-white',
  placeholder: () => 'text-gray-400 dark:text-gray-500 ml-0.5',
  singleValue: () => 'text-gray-900 dark:text-white ml-0.5',
  multiValue: () => 'bg-gray-100 dark:bg-gray-700 rounded m-0.5',
  multiValueLabel: () => 'text-gray-800 dark:text-gray-200 text-sm px-1.5 py-0.5',
  multiValueRemove: () => 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-red-600 dark:hover:text-red-400 rounded-r',
  indicatorsContainer: () => 'p-1 space-x-1',
  clearIndicator: () => 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 cursor-pointer',
  dropdownIndicator: () => 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 cursor-pointer',
  menu: () => 'p-1 mt-1 text-sm bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg z-10',
  option: (state) => `
    px-3 py-2 rounded cursor-pointer text-sm
    ${state.isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''}
    ${state.isSelected ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-100 font-semibold' : 'text-gray-900 dark:text-white'}
    hover:bg-gray-50 dark:hover:bg-gray-700
  `
};

export default function EditTrack() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<{value: string, label: string}[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<{value: string, label: string}[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<{value: string, label: string} | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [duration, setDuration] = useState('60'); // Default 60 minutes
  const [status, setStatus] = useState('pending');
  
  // Options for selects
  const [activities, setActivities] = useState<Activity[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tourGuides, setTourGuides] = useState<TourGuide[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    Promise.all([
      fetchTrack(),
      fetchActivities(),
      fetchLocations(),
      fetchTourGuides()
    ]).finally(() => setLoading(false));
  }, [id]);
  
  const fetchTrack = async () => {
    try {
      const trackDoc = await getDoc(doc(db, 'tracks', id));
      
      if (!trackDoc.exists()) {
        setError('Track not found');
        router.push('/dashboard/tracks');
        return;
      }
      
      const trackData = { id: trackDoc.id, ...trackDoc.data() } as Track;
      
      // Set form values
      setName(trackData.name || '');
      setDescription(trackData.description || '');
      
      // Handle date (Firebase timestamp to JS Date)
      if (trackData.startTime) {
        const date = trackData.startTime instanceof Date ? 
          trackData.startTime : 
          new Date(trackData.startTime.seconds * 1000);
        setStartDate(date);
      }
      
      setDuration(trackData.duration?.toString() || '60');
      setStatus(trackData.status || 'pending');
      
      // We'll set the selected items after fetching options
      return trackData;
    } catch (error) {
      console.error('Error fetching track:', error);
      setError('Failed to load track data');
    }
  };
  
  const fetchActivities = async () => {
    try {
      const activitiesQuery = query(collection(db, 'activities'));
      const snapshot = await getDocs(activitiesQuery);
      
      const activitiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Activity'
        };
      });
      
      setActivities(activitiesData);
      
      // Get the track data to set selected activities
      const trackDoc = await getDoc(doc(db, 'tracks', id));
      if (trackDoc.exists()) {
        const trackData = trackDoc.data();
        if (trackData.activityIds && Array.isArray(trackData.activityIds)) {
          const selectedOptions = trackData.activityIds
            .map(activityId => {
              const activity = activitiesData.find(a => a.id === activityId);
              return activity ? { value: activity.id, label: activity.name } : null;
            })
            .filter(Boolean) as {value: string, label: string}[];
          
          setSelectedActivities(selectedOptions);
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };
  
  const fetchLocations = async () => {
    try {
      const locationsQuery = query(collection(db, 'locations'));
      const snapshot = await getDocs(locationsQuery);
      
      const locationsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Location'
        };
      });
      
      setLocations(locationsData);
      
      // Get the track data to set selected locations
      const trackDoc = await getDoc(doc(db, 'tracks', id));
      if (trackDoc.exists()) {
        const trackData = trackDoc.data();
        if (trackData.locationIds && Array.isArray(trackData.locationIds)) {
          const selectedOptions = trackData.locationIds
            .map(locationId => {
              const location = locationsData.find(l => l.id === locationId);
              return location ? { value: location.id, label: location.name } : null;
            })
            .filter(Boolean) as {value: string, label: string}[];
          
          setSelectedLocations(selectedOptions);
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };
  
  const fetchTourGuides = async () => {
    try {
      const guidesQuery = query(
        collection(db, 'tourGuideRequests'),
        where('status', '==', 'approved')
      );
      
      const snapshot = await getDocs(guidesQuery);
      
      const guidesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          fullName: data.fullName || 'Unknown Guide',
          email: data.email || '',
          regions: data.regions || []
        };
      });
      
      setTourGuides(guidesData);
      
      // Get the track data to set selected guide
      const trackDoc = await getDoc(doc(db, 'tracks', id));
      if (trackDoc.exists()) {
        const trackData = trackDoc.data();
        if (trackData.tourGuideId) {
          const guide = guidesData.find(g => g.id === trackData.tourGuideId);
          if (guide) {
            setSelectedGuide({
              value: guide.id,
              label: `${guide.fullName} (${guide.email})`
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tour guides:', error);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name) {
      setError('Track name is required');
      return;
    }
    
    if (!selectedGuide) {
      setError('Please select a tour guide');
      return;
    }
    
    if (!startDate) {
      setError('Start time is required');
      return;
    }
    
    if (selectedActivities.length === 0 && selectedLocations.length === 0) {
      setError('Please select at least one activity or location');
      return;
    }
    
    setSaving(true);
    
    try {
      // Update track document
      const trackData = {
        name,
        description,
        tourGuideId: selectedGuide.value,
        activityIds: selectedActivities.map(a => a.value),
        locationIds: selectedLocations.map(l => l.value),
        startTime: startDate,
        duration: parseInt(duration),
        status,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'tracks', id), trackData);
      
      router.push('/dashboard/tracks');
    } catch (err) {
      console.error('Error updating track:', err);
      setError(err instanceof Error ? err.message : 'Failed to update track. Please try again.');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit}>
        <div className="space-y-12 sm:space-y-16">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
              Edit Track
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              Update track details, activities, locations, and guide assignment
            </p>

            {error && (
              <div className="mt-4 bg-red-50 dark:bg-red-900 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 space-y-8 border-b border-gray-900/10 dark:border-gray-700 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 dark:divide-gray-700 sm:border-t sm:pb-0">
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white sm:pt-1.5">
                  Track Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 dark:bg-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white sm:pt-1.5">
                  Description
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 dark:bg-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-lg sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="activities" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white sm:pt-1.5">
                  Activities
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <Select
                    id="activities"
                    isMulti
                    options={activities.map(activity => ({
                      value: activity.id,
                      label: activity.name
                    }))}
                    value={selectedActivities}
                    onChange={(selected) => setSelectedActivities(selected as {value: string, label: string}[])}
                    classNames={selectClassNames}
                    classNamePrefix="select"
                    placeholder="Select activities..."
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="locations" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white sm:pt-1.5">
                  Locations
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <Select
                    id="locations"
                    isMulti
                    options={locations.map(location => ({
                      value: location.id,
                      label: location.name
                    }))}
                    value={selectedLocations}
                    onChange={(selected) => setSelectedLocations(selected as {value: string, label: string}[])}
                    classNames={selectClassNames}
                    classNamePrefix="select"
                    placeholder="Select locations..."
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="tourGuide" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white sm:pt-1.5">
                  Tour Guide <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <Select
                    id="tourGuide"
                    options={tourGuides.map(guide => ({
                      value: guide.id,
                      label: `${guide.fullName} (${guide.email})`
                    }))}
                    value={selectedGuide}
                    onChange={(selected) => setSelectedGuide(selected as {value: string, label: string})}
                    classNames={selectClassNames}
                    classNamePrefix="select"
                    placeholder="Select a tour guide..."
                    isClearable
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="startTime" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white sm:pt-1.5">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <DatePicker
                    id="startTime"
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                    placeholderText="Select date and time"
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="duration" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white sm:pt-1.5">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <input
                    type="number"
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="15"
                    step="15"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 dark:bg-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white sm:pt-1.5">
                  Status
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 dark:bg-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                  >
                    <option value="pending">Pending</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/tracks')}
            className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 