'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createLocationMarker, createActivityMarker } from '@/utils/createMarkerIcons';

// Define custom icons for the map using SVG
const locationIcon = createLocationMarker();
const activityIcon = createActivityMarker();

// Define the location type
interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'location' | 'activity';
  mainImage?: string;
}

export default function MapPreview() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      try {
        // Fetch locations
        const locationsQuery = query(collection(db, 'locations'), limit(10));
        const locationsSnapshot = await getDocs(locationsQuery);
        
        const locationsData = locationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            type: 'location' as const, // Use const assertion to narrow the type
            mainImage: data.mainImage
          };
        })
        .filter(location => location.latitude && location.longitude)
        .filter(Boolean) as Location[];
        
        // Fetch activities with locations
        const activitiesQuery = query(collection(db, 'activities'), limit(10));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        
        const activitiesWithLocation = activitiesSnapshot.docs
          .map(doc => {
            const data = doc.data();
            if (data.latitude && data.longitude) {
              return {
                id: doc.id,
                name: data.name,
                latitude: data.latitude,
                longitude: data.longitude,
                type: 'activity' as const, // Use const assertion to narrow the type
                mainImage: data.mainImage
              };
            }
            return null;
          })
          .filter(Boolean) as Location[];

        setLocations([...locationsData, ...activitiesWithLocation]);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, []);

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Default to Tyre, Lebanon if no locations
  const defaultCenter: [number, number] = [33.2704, 35.2037];
  const mapCenter = locations.length > 0 
    ? [locations[0].latitude, locations[0].longitude] as [number, number]
    : defaultCenter;

  return (
    <div className="h-96 rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map(location => (
          <Marker 
            key={location.id} 
            position={[location.latitude, location.longitude]}
            icon={location.type === 'activity' ? activityIcon : locationIcon}
          >
            <Popup>
              <div>
                <h3 className="font-medium">{location.name}</h3>
                <p className="text-sm text-gray-500">
                  {location.type === 'activity' ? 'Activity' : 'Location'}
                </p>
                {location.mainImage && (
                  <img 
                    src={location.mainImage} 
                    alt={location.name} 
                    className="mt-2 w-full h-24 object-cover rounded"
                  />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 