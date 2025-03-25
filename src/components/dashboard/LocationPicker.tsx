'use client';

import { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { createDefaultMarker } from '@/utils/createMarkerIcons';

// Define the marker icon using SVG
const defaultIcon = createDefaultMarker();

// Set the default icon for all markers
L.Marker.prototype.options.icon = defaultIcon;

// Fix Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

// This component handles map events and updates the marker position
function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ 
  initialLat = 51.505, 
  initialLng = -0.09, 
  onLocationSelect 
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    [initialLat || 51.505, initialLng || -0.09]
  );
  const mapRef = useRef<L.Map | null>(null);

  // Update marker position when initialLat or initialLng change
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
      
      // If map is initialized, pan to the new position
      if (mapRef.current) {
        mapRef.current.setView([initialLat, initialLng], 13);
      }
    }
  }, [initialLat, initialLng]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  const handleMapReady = () => {
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenReady={handleMapReady}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} />
        <MapEvents onLocationSelect={handleLocationSelect} />
      </MapContainer>
    </div>
  );
} 