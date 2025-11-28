'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Force dynamic rendering
export const runtime = 'edge';

// Define the complete Activity interface
interface Activity {
  id: string;
  name: string;
  description?: string;
  price?: number;
  status?: string;
  type?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  mainImage?: string;
  media?: string[];
  activityDate?: any;
  tourGuideIds?: string[]; // Added this field
}

export default function EditActivity() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  // Activity state
  const [activity, setActivity] = useState<Activity | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('active');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tour guide state
  const [availableTourGuides, setAvailableTourGuides] = useState<{ id: string; name: string }[]>([]);
  const [selectedTourGuides, setSelectedTourGuides] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch activity data
        const activityDoc = await getDoc(doc(db, 'activities', id));
        if (!activityDoc.exists()) {
          setError('Activity not found');
          return;
        }
        
        const activityData = { id: activityDoc.id, ...activityDoc.data() } as Activity;
        setActivity(activityData);
        
        // Set form state
        setName(activityData.name || '');
        setDescription(activityData.description || '');
        setPrice(activityData.price ? activityData.price.toString() : '');
        setStatus(activityData.status || 'active');
        setType(activityData.type || '');
        
        // Fetch tour guides from tourGuideRequests collection
        const tourGuidesQuery = query(
          collection(db, 'tourGuideRequests'),
          where('status', '==', 'approved'),
          where('active', '!=', false)
        );
        
        const tourGuidesSnapshot = await getDocs(tourGuidesQuery);
        const tourGuidesData = tourGuidesSnapshot.docs.map(doc => ({
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

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name) {
      setError('Name is required');
      return;
    }
    
    try {
      // Update activity
      await updateDoc(doc(db, 'activities', id), {
        name,
        description,
        price: price ? parseFloat(price) : 0,
        status,
        type,
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
      setError('Failed to update activity');
    }
  };

  const handleTourGuideChange = (guideId: string) => {
    setSelectedTourGuides(prev => 
      prev.includes(guideId)
        ? prev.filter(id => id !== guideId)
        : [...prev, guideId]
    );
  };

  if (loading) {
    return <div className="text-center p-6">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-6">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Activity</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Assign Tour Guides</h3>
          {availableTourGuides.length === 0 ? (
            <p className="text-gray-500">No tour guides available</p>
          ) : (
            <div className="space-y-2">
              {availableTourGuides.map(guide => (
                <div key={guide.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`guide-${guide.id}`}
                    checked={selectedTourGuides.includes(guide.id)}
                    onChange={() => handleTourGuideChange(guide.id)}
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
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}