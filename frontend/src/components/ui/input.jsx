import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, icon, label, id, ...props }) {
  const inputId = id || React.useId();

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-gray-400 border border-gray-300 h-9 w-full min-w-0 rounded-md bg-gray-50 px-3 py-1 text-base shadow-sm transition-color outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            icon ? "pl-10 pr-3" : "px-4",
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
}

export { Input };
