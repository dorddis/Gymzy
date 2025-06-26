import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for optimized navigation that doesn't block on current page loading states
 */
export const useOptimizedNavigation = () => {
  const router = useRouter();

  const navigateOptimized = useCallback((path: string) => {
    // Use setTimeout to ensure navigation happens after current render cycle
    // This prevents blocking navigation due to loading states
    setTimeout(() => {
      router.push(path);
    }, 0);
  }, [router]);

  const navigateBack = useCallback(() => {
    setTimeout(() => {
      router.back();
    }, 0);
  }, [router]);

  const navigateReplace = useCallback((path: string) => {
    setTimeout(() => {
      router.replace(path);
    }, 0);
  }, [router]);

  return {
    navigateOptimized,
    navigateBack,
    navigateReplace,
    // Also expose original router for cases where immediate navigation is needed
    router
  };
};
