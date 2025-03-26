import './globals.css';
// Remove or comment out any next/font imports
// import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/context/auth-context';
import { ThemeProvider } from '@/lib/context/theme-context';

// const inter = Inter({ subsets: ['latin'] });

console.log('[MODULE] Layout.tsx imports:',
  require.resolve('firebase/app'),
  require.resolve('firebase/firestore')
);

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard for managing activities and locations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 dark:bg-gray-900">
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
