import { useState, useCallback } from 'react';
import api from '../api/axios';

/**
 * Custom hook for ERD schema normalization
 * Handles API communication for normalizing DSD to BCNF or 3NF
 */
export const useNormalization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  /**
   * Normalize ERD schema to BCNF or 3NF
   * @param {string} projectId - Project ID
   * @param {object} options - Normalization options
   * @param {string} options.normalization_type - 'BCNF' or '3NF'
   * @param {Array} options.functional_dependencies - Array of FD objects
   * @param {object} options.entities - Optional ERD entities (if not using project data)
   */
  const normalizeSchema = useCallback(async (projectId, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post(`/project/${projectId}/normalize/`, {
        normalization_type: options.normalization_type || 'BCNF',
        functional_dependencies: options.functional_dependencies || [],
        entities: options.entities || null,
      });

      if (response.data.success) {
        setResult(response.data);
        return response.data;
      } else {
        const errorMsg = response.data.error || 'Normalization failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to normalize schema';
      setError(errorMessage);
      console.error('Normalization Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check the normalization level of the schema
   * @param {string} projectId - Project ID
   * @param {Array} functional_dependencies - Array of FD objects
   * @param {object} entities - Optional ERD entities
   */
  const checkNormalization = useCallback(async (projectId, functional_dependencies, entities = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post(`/project/${projectId}/check-normalization/`, {
        functional_dependencies,
        entities,
      });

      if (response.data.success) {
        return response.data;
      } else {
        const errorMsg = response.data.error || 'Check failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to check normalization';
      setError(errorMessage);
      console.error('Check Normalization Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear the current result
   */
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    normalizeSchema,
    checkNormalization,
    clearResult,
    isLoading,
    error,
    result,
    original: result?.original,
    normalized: result?.normalized,
    changes: result?.changes,
    violations: result?.violations_found,
    isAlreadyNormalized: result?.is_already_normalized,
  };
};

export default useNormalization;
