import { useState } from 'react';
import api from '../api/axios';

/**
 * Custom hook for ERD to DSD transformation
 * Handles API communication for generating DSD and SQL from ERD
 */
export const useDSDTransform = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dsdResult, setDsdResult] = useState(null);

  /**
   * Transform ERD to DSD
   * @param {string} projectId - Project ID
   * @param {object} options - Transformation options
   * @param {string} options.dialect - SQL dialect (postgresql, mysql, mssql, sqlite)
   * @param {boolean} options.validate - Whether to validate DSD
   * @param {boolean} options.include_drop - Whether to include DROP statements
   * @param {object} options.entities - Optional ERD entities (if not using project data)
   */
  const transformERDtoDSD = async (projectId, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post(`/project/${projectId}/generate-dsd/`, {
        dialect: options.dialect || 'postgresql',
        validate: options.validate !== false,
        include_drop: options.include_drop || false,
        entities: options.entities || null,
      });

      if (response.data.success) {
        setDsdResult(response.data);
        return response.data;
      } else {
        const errorMsg = response.data.errors?.join(', ') || 'Transformation failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to transform ERD';
      setError(errorMessage);
      console.error('DSD Transform Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear the current DSD result
   */
  const clearResult = () => {
    setDsdResult(null);
    setError(null);
  };

  return {
    transformERDtoDSD,
    clearResult,
    isLoading,
    error,
    dsdResult,
    dsd: dsdResult?.dsd,
    sql: dsdResult?.sql,
    validation: dsdResult?.validation,
    dialect: dsdResult?.dialect,
  };
};

export default useDSDTransform;
