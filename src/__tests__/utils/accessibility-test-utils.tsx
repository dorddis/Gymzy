import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Custom render function with accessibility provider
interface AccessibilityRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  accessibilityOptions?: {
    fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast?: boolean;
    reducedMotion?: boolean;
    screenReaderOptimizations?: boolean;
  };
}

export function renderWithAccessibility(
  ui: React.ReactElement,
  options: AccessibilityRenderOptions = {}
): RenderResult {
  const { accessibilityOptions, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  // Apply accessibility options if provided
  if (accessibilityOptions) {
    // This would typically be done through the provider's updatePreferences method
    // For testing, we can simulate the effects
  }

  return result;
}

// Accessibility testing utilities
export const accessibilityTestUtils = {
  // Check for accessibility violations
  async checkAccessibility(container: HTMLElement, options?: any) {
    const results = await axe(container, {
      rules: {
        // Configure specific rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'semantic-structure': { enabled: true },
        ...options?.rules,
      },
    });
    return results;
  },

  // Check for specific accessibility features
  async checkColorContrast(container: HTMLElement) {
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    });
    return results.violations.filter(v => 
      v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
    );
  },

  async checkKeyboardNavigation(container: HTMLElement) {
    const results = await axe(container, {
      rules: {
        'keyboard': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'tabindex': { enabled: true },
      },
    });
    return results.violations.filter(v => 
      ['keyboard', 'focus-order-semantics', 'tabindex'].includes(v.id)
    );
  },

  async checkAriaLabels(container: HTMLElement) {
    const results = await axe(container, {
      rules: {
        'aria-allowed-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'input-button-name': { enabled: true },
        'link-name': { enabled: true },
      },
    });
    return results.violations.filter(v => 
      v.id.includes('aria') || v.id.includes('name')
    );
  },

  async checkSemanticStructure(container: HTMLElement) {
    const results = await axe(container, {
      rules: {
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
        'landmark-complementary-is-top-level': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'region': { enabled: true },
      },
    });
    return results.violations.filter(v => 
      ['heading-order', 'landmark-one-main', 'landmark-complementary-is-top-level', 
       'page-has-heading-one', 'region'].includes(v.id)
    );
  },

  // Simulate keyboard navigation
  simulateKeyboardNavigation(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const results = {
      totalFocusableElements: focusableElements.length,
      elementsWithoutVisibleFocus: [] as Element[],
      elementsWithImproperTabIndex: [] as Element[],
    };

    focusableElements.forEach(element => {
      // Check for visible focus indicators
      const computedStyle = window.getComputedStyle(element, ':focus');
      const hasVisibleFocus = computedStyle.outline !== 'none' || 
                             computedStyle.boxShadow !== 'none' ||
                             computedStyle.border !== element.style.border;
      
      if (!hasVisibleFocus) {
        results.elementsWithoutVisibleFocus.push(element);
      }

      // Check tabindex values
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        results.elementsWithImproperTabIndex.push(element);
      }
    });

    return results;
  },

  // Check touch target sizes (minimum 44px x 44px)
  checkTouchTargetSizes(container: HTMLElement) {
    const interactiveElements = container.querySelectorAll(
      'button, [href], input[type="button"], input[type="submit"], [role="button"], [onclick]'
    );
    
    const violations = [] as Array<{
      element: Element;
      width: number;
      height: number;
    }>;

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        violations.push({
          element,
          width: rect.width,
          height: rect.height,
        });
      }
    });

    return violations;
  },

  // Check for proper alt text on images
  checkImageAltText(container: HTMLElement) {
    const images = container.querySelectorAll('img');
    const violations = [] as Array<{
      element: Element;
      issue: string;
    }>;

    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');
      
      if (alt === null) {
        violations.push({
          element: img,
          issue: 'Missing alt attribute',
        });
      } else if (alt === src) {
        violations.push({
          element: img,
          issue: 'Alt text is same as src (likely not descriptive)',
        });
      } else if (alt.length > 125) {
        violations.push({
          element: img,
          issue: 'Alt text is too long (over 125 characters)',
        });
      }
    });

    return violations;
  },

  // Check form accessibility
  checkFormAccessibility(container: HTMLElement) {
    const forms = container.querySelectorAll('form');
    const violations = [] as Array<{
      element: Element;
      issue: string;
    }>;

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const label = id ? form.querySelector(`label[for="${id}"]`) : null;
        
        if (!label && !ariaLabel && !ariaLabelledBy) {
          violations.push({
            element: input,
            issue: 'Input has no associated label',
          });
        }

        // Check for required field indication
        const required = input.hasAttribute('required');
        if (required) {
          const hasRequiredIndicator = 
            input.getAttribute('aria-required') === 'true' ||
            (label && label.textContent?.includes('*')) ||
            ariaLabel?.includes('required');
          
          if (!hasRequiredIndicator) {
            violations.push({
              element: input,
              issue: 'Required field not properly indicated',
            });
          }
        }
      });
    });

    return violations;
  },
};

// Custom Jest matchers for accessibility testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoAccessibilityViolations(): R;
      toHaveValidColorContrast(): R;
      toHaveProperKeyboardNavigation(): R;
      toHaveValidAriaLabels(): R;
      toHaveProperTouchTargets(): R;
    }
  }
}

// Implement custom matchers
expect.extend({
  async toHaveNoAccessibilityViolations(received: HTMLElement) {
    const results = await accessibilityTestUtils.checkAccessibility(received);
    const pass = results.violations.length === 0;
    
    return {
      message: () => 
        pass 
          ? `Expected element to have accessibility violations, but found none`
          : `Expected no accessibility violations, but found ${results.violations.length}:\n${
              results.violations.map(v => `- ${v.id}: ${v.description}`).join('\n')
            }`,
      pass,
    };
  },

  async toHaveValidColorContrast(received: HTMLElement) {
    const violations = await accessibilityTestUtils.checkColorContrast(received);
    const pass = violations.length === 0;
    
    return {
      message: () => 
        pass 
          ? `Expected element to have color contrast violations, but found none`
          : `Expected valid color contrast, but found ${violations.length} violations`,
      pass,
    };
  },

  async toHaveProperKeyboardNavigation(received: HTMLElement) {
    const violations = await accessibilityTestUtils.checkKeyboardNavigation(received);
    const pass = violations.length === 0;
    
    return {
      message: () => 
        pass 
          ? `Expected element to have keyboard navigation issues, but found none`
          : `Expected proper keyboard navigation, but found ${violations.length} violations`,
      pass,
    };
  },

  async toHaveValidAriaLabels(received: HTMLElement) {
    const violations = await accessibilityTestUtils.checkAriaLabels(received);
    const pass = violations.length === 0;
    
    return {
      message: () => 
        pass 
          ? `Expected element to have ARIA label violations, but found none`
          : `Expected valid ARIA labels, but found ${violations.length} violations`,
      pass,
    };
  },

  toHaveProperTouchTargets(received: HTMLElement) {
    const violations = accessibilityTestUtils.checkTouchTargetSizes(received);
    const pass = violations.length === 0;
    
    return {
      message: () => 
        pass 
          ? `Expected element to have touch target violations, but found none`
          : `Expected proper touch targets (44px minimum), but found ${violations.length} violations:\n${
              violations.map(v => `- Element has size ${v.width}x${v.height}px`).join('\n')
            }`,
      pass,
    };
  },
});

// Export everything
export { axe, toHaveNoViolations };
export default accessibilityTestUtils;