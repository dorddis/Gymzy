"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Home, Settings, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabletView = 'app' | 'chat';

interface TabletToggleHeaderProps {
  activeView: TabletView;
  onViewChange: (view: TabletView) => void;
  unreadChatCount?: number;
  showNotificationBadge?: boolean;
  className?: string;
}

export function TabletToggleHeader({
  activeView,
  onViewChange,
  unreadChatCount = 0,
  showNotificationBadge = false,
  className,
}: TabletToggleHeaderProps) {
  return (
    <div className={cn(
      "flex items-center justify-center p-3 bg-white border-b border-gray-200 shadow-sm",
      className
    )}>
      <div className="flex bg-gray-100 rounded-lg p-1 relative">
        {/* Background slider */}
        <div
          className={cn(
            "absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-200 ease-in-out",
            activeView === 'app' ? "left-1 right-1/2" : "left-1/2 right-1"
          )}
        />
        
        {/* App View Button */}
        <button
          onClick={() => onViewChange('app')}
          className={cn(
            "relative z-10 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
            "flex items-center gap-2 min-w-[100px] justify-center",
            activeView === 'app'
              ? "text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Home className="h-4 w-4" />
          <span>App</span>
          {showNotificationBadge && activeView !== 'app' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Chat View Button */}
        <button
          onClick={() => onViewChange('chat')}
          className={cn(
            "relative z-10 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
            "flex items-center gap-2 min-w-[100px] justify-center",
            activeView === 'chat'
              ? "text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span>AI Chat</span>
          {unreadChatCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </Badge>
          )}
        </button>
      </div>
    </div>
  );
}

interface TabletViewIndicatorProps {
  activeView: TabletView;
  className?: string;
}

export function TabletViewIndicator({ activeView, className }: TabletViewIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-center py-2", className)}>
      <div className="flex space-x-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full transition-colors duration-200",
            activeView === 'app' ? "bg-blue-500" : "bg-gray-300"
          )}
        />
        <div
          className={cn(
            "w-2 h-2 rounded-full transition-colors duration-200",
            activeView === 'chat' ? "bg-blue-500" : "bg-gray-300"
          )}
        />
      </div>
    </div>
  );
}

// Hook for managing tablet toggle state
export function useTabletToggle(initialView: TabletView = 'app') {
  const [activeView, setActiveView] = React.useState<TabletView>(initialView);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const switchView = React.useCallback((newView: TabletView) => {
    if (newView === activeView || isTransitioning) return;

    setIsTransitioning(true);
    setActiveView(newView);

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [activeView, isTransitioning]);

  const toggleView = React.useCallback(() => {
    switchView(activeView === 'app' ? 'chat' : 'app');
  }, [activeView, switchView]);

  return {
    activeView,
    isTransitioning,
    switchView,
    toggleView,
  };
}