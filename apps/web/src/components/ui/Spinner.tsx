import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-[3px]",
};

/**
 * Reusable loading spinner using CSS border animation.
 */
function Spinner({ size = "md", className }: SpinnerProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "rounded-full border-brand-500/30 border-t-brand-500 animate-spin",
        sizeMap[size],
        className
      )}
    />
  );
}

export default Spinner;
