import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, ClipboardDocumentIcon, ArrowDownTrayIcon, CheckIcon, XMarkIcon, CircleStackIcon, KeyIcon, LinkIcon, CheckCircleIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * DSDViewer Component
 * Displays the generated DSD (Data Structure Diagram) with tables, columns, and constraints
 * Shows validation results and allows SQL export
 */
const DSDViewer = ({ dsdData, validationResults, sqlScript, dialect }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [showSQL, setShowSQL] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  if (!dsdData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <CircleStackIcon className="w-12 h-12 mr-3" />
        <p>No DSD generated yet. Transform your ERD to see the database structure.</p>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return <ExclamationCircleIcon className="w-4 h-4" />;
      case 'warning': return <ExclamationCircleIcon className="w-4 h-4" />;
      case 'info': return <InformationCircleIcon className="w-4 h-4" />;
      default: return <CheckCircleIcon className="w-4 h-4" />;
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([sqlScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dsdData.name}_${dialect}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <CircleStackIcon className="w-6 h-6 mr-2 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">{dsdData.name}</h2>
            {dsdData.description && (
              <p className="text-sm text-gray-600">{dsdData.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSQL(!showSQL)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            {showSQL ? 'Show Tables' : 'Show SQL'}
          </button>
          {sqlScript && (
            <>
              <button
                onClick={handleCopySQL}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                {copiedSQL ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                {copiedSQL ? 'Copied!' : 'Copy SQL'}
              </button>
              <button
                onClick={handleDownloadSQL}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* Validation Summary - Compact */}
      {validationResults && (
        <div className="px-4 py-2 border-b bg-gray-50">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowValidation(!showValidation)}
          >
            <div className="flex items-center gap-4">
              {validationResults.valid ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="font-medium text-sm">Validation Passed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  <span className="font-medium text-sm">Validation Issues</span>
                </div>
              )}
              <div className="text-xs text-gray-600">
                {validationResults.summary}
              </div>
            </div>
            {showValidation ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            )}
          </div>

          {/* Validation Issues - Collapsible */}
          {showValidation && validationResults.issues && validationResults.issues.length > 0 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {validationResults.issues.map((issue, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded text-xs ${getSeverityColor(issue.severity)}`}
                >
                  {getSeverityIcon(issue.severity)}
                  <div>
                    <span className="font-medium">{issue.table}</span>
                    {issue.column && <span className="text-gray-600"> • {issue.column}</span>}
                    <p className="mt-0.5">{issue.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {showSQL ? (
          /* SQL Script View */
          <div className="p-4">
            <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm font-mono">
              {sqlScript}
            </pre>
          </div>
        ) : (
          /* Tables View */
          <div className="p-4 space-y-4">
            {dsdData.tables && dsdData.tables.map((table) => (
              <div
                key={table.name}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Table Header */}
                <div
                  className="bg-blue-50 p-3 cursor-pointer flex items-center justify-between"
                  onClick={() => setSelectedTable(selectedTable === table.name ? null : table.name)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <h3 className="font-bold text-lg">{table.name}</h3>
                    {table.description && (
                      <span className="text-sm text-gray-600">- {table.description}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {table.columns.length} columns
                  </div>
                </div>

                {/* Table Content */}
                {selectedTable === table.name && (
                  <div className="p-3">
                    {/* Columns */}
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CircleStackIcon className="w-4 h-4" />
                        Columns
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Name</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Nullable</th>
                              <th className="p-2 text-left">Default</th>
                              <th className="p-2 text-left">Flags</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns.map((column) => (
                              <tr key={column.name} className="border-t hover:bg-gray-50">
                                <td className="p-2 font-mono">{column.name}</td>
                                <td className="p-2 font-mono text-blue-600">{column.sql_type}</td>
                                <td className="p-2">
                                  {column.nullable ? (
                                    <span className="text-gray-500">NULL</span>
                                  ) : (
                                    <span className="text-red-600 font-medium">NOT NULL</span>
                                  )}
                                </td>
                                <td className="p-2 font-mono text-gray-600">
                                  {column.default_value || '-'}
                                </td>
                                <td className="p-2">
                                  <div className="flex gap-1">
                                    {column.unique && (
                                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                        UNIQUE
                                      </span>
                                    )}
                                    {column.auto_increment && (
                                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                        AUTO
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Constraints */}
                    {table.constraints && table.constraints.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <KeyIcon className="w-4 h-4" />
                          Constraints
                        </h4>
                        <div className="space-y-2">
                          {table.constraints.map((constraint, idx) => (
                            <div key={idx} className="p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm">{constraint.name}</span>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                  {constraint.type}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-gray-600">
                                Columns: {constraint.columns.join(', ')}
                                {constraint.referenced_table && (
                                  <span className="ml-2">
                                    → <span className="font-mono">{constraint.referenced_table}</span>
                                    ({constraint.referenced_columns?.join(', ')})
                                  </span>
                                )}
                              </div>
                              {constraint.on_delete && (
                                <div className="mt-1 text-xs text-gray-500">
                                  ON DELETE {constraint.on_delete}
                                  {constraint.on_update && ` | ON UPDATE ${constraint.on_update}`}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Indexes */}
                    {table.indexes && table.indexes.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          Indexes
                        </h4>
                        <div className="space-y-1">
                          {table.indexes.map((index, idx) => (
                            <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                              <span className="font-mono">{index.name}</span>
                              <span className="text-gray-600 ml-2">
                                ({index.columns.join(', ')})
                              </span>
                              {index.unique && (
                                <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                  UNIQUE
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DSDViewer;
