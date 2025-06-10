import React, { useState } from 'react';
import { Home, BarChart, Users, User } from 'lucide-react';

export function BottomNav() {
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'social' | 'profile'>('home');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50 max-w-[430px] mx-auto w-full">
      <span
        className={`flex flex-col items-center justify-center p-2 cursor-pointer ${activeTab === 'home' ? 'text-secondary' : 'text-gray-500'}`}
        onClick={() => setActiveTab('home')}
      >
        <Home className="text-lg" />
        <span className="text-xs mt-1">Home</span>
      </span>
      <span
        className={`flex flex-col items-center justify-center p-2 cursor-pointer ${activeTab === 'stats' ? 'text-secondary' : 'text-gray-500'}`}
        onClick={() => setActiveTab('stats')}
      >
        <BarChart className="text-lg" />
        <span className="text-xs mt-1">Stats</span>
      </span>
      <span
        className={`flex flex-col items-center justify-center p-2 cursor-pointer ${activeTab === 'social' ? 'text-secondary' : 'text-gray-500'}`}
        onClick={() => setActiveTab('social')}
      >
        <Users className="text-lg" />
        <span className="text-xs mt-1">Social</span>
      </span>
      <span
        className={`flex flex-col items-center justify-center p-2 cursor-pointer ${activeTab === 'profile' ? 'text-secondary' : 'text-gray-500'}`}
        onClick={() => setActiveTab('profile')}
      >
        <User className="text-lg" />
        <span className="text-xs mt-1">Profile</span>
      </span>
    </div>
  );
} 