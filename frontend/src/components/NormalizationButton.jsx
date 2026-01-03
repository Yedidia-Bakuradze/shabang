import React from 'react';
import { BeakerIcon } from '@heroicons/react/24/outline';

/**
 * NormalizationButton Component
 * Floating action button to open normalization modal
 */
const NormalizationButton = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`fixed bottom-8 right-28 z-40 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center gap-3 group ${
        disabled
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
      }`}
      title="Normalize Schema (BCNF/3NF)"
    >
      <BeakerIcon className="w-6 h-6 text-white" />
      <span className="text-white font-medium pr-1 max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 whitespace-nowrap">
        Normalize
      </span>
    </button>
  );
};

export default NormalizationButton;
