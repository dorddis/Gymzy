"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  /**
   * Optional custom click handler. If not provided, uses router.back()
   */
  onClick?: () => void;
  /**
   * Optional additional CSS classes
   */
  className?: string;
  /**
   * Optional aria-label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Standardized back button component used throughout the app.
 * Provides consistent styling and behavior for navigation back actions.
 */
export function BackButton({
  onClick,
  className = "",
  ariaLabel = "Go back"
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`p-2 hover:bg-gray-100 rounded-full ${className}`}
      aria-label={ariaLabel}
    >
      <ArrowLeft className="h-5 w-5 text-gray-700" />
    </Button>
  );
}
