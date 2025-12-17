// SocialSitePage.js
import React, { useState } from 'react';
import SocialSite from '../pages/SocialSite'; // आपका SocialSite form component

const SocialSitePage = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Social Site Management</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add New Indent
        </button>
      </div>
      
      {/* आपका existing data table या content यहां आएगा */}
      
      <SocialSite 
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          setShowForm(false);
          // refresh data
        }}
      />
    </div>
  );
};

export default SocialSitePage;