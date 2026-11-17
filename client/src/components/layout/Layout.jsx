import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-cream-50 text-navy-900 flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-cream-200/80 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-navy-800/60 gap-4">
          <p>© {new Date().getFullYear()} StudentPulse AI. Empowering next-generation engineers.</p>
          <div className="flex items-center gap-6">
            <span>FastAPI Server</span>
            <span>•</span>
            <span>React + Vite</span>
            <span>•</span>
            <span>MongoDB Atlas</span>
            <span>•</span>
            <span>Google Gemini Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
