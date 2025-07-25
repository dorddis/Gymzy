"use client";

import React, { useEffect, useState } from 'react';
import { useAppLayout } from '@/components/layout/app-layout-provider';
import { useTabletContext } from '@/components/layout/tablet-layout-manager';
import { visualFeedbackUtils } from '@/components/ui/visual-feedback';
import { notificationUtils } from '@/components/ui/notification-system';

interface KeyboardNavigationProps {
  children: React.ReactNode;
}

// Keyboard shortcuts configuration
const KEYBOARD_SHORTCUTS = [
  {
    key: 'c',
    modifier: 'alt',
    description: 'Focus chat input',
    action: 'focus-chat',
  },
  {
    key: 'Tab',
    modifier: 'alt',
    description: 'Toggle between app and chat views (tablet mode)',
    action: 'toggle-view',
  },
  {
    key: '1',
    modifier: 'alt',
    description: 'Switch to app view (tablet mode)',
    action: 'app-view',
  },
  {
    key: '2',
    modifier: 'alt',
    description: 'Switch to chat view (tablet mode)',
    action: 'chat-view',
  },
  {
    key: 'h',
    modifier: 'alt',
    description: 'Go to home/dashboard',
    action: 'go-home',
  },
  {
    key: 'w',
    modifier: 'alt',
    description: 'Go to workout page',
    action: 'go-workout',
  },
  {
    key: 's',
    modifier: 'alt',
    description: 'Go to stats page',
    action: 'go-stats',
  },
  {
    key: 'p',
    modifier: 'alt',
    description: 'Go to profile page',
    action: 'go-profile',
  },
  {
    key: '/',
    modifier: 'alt',
    description: 'Show keyboard shortcuts help',
    action: 'show-help',
  },
];

export function KeyboardNavigation({ children }: KeyboardNavigationProps) {
  const { isDesktopLayout, isSplitScreen, isTabletToggle } = useAppLayout();
  const [showHelp, setShowHelp] = useState(false);
  
  // Get tablet context if available
  let tabletContext: ReturnType<typeof useTabletContext> | null = null;
  try {
    tabletContext = useTabletContext();
  } catch (e) {
    // Tablet context not available, that's fine
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Alt key combinations
      if (!e.altKey) return;
      
      // Find matching shortcut
      const shortcut = KEYBOARD_SHORTCUTS.find(s => s.key === e.key);
      if (!shortcut) return;
      
      // Prevent default browser behavior for these shortcuts
      e.preventDefault();
      
      // Handle the shortcut action
      handleShortcutAction(shortcut.action);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktopLayout, isSplitScreen, isTabletToggle, tabletContext]);

  // Handle shortcut actions
  const handleShortcutAction = (action: string) => {
    switch (action) {
      case 'focus-chat':
        focusChatInput();
        break;
      case 'toggle-view':
        if (tabletContext && isTabletToggle) {
          tabletContext.toggleView();
        }
        break;
      case 'app-view':
        if (tabletContext && isTabletToggle) {
          tabletContext.switchView('app');
        }
        break;
      case 'chat-view':
        if (tabletContext && isTabletToggle) {
          tabletContext.switchView('chat');
        }
        break;
      case 'go-home':
        navigateTo('/');
        break;
      case 'go-workout':
        navigateTo('/workout');
        break;
      case 'go-stats':
        navigateTo('/stats');
        break;
      case 'go-profile':
        navigateTo('/profile');
        break;
      case 'show-help':
        setShowHelp(true);
        break;
    }
  };

  // Focus the chat input
  const focusChatInput = () => {
    const chatInput = document.querySelector('.chat-input') as HTMLElement;
    if (chatInput) {
      chatInput.focus();
      visualFeedbackUtils.highlightInfo('.chat-input', 'Chat input focused');
    }
  };

  // Navigate to a page
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  // Close help dialog
  const closeHelp = () => {
    setShowHelp(false);
  };

  return (
    <>
      {children}
      
      {/* Keyboard shortcuts help dialog */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Keyboard Shortcuts</h2>
            
            <div className="space-y-2 mb-6">
              {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-700">{shortcut.description}</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {shortcut.modifier}+{shortcut.key}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={closeHelp}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hook for adding keyboard shortcuts to components
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: { modifier?: 'alt' | 'ctrl' | 'shift' | 'meta'; disabled?: boolean }
) {
  useEffect(() => {
    if (options?.disabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the correct modifier key is pressed
      const modifierPressed = options?.modifier
        ? (options.modifier === 'alt' && e.altKey) ||
          (options.modifier === 'ctrl' && e.ctrlKey) ||
          (options.modifier === 'shift' && e.shiftKey) ||
          (options.modifier === 'meta' && e.metaKey)
        : true;
      
      if (modifierPressed && e.key === key) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options]);
}

// Component for displaying keyboard shortcut hint
export function KeyboardShortcutHint({
  shortcutKey,
  modifier,
  description,
  className,
}: {
  shortcutKey: string;
  modifier?: 'alt' | 'ctrl' | 'shift' | 'meta';
  description: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center text-xs text-gray-500 ${className}`}>
      <span className="mr-1">{description}</span>
      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
        {modifier && `${modifier}+`}{shortcutKey}
      </span>
    </div>
  );
}

// Component for showing keyboard shortcuts help button
export function KeyboardShortcutsHelp() {
  const [showHelp, setShowHelp] = useState(false);
  
  // Use the keyboard shortcut to show help
  useKeyboardShortcut('/', () => setShowHelp(true), { modifier: 'alt' });
  
  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
        aria-label="Keyboard shortcuts"
      >
        <KeyboardIcon className="h-5 w-5" />
        <span className="sr-only">Keyboard shortcuts</span>
      </button>
      
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Keyboard Shortcuts</h2>
            
            <div className="space-y-2 mb-6">
              {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-700">{shortcut.description}</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {shortcut.modifier}+{shortcut.key}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Keyboard icon component
function KeyboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
      <path d="M6 8h.01" />
      <path d="M10 8h.01" />
      <path d="M14 8h.01" />
      <path d="M18 8h.01" />
      <path d="M6 12h.01" />
      <path d="M10 12h.01" />
      <path d="M14 12h.01" />
      <path d="M18 12h.01" />
      <path d="M6 16h.01" />
      <path d="M10 16h.01" />
      <path d="M14 16h.01" />
      <path d="M18 16h.01" />
    </svg>
  );
}