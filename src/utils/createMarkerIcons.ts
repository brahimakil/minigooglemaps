'use client';

// This utility creates SVG-based marker icons for maps
import L from 'leaflet';

// Create a default marker icon (blue)
export function createDefaultMarker() {
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="#2563EB" stroke="#ffffff" stroke-width="1" d="M12.5 0C5.596 0 0 5.596 0 12.5C0 19.404 12.5 41 12.5 41S25 19.404 25 12.5C25 5.596 19.404 0 12.5 0Z" />
      <circle fill="#ffffff" cx="12.5" cy="12.5" r="5" />
    </svg>
  `;
  
  const svgUrl = 'data:image/svg+xml;base64,' + btoa(svgTemplate);
  
  return L.icon({
    iconUrl: svgUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

// Create a location marker (green)
export function createLocationMarker() {
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle fill="#10B981" stroke="#ffffff" stroke-width="2" cx="16" cy="16" r="14" />
      <path fill="#ffffff" d="M16 8C12.13 8 9 11.13 9 15C9 20.25 16 24 16 24C16 24 23 20.25 23 15C23 11.13 19.87 8 16 8ZM16 17.5C14.62 17.5 13.5 16.38 13.5 15C13.5 13.62 14.62 12.5 16 12.5C17.38 12.5 18.5 13.62 18.5 15C18.5 16.38 17.38 17.5 16 17.5Z" />
    </svg>
  `;
  
  const svgUrl = 'data:image/svg+xml;base64,' + btoa(svgTemplate);
  
  return L.icon({
    iconUrl: svgUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

// Create an activity marker (orange)
export function createActivityMarker() {
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle fill="#F59E0B" stroke="#ffffff" stroke-width="2" cx="16" cy="16" r="14" />
      <path fill="#ffffff" d="M16 8C12.13 8 9 11.13 9 15C9 20.25 16 24 16 24C16 24 23 20.25 23 15C23 11.13 19.87 8 16 8ZM16 17.5C14.62 17.5 13.5 16.38 13.5 15C13.5 13.62 14.62 12.5 16 12.5C17.38 12.5 18.5 13.62 18.5 15C18.5 16.38 17.38 17.5 16 17.5Z" />
    </svg>
  `;
  
  const svgUrl = 'data:image/svg+xml;base64,' + btoa(svgTemplate);
  
  return L.icon({
    iconUrl: svgUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
} 