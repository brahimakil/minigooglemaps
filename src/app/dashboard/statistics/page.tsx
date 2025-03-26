'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CalendarIcon, 
  ActivityIcon, 
  TagIcon, 
  MapPinIcon,
  TrendingUpIcon,
  ClockIcon,
  UserIcon
} from '@/components/icons';
import dynamic from 'next/dynamic';

// Import charts dynamically to avoid SSR issues
const BarChart = dynamic(() => import('@/components/dashboard/charts/BarChart'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});
const LineChart = dynamic(() => import('@/components/dashboard/charts/LineChart'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});
const PieChart = dynamic(() => import('@/components/dashboard/charts/PieChart'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});
const HeatMap = dynamic(() => import('@/components/dashboard/charts/HeatMap'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

interface ActivityData {
  id: string;
  name: string;
  type: string;
  status: string;
  price: number;
  createdAt: Timestamp;
  activityDate?: Timestamp;
  locationName?: string;
}

interface ActivityTypeData {
  id: string;
  name: string;
  count: number;
}

interface LocationData {
  id: string;
  name: string;
  count: number;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface PriceRangeData {
  range: string;
  count: number;
}

interface UserActivityData {
  activityName: string;
  userCount: number;
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [activityCount, setActivityCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [locationCount, setLocationCount] = useState(0);
  const [activityTypeCount, setActivityTypeCount] = useState(0);
  const [activeActivities, setActiveActivities] = useState(0);
  const [draftActivities, setDraftActivities] = useState(0);
  const [averagePrice, setAveragePrice] = useState(0);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeData[]>([]);
  const [popularLocations, setPopularLocations] = useState<LocationData[]>([]);
  const [monthlyActivities, setMonthlyActivities] = useState<MonthlyData[]>([]);
  const [priceRanges, setPriceRanges] = useState<PriceRangeData[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState(0);
  const [pastActivities, setPastActivities] = useState(0);
  const [userActivitiesData, setUserActivitiesData] = useState<UserActivityData[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [avgUsersPerActivity, setAvgUsersPerActivity] = useState(0);

  useEffect(() => {
    async function fetchStatistics() {
      try {
        setLoading(true);
        
        // Fetch basic counts
        const usersSnapshot = await getDocs(collection(db, 'appUsers'));
        const activitiesSnapshot = await getDocs(collection(db, 'activities'));
        const locationsSnapshot = await getDocs(collection(db, 'locations'));
        const activityTypesSnapshot = await getDocs(collection(db, 'activityTypes'));
        
        setUserCount(usersSnapshot.size);
        setActivityCount(activitiesSnapshot.size);
        setLocationCount(locationsSnapshot.size);
        setActivityTypeCount(activityTypesSnapshot.size);
        
        // Process activities data
        const activities: ActivityData[] = [];
        let priceSum = 0;
        let activeCount = 0;
        let draftCount = 0;
        
        const today = new Date();
        let upcomingCount = 0;
        let pastCount = 0;
        
        activitiesSnapshot.forEach(doc => {
          const data = doc.data() as ActivityData;
          data.id = doc.id;
          activities.push(data);
          
          // Calculate price average
          if (data.price) {
            priceSum += data.price;
          }
          
          // Count by status
          if (data.status === 'active') {
            activeCount++;
          } else if (data.status === 'draft') {
            draftCount++;
          }
          
          // Count upcoming vs past activities
          if (data.activityDate) {
            const date = data.activityDate.toDate ? 
              data.activityDate.toDate() :
              data.activityDate instanceof Date ? 
                data.activityDate : 
                new Date(data.activityDate.seconds * 1000);
              
            if (date > today) {
              upcomingCount++;
            } else {
              pastCount++;
            }
          }
        });
        
        setActiveActivities(activeCount);
        setDraftActivities(draftCount);
        setAveragePrice(activities.length > 0 ? Math.round((priceSum / activities.length) * 100) / 100 : 0);
        setUpcomingActivities(upcomingCount);
        setPastActivities(pastCount);
        
        // Process activity types data
        const activityTypesData: ActivityTypeData[] = [];
        const activityTypeMap = new Map<string, { id: string; name: string; count: number }>();
        
        // First, get all activity types
        activityTypesSnapshot.forEach(doc => {
          const data = doc.data();
          activityTypeMap.set(doc.id, { id: doc.id, name: data.name, count: 0 });
        });
        
        // Then count activities by type
        activities.forEach(activity => {
          if (activity.type && activityTypeMap.has(activity.type)) {
            const typeData = activityTypeMap.get(activity.type)!;
            typeData.count += 1;
          }
        });
        
        // Convert map to array
        activityTypeMap.forEach(typeData => {
          activityTypesData.push(typeData);
        });
        
        // Sort by count (descending)
        activityTypesData.sort((a, b) => b.count - a.count);
        setActivityTypes(activityTypesData);
        
        // Process locations data
        const locationsData: LocationData[] = [];
        const locationMap = new Map<string, { id: string; name: string; count: number }>();
        
        // First, get all locations
        locationsSnapshot.forEach(doc => {
          const data = doc.data();
          locationMap.set(doc.id, { id: doc.id, name: data.name, count: 0 });
        });
        
        // Then count activities by location
        activities.forEach(activity => {
          if (activity.locationName && locationMap.has(activity.locationName)) {
            const locationData = locationMap.get(activity.locationName)!;
            locationData.count += 1;
          }
        });
        
        // Convert map to array
        locationMap.forEach(locationData => {
          locationsData.push(locationData);
        });
        
        // Sort by count (descending)
        locationsData.sort((a, b) => b.count - a.count);
        setPopularLocations(locationsData);
        
        // Process monthly data
        const monthlyData: MonthlyData[] = [];
        const monthMap = new Map<string, number>();
        
        // Initialize all months
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        months.forEach(month => {
          monthMap.set(month, 0);
        });
        
        // Count activities by month
        activities.forEach(activity => {
          if (activity.createdAt) {
            const date = activity.createdAt.toDate ? 
              activity.createdAt.toDate() :
              activity.createdAt instanceof Date ? 
                activity.createdAt : 
                new Date(activity.createdAt.seconds * 1000);
            const month = months[date.getMonth()];
            monthMap.set(month, (monthMap.get(month) || 0) + 1);
          }
        });
        
        // Convert map to array
        months.forEach(month => {
          monthlyData.push({
            month,
            count: monthMap.get(month) || 0
          });
        });
        
        setMonthlyActivities(monthlyData);
        
        // Process price ranges
        const priceRangeData: PriceRangeData[] = [];
        const priceRanges = [
          { range: '$0', min: 0, max: 0 },
          { range: '$1-$50', min: 1, max: 50 },
          { range: '$51-$100', min: 51, max: 100 },
          { range: '$101-$200', min: 101, max: 200 },
          { range: '$201-$500', min: 201, max: 500 },
          { range: '$500+', min: 501, max: Infinity }
        ];
        
        // Initialize counts
        priceRanges.forEach(range => {
          priceRangeData.push({
            range: range.range,
            count: 0
          });
        });
        
        // Count activities by price range
        activities.forEach(activity => {
          if (typeof activity.price === 'number') {
            const price = activity.price;
            const rangeIndex = priceRanges.findIndex(
              range => price >= range.min && price <= range.max
            );
            if (rangeIndex !== -1) {
              priceRangeData[rangeIndex].count += 1;
            }
          }
        });
        
        setPriceRanges(priceRangeData);
        
        // Fetch user-activity relationships
        const activityUsersSnapshot = await getDocs(collection(db, 'activityUsers'));
        let totalUserAssignments = 0;
        const activityUserMap = new Map<string, number>();
        
        // Process activity-user relationships
        activityUsersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.userIds && Array.isArray(data.userIds)) {
            const activityId = doc.id;
            const userCount = data.userIds.length;
            activityUserMap.set(activityId, userCount);
            totalUserAssignments += userCount;
          }
        });
        
        // Get activity names for the IDs
        const userActivitiesList: UserActivityData[] = [];
        const entries = Array.from(activityUserMap.entries());
        
        for (let i = 0; i < entries.length; i++) {
          const activityId = entries[i][0];
          const userCount = entries[i][1];
          
          // Get activity name
          const activityDoc = activities.find(a => a.id === activityId);
          if (activityDoc) {
            userActivitiesList.push({
              activityName: activityDoc.name || `Activity ${activityId.substring(0, 6)}`,
              userCount
            });
          }
        }
        
        // Sort by user count (descending) and take top 10
        const topUserActivities = userActivitiesList
          .sort((a, b) => b.userCount - a.userCount)
          .slice(0, 10);
        
        setUserActivitiesData(topUserActivities);
        setTotalAssignments(totalUserAssignments);
        setAvgUsersPerActivity(totalUserAssignments / Math.max(activityCount, 1));
        
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Statistics Dashboard</h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
          <ClockIcon className="h-4 w-4 mr-1" />
          Last updated: {new Date().toLocaleString()}
        </span>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ActivityIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Activities</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{activityCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm flex justify-between">
              <span className="font-medium text-green-600 dark:text-green-400">
                <span className="font-bold">{activeActivities}</span> Active
              </span>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                <span className="font-bold">{draftActivities}</span> Draft
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Users</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{userCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Average {(activityCount / Math.max(userCount, 1)).toFixed(1)} activities per user
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Locations</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{locationCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-red-600 dark:text-red-400">
                {popularLocations[0]?.name || 'No locations'} is most popular
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Activity Types</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{activityTypeCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {activityTypes[0]?.name || 'No types'} is most common
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Activity Timeline */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Activity Timeline (2023)
            </h3>
          </div>
          <div className="p-5">
            <div className="h-80">
              <LineChart
                data={monthlyActivities.map(item => ({
                  month: item.month,
                  count: item.count,
                  [item.month]: item.count
                }))}
                title="Monthly Activities"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-purple-500" />
              Activities by Type
            </h3>
          </div>
          <div className="p-5">
            <div className="h-80">
              <PieChart 
                data={activityTypes.map(type => ({ 
                  name: type.name, 
                  value: type.count 
                }))} 
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Price Distribution & Activity Status */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-green-500" />
              Price Distribution
            </h3>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-center mb-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Price</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">${averagePrice}</p>
              </div>
            </div>
            <div className="h-64">
              <BarChart 
                data={priceRanges.map(range => ({ 
                  name: range.range, 
                  value: range.count 
                }))} 
                xKey="name"
                yKey="value"
                color="#10B981"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
              Activity Timeline
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Upcoming</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{upcomingActivities}</p>
                <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                  {upcomingActivities > 0 
                    ? `${Math.round((upcomingActivities / activityCount) * 100)}% of total` 
                    : 'No upcoming activities'}
                </p>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Past</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{pastActivities}</p>
                <p className="text-xs text-purple-500 dark:text-purple-300 mt-1">
                  {pastActivities > 0 
                    ? `${Math.round((pastActivities / activityCount) * 100)}% of total` 
                    : 'No past activities'}
                </p>
              </div>
            </div>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200 dark:bg-blue-900 dark:text-blue-300">
                    Upcoming vs Past
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-300">
                    {activityCount > 0 
                      ? `${Math.round((upcomingActivities / activityCount) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                <div 
                  style={{ width: `${activityCount > 0 ? (upcomingActivities / activityCount) * 100 : 0}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Popular Locations</h4>
              <ul className="space-y-2">
                {popularLocations.slice(0, 3).map((location, index) => (
                  <li key={location.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`
                        flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium
                        ${index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                          index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : 
                          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'}
                      `}>
                        {index + 1}
                      </span>
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{location.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{location.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* User-Activity Distribution */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-blue-500" />
              User Assignment Distribution
            </h3>
          </div>
          <div className="p-5">
            <div className="h-80">
              <BarChart 
                data={userActivitiesData.map(item => ({ 
                  name: item.activityName, 
                  value: item.userCount 
                }))} 
                xKey="name"
                yKey="value"
                color="#3B82F6"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
              User Assignment Metrics
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Assignments</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalAssignments}</p>
                <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                  {totalAssignments > 0 
                    ? `${(totalAssignments / userCount).toFixed(1)} per user` 
                    : 'No assignments'}
                </p>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Avg Users per Activity</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{avgUsersPerActivity.toFixed(1)}</p>
                <p className="text-xs text-indigo-500 dark:text-indigo-300 mt-1">
                  {avgUsersPerActivity > 0 
                    ? `${Math.round(avgUsersPerActivity * 100 / Math.max(activityCount, 1))}% coverage` 
                    : 'No assignments'}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Top Activities by User Count</h4>
              <ul className="space-y-3">
                {userActivitiesData.slice(0, 5).map((item, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`
                        flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium
                        ${index === 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                          index === 1 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' : 
                          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'}
                      `}>
                        {index + 1}
                      </span>
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                        {item.activityName}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.userCount} {item.userCount === 1 ? 'user' : 'users'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 