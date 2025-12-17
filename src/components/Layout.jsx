import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const location = useLocation();
  
  // Prevent scroll on route changes
  useEffect(() => {
    // Don't scroll the window on route change
    window.scrollTo(0, 0);
    
    // Disable browser's scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Add global styles to prevent scrolling
    const style = document.createElement('style');
    style.id = 'layout-scroll-prevention';
    style.textContent = `
      html, body, #root, .app, .flex, [class*="overflow"] {
        scroll-behavior: auto !important;
        overflow-anchor: none !important;
      }
      
      * {
        scroll-behavior: auto !important;
      }
      
      /* Prevent any focus scrolling */
      *:focus {
        scroll-margin: 0 !important;
        scroll-padding: 0 !important;
      }
      
      /* Disable smooth scrolling globally */
      @media (prefers-reduced-motion: no-preference) {
        html {
          scroll-behavior: auto !important;
        }
      }
      
      /* Ensure sidebar doesn't cause layout shifts */
      .scrollbar-hide {
        scroll-behavior: auto !important;
        overflow-anchor: none !important;
      }
    `;
    
    // Add style only once
    if (!document.getElementById('layout-scroll-prevention')) {
      document.head.appendChild(style);
    }
    
    return () => {
      // Don't remove the style as it should persist
    };
  }, [location.pathname]);
  
  return (
    <div className="flex h-screen bg-gray-50" style={{ overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-16 md:pt-16 lg:pt-4 p-4">
          <div className="container mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Fixed Footer */}
        <footer className="bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 py-3 px-4 flex-shrink-0 shadow-lg">
          <div className="container mx-auto text-center text-sm text-gray-700">
            Powered by{' '}
            <a 
              href="https://www.botivate.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Botivate
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;