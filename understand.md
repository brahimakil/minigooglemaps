# Project Understanding: Admin Next.js Web Application with Firebase

## Project Overview
This is an admin dashboard web application built with Next.js that connects to Firebase for authentication and data storage. The application will allow administrators to manage users, activities, activity types, locations, and category locations. It will feature interactive maps and calendar views with comprehensive statistics.

## Technical Stack
- **Frontend**: Next.js 15.2.3 with React 19
- **Styling**: TailwindCSS 4
- **Authentication**: Firebase Authentication (email/password)
- **Database**: Firebase Firestore
- **Maps**: OpenStreetMap API
- **Charts**: For statistics visualization (to be determined)

## Core Features

### Authentication
- Admin signup/login functionality using Firebase Authentication
- Email and password authentication
- Protected routes (redirect to login if not authenticated)
- Logout functionality
- Route protection (/dashboard requires auth, login page redirects if already authenticated)

### User Management
- View all users
- Edit user details
- Delete users
- User profile management

### Activity Management
- CRUD operations for activities
- Activity fields:
  - Activity name
  - Location (latitude/longitude)
  - Phone number
  - Description
  - Activity type (reference to activity types collection)
  - Price
  - Duration
  - Main image (featured image for the activity)
  - Media (multiple additional photos/videos)
  - Status (pending, active, finished, cancelled)
- Status should automatically update based on duration and current time

### Activity Types Management
- CRUD operations for activity types
- Activity types will be referenced by activities

### Location/Places Management
- CRUD operations for locations
- Location fields:
  - Place name
  - Location coordinates (latitude/longitude)
  - Description
  - Main image (featured image for the location)
  - Media (unlimited additional photos)
  - Phone number
  - Category (reference to category locations collection)

### Category Locations Management
- CRUD operations for location categories (e.g., restaurant, hotel)
- Categories will be referenced by locations

### Dashboard Features
- Interactive map using OpenStreetMap showing all locations and activities
- Filtering options for the map
- Calendar view showing all activities with their scheduled dates
- Comprehensive statistics with various chart types:
  - Pie charts
  - Flow charts
  - Histograms
  - All charts must reflect real-time data from Firestore

## Firebase Implementation Details
- Use Firestore for database (not Firebase Storage)
- Implement proper Firestore indexes for efficient queries
- Set up appropriate Firestore security rules
- Configure Firebase Authentication for admin users

## UI/UX Requirements
- Modern, clean design
- Responsive layout
- Intuitive navigation between different management sections
- Interactive data visualization
- User-friendly forms for data entry

## Data Structure (Firestore Collections)
1. **users** - Admin users with authentication details
2. **appUsers** - End users managed by admins
3. **activities** - All activity entries
4. **activityTypes** - Types/categories for activities
5. **locations** - Places with geographical coordinates
6. **locationCategories** - Categories for locations

## Implementation Considerations
- Proper error handling for all Firebase operations
- Loading states for async operations
- Form validation for all input fields
- Optimistic UI updates for better user experience
- Efficient data fetching and state management
- Proper indexing for complex Firestore queries
- Secure authentication flow
- Responsive design for all screen sizes
