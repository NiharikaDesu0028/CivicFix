import React from 'react';
import CitizenTopbar from './CitizenTopbar';

interface CitizenLayoutProps {
  children: React.ReactNode;
  activePage?: 'dashboard' | 'report' | 'complaints' | 'profile' | 'explore';
}

export default function CitizenLayout({ children, activePage }: CitizenLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <CitizenTopbar activePage={activePage} />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {children}
      </main>
    </div>
  );
}
