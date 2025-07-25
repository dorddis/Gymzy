"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface VisualFeedbackOptions {
  type: 'highlight' | 'pulse' | 'border' | 'glow' | 'ripple' | 'shake';
  target: string | Element;
  duration?: number;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
  message?: string;
  showTooltip?: boolean;
  onComplete?: () => void;
}

interface VisualFeedbackState {
  id: string;
  element: Element;
  options: VisualFeedbackOptions;
  isActive: boolean;
}

// Global feedback manager
class VisualFeedbackManager {
  private activeFeedbacks = new Map<string, VisualFeedbackState>();
  private observers = new Set<(feedbacks: VisualFeedbackState[]) => void>();

  addFeedback(options: VisualFeedbackOptions): string {
    const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let element: Element | null = null;
    if (typeof options.target === 'string') {
      element = document.querySelector(options.target);
      if (!element) {
        console.warn(`Visual feedback target not found: ${options.target}`);
        return id;
      }
    } else {
      element = options.target;
    }

    const feedback: VisualFeedbackState = {
      id,
      element,
      options: {
        duration: 2000,
        color: '#3B82F6',
        intensity: 'medium',
        ...options,
      },
      isActive: true,
    };

    this.activeFeedbacks.set(id, feedback);
    this.notifyObservers();

    // Auto-remove after duration
    if (feedback.options.duration && feedback.options.duration > 0) {
      setTimeout(() => {
        this.removeFeedback(id);
      }, feedback.options.duration);
    }

    return id;
  }

  removeFeedback(id: string): void {
    const feedback = this.activeFeedbacks.get(id);
    if (feedback) {
      feedback.isActive = false;
      this.activeFeedbacks.delete(id);
      feedback.options.onComplete?.();
      this.notifyObservers();
    }
  }

  clearAllFeedbacks(): void {
    this.activeFeedbacks.forEach((feedback) => {
      feedback.options.onComplete?.();
    });
    this.activeFeedbacks.clear();
    this.notifyObservers();
  }

  getFeedbacks(): VisualFeedbackState[] {
    return Array.from(this.activeFeedbacks.values());
  }

  subscribe(observer: (feedbacks: VisualFeedbackState[]) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  private notifyObservers(): void {
    const feedbacks = this.getFeedbacks();
    this.observers.forEach(observer => observer(feedbacks));
  }
}

const feedbackManager = new VisualFeedbackManager();

// Hook for using visual feedback
export function useVisualFeedback() {
  const [feedbacks, setFeedbacks] = useState<VisualFeedbackState[]>([]);

  useEffect(() => {
    const unsubscribe = feedbackManager.subscribe(setFeedbacks);
    return unsubscribe;
  }, []);

  const addFeedback = (options: VisualFeedbackOptions): string => {
    return feedbackManager.addFeedback(options);
  };

  const removeFeedback = (id: string): void => {
    feedbackManager.removeFeedback(id);
  };

  const clearAll = (): void => {
    feedbackManager.clearAllFeedbacks();
  };

  return {
    feedbacks,
    addFeedback,
    removeFeedback,
    clearAll,
  };
}

// Individual feedback component
interface FeedbackOverlayProps {
  feedback: VisualFeedbackState;
}

function FeedbackOverlay({ feedback }: FeedbackOverlayProps) {
  const { element, options } = feedback;
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateRect = () => {
      const newRect = element.getBoundingClientRect();
      setRect(newRect);
    };

    updateRect();
    setIsVisible(true);

    // Update position on scroll/resize
    const handleUpdate = () => updateRect();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [element]);

  if (!rect || !isVisible) return null;

  const getIntensityValues = (intensity: string) => {
    switch (intensity) {
      case 'low':
        return { opacity: 0.3, blur: 2, scale: 1.02 };
      case 'high':
        return { opacity: 0.7, blur: 8, scale: 1.08 };
      default:
        return { opacity: 0.5, blur: 4, scale: 1.05 };
    }
  };

  const intensity = getIntensityValues(options.intensity || 'medium');

  const getAnimationClasses = () => {
    switch (options.type) {
      case 'pulse':
        return 'animate-pulse';
      case 'shake':
        return 'animate-bounce';
      case 'ripple':
        return 'animate-ping';
      default:
        return '';
    }
  };

  const getEffectStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      pointerEvents: 'none',
      zIndex: 9999,
      borderRadius: '8px',
      transition: 'all 0.3s ease-in-out',
    };

    switch (options.type) {
      case 'highlight':
        return {
          ...baseStyles,
          backgroundColor: `${options.color}${Math.round(intensity.opacity * 255).toString(16).padStart(2, '0')}`,
          boxShadow: `0 0 ${intensity.blur * 2}px ${options.color}${Math.round(intensity.opacity * 128).toString(16).padStart(2, '0')}`,
        };

      case 'border':
        return {
          ...baseStyles,
          border: `3px solid ${options.color}`,
          backgroundColor: 'transparent',
        };

      case 'glow':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          boxShadow: `0 0 ${intensity.blur * 4}px ${options.color}, inset 0 0 ${intensity.blur * 2}px ${options.color}${Math.round(intensity.opacity * 64).toString(16).padStart(2, '0')}`,
        };

      case 'ripple':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          border: `2px solid ${options.color}`,
          transform: `scale(${intensity.scale})`,
        };

      default:
        return baseStyles;
    }
  };

  return createPortal(
    <div>
      {/* Main effect overlay */}
      <div
        className={cn('transition-all duration-300', getAnimationClasses())}
        style={getEffectStyles()}
      />

      {/* Tooltip if enabled */}
      {options.showTooltip && options.message && (
        <div
          className="fixed z-[10000] bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
          style={{
            top: rect.top - 40,
            left: rect.left + rect.width / 2,
            transform: 'translateX(-50%)',
          }}
        >
          {options.message}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          />
        </div>
      )}
    </div>,
    document.body
  );
}

// Main visual feedback provider component
export function VisualFeedbackProvider({ children }: { children: React.ReactNode }) {
  const { feedbacks } = useVisualFeedback();

  return (
    <>
      {children}
      {feedbacks.map((feedback) => (
        <FeedbackOverlay key={feedback.id} feedback={feedback} />
      ))}
    </>
  );
}

// Utility functions for common feedback patterns
export const visualFeedbackUtils = {
  // Highlight an element with success color
  highlightSuccess: (target: string | Element, message?: string) => {
    return feedbackManager.addFeedback({
      type: 'highlight',
      target,
      color: '#10B981',
      duration: 2000,
      message,
      showTooltip: !!message,
    });
  },

  // Highlight an element with error color
  highlightError: (target: string | Element, message?: string) => {
    return feedbackManager.addFeedback({
      type: 'highlight',
      target,
      color: '#EF4444',
      duration: 3000,
      message,
      showTooltip: !!message,
    });
  },

  // Highlight an element with info color
  highlightInfo: (target: string | Element, message?: string) => {
    return feedbackManager.addFeedback({
      type: 'highlight',
      target,
      color: '#3B82F6',
      duration: 2000,
      message,
      showTooltip: !!message,
    });
  },

  // Add a pulsing effect
  pulse: (target: string | Element, color = '#8B5CF6') => {
    return feedbackManager.addFeedback({
      type: 'pulse',
      target,
      color,
      duration: 2000,
    });
  },

  // Add a glow effect
  glow: (target: string | Element, color = '#F59E0B') => {
    return feedbackManager.addFeedback({
      type: 'glow',
      target,
      color,
      duration: 2500,
      intensity: 'high',
    });
  },

  // Add a ripple effect
  ripple: (target: string | Element, color = '#06B6D4') => {
    return feedbackManager.addFeedback({
      type: 'ripple',
      target,
      color,
      duration: 1500,
    });
  },

  // Shake element to indicate error or attention needed
  shake: (target: string | Element) => {
    return feedbackManager.addFeedback({
      type: 'shake',
      target,
      color: '#EF4444',
      duration: 1000,
    });
  },

  // Clear all active feedbacks
  clearAll: () => {
    feedbackManager.clearAllFeedbacks();
  },
};

// Export the manager for direct access if needed
export { feedbackManager };