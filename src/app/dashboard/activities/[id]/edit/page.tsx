'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { ActivityIcon, MapPinIcon } from '@/components/icons';
import dynamic from 'next/dynamic';
import MediaUploader from '@/components/dashboard/MediaUploader';

// Import the map component dynamically to avoid SSR issues
const LocationPicker = dynamic(() => import('@/components/dashboard/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <MapPinIcon className="h-8 w-8 text-gray-400" />
    </div>
  ),
});

interface ActivityType {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface ActivityEditProps {
  params: {
    id: string;
  };
}

export default function EditActivity({ params }: ActivityEditProps) {
  const { id } = params;
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('active');
  const [type, setType] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [media, setMedia] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [activityDate, setActivityDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const activityDoc = await getDoc(doc(db, 'activities', id));
        if (activityDoc.exists()) {
          const data = activityDoc.data();
          setName(data.name || '');
          setDescription(data.description || '');
          setPrice(data.price ? data.price.toString() : '');
          setStatus(data.status || 'active');
          setType(data.type || '');
          setLocationName(data.locationName || '');
          setLatitude(data.latitude || null);
          setLongitude(data.longitude || null);
          setCurrentImage(data.mainImage || null);
          setMedia(data.media || []);
          
          // Handle activity date
          if (data.activityDate) {
            // If it's a Firestore timestamp
            if (data.activityDate.toDate) {
              const date = data.activityDate.toDate();
              setActivityDate(date.toISOString().split('T')[0]);
            } 
            // If it's a JavaScript Date object stored as seconds/nanoseconds
            else if (data.activityDate.seconds) {
              const date = new Date(data.activityDate.seconds * 1000);
              setActivityDate(date.toISOString().split('T')[0]);
            }
            // If it's already a JavaScript Date object
            else if (data.activityDate instanceof Date) {
              setActivityDate(data.activityDate.toISOString().split('T')[0]);
            }
          }
        } else {
          setError('Activity not found');
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Failed to load activity');
      } finally {
        setLoading(false);
      }
    }

    async function fetchOptions() {
      try {
        // Fetch activity types
        const typesQuery = query(collection(db, 'activityTypes'));
        const typesSnapshot = await getDocs(typesQuery);
        const typesData = typesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        
        setActivityTypes(typesData);
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoadingOptions(false);
      }
    }
    
    fetchActivity();
    fetchOptions();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleMediaChange = (mediaUrls: string[]) => {
    setMedia(mediaUrls);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name) {
      setError('Name is required');
      return;
    }
    
    setSaving(true);
    
    try {
      let imageUrl = currentImage;
      
      if (image) {
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
          reader.readAsDataURL(image);
        });
      }
      
      // Check if the base64 string is too large (Firestore has a 1MB document limit)
      if (imageUrl && imageUrl.length > 900000) { // Leave some room for other fields
        throw new Error('Image is too large. Please use a smaller image or compress it first.');
      }
      
      // Convert the date string to a JavaScript Date object
      const selectedDate = new Date(activityDate);
      
      // Direct Firestore update instead of API call
      const activityRef = doc(db, 'activities', id);
      await updateDoc(activityRef, {
        name,
        description,
        price: price ? parseFloat(price) : 0,
        status,
        type,
        locationName,
        latitude: latitude || null,
        longitude: longitude || null,
        mainImage: imageUrl,
        media: media,
        activityDate: selectedDate,
        updatedAt: serverTimestamp()
      });
      
      router.push('/dashboard/activities');
    } catch (err) {
      console.error('Error updating activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to update activity');
      setSaving(false);
    }
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Activity</h1>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Activity Information</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Basic information about the activity.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="coming_soon">Coming Soon</option>
                    </select>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Activity Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      disabled={loadingOptions}
                    >
                      <option value="">Select a type</option>
                      {activityTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location Name
                    </label>
                    <input
                      type="text"
                      name="locationName"
                      id="locationName"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Enter the location name"
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="activityDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Activity Date
                    </label>
                    <input
                      type="date"
                      name="activityDate"
                      id="activityDate"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Activity Location</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Click on the map to set the activity location (optional).
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location on Map (Optional)
                  </label>
                  <div className="h-[500px] w-full">
                    <LocationPicker
                      initialLat={latitude}
                      initialLng={longitude}
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Click on the map to select the location.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Activity Image</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Update the main image for this activity.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="flex items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Change Image
                  </button>
                  {image && (
                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                      {image.name}
                    </span>
                  )}
                </div>
                
                {(imagePreview || currentImage) && (
                  <div className="mt-4">
                    <img
                      src={imagePreview || currentImage || ''}
                      alt="Preview"
                      className="h-48 w-auto object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Additional Media</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Upload additional images and videos for this activity.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <MediaUploader 
                  folderPath="activities/media"
                  existingMedia={media}
                  onMediaChange={handleMediaChange} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 