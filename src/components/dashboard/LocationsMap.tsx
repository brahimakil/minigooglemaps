'use client';

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { createLocationMarker } from '@/utils/createMarkerIcons';

// Define custom icon for the map using SVG
const locationIcon = createLocationMarker();

interface Location {
  id: string;
  name: string;
  address?: string;
  category?: string;
  latitude: number;
  longitude: number;
  mainImage?: string;
}

interface LocationsMapProps {
  locations: Location[];
}

export default function LocationsMap({ locations }: LocationsMapProps) {
  // Tyre, Lebanon coordinates
  const tyreCoordinates: [number, number] = [33.2704, 35.2037];
  
  // Filter out locations with invalid coordinates
  const validLocations = locations.filter(
    loc => typeof loc.latitude === 'number' && 
           typeof loc.longitude === 'number' && 
           !isNaN(loc.latitude) && 
           !isNaN(loc.longitude)
  );

  return (
    <div className="h-96 rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        center={tyreCoordinates} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validLocations.map((location) => (
          <Marker 
            key={location.id} 
            position={[location.latitude, location.longitude]}
            icon={locationIcon}
          >
            <Popup>
              <div>
                <h3 className="font-medium">{location.name}</h3>
                {location.address && (
                  <p className="text-sm text-gray-500">{location.address}</p>
                )}
                {location.category && (
                  <p className="text-sm text-gray-500">Category: {location.category}</p>
                )}
                {location.mainImage && (
                  <img 
                    src={location.mainImage} 
                    alt={location.name} 
                    className="mt-2 w-full h-24 object-cover rounded"
                  />
                )}
                <div className="mt-2">
                  <Link 
                    href={`/dashboard/locations/${location.id}/edit`}
                    className="text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    Edit Location
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 