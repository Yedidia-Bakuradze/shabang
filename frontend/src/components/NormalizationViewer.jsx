import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  TableCellsIcon,
  KeyIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

/**
 * NormalizationViewer Component
 * Displays before/after comparison of schema normalization
 * Shows changes made, violations found, and allows approval/cancellation
 */
const NormalizationViewer = ({ 
  original, 
  normalized, 
  changes = [], 
  violations = [],
  normalizationType,
  isAlreadyNormalized,
  onApprove,
  onCancel,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState('comparison'); // 'comparison' | 'original' | 'normalized'
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [showChanges, setShowChanges] = useState(true);

  const toggleTable = (tableName) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const renderTableCard = (table, isNormalized = false) => {
    const isExpanded = expandedTables.has(table.name);
    
    // Find primary key columns
    const pkConstraint = table.constraints?.find(c => c.type === 'PRIMARY KEY');
    const pkColumns = new Set(pkConstraint?.columns || []);
    
    // Find foreign key columns
    const fkConstraints = table.constraints?.filter(c => c.type === 'FOREIGN KEY') || [];
    const fkColumns = new Set();
    fkConstraints.forEach(fk => {
      fk.columns?.forEach(col => fkColumns.add(col));
    });

    return (
      <div 
        key={table.name}
        className={`border rounded-lg overflow-hidden transition-all ${
          isNormalized 
            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
        }`}
      >
        {/* Table Header */}
        <div 
          className={`p-3 cursor-pointer flex items-center justify-between ${
            isNormalized 
              ? 'bg-green-100 dark:bg-green-900/40' 
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
          onClick={() => toggleTable(table.name)}
        >
          <div className="flex items-center gap-2">
            <TableCellsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">{table.name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({table.columns?.length || 0} columns)
            </span>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {/* Table Content */}
        {isExpanded && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-600">
            {/* Columns */}
            <div className="space-y-1">
              {table.columns?.map(col => (
                <div 
                  key={col.name}
                  className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {pkColumns.has(col.name) && (
                    <KeyIcon className="w-4 h-4 text-yellow-500" title="Primary Key" />
                  )}
                  {fkColumns.has(col.name) && (
                    <LinkIcon className="w-4 h-4 text-blue-500" title="Foreign Key" />
                  )}
                  <span className={`font-medium ${
                    pkColumns.has(col.name) ? 'text-yellow-700 dark:text-yellow-400' : 
                    fkColumns.has(col.name) ? 'text-blue-700 dark:text-blue-400' : 
                    'text-gray-800 dark:text-gray-200'
                  }`}>
                    {col.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {col.sql_type}
                  </span>
                  {col.nullable === false && (
                    <span className="text-xs text-red-500">NOT NULL</span>
                  )}
                </div>
              ))}
            </div>

            {/* Foreign Keys */}
            {fkConstraints.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Foreign Keys:</p>
                {fkConstraints.map((fk, idx) => (
                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span>{fk.columns?.join(', ')}</span>
                    <ArrowRightIcon className="w-3 h-3" />
                    <span className="text-blue-600 dark:text-blue-400">
                      {fk.referenced_table}({fk.referenced_columns?.join(', ')})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!original && !normalized) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <TableCellsIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Run normalization to see results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Status */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {normalizationType} Normalization Result
            </h3>
            {isAlreadyNormalized ? (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-full flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" />
                Already Normalized
              </span>
            ) : (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-full">
                {changes.length} changes
              </span>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1 text-sm transition-colors ${
                viewMode === 'comparison'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Comparison
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`px-3 py-1 text-sm transition-colors ${
                viewMode === 'original'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setViewMode('normalized')}
              className={`px-3 py-1 text-sm transition-colors ${
                viewMode === 'normalized'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Normalized
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Original: </span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {original?.tables?.length || 0} tables
            </span>
          </div>
          <ArrowRightIcon className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-gray-500 dark:text-gray-400">Normalized: </span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {normalized?.tables?.length || 0} tables
            </span>
          </div>
        </div>
      </div>

      {/* Changes Panel (Collapsible) */}
      {changes.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowChanges(!showChanges)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
              Changes Made ({changes.length})
            </span>
            {showChanges ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {showChanges && (
            <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
              {changes.map((change, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded">
                      {change.type}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {change.original_table}
                        {change.new_tables?.length > 0 && (
                          <>
                            <ArrowRightIcon className="w-3 h-3 inline mx-1" />
                            {change.new_tables.join(', ')}
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {change.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Violations Panel */}
      {violations.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
            Violations Found ({violations.length})
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {violations.map((v, idx) => (
              <div key={idx} className="text-xs text-red-600 dark:text-red-400">
                <span className="font-medium">{v.table}</span>: {v.fd}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables View */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'comparison' ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Original Tables */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                Original Schema
              </h4>
              <div className="space-y-2">
                {original?.tables?.map(table => renderTableCard(table, false))}
              </div>
            </div>

            {/* Normalized Tables */}
            <div>
              <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Normalized Schema
              </h4>
              <div className="space-y-2">
                {normalized?.tables?.map(table => renderTableCard(table, true))}
              </div>
            </div>
          </div>
        ) : viewMode === 'original' ? (
          <div className="space-y-2">
            {original?.tables?.map(table => renderTableCard(table, false))}
          </div>
        ) : (
          <div className="space-y-2">
            {normalized?.tables?.map(table => renderTableCard(table, true))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isAlreadyNormalized && changes.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                       border border-gray-300 dark:border-gray-600 rounded-lg 
                       hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white 
                       rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all
                       flex items-center gap-2 font-medium shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Applying...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Apply Normalization
              </>
            )}
          </button>
        </div>
      )}

      {/* Already Normalized Message */}
      {isAlreadyNormalized && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">
              Your schema is already in {normalizationType}! No changes needed.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NormalizationViewer;
