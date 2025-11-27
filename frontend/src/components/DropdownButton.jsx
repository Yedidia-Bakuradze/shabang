import React from 'react';

const DropdownButton = ({ onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
            {children}
        </button>
    );
};

export default DropdownButton;
