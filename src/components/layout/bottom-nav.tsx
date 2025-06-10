import React from 'react';
import { Home, BarChart2, Users, Dumbbell } from 'lucide-react';

export function BottomNav() {
  // Placeholder for active tab state - will be replaced with actual routing later
  const [activeTab, setActiveTab] = React.useState('home');

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'workout', label: 'Workout', icon: Dumbbell }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-16 ${
                isActive ? 'text-secondary' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-secondary' : 'text-gray-500'}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
} 