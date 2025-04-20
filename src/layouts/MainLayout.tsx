import React, { ReactNode } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/layout/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout; 