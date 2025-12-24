import React, { useState } from 'react';
import { CircleStackIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * DSDTransformPanel Component
 * Control panel for transforming ERD to DSD
 * Allows selecting SQL dialect, validation options, and triggering transformation
 */
const DSDTransformPanel = ({ onTransform, isLoading, projectId }) => {
  const [dialect, setDialect] = useState('postgresql');
  const [validate, setValidate] = useState(true);
  const [includeDrop, setIncludeDrop] = useState(false);

  const dialects = [
    { value: 'postgresql', label: 'PostgreSQL', icon: '🐘' },
    { value: 'mysql', label: 'MySQL', icon: '🐬' },
    { value: 'mssql', label: 'SQL Server', icon: '🏢' },
    { value: 'sqlite', label: 'SQLite', icon: '🪶' },
  ];

  const handleTransform = () => {
    if (!projectId) {
      alert('Please save your project first');
      return;
    }

    onTransform({
      dialect,
      validate,
      include_drop: includeDrop,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CircleStackIcon className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold">Generate DSD</h3>
      </div>

      {/* SQL Dialect Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SQL Dialect
        </label>
        <div className="grid grid-cols-2 gap-2">
          {dialects.map((d) => (
            <button
              key={d.value}
              onClick={() => setDialect(d.value)}
              className={`p-3 rounded-lg border-2 transition-all ${
                dialect === d.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{d.icon}</div>
              <div className="text-sm font-medium">{d.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          Options
        </label>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-sm">Validate Schema</div>
            <div className="text-xs text-gray-600">
              Check for errors and warnings before generating SQL
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={validate}
              onChange={(e) => setValidate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-sm flex items-center gap-2">
              Include DROP Statements
              <span className="text-yellow-600">⚠️</span>
            </div>
            <div className="text-xs text-gray-600">
              Add DROP TABLE statements (use with caution!)
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={includeDrop}
              onChange={(e) => setIncludeDrop(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
          </label>
        </div>
      </div>

      {/* Transform Button */}
      <button
        onClick={handleTransform}
        disabled={isLoading || !projectId}
        className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
          isLoading || !projectId
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Transforming...
          </>
        ) : (
          <>
            Generate DSD & SQL
          </>
        )}
      </button>

      {!projectId && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          ⚠️ Save your ERD project before generating DSD
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Tip:</strong> This will convert your Entity Relationship Diagram to a Data Structure Diagram and generate SQL DDL scripts.</p>
        <p>🔍 Validation will check for:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Missing primary keys</li>
          <li>Invalid foreign key references</li>
          <li>Type mismatches</li>
          <li>Naming convention issues</li>
        </ul>
      </div>
    </div>
  );
};

export default DSDTransformPanel;
