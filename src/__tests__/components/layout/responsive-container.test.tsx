import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveText,
  useResponsiveValue,
  useResponsiveSpacing,
} from '@/components/layout/responsive-container';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

// Mock the responsive layout hook
jest.mock('@/hooks/use-responsive-layout');

const mockUseResponsiveLayout = useResponsiveLayout as jest.MockedFunction<typeof useResponsiveLayout>;

// Test component for hooks
function TestHookComponent() {
  const value = useResponsiveValue({
    mobile: 'mobile-value',
    tablet: 'tablet-value',
    desktop: 'desktop-value',
    splitScreen: 'split-screen-value',
  });

  const { spacing, padding, margin, gap } = useResponsiveSpacing();

  return (
    <div>
      <div data-testid="responsive-value">{value}</div>
      <div data-testid="spacing-md" className={spacing.md}>Spacing</div>
      <div data-testid="padding-lg" className={padding.lg}>Padding</div>
      <div data-testid="margin-sm" className={margin.sm}>Margin</div>
      <div data-testid="gap-md" className={gap.md}>Gap</div>
    </div>
  );
}

describe('ResponsiveContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ResponsiveContainer component', () => {
    it('should render with mobile layout', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <ResponsiveContainer>
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByText('Test Content').parentElement;
      expect(container).toHaveAttribute('data-breakpoint', 'mobile');
      expect(container).toHaveAttribute('data-compact', 'false');
    });

    it('should render with desktop split-screen layout', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <ResponsiveContainer>
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByText('Test Content').parentElement;
      expect(container).toHaveAttribute('data-breakpoint', 'desktop');
      expect(container).toHaveAttribute('data-compact', 'true');
      expect(container).toHaveClass('split-screen-mode');
    });

    it('should enable compact mode when width is below minimum', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'tablet',
        width: 300, // Below default minWidth of 400
        height: 600,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: true,
      });

      render(
        <ResponsiveContainer minWidth={400}>
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByText('Test Content').parentElement;
      expect(container).toHaveAttribute('data-compact', 'true');
    });

    it('should apply custom className', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <ResponsiveContainer className="custom-class">
          <div>Test Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByText('Test Content').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('ResponsiveGrid component', () => {
    it('should render with responsive grid classes', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'tablet',
        width: 768,
        height: 1024,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: true,
      });

      render(
        <ResponsiveGrid contentType="dashboard">
          <div>Grid Item</div>
        </ResponsiveGrid>
      );

      const grid = screen.getByText('Grid Item').parentElement;
      expect(grid).toHaveClass('grid', 'gap-4', 'grid-cols-2');
    });

    it('should use auto-fit grid in split-screen mode', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <ResponsiveGrid contentType="dashboard" minItemWidth={250}>
          <div>Grid Item</div>
        </ResponsiveGrid>
      );

      const grid = screen.getByText('Grid Item').parentElement;
      expect(grid).toHaveClass('grid', 'gap-4');
      expect(grid).toHaveStyle({
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      });
    });
  });

  describe('ResponsiveCard component', () => {
    it('should render with default padding', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <ResponsiveCard>
          <div>Card Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByText('Card Content').parentElement;
      expect(card).toHaveClass('p-4'); // Default medium padding for non-compact
    });

    it('should render with compact padding in split-screen mode', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(
        <ResponsiveCard>
          <div>Card Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByText('Card Content').parentElement;
      expect(card).toHaveClass('p-3', 'compact-card'); // Compact padding for split-screen
    });

    it('should apply custom padding size', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <ResponsiveCard padding="lg">
          <div>Card Content</div>
        </ResponsiveCard>
      );

      const card = screen.getByText('Card Content').parentElement;
      expect(card).toHaveClass('p-6'); // Large padding for non-compact
    });
  });

  describe('ResponsiveText component', () => {
    it('should render with correct variant classes', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <ResponsiveText variant="heading1">
          Heading Text
        </ResponsiveText>
      );

      const text = screen.getByText('Heading Text');
      expect(text).toHaveClass('text-2xl', 'lg:text-3xl'); // Desktop heading1 classes
    });

    it('should render with custom HTML element', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(
        <ResponsiveText variant="heading2" as="h2">
          Heading Text
        </ResponsiveText>
      );

      const text = screen.getByRole('heading', { level: 2 });
      expect(text).toHaveTextContent('Heading Text');
    });
  });

  describe('useResponsiveValue hook', () => {
    it('should return mobile value for mobile breakpoint', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(<TestHookComponent />);

      expect(screen.getByTestId('responsive-value')).toHaveTextContent('mobile-value');
    });

    it('should return tablet value for tablet breakpoint', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'tablet',
        width: 768,
        height: 1024,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: true,
      });

      render(<TestHookComponent />);

      expect(screen.getByTestId('responsive-value')).toHaveTextContent('tablet-value');
    });

    it('should return desktop value for desktop breakpoint', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(<TestHookComponent />);

      expect(screen.getByTestId('responsive-value')).toHaveTextContent('desktop-value');
    });

    it('should return split-screen value when in split-screen mode', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(<TestHookComponent />);

      expect(screen.getByTestId('responsive-value')).toHaveTextContent('split-screen-value');
    });
  });

  describe('useResponsiveSpacing hook', () => {
    it('should return normal spacing for non-split-screen mode', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: false,
        shouldUseToggleMode: false,
      });

      render(<TestHookComponent />);

      expect(screen.getByTestId('spacing-md')).toHaveClass('space-y-4');
      expect(screen.getByTestId('padding-lg')).toHaveClass('p-6');
      expect(screen.getByTestId('margin-sm')).toHaveClass('m-3');
      expect(screen.getByTestId('gap-md')).toHaveClass('gap-4');
    });

    it('should return compact spacing for split-screen mode', () => {
      mockUseResponsiveLayout.mockReturnValue({
        breakpoint: 'desktop',
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        shouldUseSplitScreen: true,
        shouldUseToggleMode: false,
      });

      render(<TestHookComponent />);

      expect(screen.getByTestId('spacing-md')).toHaveClass('space-y-3');
      expect(screen.getByTestId('padding-lg')).toHaveClass('p-4');
      expect(screen.getByTestId('margin-sm')).toHaveClass('m-2');
      expect(screen.getByTestId('gap-md')).toHaveClass('gap-3');
    });
  });
});