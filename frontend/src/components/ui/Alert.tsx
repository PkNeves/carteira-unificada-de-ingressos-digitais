import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
  onClose?: () => void;
}

export function Alert({ children, variant = 'info', className = '', onClose }: AlertProps) {
  const variantStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  
  return (
    <div
      className={`relative px-4 py-3 border rounded-lg ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-current opacity-50 hover:opacity-75"
          aria-label="Fechar"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
      {children}
    </div>
  );
}

