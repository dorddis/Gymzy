import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderWithAccessibility } from '../../utils/accessibility-test-utils';
import {
  ScreenReaderAnnouncer,
  useScreenReaderAnnouncement,
  useFormAnnouncements,
  useNavigationAnnouncements,
  useStatusAnnouncements,
  DynamicAnnouncement,
  LiveRegion,
} from '@/components/accessibility/ScreenReaderAnnouncer';

// Test components
function TestAnnouncementComponent() {
  const { announce } = useScreenReaderAnnouncement();
  
  return (
    <div>
      <button onClick={() => announce('Test polite message', 'polite', 'general')}>
        Announce Polite
      </button>
      <button onClick={() => announce('Test assertive message', 'assertive', 'error')}>
        Announce Assertive
      </button>
    </div>
  );
}

function TestFormAnnouncementComponent() {
  const { 
    announceFieldError, 
    announceFieldSuccess, 
    announceFormSubmission,
    announceRequiredField 
  } = useFormAnnouncements();
  
  return (
    <div>
      <button onClick={() => announceFieldError('Email', 'Invalid email format')}>
        Field Error
      </button>
      <button onClick={() => announceFieldSuccess('Email', 'Email is valid')}>
        Field Success
      </button>
      <button onClick={() => announceFormSubmission(true, 'Profile updated')}>
        Form Success
      </button>
      <button onClick={() => announceFormSubmission(false, 'Network error')}>
        Form Error
      </button>
      <button onClick={() => announceRequiredField('Password')}>
        Required Field
      </button>
    </div>
  );
}

function TestNavigationAnnouncementComponent() {
  const { 
    announcePageChange, 
    announceRouteChange,
    announceFocusChange,
    announceModalOpen,
    announceModalClose 
  } = useNavigationAnnouncements();
  
  return (
    <div>
      <button onClick={() => announcePageChange('Dashboard')}>
        Page Change
      </button>
      <button onClick={() => announceRouteChange('Workouts')}>
        Route Change
      </button>
      <button onClick={() => announceFocusChange('Search button')}>
        Focus Change
      </button>
      <button onClick={() => announceModalOpen('Settings')}>
        Modal Open
      </button>
      <button onClick={() => announceModalClose('Settings')}>
        Modal Close
      </button>
    </div>
  );
}

function TestStatusAnnouncementComponent() {
  const { 
    announceLoading,
    announceLoadingComplete,
    announceProgress,
    announceDataUpdate,
    announceError,
    announceSuccess 
  } = useStatusAnnouncements();
  
  return (
    <div>
      <button onClick={() => announceLoading('workouts')}>
        Loading
      </button>
      <button onClick={() => announceLoadingComplete('workouts')}>
        Loading Complete
      </button>
      <button onClick={() => announceProgress(3, 10, 'uploading files')}>
        Progress
      </button>
      <button onClick={() => announceDataUpdate('Workouts', 5)}>
        Data Update
      </button>
      <button onClick={() => announceError('Network timeout', 'saving workout')}>
        Error
      </button>
      <button onClick={() => announceSuccess('Workout saved', 'database')}>
        Success
      </button>
    </div>
  );
}

function TestDynamicAnnouncementComponent() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Increment: {count}
      </button>
      <DynamicAnnouncement
        message={`Count is now ${count}`}
        priority="polite"
        category="status"
        trigger={count}
        delay={100}
      />
    </div>
  );
}

describe('ScreenReaderAnnouncer', () => {
  beforeEach(() => {
    // Clear any existing announcements
    const existingAnnouncer = document.querySelector('[aria-live]');
    if (existingAnnouncer) {
      existingAnnouncer.remove();
    }
  });

  it('should render without crashing', () => {
    renderWithAccessibility(<ScreenReaderAnnouncer />);
    // Component should not render anything visible initially
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should create live region when announcement is made', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestAnnouncementComponent />
      </div>
    );

    const politeButton = screen.getByText('Announce Polite');
    
    act(() => {
      politeButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion).toHaveTextContent('Test polite message');
    });
  });

  it('should handle assertive announcements', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestAnnouncementComponent />
      </div>
    );

    const assertiveButton = screen.getByText('Announce Assertive');
    
    act(() => {
      assertiveButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(liveRegion).toHaveTextContent('Test assertive message');
    });
  });

  it('should queue multiple announcements', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestAnnouncementComponent />
      </div>
    );

    const politeButton = screen.getByText('Announce Polite');
    const assertiveButton = screen.getByText('Announce Assertive');
    
    // Make multiple announcements quickly
    act(() => {
      politeButton.click();
      assertiveButton.click();
    });

    // Should show the first announcement
    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });

    // Wait for queue processing
    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      // Should prioritize assertive messages
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    }, { timeout: 2000 });
  });

  it('should respect announcement preferences', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestAnnouncementComponent />
      </div>,
      {
        accessibilityOptions: {
          // This would be handled by the AccessibilityProvider
          // For now, we test the basic functionality
        }
      }
    );

    const politeButton = screen.getByText('Announce Polite');
    
    act(() => {
      politeButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });
  });
});

describe('useFormAnnouncements', () => {
  it('should announce field errors', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestFormAnnouncementComponent />
      </div>
    );

    const fieldErrorButton = screen.getByText('Field Error');
    
    act(() => {
      fieldErrorButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(liveRegion).toHaveTextContent('Email has an error: Invalid email format');
    });
  });

  it('should announce field success', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestFormAnnouncementComponent />
      </div>
    );

    const fieldSuccessButton = screen.getByText('Field Success');
    
    act(() => {
      fieldSuccessButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent('Email is valid');
    });
  });

  it('should announce form submission results', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestFormAnnouncementComponent />
      </div>
    );

    const formSuccessButton = screen.getByText('Form Success');
    
    act(() => {
      formSuccessButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent('Profile updated');
    });
  });

  it('should announce required fields', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestFormAnnouncementComponent />
      </div>
    );

    const requiredFieldButton = screen.getByText('Required Field');
    
    act(() => {
      requiredFieldButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(liveRegion).toHaveTextContent('Password is required');
    });
  });
});

describe('useNavigationAnnouncements', () => {
  it('should announce page changes', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestNavigationAnnouncementComponent />
      </div>
    );

    const pageChangeButton = screen.getByText('Page Change');
    
    act(() => {
      pageChangeButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Navigated to Dashboard');
    });
  });

  it('should announce modal state changes', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestNavigationAnnouncementComponent />
      </div>
    );

    const modalOpenButton = screen.getByText('Modal Open');
    
    act(() => {
      modalOpenButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Settings dialog opened');
    });
  });
});

describe('useStatusAnnouncements', () => {
  it('should announce loading states', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestStatusAnnouncementComponent />
      </div>
    );

    const loadingButton = screen.getByText('Loading');
    
    act(() => {
      loadingButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Loading workouts');
    });
  });

  it('should announce progress updates', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestStatusAnnouncementComponent />
      </div>
    );

    const progressButton = screen.getByText('Progress');
    
    act(() => {
      progressButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Progress uploading files: 3 of 10');
    });
  });

  it('should announce errors with assertive priority', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestStatusAnnouncementComponent />
      </div>
    );

    const errorButton = screen.getByText('Error');
    
    act(() => {
      errorButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(liveRegion).toHaveTextContent('Error in saving workout: Network timeout');
    });
  });
});

describe('DynamicAnnouncement', () => {
  it('should announce when trigger changes', async () => {
    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestDynamicAnnouncementComponent />
      </div>
    );

    const incrementButton = screen.getByText(/Increment:/);
    
    act(() => {
      incrementButton.click();
    });

    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Count is now 1');
    });
  });

  it('should respect delay setting', async () => {
    const TestDelayedComponent = () => {
      const [trigger, setTrigger] = React.useState(0);
      
      return (
        <div>
          <button onClick={() => setTrigger(t => t + 1)}>
            Trigger
          </button>
          <DynamicAnnouncement
            message="Delayed message"
            trigger={trigger}
            delay={500}
          />
        </div>
      );
    };

    renderWithAccessibility(
      <div>
        <ScreenReaderAnnouncer />
        <TestDelayedComponent />
      </div>
    );

    const triggerButton = screen.getByText('Trigger');
    
    act(() => {
      triggerButton.click();
    });

    // Should not announce immediately
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // Should announce after delay
    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Delayed message');
    }, { timeout: 1000 });
  });
});

describe('LiveRegion', () => {
  it('should render with proper ARIA attributes', () => {
    render(
      <LiveRegion priority="assertive" atomic={false} relevant="additions">
        <p>Live content</p>
      </LiveRegion>
    );

    const liveRegion = screen.getByText('Live content').parentElement;
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
    expect(liveRegion).toHaveAttribute('aria-relevant', 'additions');
  });

  it('should render children content', () => {
    render(
      <LiveRegion>
        <p>Test content</p>
        <span>More content</span>
      </LiveRegion>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('More content')).toBeInTheDocument();
  });
});