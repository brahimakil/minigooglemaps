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

interface LocationSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
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
  initialLat,
  initialLng,
  onLocationSelect 
}: LocationPickerProps) {
  const fallbackCenter: [number, number] = [33.8938, 35.5018]; // Beirut, Lebanon
  const [position, setPosition] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : fallbackCenter
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const hasSetInitialLocation = useRef(false);

  // Update marker position when initialLat or initialLng change
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
      hasSetInitialLocation.current = true;
      
      // If map is initialized, pan to the new position
      if (mapRef.current) {
        mapRef.current.setView([initialLat, initialLng], 13);
      }
    }
  }, [initialLat, initialLng]);

  // Try to use browser geolocation if no initial coordinates are provided
  useEffect(() => {
    if (initialLat || initialLng || hasSetInitialLocation.current) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        hasSetInitialLocation.current = true;
        onLocationSelect(lat, lng);
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 13);
        }
      },
      () => {
        // Keep fallback center if user denies or geolocation fails
        if (mapRef.current) {
          mapRef.current.setView(fallbackCenter, 13);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [initialLat, initialLng, onLocationSelect]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
    }
  };

  const handleMapReady = () => {
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Search failed. Please try again.');
      }

      const results = (await response.json()) as LocationSearchResult[];
      setSearchResults(results);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchResultSelect = (result: LocationSearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    handleLocationSelect(lat, lng);
    setSearchResults([]);
    setSearchQuery(result.display_name);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        handleLocationSelect(lat, lng);
      },
      () => {
        setSearchError('Unable to get your current location');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="w-full rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search location (city, address, landmark)"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              disabled={searchLoading}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Use my location
            </button>
          </div>
        </div>

        {searchError && (
          <p className="mt-2 text-xs text-red-600">{searchError}</p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-2 max-h-40 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSearchResultSelect(result)}
                className="block w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {result.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-96 w-full">
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
    </div>
  );
} 