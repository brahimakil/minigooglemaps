'use client';

import L from 'leaflet';

// Create a function to generate a data URL for a marker icon
function createMarkerIcon(color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="${color}" stroke="#000" stroke-width="1" d="M12.5 0C5.596 0 0 5.596 0 12.5C0 19.404 12.5 41 12.5 41S25 19.404 25 12.5C25 5.596 19.404 0 12.5 0Z"/>
      <circle fill="white" cx="12.5" cy="12.5" r="5"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Create a function to generate a data URL for a shadow
function createMarkerShadow(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="41" height="41" viewBox="0 0 41 41">
      <ellipse fill="rgba(0,0,0,0.3)" cx="20.5" cy="39" rx="10" ry="2"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Default marker icon
export const defaultIcon = L.icon({
  iconUrl: createMarkerIcon('#3388ff'),
  shadowUrl: createMarkerShadow(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Activity marker icon
export const activityIcon = L.icon({
  iconUrl: createMarkerIcon('#4ade80'), // Green
  shadowUrl: createMarkerShadow(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Location marker icon
export const locationIcon = L.icon({
  iconUrl: createMarkerIcon('#f97316'), // Orange
  shadowUrl: createMarkerShadow(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}); 