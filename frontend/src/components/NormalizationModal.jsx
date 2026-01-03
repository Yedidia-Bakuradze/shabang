import React, { useState, useMemo } from 'react';
import { XMarkIcon, BeakerIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import FunctionalDependencyInput from './FunctionalDependencyInput';
import NormalizationViewer from './NormalizationViewer';
import useNormalization from '../hooks/useNormalization';
import useFlowStore from '../store/useFlowStore';
import { toast } from 'react-hot-toast';

/**
 * NormalizationModal Component
 * Modal for normalizing ERD schema to BCNF or 3NF
 * Allows users to input functional dependencies and see before/after comparison
 */
const NormalizationModal = ({ isOpen, onClose, projectId, projectName }) => {
  const [showPanel, setShowPanel] = useState(true);
  const [normalizationType, setNormalizationType] = useState('BCNF');
  const [functionalDependencies, setFunctionalDependencies] = useState([]);
  const [fdValidationErrors, setFdValidationErrors] = useState([]);
  
  const { getCanvasData, setDSDData, applyNormalizedSchema } = useFlowStore();
  const { 
    normalizeSchema, 
    isLoading, 
    error, 
    result,
    original,
    normalized,
    changes,
    violations,
    isAlreadyNormalized,
    clearResult
  } = useNormalization();

  // Extract all attributes from the current ERD for the FD input
  const availableAttributes = useMemo(() => {
    const canvasData = getCanvasData();
    const attributes = new Set();
    
    if (canvasData?.nodes) {
      canvasData.nodes.forEach(node => {
        // Entity nodes have attributes
        if (node.type === 'entityNode' && node.data?.attributes) {
          node.data.attributes.forEach(attr => {
            if (attr.name || attr.label) {
              attributes.add(attr.name || attr.label);
            }
          });
        }
        // Also add entity names as they might be referenced
        if (node.type === 'entityNode' && node.data?.label) {
          // Add implicit ID column if entity has a label
          const entityName = node.data.label;
          attributes.add(`${entityName.toLowerCase()}_id`);
        }
        // Standalone attribute nodes
        if (node.type === 'attributeNode' && node.data?.label) {
          attributes.add(node.data.label);
        }
      });
    }
    
    return Array.from(attributes).sort();
  }, [getCanvasData]);

  if (!isOpen) return null;

  const handleNormalize = async () => {
    if (functionalDependencies.length === 0) {
      toast.error('Please add at least one functional dependency');
      return;
    }

    // Check for validation errors (invalid attributes)
    if (fdValidationErrors.length > 0) {
      toast.error('Please fix the invalid attributes in your functional dependencies');
      return;
    }

    // Validate FDs have both sides filled
    const invalidFDs = functionalDependencies.filter(
      fd => fd.determinant.length === 0 || fd.dependent.length === 0
    );
    
    if (invalidFDs.length > 0) {
      toast.error('All functional dependencies must have both determinant and dependent attributes');
      return;
    }

    try {
      const canvasData = getCanvasData();
      
      await normalizeSchema(projectId, {
        normalization_type: normalizationType,
        functional_dependencies: functionalDependencies,
        entities: canvasData
      });
      
      setShowPanel(false);
      toast.success('Normalization analysis complete!');
    } catch (err) {
      // Check if server returned invalid attributes error
      const serverError = err.response?.data?.error || error || 'Failed to normalize schema';
      toast.error(serverError);
    }
  };

  const handleApprove = () => {
    if (normalized) {
      // Store the normalized DSD in the flow store
      setDSDData({
        name: projectName || 'normalized_schema',
        tables: normalized.tables
      });
      
      toast.success('Normalized schema applied! View it in DSD mode.');
      onClose();
    }
  };

  const handleCancel = () => {
    clearResult();
    setShowPanel(true);
  };

  const handleClose = () => {
    clearResult();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <BeakerIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Schema Normalization
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{projectName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Configuration */}
          {showPanel && (
            <div className="w-[450px] border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Normalization Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Normalization Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNormalizationType('BCNF')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        normalizationType === 'BCNF'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">BCNF</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Boyce-Codd Normal Form
                      </div>
                    </button>
                    <button
                      onClick={() => setNormalizationType('3NF')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        normalizationType === '3NF'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">3NF</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Third Normal Form
                      </div>
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {normalizationType === 'BCNF' ? (
                        <>
                          <strong>BCNF</strong> eliminates all redundancy based on functional dependencies. 
                          For every FD X → Y, X must be a superkey. More strict than 3NF.
                        </>
                      ) : (
                        <>
                          <strong>3NF</strong> ensures no transitive dependencies. 
                          For every FD X → Y, either X is a superkey OR Y consists of prime attributes.
                          Preserves all dependencies.
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Functional Dependencies Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Functional Dependencies
                  </label>
                  <FunctionalDependencyInput
                    availableAttributes={availableAttributes}
                    value={functionalDependencies}
                    onChange={setFunctionalDependencies}
                    onValidationChange={setFdValidationErrors}
                    disabled={isLoading}
                  />
                </div>

                {/* Normalize Button */}
                <button
                  onClick={handleNormalize}
                  disabled={isLoading || functionalDependencies.length === 0 || fdValidationErrors.length > 0}
                  className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    isLoading || functionalDependencies.length === 0 || fdValidationErrors.length > 0
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BeakerIcon className="w-5 h-5" />
                      Normalize to {normalizationType}
                    </>
                  )}
                </button>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Tips */}
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                  <p><strong>💡 Tips:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Identify which attributes determine others</li>
                    <li>Primary keys typically determine all other attributes</li>
                    <li>Look for partial and transitive dependencies</li>
                    <li>BCNF is stricter but may lose some dependencies</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Right Panel - Results Viewer */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!showPanel && result && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button
                  onClick={() => setShowPanel(true)}
                  className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg flex items-center gap-2"
                >
                  ← Show Configuration
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-hidden">
              <NormalizationViewer
                original={original}
                normalized={normalized}
                changes={changes}
                violations={violations}
                normalizationType={normalizationType}
                isAlreadyNormalized={isAlreadyNormalized}
                onApprove={handleApprove}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NormalizationModal;
