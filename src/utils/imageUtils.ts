/**
 * Utility functions for handling images
 */

/**
 * Base64 encoded placeholder image for use when actual images fail to load
 * This is a simple gray image with an icon indicating an image is missing
 */
export const PLACEHOLDER_IMAGE_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNzUgNTZIODhWNjlINzVWNTZaIiBmaWxsPSIjNkI3MjgwIi8+PHBhdGggZD0iTTExMiA1NkgxMjVWNjlIMTEyVjU2WiIgZmlsbD0iIzZCNzI4MCIvPjxwYXRoIGQ9Ik04MSAxMjVDODEgMTE1LjA1OSA4OS4wNTg5IDEwNyA5OSAxMDdIMTAxQzExMC45NDEgMTA3IDExOSAxMTUuMDU5IDExOSAxMjVWMTM4SDgxVjEyNVoiIGZpbGw9IiM2QjcyODAiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUwIDYzQzUwIDU1LjgyMDMgNTUuODIwMyA1MCA2MyA1MEgxMzdDMTQ0LjE4IDUwIDE1MCA1NS44MjAzIDE1MCA2M1YxMzdDMTUwIDE0NC4xOCAxNDQuMTggMTUwIDEzNyAxNTBINjNDNTUuODIwMyAxNTAgNTAgMTQ0LjE4IDUwIDEzN1Y2M1pNNjMgNTZDNTkuMTM0IDU2IDU2IDU5LjEzNCA1NiA2M1YxMzdDNTYgMTQwLjg2NiA1OS4xMzQgMTQ0IDYzIDE0NEgxMzdDMTQwLjg2NiAxNDQgMTQ0IDE0MC44NjYgMTQ0IDEzN1Y2M0MxNDQgNTkuMTM0IDE0MC44NjYgNTYgMTM3IDU2SDYzWiIgZmlsbD0iIzZCNzI4MCIvPjwvc3ZnPg==';

/**
 * Creates a safe image URL with fallback handling for Firebase Storage images
 * that might have CORS issues in development
 * 
 * @param url - The original image URL (likely from Firebase Storage)
 * @returns Either the original URL or a fallback image URL if it's a Firebase Storage URL
 */
export function createSafeImageUrl(url: string): string {
  if (!url) {
    return PLACEHOLDER_IMAGE_DATA_URL; // Default fallback
  }

  // Check if it's a Firebase Storage URL
  if (url.includes('firebasestorage.googleapis.com')) {
    // In development, Firebase Storage URLs might have CORS issues
    if (process.env.NODE_ENV === 'development') {
      // Return a data URL placeholder image
      return PLACEHOLDER_IMAGE_DATA_URL;
    }
  }

  // Return the original URL for production or non-Firebase Storage URLs
  return url;
}

/**
 * Function to create image props with error handling
 * This is used by the SafeImage component
 * 
 * @param props - Image props including src, alt, className, etc.
 * @returns Props object for an img element with error handling included
 */
export function createSafeImageProps(options: {
  src?: string;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  [key: string]: any;
}): Record<string, any> {
  const { 
    src, 
    alt = 'Image', 
    className = '',
    fallbackSrc = PLACEHOLDER_IMAGE_DATA_URL,
    ...rest 
  } = options;
  
  // Use the safe URL function first
  const safeUrl = createSafeImageUrl(src || '');
  
  // Create the onError handler
  const onError = (e: Event) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== fallbackSrc) {
      target.src = fallbackSrc;
    }
  };
  
  // Return all properties needed for the img element
  return {
    src: safeUrl,
    alt,
    className,
    onError,
    ...rest
  };
} 