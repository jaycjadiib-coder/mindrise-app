import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Back',
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all shadow-2xs shrink-0 cursor-pointer ${className}`}
      title="Return to Home Dashboard"
      aria-label="Back to Home Dashboard"
    >
      <ArrowLeft className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <span>{label}</span>
    </button>
  );
};
