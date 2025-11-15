import { useState, useCallback } from 'react';
import { computeGraph } from '../services/computeAPI';
import { convertToGraphDefinition } from '../services/graphConverter';

/**
 * useCompute - Hook for managing compute state and operations
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @returns {Object} Compute state and functions
 */
export function useCompute(nodes, edges) {
  const [isComputing, setIsComputing] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const [error, setError] = useState(null);

  const compute = useCallback(async () => {
    setIsComputing(true);
    setError(null);
    
    try {
      const graphDefinition = convertToGraphDefinition(nodes, edges);
      console.log('Computing graph:', graphDefinition);
      const result = await computeGraph(graphDefinition);
      console.log('Compute result:', result);
      setGeometry(result.geometry);
      return result;
    } catch (err) {
      console.error('Compute error:', err);
      setError(err.message || 'Compute failed');
      throw err;
    } finally {
      setIsComputing(false);
    }
  }, [nodes, edges]);

  return {
    isComputing,
    geometry,
    error,
    compute,
  };
}

