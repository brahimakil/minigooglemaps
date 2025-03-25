'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';

// Import only icons we know exist
import { 
  MapPinIcon, 
  ActivityIcon, 
  CalendarIcon
} from '@/components/icons';

interface CalendarEvent {
  id: string;
  name: string;
  date: Date;
  type: 'activity' | 'location';
  status?: string;
  mainImage?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        // Get the first and last day of the current month
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Fetch activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          where('createdAt', '>=', firstDay),
          where('createdAt', '<=', lastDay),
          orderBy('createdAt', 'asc')
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            date: data.createdAt?.toDate() || new Date(),
            type: 'activity' as const,
            status: data.status,
            mainImage: data.mainImage
          };
        });
        
        // Fetch locations
        const locationsQuery = query(
          collection(db, 'locations'),
          where('createdAt', '>=', firstDay),
          where('createdAt', '<=', lastDay),
          orderBy('createdAt', 'asc')
        );
        
        const locationsSnapshot = await getDocs(locationsQuery);
        const locationsData = locationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            date: data.createdAt?.toDate() || new Date(),
            type: 'location' as const,
            mainImage: data.mainImage
          };
        });
        
        // Combine and sort events
        const allEvents = [...activitiesData, ...locationsData].sort((a, b) => 
          a.date.getTime() - b.date.getTime()
        );
        
        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvents();
  }, [currentDate]);

  // For the navigation buttons, use simple buttons instead of icons
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"></div>
      );
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter(event => {
        const eventDate = event.date;
        return eventDate.getDate() === day && 
               eventDate.getMonth() === month && 
               eventDate.getFullYear() === year;
      });
      
      days.push(
        <div key={`day-${day}`} className="h-24 border border-gray-200 dark:border-gray-700 p-2 overflow-hidden">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${
              new Date().toDateString() === date.toDateString() 
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full w-6 h-6 flex items-center justify-center' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {day}
            </span>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-16">
            {dayEvents.map((event, index) => (
              <Link 
                key={index}
                href={event.type === 'activity' 
                  ? `/dashboard/activities/${event.id}/edit` 
                  : `/dashboard/locations/${event.id}/edit`
                }
                className={`block text-xs truncate px-2 py-1 rounded ${
                  event.type === 'activity' 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}
              >
                {event.name}
              </Link>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Calendar</h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-md ${
                view === 'month' 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-md ${
                view === 'week' 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-md ${
                view === 'day' 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Day
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              &larr; Prev
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            
            <button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Next &rarr;
            </button>
          </div>
          
          {loading ? (
            <div className="p-4">
              <div className="animate-pulse grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : view === 'month' ? (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-px">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center py-2 font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {renderCalendarDays()}
              </div>
            </div>
          ) : view === 'week' ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Week view implementation */}
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Week view coming soon
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Day view implementation */}
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Day view coming soon
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upcoming Events</h3>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.slice(0, 5).map((event, index) => (
                <Link 
                  key={index}
                  href={event.type === 'activity' 
                    ? `/dashboard/activities/${event.id}/edit` 
                    : `/dashboard/locations/${event.id}/edit`
                  }
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {event.mainImage ? (
                      <img 
                        src={event.mainImage} 
                        alt={event.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className={`h-12 w-12 rounded-md flex items-center justify-center ${
                        event.type === 'activity' 
                          ? 'bg-indigo-100 dark:bg-indigo-900' 
                          : 'bg-green-100 dark:bg-green-900'
                      }`}>
                        {event.type === 'activity' ? (
                          <ActivityIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                        ) : (
                          <MapPinIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{event.name}</h4>
                    <div className="flex items-center mt-1">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {event.date.toLocaleDateString()} • {event.type}
                        {event.status && ` • ${event.status}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No events</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No events found for this month.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 