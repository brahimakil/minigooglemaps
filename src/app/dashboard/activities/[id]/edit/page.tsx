'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MapPinIcon } from '@/components/icons';
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

interface TourGuide {
  id: string;
  name: string;
}

export default function EditActivity() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // Activity state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('active');
  const [type, setType] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [media, setMedia] = useState<string[]>([]);
  const [activityDate, setActivityDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tour guide state
  const [availableTourGuides, setAvailableTourGuides] = useState<TourGuide[]>([]);
  const [selectedTourGuides, setSelectedTourGuides] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // Fetch activity types
        const typesQuery = query(collection(db, 'activityTypes'));
        const typesSnapshot = await getDocs(typesQuery);
        const typesData = typesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setActivityTypes(typesData);
        setLoadingOptions(false);

        // Fetch activity data
        const activityDoc = await getDoc(doc(db, 'activities', id));
        if (!activityDoc.exists()) {
          setError('Activity not found');
          setLoading(false);
          return;
        }

        const activityData = activityDoc.data();

        // Set form state from existing activity
        setName(activityData.name || '');
        setDescription(activityData.description || '');
        setPrice(activityData.price ? activityData.price.toString() : '');
        setStatus(activityData.status || 'active');
        setType(activityData.type || '');
        setLocationName(activityData.locationName || '');
        setLatitude(activityData.latitude || null);
        setLongitude(activityData.longitude || null);
        setExistingImage(activityData.mainImage || null);
        setMedia(activityData.media || []);
        
        // Handle activity date
        if (activityData.activityDate) {
          const date = activityData.activityDate.toDate ? activityData.activityDate.toDate() : new Date(activityData.activityDate);
          setActivityDate(date.toISOString().split('T')[0]);
        }

        // Fetch tour guides
        const tourGuidesQuery = query(
          collection(db, 'tourGuideRequests'),
          where('status', '==', 'approved')
        );
        const tourGuidesSnapshot = await getDocs(tourGuidesQuery);
        const tourGuidesData = tourGuidesSnapshot.docs
          .filter(doc => doc.data().active !== false)
          .map(doc => ({
            id: doc.id,
            name: doc.data().fullName || 'Unknown Guide'
          }));
        setAvailableTourGuides(tourGuidesData);

        // Fetch assigned tour guides for this activity
        const activityGuidesDoc = await getDoc(doc(db, 'activityGuides', id));
        if (activityGuidesDoc.exists()) {
          setSelectedTourGuides(activityGuidesDoc.data().guideIds || []);
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name) {
      setError('Name is required');
      return;
    }

    setSaving(true);

    try {
      let imageUrl = existingImage;

      // If a new image was selected, convert to base64
      if (image) {
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

        if (imageUrl && imageUrl.length > 900000) {
          throw new Error('Image is too large. Please use a smaller image or compress it first.');
        }
      }

      // Convert the date string to a JavaScript Date object
      const selectedDate = activityDate ? new Date(activityDate) : null;

      // Update activity
      await updateDoc(doc(db, 'activities', id), {
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

      // Update tour guide assignments
      await setDoc(doc(db, 'activityGuides', id), {
        guideIds: selectedTourGuides,
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !name) {
    return <div className="text-red-500 p-6 text-center">{error}</div>;
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
          {/* Activity Information Section */}
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
                      {activityTypes.map((actType) => (
                        <option key={actType.id} value={actType.id}>{actType.name}</option>
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

          {/* Location Map Section */}
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Activity Location</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Click on the map to set the activity location.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location on Map
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

          {/* Activity Image Section */}
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Activity Image</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Upload a main image for this activity.
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
                    {existingImage || imagePreview ? 'Change Image' : 'Select Image'}
                  </button>
                  {image && (
                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                      {image.name}
                    </span>
                  )}
                </div>

                {(imagePreview || existingImage) && (
                  <div className="mt-4">
                    <img
                      src={imagePreview || existingImage || ''}
                      alt="Preview"
                      className="h-48 w-auto object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Media Section */}
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

          {/* Tour Guide Assignment Section */}
          <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Assign Tour Guides</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select tour guides to lead this activity.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                {availableTourGuides.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No tour guides available</p>
                ) : (
                  <div className="space-y-2">
                    {availableTourGuides.map(guide => (
                      <div key={guide.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`guide-${guide.id}`}
                          checked={selectedTourGuides.includes(guide.id)}
                          onChange={() => {
                            setSelectedTourGuides(prev =>
                              prev.includes(guide.id)
                                ? prev.filter(gid => gid !== guide.id)
                                : [...prev, guide.id]
                            );
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`guide-${guide.id}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          {guide.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}