'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createDefaultMarker } from '@/utils/createMarkerIcons';

// Define the marker icon using SVG
const defaultIcon = createDefaultMarker();

// Set the default icon for all markers
L.Marker.prototype.options.icon = defaultIcon;

interface LocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ 
  initialLat = 33.8938, // Lebanon coordinates (Beirut)
  initialLng = 35.5018, // Lebanon coordinates (Beirut)
  onLocationSelect 
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    [initialLat ?? 33.8938, initialLng ?? 35.5018]
  );
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    // This ensures the map is properly sized after it's mounted
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <div className="w-full h-[300px] md:h-[500px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenReady={(map) => {
          mapRef.current = map.target;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
      </MapContainer>
    </div>
  );
} 