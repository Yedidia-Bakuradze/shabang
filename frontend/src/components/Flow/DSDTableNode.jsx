import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { KeyIcon, LinkIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../../context/ThemeContext';

/**
 * DSDTableNode Component
 * A custom React Flow node that displays a database table in DSD (Data Structure Diagram) view
 * Shows table name, columns with types, and PK/FK indicators
 */
const DSDTableNode = memo(({ data, selected }) => {
  const { darkMode } = useTheme();
  const { tableName, columns = [], description } = data;

  return (
    <div
      className={`
        min-w-[220px] rounded-lg overflow-hidden shadow-lg transition-all duration-200
        ${selected 
          ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-xl scale-[1.02]' 
          : 'hover:shadow-xl'}
        ${darkMode 
          ? 'bg-slate-800 border border-slate-700' 
          : 'bg-white border border-gray-200'}
      `}
    >
      {/* Table Header */}
      <div className={`
        px-4 py-3 font-bold text-sm flex items-center gap-2
        ${darkMode 
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
          : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'}
      `}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
        <span className="truncate">{tableName}</span>
      </div>

      {/* Description (if exists) */}
      {description && (
        <div className={`px-3 py-1 text-xs italic border-b ${darkMode ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-100'}`}>
          {description}
        </div>
      )}

      {/* Columns */}
      <div className="divide-y divide-gray-100 dark:divide-slate-700">
        {columns.map((column, index) => (
          <div
            key={column.name}
            className={`
              relative px-3 py-2 flex items-center justify-between text-xs
              ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}
              ${column.isPrimaryKey ? (darkMode ? 'bg-green-900/20' : 'bg-green-50') : ''}
              ${column.isForeignKey && !column.isPrimaryKey ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''}
            `}
          >
            {/* Left Handle for incoming FK connections */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${column.name}-left`}
              className="!w-2 !h-2 !bg-indigo-500 !border-2 !border-white"
              style={{ top: '50%' }}
            />

            {/* Column Info */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* PK/FK Icons */}
              <div className="flex items-center gap-0.5 w-8 justify-start">
                {column.isPrimaryKey && (
                  <KeyIcon className="w-3.5 h-3.5 text-green-500" title="Primary Key" />
                )}
                {column.isForeignKey && (
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" title="Foreign Key" />
                )}
              </div>

              {/* Column Name */}
              <span className={`font-medium truncate ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                {column.name}
              </span>
            </div>

            {/* Column Type */}
            <span className={`
              ml-2 px-2 py-0.5 rounded text-[10px] font-mono
              ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}
            `}>
              {column.type}
              {!column.nullable && <span className="text-red-400 ml-1">*</span>}
            </span>

            {/* Right Handle for outgoing FK connections */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${column.name}-right`}
              className="!w-2 !h-2 !bg-indigo-500 !border-2 !border-white"
              style={{ top: '50%' }}
            />
          </div>
        ))}
      </div>

      {/* Footer with stats */}
      <div className={`
        px-3 py-2 text-[10px] flex items-center justify-between border-t
        ${darkMode ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-400'}
      `}>
        <span>{columns.length} columns</span>
        <div className="flex items-center gap-2">
          {columns.some(c => c.isPrimaryKey) && (
            <span className="flex items-center gap-1">
              <KeyIcon className="w-3 h-3 text-green-500" />
              PK
            </span>
          )}
          {columns.some(c => c.isForeignKey) && (
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-blue-500" />
              FK
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

DSDTableNode.displayName = 'DSDTableNode';

export default DSDTableNode;
