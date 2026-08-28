import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * AuthInput — labelled input with error state for auth forms.
 */
const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-text)]"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-lg text-sm text-white",
            "bg-[var(--color-surface-2)] border",
            "placeholder:text-[var(--color-muted)]",
            "transition-colors duration-150 outline-none",
            error
              ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
              : "border-[var(--color-border)] focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/20",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400 mt-0.5" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

export default AuthInput;
