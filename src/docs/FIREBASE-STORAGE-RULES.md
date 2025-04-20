# Firebase Storage Rules Setup

## Problem

You're experiencing CORS (Cross-Origin Resource Sharing) errors when trying to upload files to Firebase Storage from your local development environment. This happens because Firebase Storage requires proper security rules to allow uploads and downloads from specific origins.

## Solution: Set Up Firebase Storage Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`minimaps-1c488`)
3. From the left navigation menu, click on "Storage"
4. Click on the "Rules" tab
5. Replace the existing rules with the following:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all objects without requiring authentication
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow write to specific paths with authentication
    match /tour-guides/{allPaths=**} {
      allow write: if request.auth != null;
    }
    
    match /activities/{allPaths=**} {
      allow write: if request.auth != null;
    }
    
    match /locations/{allPaths=**} {
      allow write: if request.auth != null;
    }
    
    match /users/{userId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. Click "Publish" to save the rules

## Configure CORS for Firebase Storage

Additionally, you need to configure CORS for your Firebase Storage bucket:

1. Install the Google Cloud SDK: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2. Log in with your Google account: `gcloud auth login`
3. Create a file named `cors.json` with the following content:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

4. Apply the CORS configuration to your bucket:

```bash
gsutil cors set cors.json gs://minimaps-1c488.firebasestorage.app
```

## Temporary Solution

For development purposes, we've implemented a workaround in the code that:

1. Detects when you're in a development environment
2. Uses a base64-encoded placeholder image instead of uploading to Firebase Storage
3. Still creates the database record with this placeholder image

This allows you to continue developing and testing without constantly encountering CORS errors.

## For Production

In production, make sure to set up both the Storage Rules and CORS configuration as described above. This will ensure that:

1. Your users can upload images to Firebase Storage
2. The uploaded images can be displayed in your application
3. The security rules protect your storage from unauthorized access 