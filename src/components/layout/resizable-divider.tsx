"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { positionToSplitRatio, validateSplitRatio } from '@/lib/layout-utils';

interface ResizableDividerProps {
  splitRatio: number;
  onSplitRatioChange: (ratio: number) => void;
  containerWidth: number;
  minAppPanelWidth: number;
  minChatPanelWidth: number;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function ResizableDivider({
  splitRatio,
  onSplitRatioChange,
  containerWidth,
  minAppPanelWidth,
  minChatPanelWidth,
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Resize panels',
}: ResizableDividerProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRatio, setDragStartRatio] = useState(0);
  const [previewRatio, setPreviewRatio] = useState<number | null>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse/touch start
  const handlePointerStart = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsResizing(true);
    setDragStartX(e.clientX);
    setDragStartRatio(splitRatio);
    
    // Capture pointer to handle movement outside the element
    if (dividerRef.current) {
      dividerRef.current.setPointerCapture(e.pointerId);
    }
    
    // Prevent text selection and set cursor
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('resizing-cursor');
  }, [disabled, splitRatio]);

  // Handle mouse/touch move
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isResizing || disabled) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaRatio = deltaX / containerWidth;
    const newRatio = dragStartRatio + deltaRatio;
    
    // Validate the new ratio
    const validation = validateSplitRatio(newRatio, containerWidth);
    const finalRatio = validation.isValid ? newRatio : validation.adjustedRatio!;
    
    setPreviewRatio(finalRatio);
  }, [isResizing, disabled, dragStartX, dragStartRatio, containerWidth]);

  // Handle mouse/touch end
  const handlePointerEnd = useCallback((e: PointerEvent) => {
    if (!isResizing) return;
    
    setIsResizing(false);
    
    // Release pointer capture
    if (dividerRef.current) {
      dividerRef.current.releasePointerCapture((e as any).pointerId);
    }
    
    // Restore document styles
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.body.classList.remove('resizing-cursor');
    
    // Apply the final ratio
    if (previewRatio !== null) {
      onSplitRatioChange(previewRatio);
      setPreviewRatio(null);
    }
  }, [isResizing, previewRatio, onSplitRatioChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    const step = 0.05; // 5% steps
    let newRatio = splitRatio;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newRatio = Math.max(0.5, splitRatio - step);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newRatio = Math.min(0.8, splitRatio + step);
        break;
      case 'Home':
        e.preventDefault();
        newRatio = 0.5;
        break;
      case 'End':
        e.preventDefault();
        newRatio = 0.8;
        break;
      default:
        return;
    }
    
    const validation = validateSplitRatio(newRatio, containerWidth);
    const finalRatio = validation.isValid ? newRatio : validation.adjustedRatio!;
    onSplitRatioChange(finalRatio);
  }, [disabled, splitRatio, containerWidth, onSplitRatioChange]);

  // Add global pointer event listeners during resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerEnd);
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerEnd);
      };
    }
  }, [isResizing, handlePointerMove, handlePointerEnd]);

  // Calculate current position
  const currentRatio = previewRatio ?? splitRatio;
  const position = currentRatio * containerWidth;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: containerWidth }}
    >
      <div
        ref={dividerRef}
        className={cn(
          "absolute top-0 bottom-0 w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize",
          "transition-colors duration-150 flex items-center justify-center group",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          isResizing && "bg-blue-300",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        style={{ 
          left: position - 2, // Center the 4px divider
          width: '4px',
        }}
        onPointerDown={handlePointerStart}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="separator"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        aria-valuenow={Math.round(currentRatio * 100)}
        aria-valuemin={50}
        aria-valuemax={80}
        aria-valuetext={`${Math.round(currentRatio * 100)}% app panel width`}
      >
        {/* Visual indicator */}
        <div className="flex flex-col space-y-1 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-0.5 h-4 bg-gray-500 rounded-full"></div>
          <div className="w-0.5 h-4 bg-gray-500 rounded-full"></div>
          <div className="w-0.5 h-4 bg-gray-500 rounded-full"></div>
        </div>
      </div>
      
      {/* Resize preview overlay */}
      {isResizing && previewRatio !== null && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-0 bottom-0 bg-blue-200 opacity-30 transition-all duration-75"
            style={{ 
              left: 0,
              width: `${previewRatio * 100}%`,
            }}
          />
          <div 
            className="absolute top-0 bottom-0 bg-green-200 opacity-30 transition-all duration-75"
            style={{ 
              right: 0,
              width: `${(1 - previewRatio) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// Hook for managing resizable divider state
export function useResizableDivider(
  initialRatio: number,
  containerWidth: number,
  minAppPanelWidth: number,
  minChatPanelWidth: number,
  onRatioChange?: (ratio: number) => void
) {
  const [splitRatio, setSplitRatio] = useState(initialRatio);
  
  const handleSplitRatioChange = useCallback((newRatio: number) => {
    setSplitRatio(newRatio);
    onRatioChange?.(newRatio);
  }, [onRatioChange]);
  
  // Validate ratio when container width changes
  useEffect(() => {
    const validation = validateSplitRatio(splitRatio, containerWidth);
    if (!validation.isValid && validation.adjustedRatio) {
      handleSplitRatioChange(validation.adjustedRatio);
    }
  }, [containerWidth, splitRatio, handleSplitRatioChange]);
  
  return {
    splitRatio,
    setSplitRatio: handleSplitRatioChange,
    appPanelWidth: Math.floor(containerWidth * splitRatio),
    chatPanelWidth: containerWidth - Math.floor(containerWidth * splitRatio) - 4, // Account for divider width
  };
}