import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
  const baseStyles = 'bg-white rounded-lg shadow-sm border border-gray-200';
  const hoverStyles = hover ? 'transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5' : '';
  const clickStyles = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${clickStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

