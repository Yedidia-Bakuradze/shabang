import React from 'react';

const Input = ({ label, type = 'text', id, value, onChange, onFocus, onBlur, placeholder, required = false, error }) => {
    return (
        <div className="mb-4">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <input
                type={type}
                id={id}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={placeholder}
                required={required}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm 
                    bg-white text-gray-900 
                    dark:bg-gray-700 dark:text-gray-100 
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
                        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default Input;
