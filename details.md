# Admin Dashboard Project Documentation

## Project Overview

This is a Next.js admin dashboard application that connects to Firebase for authentication and data management. The application allows administrators to manage users, activities, activity types, locations, and category locations. It features interactive maps, calendar views, and comprehensive statistics.

## Tech Stack

- **Frontend**: Next.js 15.2.3 with React 19
- **Styling**: TailwindCSS 4 with dark mode support
- **Authentication**: Firebase Authentication (email/password)
- **Database**: Firebase Firestore
- **Maps**: OpenStreetMap API for map integration
- **Charts**: Chart.js for statistics visualization

## Project Structure

### Root Configuration Files

- **package.json**: Defines project dependencies and scripts
- **next.config.js**: Next.js configuration including image domains and webpack settings
- **tailwind.config.js**: TailwindCSS configuration with dark mode support
- **postcss.config.js**: PostCSS configuration for TailwindCSS
- **tsconfig.json**: TypeScript configuration
- **vercel.json**: Vercel deployment configuration

### Source Code Structure

src/
├── app/ # Next.js App Router pages
│ ├── dashboard/ # Dashboard routes
│ ├── login/ # Login page
│ ├── signup/ # Signup page
│ ├── globals.css # Global CSS
│ ├── layout.tsx # Root layout
│ └── page.tsx # Root page (redirects to login)
├── components/ # Reusable components
│ ├── auth/ # Authentication components
│ ├── dashboard/ # Dashboard-specific components
│ ├── icons/ # Icon components
│ └── layout/ # Layout components
└── lib/ # Utility functions and context
├── context/ # React context providers
└── firebase/ # Firebase configuration and utilities

## Authentication System

The application uses Firebase Authentication for user management. The authentication flow is handled through the `AuthContext` provider, which manages the user state and provides login, signup, and logout functionality.

### Key Authentication Files

- **src/lib/context/auth-context.tsx**: Provides authentication context to the application
- **src/lib/firebase/auth.ts**: Firebase authentication utilities
- **src/components/auth/AuthGuard.tsx**: Component that protects routes requiring authentication
- **src/app/login/page.tsx**: Login page component
- **src/app/signup/page.tsx**: Signup page component

### Authentication Flow

1. Users can sign up with email and password
2. Users can log in with email and password
3. Protected routes redirect to login if not authenticated
4. Authenticated users are redirected to dashboard from login/signup pages

## Routing Structure

The application uses Next.js App Router for routing:

- **/** - Redirects to /login
- **/login** - User login page
- **/signup** - User registration page
- **/dashboard** - Main dashboard (protected)
- **/dashboard/users** - User management
- **/dashboard/activities** - Activity management
- **/dashboard/activities/new** - Create new activity
- **/dashboard/activity-types** - Activity types management
- **/dashboard/activity-types/new** - Create new activity type
- **/dashboard/locations** - Location management
- **/dashboard/locations/new** - Create new location
- **/dashboard/location-categories** - Location categories management
- **/dashboard/calendar** - Calendar view
- **/dashboard/statistics** - Statistics and charts

## Layout System

The application uses a nested layout structure:

1. **Root Layout** (`src/app/layout.tsx`): Provides the base HTML structure and context providers
2. **Dashboard Layout** (`src/app/dashboard/layout.tsx`): Provides the dashboard structure with header and sidebar

### Layout Components

- **Header** (`src/components/layout/Header.tsx`): Top navigation bar with user menu and theme toggle
- **Sidebar** (`src/components/layout/Sidebar.tsx`): Side navigation with links to different sections

## Theme System

The application supports light and dark modes through a theme context:

- **src/lib/context/theme-context.tsx**: Provides theme state and toggle functionality
- Theme preference is stored in localStorage
- System preference is used as fallback

## Firebase Integration

Firebase is used for authentication and data storage:

- **src/lib/firebase/config.ts**: Firebase configuration and initialization
- **src/lib/firebase/auth.ts**: Authentication utilities
- **src/lib/firebase/firestore.ts**: Firestore database utilities

### Data Models

1. **Users**: Admin users with authentication details
   - Email, password, profile information
   - Authentication managed by Firebase Auth

2. **App Users**: End users managed by admins
   - User profile information
   - Preferences and settings
   - Activity history

3. **Activities**: Activity entries with details like:
   - Name
   - Location (latitude/longitude)
   - Phone number
   - Description
   - Activity type (reference to activity types collection)
   - Price
   - Duration
   - Main image (featured image)
   - Media (multiple additional photos/videos)
   - Status (pending, active, finished, cancelled)
   - Status automatically updates based on duration and current time

4. **Activity Types**: Categories for activities
   - Name
   - Description
   - Icon

5. **Locations**: Places with geographical coordinates
   - Place name
   - Location coordinates (latitude/longitude)
   - Description
   - Main image (featured image)
   - Media (additional photos)
   - Phone number
   - Category (reference to location categories)

6. **Location Categories**: Categories for locations
   - Name (e.g., restaurant, hotel)
   - Description
   - Icon

### Data Relationships

- Activities reference Activity Types
- Locations reference Location Categories
- Activities can be associated with specific Locations
- Users can be associated with Activities (for tracking purposes)

## Key Features

### Dashboard Overview

The main dashboard (`/dashboard`) displays:
- Summary statistics (users, activities, locations)
- Recent activities
- Quick access to main sections
- Interactive map preview showing locations and activities

### User Management

The users section (`/dashboard/users`) allows:
- Viewing all users
- Editing user details
- Deleting users
- User profile management

### Activity Management

The activities section (`/dashboard/activities`) provides:
- List of all activities
- Filtering and sorting options
- Creating, editing, and deleting activities
- Activity status management
- Media management for activities

### Location Management

The locations section (`/dashboard/locations`) offers:
- List of all locations
- Map view of locations
- Creating, editing, and deleting locations
- Media management for locations

### Calendar View

The calendar page (`/dashboard/calendar`) shows:
- Monthly calendar view
- Activities scheduled on each day
- Navigation between months
- Quick access to activity details

### Statistics

The statistics page (`/dashboard/statistics`) displays:
- Key metrics (total users, activities, locations)
- Charts for data visualization:
  - Activity types distribution
  - Monthly activity trends
  - Price range distribution
  - Popular locations

## Component Structure

### Page Components

Each page follows a similar structure:
1. Import necessary dependencies
2. Define state variables and hooks
3. Implement data fetching logic
4. Define event handlers
5. Return JSX for rendering

Example from `src/app/dashboard/page.tsx`:
```typescript
export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    activities: 0,
    locations: 0,
    activityTypes: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch stats
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const activitiesSnapshot = await getDocs(collection(db, 'activities'));
        const locationsSnapshot = await getDocs(collection(db, 'locations'));
        const activityTypesSnapshot = await getDocs(collection(db, 'activityTypes'));

        setStats({
          users: usersSnapshot.size,
          activities: activitiesSnapshot.size,
          locations: locationsSnapshot.size,
          activityTypes: activityTypesSnapshot.size,
        });

        // Fetch recent activities
        const recentActivitiesQuery = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentActivitiesSnapshot = await getDocs(recentActivitiesQuery);
        const recentActivitiesData = recentActivitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRecentActivities(recentActivitiesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);
  
  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

### Reusable Components

The application includes several reusable components:

- **MediaUploader**: For uploading and managing media files
  - Handles file selection and preview
  - Converts files to base64 for storage
  - Manages multiple file uploads

- **AuthGuard**: For protecting routes
  - Checks authentication status
  - Redirects unauthenticated users
  - Shows loading state during auth check

- **LocationPicker**: For selecting locations on a map
  - Interactive map interface
  - Marker placement
  - Coordinate capture

- **Icons**: SVG icons used throughout the application
  - Consistent styling
  - Accessibility attributes
  - Size customization

## Form Handling

Forms are implemented using controlled components:

1. State variables for form fields
2. Change handlers to update state
3. Submit handler to process form submission
4. Validation logic
5. Error handling and display

Example from login form:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      // Force a hard navigation to dashboard
      window.location.href = '/dashboard';
    }
  } catch (err) {
    setError('An unexpected error occurred. Please try again.');
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

## Data Fetching

Data is fetched from Firebase Firestore using:

1. React's `useEffect` hook for initial data loading
2. Firebase queries to filter and sort data
3. State management to store and update data
4. Loading states to handle asynchronous operations

Example:
```typescript
useEffect(() => {
  async function fetchData() {
    const querySnapshot = await getDocs(collection(db, 'activities'));
    const activitiesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setActivities(activitiesData);
    setLoading(false);
  }
  
  fetchData();
}, []);
```

## Firebase Data Operations

The application performs various operations on Firebase data:

### Creating Documents

```typescript
const activityData = {
  name,
  description,
  price: price ? parseFloat(price) : 0,
  status,
  type,
  locationName,
  latitude: latitude || null,
  longitude: longitude || null,
  mainImage: imageUrl,
  media: media,
  activityDate: selectedDate,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

await addDoc(collection(db, 'activities'), activityData);
```

### Reading Documents

```typescript
const querySnapshot = await getDocs(collection(db, 'activities'));
const activitiesData = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Updating Documents

```typescript
await updateDoc(doc(db, 'activities', id), {
  name: updatedName,
  description: updatedDescription,
  updatedAt: serverTimestamp()
});
```

### Deleting Documents

```typescript
await deleteDoc(doc(db, 'activities', id));
```

## Error Handling

The application implements error handling through:

1. Try-catch blocks for async operations
2. Error state variables to store error messages
3. UI components to display errors to users
4. Form validation to prevent invalid submissions

Example error handling:
```typescript
try {
  // Attempt operation
  await addDoc(collection(db, 'activities'), activityData);
  router.push('/dashboard/activities');
} catch (err) {
  console.error('Error creating activity:', err);
  setError(err instanceof Error ? err.message : 'Failed to create activity. Please try again.');
} finally {
  setLoading(false);
}
```

## Responsive Design

The UI is responsive and adapts to different screen sizes:

1. Mobile-first approach with Tailwind's responsive utilities
2. Collapsible sidebar for mobile devices
3. Responsive grid layouts
4. Adaptive typography and spacing

Example responsive component:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Grid items */}
</div>
```

## Dark Mode Implementation

Dark mode is implemented using:

1. Tailwind's dark mode class strategy
2. Theme context to manage theme state
3. Toggle buttons in header and login/signup pages
4. Persistent theme preference in localStorage

Example dark mode toggle:
```tsx
<button
  type="button"
  className="rounded-full bg-white dark:bg-gray-800 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
  onClick={toggleTheme}
>
  {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
</button>
```

## Performance Considerations

The application includes several performance optimizations:

1. Next.js image optimization
2. Code splitting through dynamic imports
3. Efficient data fetching with Firebase queries
4. Optimistic UI updates for better user experience
5. Lazy loading of components and data

Example of dynamic import:
```typescript
const MapPreview = dynamic(() => import('@/components/dashboard/MapPreview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <MapPinIcon className="h-8 w-8 text-gray-400" />
    </div>
  ),
});
```

## Deployment

The application is configured for deployment on Vercel:

1. `vercel.json` configuration file
2. Build optimization settings
3. Environment variable management
4. Image optimization settings

## Security Considerations

Security measures include:

1. Protected routes with authentication checks
2. Secure Firebase configuration
3. Form validation to prevent malicious inputs
4. Proper error handling to avoid exposing sensitive information
5. Environment variable management for sensitive keys

