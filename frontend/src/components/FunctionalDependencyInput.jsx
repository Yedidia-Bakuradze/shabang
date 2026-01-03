import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * FunctionalDependencyInput Component
 * Allows users to input functional dependencies for normalization
 * Supports both structured input (dropdowns) and text input
 */
const FunctionalDependencyInput = ({ 
  availableAttributes = [], 
  value = [], 
  onChange,
  onValidationChange,
  disabled = false 
}) => {
  const [fds, setFds] = useState(value);
  const [inputMode, setInputMode] = useState('structured'); // 'structured' or 'text'
  const [textInput, setTextInput] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  // Validate FDs against available attributes
  const validateFDs = (fdsToValidate) => {
    const errors = [];
    const availableSet = new Set(availableAttributes);

    fdsToValidate.forEach((fd, index) => {
      const invalidDeterminants = fd.determinant.filter(attr => !availableSet.has(attr));
      const invalidDependents = fd.dependent.filter(attr => !availableSet.has(attr));

      if (invalidDeterminants.length > 0) {
        errors.push({
          fdIndex: index,
          side: 'determinant',
          invalidAttrs: invalidDeterminants,
          message: `Unknown attribute${invalidDeterminants.length > 1 ? 's' : ''}: ${invalidDeterminants.join(', ')}`
        });
      }
      if (invalidDependents.length > 0) {
        errors.push({
          fdIndex: index,
          side: 'dependent',
          invalidAttrs: invalidDependents,
          message: `Unknown attribute${invalidDependents.length > 1 ? 's' : ''}: ${invalidDependents.join(', ')}`
        });
      }
    });

    setValidationErrors(errors);
    if (onValidationChange) {
      onValidationChange(errors);
    }
    return errors;
  };

  useEffect(() => {
    setFds(value);
  }, [value]);

  useEffect(() => {
    // Convert FDs to text format when switching to text mode
    if (inputMode === 'text') {
      const text = fds.map(fd => {
        const det = fd.determinant.join(', ');
        const dep = fd.dependent.join(', ');
        return `${det} -> ${dep}`;
      }).join('\n');
      setTextInput(text);
    }
  }, [inputMode]);

  const handleAddFD = () => {
    const newFds = [...fds, { determinant: [], dependent: [] }];
    setFds(newFds);
    onChange(newFds);
  };

  const handleRemoveFD = (index) => {
    const newFds = fds.filter((_, i) => i !== index);
    setFds(newFds);
    onChange(newFds);
  };

  const handleDeterminantChange = (index, selectedAttrs) => {
    const newFds = [...fds];
    newFds[index] = { ...newFds[index], determinant: selectedAttrs };
    setFds(newFds);
    onChange(newFds);
  };

  const handleDependentChange = (index, selectedAttrs) => {
    const newFds = [...fds];
    newFds[index] = { ...newFds[index], dependent: selectedAttrs };
    setFds(newFds);
    onChange(newFds);
  };

  const handleTextInputChange = (text) => {
    setTextInput(text);
    
    // Parse text input to FDs
    const parsedFds = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes('->')) continue;
      
      const parts = trimmed.split('->');
      if (parts.length !== 2) continue;
      
      const determinant = parts[0].split(',').map(s => s.trim()).filter(s => s);
      const dependent = parts[1].split(',').map(s => s.trim()).filter(s => s);
      
      if (determinant.length > 0 && dependent.length > 0) {
        parsedFds.push({ determinant, dependent });
      }
    }
    
    setFds(parsedFds);
    onChange(parsedFds);
    validateFDs(parsedFds);
  };

  const toggleAttribute = (fdIndex, side, attr) => {
    const newFds = [...fds];
    const fd = newFds[fdIndex];
    const currentList = side === 'determinant' ? fd.determinant : fd.dependent;
    
    if (currentList.includes(attr)) {
      newFds[fdIndex] = {
        ...fd,
        [side]: currentList.filter(a => a !== attr)
      };
    } else {
      newFds[fdIndex] = {
        ...fd,
        [side]: [...currentList, attr]
      };
    }
    
    setFds(newFds);
    onChange(newFds);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Input Mode:</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <button
            type="button"
            onClick={() => setInputMode('structured')}
            disabled={disabled}
            className={`px-3 py-1 text-sm transition-colors ${
              inputMode === 'structured'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setInputMode('text')}
            disabled={disabled}
            className={`px-3 py-1 text-sm transition-colors ${
              inputMode === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Text
          </button>
        </div>
      </div>

      {inputMode === 'text' ? (
        /* Text Input Mode */
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter Functional Dependencies (one per line)
          </label>
          <textarea
            value={textInput}
            onChange={(e) => handleTextInputChange(e.target.value)}
            disabled={disabled}
            placeholder="Example:&#10;CustomerID -> Name, Email&#10;OrderID, ProductID -> Quantity&#10;EmployeeID -> Department, Salary"
            className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       placeholder-gray-400 dark:placeholder-gray-500
                       font-mono text-sm resize-none"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Format: determinant_attrs -&gt; dependent_attrs (comma-separated)
          </p>
          {/* Validation Errors for Text Mode */}
          {validationErrors.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">⚠️ Invalid Attributes Found:</p>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>
                    FD #{err.fdIndex + 1} ({err.side}): {err.message}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                Available attributes: {availableAttributes.join(', ') || 'None'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Structured Input Mode */
        <div className="space-y-3">
          {fds.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p className="mb-2">No functional dependencies defined</p>
              <p className="text-sm">Click "Add FD" to define functional dependencies</p>
            </div>
          ) : (
            fds.map((fd, index) => {
              const fdErrors = validationErrors.filter(e => e.fdIndex === index);
              const hasError = fdErrors.length > 0;
              return (
              <div 
                key={index} 
                className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border ${hasError ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <div className="flex items-start gap-3">
                  {/* Determinant (LHS) */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Determinant (X)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {availableAttributes.map(attr => (
                        <button
                          key={attr}
                          type="button"
                          onClick={() => toggleAttribute(index, 'determinant', attr)}
                          disabled={disabled}
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            fd.determinant.includes(attr)
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {attr}
                        </button>
                      ))}
                    </div>
                    {fd.determinant.length > 0 && (
                      <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                        {fd.determinant.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center pt-6 px-2 text-gray-400 dark:text-gray-500 font-bold text-lg">
                    →
                  </div>

                  {/* Dependent (RHS) */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Dependent (Y)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {availableAttributes.map(attr => (
                        <button
                          key={attr}
                          type="button"
                          onClick={() => toggleAttribute(index, 'dependent', attr)}
                          disabled={disabled || fd.determinant.includes(attr)}
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            fd.dependent.includes(attr)
                              ? 'bg-purple-600 text-white'
                              : fd.determinant.includes(attr)
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {attr}
                        </button>
                      ))}
                    </div>
                    {fd.dependent.length > 0 && (
                      <div className="mt-2 text-sm text-purple-600 dark:text-purple-400">
                        {fd.dependent.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFD(index)}
                    disabled={disabled}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* FD Preview */}
                {fd.determinant.length > 0 && fd.dependent.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Preview: </span>
                    <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {fd.determinant.join(', ')} → {fd.dependent.join(', ')}
                    </code>
                  </div>
                )}

                {/* Per-FD Validation Errors */}
                {hasError && (
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ⚠️ {fdErrors.map(e => e.message).join('; ')}
                    </p>
                  </div>
                )}
              </div>
            );
            })
          )}

          {/* Add FD Button */}
          <button
            type="button"
            onClick={handleAddFD}
            disabled={disabled}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 
                       rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 
                       hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400
                       transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Functional Dependency
          </button>
        </div>
      )}

      {/* Summary */}
      {fds.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">{fds.length}</span> functional {fds.length === 1 ? 'dependency' : 'dependencies'} defined
          </p>
        </div>
      )}
    </div>
  );
};

export default FunctionalDependencyInput;
