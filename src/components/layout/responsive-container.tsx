"use client";

import React, { ReactNode } from 'react';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getResponsiveGridClasses, getResponsiveFontSizes } from '@/lib/layout-utils';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: ReactNode;
  contentType?: 'dashboard' | 'workout-list' | 'form' | 'chart';
  className?: string;
  enableCompactMode?: boolean;
  minWidth?: number;
}

export function ResponsiveContainer({
  children,
  contentType = 'dashboard',
  className,
  enableCompactMode = true,
  minWidth = 400,
}: ResponsiveContainerProps) {
  const layout = useResponsiveLayout();
  const fontSizes = getResponsiveFontSizes(layout.breakpoint);

  // Determine if we should use compact mode
  const shouldUseCompactMode = enableCompactMode && 
    (layout.shouldUseSplitScreen || (layout.width > 0 && layout.width < minWidth));

  const containerClasses = cn(
    'responsive-container',
    shouldUseCompactMode && 'compact-mode',
    layout.breakpoint === 'desktop' && layout.shouldUseSplitScreen && 'split-screen-mode',
    className
  );

  return (
    <div 
      className={containerClasses}
      data-breakpoint={layout.breakpoint}
      data-compact={shouldUseCompactMode}
      style={{
        '--font-heading-1': fontSizes.heading1,
        '--font-heading-2': fontSizes.heading2,
        '--font-heading-3': fontSizes.heading3,
        '--font-body': fontSizes.body,
        '--font-small': fontSizes.small,
        '--font-tiny': fontSizes.tiny,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  contentType?: 'dashboard' | 'workout-list' | 'form' | 'chart';
  className?: string;
  minItemWidth?: number;
  gap?: number;
}

export function ResponsiveGrid({
  children,
  contentType = 'dashboard',
  className,
  minItemWidth = 200,
  gap = 4,
}: ResponsiveGridProps) {
  const layout = useResponsiveLayout();
  const gridClasses = getResponsiveGridClasses(layout.breakpoint, contentType);

  // For split-screen mode, use CSS Grid with auto-fit for better responsiveness
  const shouldUseAutoGrid = layout.shouldUseSplitScreen;

  if (shouldUseAutoGrid) {
    return (
      <div
        className={cn('grid gap-4', className)}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
          gap: `${gap * 0.25}rem`,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function ResponsiveCard({
  children,
  className,
  compact,
  padding = 'md',
}: ResponsiveCardProps) {
  const layout = useResponsiveLayout();
  
  const isCompact = compact ?? layout.shouldUseSplitScreen;
  
  const paddingClasses = {
    sm: isCompact ? 'p-2' : 'p-3',
    md: isCompact ? 'p-3' : 'p-4',
    lg: isCompact ? 'p-4' : 'p-6',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-100',
        paddingClasses[padding],
        isCompact && 'compact-card',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveTextProps {
  children: ReactNode;
  variant: 'heading1' | 'heading2' | 'heading3' | 'body' | 'small' | 'tiny';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ResponsiveText({
  children,
  variant,
  className,
  as: Component = 'div',
}: ResponsiveTextProps) {
  const layout = useResponsiveLayout();
  const fontSizes = getResponsiveFontSizes(layout.breakpoint);

  const variantClass = fontSizes[variant];

  return (
    <Component className={cn(variantClass, className)}>
      {children}
    </Component>
  );
}

// Hook for getting responsive values
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet: T;
  desktop: T;
  splitScreen?: T;
}): T {
  const layout = useResponsiveLayout();

  if (layout.shouldUseSplitScreen && values.splitScreen !== undefined) {
    return values.splitScreen;
  }

  switch (layout.breakpoint) {
    case 'mobile':
      return values.mobile;
    case 'tablet':
      return values.tablet;
    case 'desktop':
      return values.desktop;
    default:
      return values.mobile;
  }
}

// Hook for responsive spacing
export function useResponsiveSpacing() {
  const layout = useResponsiveLayout();
  
  const spacing = {
    xs: layout.shouldUseSplitScreen ? 'space-y-1' : 'space-y-2',
    sm: layout.shouldUseSplitScreen ? 'space-y-2' : 'space-y-3',
    md: layout.shouldUseSplitScreen ? 'space-y-3' : 'space-y-4',
    lg: layout.shouldUseSplitScreen ? 'space-y-4' : 'space-y-6',
    xl: layout.shouldUseSplitScreen ? 'space-y-6' : 'space-y-8',
  };

  const padding = {
    xs: layout.shouldUseSplitScreen ? 'p-1' : 'p-2',
    sm: layout.shouldUseSplitScreen ? 'p-2' : 'p-3',
    md: layout.shouldUseSplitScreen ? 'p-3' : 'p-4',
    lg: layout.shouldUseSplitScreen ? 'p-4' : 'p-6',
    xl: layout.shouldUseSplitScreen ? 'p-6' : 'p-8',
  };

  const margin = {
    xs: layout.shouldUseSplitScreen ? 'm-1' : 'm-2',
    sm: layout.shouldUseSplitScreen ? 'm-2' : 'm-3',
    md: layout.shouldUseSplitScreen ? 'm-3' : 'm-4',
    lg: layout.shouldUseSplitScreen ? 'm-4' : 'm-6',
    xl: layout.shouldUseSplitScreen ? 'm-6' : 'm-8',
  };

  const gap = {
    xs: layout.shouldUseSplitScreen ? 'gap-1' : 'gap-2',
    sm: layout.shouldUseSplitScreen ? 'gap-2' : 'gap-3',
    md: layout.shouldUseSplitScreen ? 'gap-3' : 'gap-4',
    lg: layout.shouldUseSplitScreen ? 'gap-4' : 'gap-6',
    xl: layout.shouldUseSplitScreen ? 'gap-6' : 'gap-8',
  };

  return { spacing, padding, margin, gap };
}