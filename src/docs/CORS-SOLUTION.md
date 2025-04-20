# Firebase Storage CORS Issue Solution

## Problem

When developing locally with Firebase Storage, you may encounter CORS (Cross-Origin Resource Sharing) errors when attempting to load images or other assets from Firebase Storage. This typically manifests as errors like:

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

## Solution

We've implemented a solution that uses inline base64-encoded SVG images as fallbacks when Firebase Storage URLs fail to load in development environments. This approach:

1. Prevents CORS errors from breaking the UI
2. Shows placeholder images instead of broken image links
3. Automatically works in production without any changes

## Implementation

The solution consists of:

1. A utility function (`createSafeImageUrl`) that detects Firebase Storage URLs and returns placeholder images in development
2. A React component (`SafeImage`) that uses this utility and handles image loading errors
3. Base64-encoded SVG placeholder images that work without external requests

## Usage

Instead of using standard `<img>` tags for Firebase Storage images, use our `SafeImage` component:

```jsx
import SafeImage from '@/components/SafeImageComponent';

// In your component:
<SafeImage 
  src={firebaseImageUrl} 
  alt="Description" 
  className="your-classes" 
/>
```

## Configuring Firebase Storage CORS (for Production)

For production, you should properly configure CORS for your Firebase Storage bucket:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Log in to Firebase: `firebase login`
3. Create a CORS configuration file named `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

4. Apply the configuration to your bucket:

```bash
gsutil cors set cors.json gs://YOUR-STORAGE-BUCKET-NAME
```

This will allow GET requests from any origin, which is suitable for public assets. 