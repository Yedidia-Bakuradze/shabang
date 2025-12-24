import React from 'react';
import { KeyIcon, LinkIcon, CircleStackIcon } from '@heroicons/react/24/outline';

/**
 * DSDTablePanel Component
 * Displays detailed properties for a selected DSD table node
 * Read-only view of table structure, columns, constraints, and indexes
 */
const DSDTablePanel = ({ node }) => {
  const { tableName, description, columns = [], constraints = [], indexes = [] } = node.data;

  // Categorize constraints
  const pkConstraints = constraints.filter(c => c.type === 'PRIMARY KEY');
  const fkConstraints = constraints.filter(c => c.type === 'FOREIGN KEY');
  const uniqueConstraints = constraints.filter(c => c.type === 'UNIQUE');

  return (
    <div className="space-y-6">
      {/* Table Info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CircleStackIcon className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{tableName}</h3>
        </div>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">{description}</p>
        )}
        <div className="mt-2 text-xs text-indigo-500 font-medium">
          DSD View - Read Only
        </div>
      </div>

      {/* Columns Section */}
      <div>
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Columns ({columns.length})
        </h4>
        <div className="space-y-2">
          {columns.map((col, idx) => (
            <div
              key={col.name}
              className={`
                p-3 rounded-lg border transition-all
                ${col.isPrimaryKey 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : col.isForeignKey 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {col.isPrimaryKey && (
                    <KeyIcon className="w-4 h-4 text-green-500" title="Primary Key" />
                  )}
                  {col.isForeignKey && (
                    <LinkIcon className="w-4 h-4 text-blue-500" title="Foreign Key" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100">{col.name}</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                  {col.type}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {!col.nullable && (
                  <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    NOT NULL
                  </span>
                )}
                {col.isForeignKey && col.fkReference && (
                  <span className="text-blue-600 dark:text-blue-400">
                    → {col.fkReference.referencedTable}.{col.fkReference.referencedColumn}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Keys */}
      {pkConstraints.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <KeyIcon className="w-4 h-4 text-green-500" />
            Primary Keys
          </h4>
          <div className="space-y-2">
            {pkConstraints.map((pk, idx) => (
              <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{pk.name}</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ({pk.columns?.join(', ')})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foreign Keys */}
      {fkConstraints.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-blue-500" />
            Foreign Keys
          </h4>
          <div className="space-y-2">
            {fkConstraints.map((fk, idx) => (
              <div key={idx} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{fk.name}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {fk.columns?.join(', ')} → {fk.referenced_table}.{fk.referenced_columns?.join(', ')}
                </div>
                {(fk.on_delete || fk.on_update) && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    {fk.on_delete && `ON DELETE ${fk.on_delete}`}
                    {fk.on_delete && fk.on_update && ' | '}
                    {fk.on_update && `ON UPDATE ${fk.on_update}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unique Constraints */}
      {uniqueConstraints.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-4 h-4 flex items-center justify-center text-purple-500 font-bold text-xs">U</span>
            Unique Constraints
          </h4>
          <div className="space-y-2">
            {uniqueConstraints.map((uc, idx) => (
              <div key={idx} className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{uc.name}</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  ({uc.columns?.join(', ')})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indexes */}
      {indexes && indexes.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Indexes
          </h4>
          <div className="space-y-2">
            {indexes.map((idx, i) => (
              <div key={i} className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{idx.name}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ({idx.columns?.join(', ')})
                  {idx.unique && <span className="ml-2 text-purple-500">UNIQUE</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DSDTablePanel;
