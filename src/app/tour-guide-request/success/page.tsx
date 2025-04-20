'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/context/theme-context';
import { SunIcon, MoonIcon } from '@/components/icons';

export default function TourGuideRequestSuccess() {
  const { theme, toggleTheme } = useTheme();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/login';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
        </button>
      </div>
      
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-md flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Application Submitted!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Thank you for applying to be a tour guide. Our team will review your application and contact you via email.
          </p>
        </div>
        
        <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-6">
          <p className="text-sm text-green-700 dark:text-green-300">
            Your application has been received and is pending review. You'll be redirected to the login page in {countdown} seconds.
          </p>
        </div>
        
        <div>
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
} 