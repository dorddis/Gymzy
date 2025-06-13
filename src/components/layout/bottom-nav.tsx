"use client";

import React from 'react';
import { Home, BarChart2, Users, Dumbbell, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, href: '/' },
    { id: 'stats', label: 'Stats', icon: BarChart2, href: '/stats' },
    { id: 'feed', label: 'Feed', icon: Users, href: '/feed' },
    { id: 'workout', label: 'Workout', icon: Dumbbell, href: '/workout' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, href: '/chat' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link href={item.href} key={item.id} passHref>
              <button
                className={`flex flex-col items-center justify-center w-16 ${
                  isActive ? 'text-secondary' : 'text-gray-500'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-secondary' : 'text-gray-500'}`} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 