import React from 'react';

/**
 * Toggle Switch Component - StitchAI-style
 * 
 * @param {boolean} checked - Current state
 * @param {function} onChange - Callback when toggled
 * @param {string} label - Label text
 * @param {string} description - Optional description text
 */
const ToggleSwitch = ({ checked, onChange, label, description }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {label}
        </span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="
          w-11 h-6 
          bg-gray-200 dark:bg-gray-700
          peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 dark:peer-focus:ring-offset-gray-800
          rounded-full 
          peer 
          peer-checked:after:translate-x-full 
          peer-checked:after:border-white 
          after:content-[''] 
          after:absolute 
          after:top-[2px] 
          after:start-[2px] 
          after:bg-white 
          after:border-gray-300 
          after:border 
          after:rounded-full 
          after:h-5 
          after:w-5 
          after:transition-all 
          peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500
          transition-colors
        " />
      </div>
    </label>
  );
};

export default ToggleSwitch;
