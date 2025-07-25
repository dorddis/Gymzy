"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext, useAppActions } from '@/contexts/AppChatBridgeContext';
import { useAppLayout } from '@/components/layout/app-layout-provider';

export function AppContextDisplay() {
  const { isDesktopLayout } = useAppLayout();
  const context = useAppContext();
  const actions = useAppActions();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isDesktopLayout) {
    return null; // Only show in desktop layout
  }

  return (
    <Card className="p-4 app-context-display">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">App Context</h3>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          size="sm"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Current Context</h4>
            <div className="bg-gray-50 p-3 rounded text-xs font-mono">
              <div><strong>Page:</strong> {context.currentPage}</div>
              <div><strong>Active Workout:</strong> {context.activeWorkout ? 'Yes' : 'No'}</div>
              <div><strong>Visible Elements:</strong> {context.visibleElements?.length || 0}</div>
              <div><strong>Recent Actions:</strong> {context.recentActions?.length || 0}</div>
            </div>
          </div>

          {context.visibleElements && context.visibleElements.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Visible Elements</h4>
              <div className="bg-gray-50 p-3 rounded text-xs">
                {context.visibleElements.map((element, index) => (
                  <div key={index} className="text-gray-600">
                    {element}
                  </div>
                ))}
              </div>
            </div>
          )}

          {context.recentActions && context.recentActions.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Recent Actions</h4>
              <div className="bg-gray-50 p-3 rounded text-xs max-h-32 overflow-y-auto">
                {context.recentActions.slice(0, 5).map((action, index) => (
                  <div key={index} className="text-gray-600 mb-1">
                    <strong>{action.type}</strong> - {new Date(action.timestamp).toLocaleTimeString()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {actions && actions.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Recent Actions</h4>
              <div className="bg-gray-50 p-3 rounded text-xs max-h-32 overflow-y-auto">
                {actions.slice(0, 3).map((action, index) => (
                  <div key={index} className="text-gray-600 mb-1">
                    <strong>{action.type}</strong> - {new Date(action.timestamp).toLocaleTimeString()}
                    {action.payload && (
                      <div className="ml-2 text-gray-500">
                        {JSON.stringify(action.payload, null, 2).substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {context.activeWorkout && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Active Workout</h4>
              <div className="bg-gray-50 p-3 rounded text-xs">
                <div><strong>Exercises:</strong> {context.activeWorkout.exercises?.length || 0}</div>
                <div><strong>Status:</strong> {context.activeWorkout.status || 'Unknown'}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}