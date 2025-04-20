'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/privacy-policy" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
              Terms of Service
            </Link>
            <Link href="/help" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
              Help Center
            </Link>
          </div>
          <div className="mt-4 md:mt-0 md:order-1 text-center md:text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {currentYear} Admin Dashboard. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 