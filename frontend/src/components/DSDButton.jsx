import React from 'react';
import { CircleStackIcon } from '@heroicons/react/24/outline';

/**
 * DSDButton Component
 * Floating action button to open DSD transformation modal
 */
const DSDButton = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`fixed bottom-8 right-8 z-40 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center gap-3 group ${
        disabled
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
      }`}
      title="Generate Database Structure"
    >
      <CircleStackIcon className="w-6 h-6 text-white" />
      <span className="text-white font-medium pr-1 max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 whitespace-nowrap">
        Generate DSD
      </span>
    </button>
  );
};

export default DSDButton;
