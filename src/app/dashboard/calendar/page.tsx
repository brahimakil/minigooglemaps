'use client';

import { useState, useEffect, Fragment } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import { MapPinIcon, ActivityIcon, CalendarIcon, XIcon } from '@/components/icons';

interface CalendarEvent {
  id: string;
  name: string;
  date: Date;
  type: 'activity';
  status?: string;
  mainImage?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upcomingActivities, setUpcomingActivities] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        // Fetch activities using activityDate
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('activityDate', 'asc')
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const allActivitiesData = activitiesSnapshot.docs
          .map(doc => {
            const data = doc.data();
            let eventDate;
            
            // Handle different types of date fields
            if (data.activityDate) {
              if (data.activityDate instanceof Timestamp) {
                eventDate = data.activityDate.toDate();
              } else if (data.activityDate.seconds) {
                eventDate = new Date(data.activityDate.seconds * 1000);
              } else if (typeof data.activityDate === 'string') {
                eventDate = new Date(data.activityDate);
              } else if (data.activityDate instanceof Date) {
                eventDate = data.activityDate;
              }
            } else {
              eventDate = data.createdAt?.toDate() || new Date();
            }
            
            return {
              id: doc.id,
              name: data.name || 'Unnamed Activity',
              date: eventDate,
              type: 'activity' as const,
              status: data.status,
              mainImage: data.mainImage
            };
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Filter activities for the current month (for the calendar)
        const currentMonthActivities = allActivitiesData.filter(event => 
          event.date.getMonth() === currentDate.getMonth() && 
          event.date.getFullYear() === currentDate.getFullYear()
        );
        
        // Get upcoming activities (today and future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingActivitiesData = allActivitiesData.filter(
          event => event.date >= today
        ).slice(0, 5); // Get only the first 5 upcoming activities
        
        setEvents(currentMonthActivities);
        setUpcomingActivities(upcomingActivitiesData);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvents();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date, events: CalendarEvent[]) => {
    setSelectedDay(date);
    setDayEvents(events);
    setIsModalOpen(true);
  };

  const renderCalendarDays = () => {
    const days = [];
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Calculate days from previous month to show
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    for (let i = firstDayOfWeek; i > 0; i--) {
      const prevMonthDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1 - i
      );
      days.push({
        date: prevMonthDay,
        isPreviousMonth: true
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        isCurrentMonth: true
      });
    }
    
    // Calculate days from next month to show
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const nextMonthDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        i
      );
      days.push({
        date: nextMonthDay,
        isNextMonth: true
      });
    }
    
    return days.map((day, index) => {
      // Get events for this day
      const dayEvents = events.filter(event => 
        event.date.getDate() === day.date.getDate() &&
        event.date.getMonth() === day.date.getMonth() &&
        event.date.getFullYear() === day.date.getFullYear()
      );
      
      const hasEvents = dayEvents.length > 0;
      
      // Check if this is today
      const isToday = () => {
        const now = new Date();
        // Force timezone-aware comparison using ISO date parts
        return day.date.getDate() === now.getDate() &&
               day.date.getMonth() === now.getMonth() &&
               day.date.getFullYear() === now.getFullYear();
      };
      
      return (
        <div
          key={index}
          onClick={() => day.isCurrentMonth && hasEvents && handleDayClick(day.date, dayEvents)}
          className={`relative h-32 p-1 border border-gray-200 dark:border-gray-700 ${
            day.isCurrentMonth 
              ? 'bg-white dark:bg-gray-800'
              : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500'
          } ${
            isToday()
              ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500 dark:ring-indigo-400'
              : ''
          } ${
            hasEvents && day.isCurrentMonth
              ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
              : ''
          }`}
        >
          <div className={`font-semibold text-right ${
            isToday() ? 'text-indigo-600 dark:text-indigo-400' : ''
          }`}>
            {day.date.getDate()}
          </div>
          
          {day.isCurrentMonth && hasEvents && (
            <div className="mt-1 max-h-24 overflow-y-auto">
              {dayEvents.slice(0, 3).map((event, eventIndex) => (
                <Link
                  key={eventIndex}
                  href={`/dashboard/activities/${event.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="block text-xs truncate rounded p-1 mb-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200"
                >
                  {event.name}
                </Link>
              ))}
              {dayEvents.length > 3 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDayClick(day.date, dayEvents);
                  }}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mt-1"
                >
                  +{dayEvents.length - 3} more
                </button>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <CalendarIcon className="mr-2 h-6 w-6 text-indigo-500" />
              Calendar
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex space-x-1 rounded-md shadow-sm">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                  view === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-2 text-sm font-medium ${
                  view === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                  view === 'day'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Day
              </button>
            </div>
            
            <div className="flex space-x-1 rounded-md shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-l-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                &larr;
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-r-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                &rarr;
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ) : view === 'month' ? (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-px mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center py-2 font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          </div>
        ) : view === 'week' ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <ActivityIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            Week view coming soon
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <ActivityIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            Day view coming soon
          </div>
        )}
      </div>
      
      {/* Upcoming Activities Section */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <ActivityIcon className="mr-2 h-5 w-5 text-indigo-500" />
            Upcoming Activities
          </h2>
        </div>
        
        <div className="p-4">
          {upcomingActivities.length > 0 ? (
            <div className="space-y-4">
              {upcomingActivities.map((activity, index) => (
                <Link 
                  key={index}
                  href={`/dashboard/activities/${activity.id}/edit`}
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {activity.mainImage ? (
                      <img 
                        src={activity.mainImage} 
                        alt={activity.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md flex items-center justify-center bg-indigo-100 dark:bg-indigo-900">
                        <ActivityIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{activity.name}</h4>
                    <div className="flex items-center mt-1">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.date.toLocaleDateString()} 
                        {activity.status && ` • ${activity.status}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ActivityIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No upcoming activities</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add activities to see them here.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Day Events Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-10" 
          onClose={() => setIsModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black dark:bg-gray-900 bg-opacity-25 dark:bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center"
                    >
                      <CalendarIcon className="mr-2 h-5 w-5 text-indigo-500" />
                      {selectedDay?.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mt-2 space-y-3 max-h-80 overflow-y-auto">
                    {dayEvents.length > 0 ? (
                      dayEvents.map((event, index) => (
                        <Link
                          href={`/dashboard/activities/${event.id}/edit`}
                          key={index}
                          className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                          onClick={() => setIsModalOpen(false)}
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {event.mainImage ? (
                                <img 
                                  src={event.mainImage} 
                                  alt={event.name}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md flex items-center justify-center bg-indigo-100 dark:bg-indigo-900">
                                  <ActivityIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{event.name}</h4>
                              <div className="flex items-center mt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {event.status ? `Status: ${event.status}` : 'Activity'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <ActivityIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No activities scheduled for this day.
                        </p>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 