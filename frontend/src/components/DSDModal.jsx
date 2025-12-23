import React, { useState } from 'react';
import { XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import DSDViewer from '../components/DSDViewer';
import DSDTransformPanel from '../components/DSDTransformPanel';
import useDSDTransform from '../hooks/useDSDTransform';
import { toast } from 'react-hot-toast';

/**
 * DSDModal Component
 * Modal for displaying DSD transformation panel and results
 * Integrates with the Editor page
 */
const DSDModal = ({ isOpen, onClose, projectId, projectName }) => {
  const [showPanel, setShowPanel] = useState(true);
  const { 
    transformERDtoDSD, 
    isLoading, 
    error, 
    dsd, 
    sql, 
    validation, 
    dialect 
  } = useDSDTransform();

  if (!isOpen) return null;

  const handleTransform = async (options) => {
    try {
      await transformERDtoDSD(projectId, options);
      setShowPanel(false);
      toast.success('DSD generated successfully!');
    } catch (err) {
      toast.error(error || 'Failed to generate DSD');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold">Data Structure Diagram</h2>
              <p className="text-sm text-gray-600">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Transform Options */}
          {showPanel && (
            <div className="w-96 border-r p-6 overflow-y-auto">
              <DSDTransformPanel
                onTransform={handleTransform}
                isLoading={isLoading}
                projectId={projectId}
              />
            </div>
          )}

          {/* Right Panel - DSD Viewer */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!showPanel && dsd && (
              <div className="p-2 border-b bg-gray-50">
                <button
                  onClick={() => setShowPanel(true)}
                  className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                >
                  Show Transform Options
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-hidden">
              {error && !dsd ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-red-600 mb-2">Transformation Failed</h3>
                    <p className="text-gray-600">{error}</p>
                    <button
                      onClick={() => setShowPanel(true)}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                <DSDViewer
                  dsdData={dsd}
                  validationResults={validation}
                  sqlScript={sql}
                  dialect={dialect}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSDModal;
