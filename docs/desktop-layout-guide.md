# Desktop Layout System Guide

## Overview

The Gymzy desktop layout system provides a responsive, split-screen interface optimized for desktop users. It features a main application panel alongside an integrated AI chat panel, with comprehensive customization options and accessibility support.

## Table of Contents

1. [Architecture](#architecture)
2. [Components](#components)
3. [User Preferences](#user-preferences)
4. [Keyboard Navigation](#keyboard-navigation)
5. [Performance](#performance)
6. [Accessibility](#accessibility)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Architecture

### Layout Detection

The system automatically detects the appropriate layout based on screen size:

- **Mobile** (< 768px): Single-column mobile layout
- **Tablet** (768px - 1023px): Toggle between app and chat views
- **Desktop** (≥ 1024px): Split-screen layout with resizable panels

### Responsive Breakpoints

```typescript
const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  desktop: 1024,
  'desktop-lg': 1280,
  'desktop-xl': 1440,
  'split-screen': 1200,
};
```

### Component Hierarchy

```
Providers
├── ErrorBoundary
├── AppChatBridgeProvider
├── AppLayoutProvider
├── ChatActionHandler
├── ChatContextProvider
├── KeyboardNavigation
└── DesktopLayoutWrapper
    ├── LayoutErrorBoundary
    ├── WorkoutErrorBoundary (App Panel)
    ├── ResizableDivider
    └── ChatErrorBoundary (Chat Panel)
```

## Components

### DesktopLayoutWrapper

The main layout component that orchestrates the split-screen interface.

```tsx
import { DesktopLayoutWrapper } from '@/components/layout/desktop-layout-wrapper';

<DesktopLayoutWrapper
  chatComponent={<DesktopChatPanel />}
  onLayoutChange={(breakpoint, dimensions) => {
    console.log('Layout changed:', breakpoint, dimensions);
  }}
>
  <YourAppContent />
</DesktopLayoutWrapper>
```

**Props:**
- `children`: Main application content
- `chatComponent`: Chat panel component
- `className`: Additional CSS classes
- `onLayoutChange`: Callback for layout changes

### DesktopChatPanel

Optimized chat component for desktop embedding.

```tsx
import { DesktopChatPanel } from '@/components/chat/desktop-chat-panel';

<DesktopChatPanel
  isEmbedded={true}
  compact={false}
  onAppAction={(action, data) => {
    console.log('Chat action:', action, data);
  }}
/>
```

**Props:**
- `isEmbedded`: Whether chat is embedded in split-screen
- `compact`: Use compact UI for smaller spaces
- `onAppAction`: Callback for chat-triggered actions

### ResizableDivider

Draggable divider for adjusting panel sizes.

```tsx
import { ResizableDivider } from '@/components/layout/resizable-divider';

<ResizableDivider
  splitRatio={0.65}
  onSplitRatioChange={(ratio) => setSplitRatio(ratio)}
  containerWidth={1200}
  minAppPanelWidth={400}
  minChatPanelWidth={300}
/>
```

## User Preferences

### Desktop Preferences

Users can customize their desktop experience through the settings panel:

```typescript
interface DesktopLayoutPreferences {
  enabled: boolean;                    // Enable/disable desktop mode
  chatPanelPosition: 'left' | 'right'; // Chat panel position
  defaultSplitRatio: number;           // Default split ratio (0.3-0.8)
  autoHideChat: boolean;               // Auto-hide chat when inactive
  compactMode: boolean;                // Use compact UI elements
  animationsEnabled: boolean;          // Enable/disable animations
  keyboardShortcutsEnabled: boolean;   // Enable keyboard shortcuts
  theme: 'light' | 'dark' | 'system';  // Theme preference
  fontSize: 'small' | 'medium' | 'large'; // Font size
  reducedMotion: boolean;              // Reduce motion for accessibility
}
```

### Using Preferences

```tsx
import { useDesktopPreferences } from '@/lib/user-preferences';

function MyComponent() {
  const { desktopPreferences, updateDesktopPreferences } = useDesktopPreferences();
  
  const toggleCompactMode = () => {
    updateDesktopPreferences({
      compactMode: !desktopPreferences.compactMode
    });
  };
  
  return (
    <div className={desktopPreferences.compactMode ? 'compact' : 'normal'}>
      {/* Component content */}
    </div>
  );
}
```

### Settings Panel

```tsx
import { DesktopPreferencesPanel } from '@/components/settings/desktop-preferences-panel';

<DesktopPreferencesPanel
  onClose={() => setShowSettings(false)}
/>
```

## Keyboard Navigation

### Default Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + C` | Focus chat input |
| `Alt + H` | Navigate to home |
| `Alt + W` | Navigate to workout |
| `Alt + S` | Navigate to stats |
| `Alt + P` | Navigate to profile |
| `Alt + /` | Show keyboard shortcuts help |
| `Alt + Tab` | Toggle views (tablet mode) |
| `Alt + 1` | Switch to app view (tablet) |
| `Alt + 2` | Switch to chat view (tablet) |

### Custom Shortcuts

```tsx
import { useKeyboardShortcut } from '@/components/layout/keyboard-navigation';

function MyComponent() {
  useKeyboardShortcut('k', () => {
    console.log('Custom shortcut triggered');
  }, { modifier: 'alt' });
  
  return <div>Component with custom shortcut</div>;
}
```

### Accessibility Features

- **Skip to content** link for keyboard users
- **Focus trapping** in modals and dialogs
- **Screen reader announcements** for dynamic content
- **ARIA labels** and semantic markup
- **High contrast** focus indicators

## Performance

### Optimization Strategies

1. **Lazy Loading**: Heavy components are loaded on demand
2. **Memoization**: Expensive calculations are cached
3. **Debouncing**: Rapid state updates are batched
4. **Error Boundaries**: Graceful degradation on errors
5. **Performance Monitoring**: Real-time performance tracking

### Performance Budgets

- **Component Render**: < 50ms
- **Chat Panel Load**: < 100ms
- **Layout Calculations**: < 10ms
- **Animation Frames**: < 16.67ms (60fps)

### Monitoring

```tsx
import { usePerformanceMonitor } from '@/components/layout/performance-optimizations';

function MyComponent() {
  usePerformanceMonitor('MyComponent');
  
  return <div>Monitored component</div>;
}
```

## Accessibility

### WCAG Compliance

The desktop layout system follows WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Reader Support**: Proper semantic markup and ARIA labels
- **Color Contrast**: Meets minimum contrast ratios
- **Focus Management**: Clear focus indicators and logical tab order
- **Reduced Motion**: Respects user's motion preferences

### Testing Accessibility

```bash
# Run accessibility tests
npm run test:a11y

# Test with screen reader
# Use NVDA, JAWS, or VoiceOver to test screen reader compatibility
```

### Accessibility Features

```tsx
import { 
  SkipToContent, 
  FocusTrap, 
  ScreenReaderAnnouncement 
} from '@/components/layout/accessibility-helpers';

function AccessibleComponent() {
  return (
    <>
      <SkipToContent />
      <FocusTrap active={isModalOpen}>
        <div role="dialog" aria-labelledby="modal-title">
          <h2 id="modal-title">Modal Title</h2>
          {/* Modal content */}
        </div>
      </FocusTrap>
      <ScreenReaderAnnouncement 
        message="Action completed successfully" 
        assertive={true} 
      />
    </>
  );
}
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=desktop-layout
npm test -- --testPathPattern=user-preferences
npm test -- --testPathPattern=keyboard-navigation
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance
```

### E2E Tests

```bash
# Run end-to-end tests
npm run test:e2e

# Run specific E2E scenarios
npm run test:e2e -- --spec="desktop-workflow"
```

### Visual Regression Tests

```bash
# Run visual regression tests
npm run test:visual

# Update visual baselines
npm run test:visual -- --update-snapshots
```

## Troubleshooting

### Common Issues

#### Layout Not Switching to Desktop Mode

**Symptoms**: Desktop layout not activating on large screens

**Solutions**:
1. Check if desktop mode is enabled in preferences
2. Verify screen width meets minimum requirement (1024px)
3. Check for JavaScript errors in console
4. Ensure responsive layout hook is working

```tsx
// Debug responsive layout
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

function DebugLayout() {
  const layout = useResponsiveLayout();
  console.log('Layout state:', layout);
  return <div>Check console for layout debug info</div>;
}
```

#### Chat Panel Not Loading

**Symptoms**: Chat panel shows loading state indefinitely

**Solutions**:
1. Check network connectivity
2. Verify authentication state
3. Check for errors in chat service
4. Clear browser cache and localStorage

```tsx
// Debug chat state
import { useDesktopChatIntegration } from '@/hooks/use-desktop-chat-integration';

function DebugChat() {
  const chatState = useDesktopChatIntegration();
  console.log('Chat state:', chatState);
  return <div>Check console for chat debug info</div>;
}
```

#### Performance Issues

**Symptoms**: Slow rendering or janky animations

**Solutions**:
1. Enable performance monitoring
2. Check for memory leaks
3. Reduce animation complexity
4. Enable reduced motion if needed

```tsx
// Monitor performance
import { PerformanceMonitor } from '@/components/layout/performance-optimizations';

function App() {
  return (
    <>
      <YourApp />
      <PerformanceMonitor /> {/* Shows performance metrics in dev mode */}
    </>
  );
}
```

#### Keyboard Shortcuts Not Working

**Symptoms**: Keyboard shortcuts don't trigger actions

**Solutions**:
1. Check if shortcuts are enabled in preferences
2. Verify no other elements are capturing key events
3. Check for conflicting browser shortcuts
4. Ensure KeyboardNavigation component is mounted

```tsx
// Debug keyboard shortcuts
import { usePreferenceAwareKeyboardShortcuts } from '@/hooks/use-preference-aware-layout';

function DebugKeyboard() {
  const { enabled } = usePreferenceAwareKeyboardShortcuts();
  console.log('Keyboard shortcuts enabled:', enabled);
  return <div>Check console for keyboard debug info</div>;
}
```

### Error Recovery

The system includes comprehensive error boundaries that provide graceful degradation:

- **Layout errors**: Fall back to mobile layout
- **Chat errors**: Show error message, keep app functional
- **App errors**: Show error message, keep chat functional
- **Preference errors**: Reset to defaults

### Getting Help

1. Check the browser console for error messages
2. Enable debug mode in development
3. Use React DevTools to inspect component state
4. Check network tab for failed requests
5. Verify localStorage for corrupted preferences

### Debug Mode

```tsx
// Enable debug mode
localStorage.setItem('gymzy_debug', 'true');

// This will enable:
// - Verbose console logging
// - Performance monitoring
// - State inspection tools
// - Error details in production
```

## Best Practices

### Component Development

1. **Use error boundaries** for all major components
2. **Implement loading states** for async operations
3. **Add proper TypeScript types** for all props and state
4. **Include accessibility attributes** from the start
5. **Test on multiple screen sizes** and devices

### Performance

1. **Lazy load** heavy components
2. **Memoize** expensive calculations
3. **Debounce** rapid state updates
4. **Use React.memo** for pure components
5. **Monitor** performance in development

### Accessibility

1. **Test with keyboard only** navigation
2. **Use screen readers** for testing
3. **Provide alternative text** for images
4. **Ensure proper heading structure**
5. **Test with high contrast** mode

### User Experience

1. **Respect user preferences** for motion and themes
2. **Provide clear feedback** for all actions
3. **Maintain consistent** interaction patterns
4. **Support both mouse and keyboard** users
5. **Test with real users** when possible

## API Reference

### Hooks

- `useResponsiveLayout()` - Get current responsive layout state
- `useDesktopPreferences()` - Manage desktop preferences
- `useKeyboardShortcut()` - Add custom keyboard shortcuts
- `usePerformanceMonitor()` - Monitor component performance
- `useDesktopChatIntegration()` - Manage chat integration state

### Components

- `DesktopLayoutWrapper` - Main layout container
- `DesktopChatPanel` - Desktop-optimized chat panel
- `ResizableDivider` - Draggable panel divider
- `DesktopPreferencesPanel` - Settings panel
- `KeyboardNavigation` - Keyboard shortcut system
- `ErrorBoundary` - Error handling wrapper

### Utilities

- `ResponsiveUtils` - Responsive calculation utilities
- `UserPreferencesManager` - Preference management
- `DESIGN_TOKENS` - Design system constants
- `BREAKPOINTS` - Responsive breakpoints

## Contributing

When contributing to the desktop layout system:

1. **Follow TypeScript** best practices
2. **Add comprehensive tests** for new features
3. **Update documentation** for API changes
4. **Test accessibility** thoroughly
5. **Consider performance** impact
6. **Maintain backward compatibility** when possible

## License

This desktop layout system is part of the Gymzy application and follows the same license terms.