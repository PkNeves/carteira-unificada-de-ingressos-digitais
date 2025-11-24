import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const hasError = !!error;
  
  const inputBaseStyles = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200';
  const inputErrorStyles = hasError 
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 focus:ring-primary focus:border-primary';
  const inputClassName = `${inputBaseStyles} ${inputErrorStyles} ${className}`.trim();
  
  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className={`block mb-2 text-sm font-medium ${hasError ? 'text-red-700' : 'text-gray-700'}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={inputClassName}
        aria-invalid={hasError}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

