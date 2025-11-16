/**
 * Utility functions for solving Grasshopper definitions via Rhino Compute
 */

/**
 * Convert a .gh file to base64
 * @param {File} file - The .gh file from a file input
 * @returns {Promise<string>} Base64 encoded file content
 */
export async function ghFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Get the base64 part (remove "data:application/octet-stream;base64," prefix)
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Step 1: Upload .gh file to get a pointer
 * @param {string} ghFileBase64 - Base64 encoded .gh file
 * @param {string} fileName - Optional filename
 * @param {string} backendUrl - Backend URL (default: http://localhost:4001)
 * @returns {Promise<Object>} Upload result with pointer
 */
export async function uploadGrasshopper(ghFileBase64, fileName = 'definition.gh', backendUrl = 'http://localhost:4001') {
  const response = await fetch(`${backendUrl}/grasshopper/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ghFileBase64,
      fileName
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Grasshopper upload failed');
  }

  return response.json();
}

/**
 * Solve a Grasshopper definition
 * 
 * Option 1: Direct with base64 algo
 * Option 2: With cached pointer from upload
 * 
 * @param {Object} options
 * @param {string} [options.algo] - Base64 encoded .gh file (Option 1)
 * @param {string} [options.pointer] - Pointer from upload (Option 2)
 * @param {string} options.fileName - Optional filename
 * @param {Array} options.values - Parameter values in Rhino Compute format
 * @param {boolean} options.cachesolve - Whether to cache the solution
 * @param {string} options.backendUrl - Backend URL (default: http://localhost:4001)
 * @returns {Promise<Object>} Solve results
 */
export async function solveGrasshopper({ 
  algo = null,
  pointer = null,
  fileName = 'definition.gh', 
  values = [],
  cachesolve = true,
  absolutetolerance = 0.01,
  angletolerance = 1.0,
  modelunits = 'Meters',
  dataversion = 7,
  backendUrl = 'http://localhost:4001'
}) {
  if (!algo && !pointer) {
    throw new Error('Either algo (base64 .gh file) or pointer is required');
  }

  const response = await fetch(`${backendUrl}/grasshopper/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      algo,
      pointer,
      fileName,
      values,
      cachesolve,
      absolutetolerance,
      angletolerance,
      modelunits,
      dataversion
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Grasshopper solve failed');
  }

  return response.json();
}

/**
 * Format a simple number parameter for Rhino Compute
 * @param {string} paramName - Parameter name from Grasshopper
 * @param {number} value - Numeric value
 * @param {string} type - Type (System.Double, System.Int32, etc.)
 * @returns {Object} Formatted parameter object
 */
export function formatNumberParam(paramName, value, type = 'System.Double') {
  return {
    ParamName: paramName,
    InnerTree: {
      '{0}': [
        {
          type: type,
          data: String(value)
        }
      ]
    }
  };
}

/**
 * Format a list of numbers for Rhino Compute
 * @param {string} paramName - Parameter name from Grasshopper
 * @param {Array<number>} values - Array of numeric values
 * @param {string} type - Type (System.Double, System.Int32, etc.)
 * @returns {Object} Formatted parameter object
 */
export function formatNumberListParam(paramName, values, type = 'System.Double') {
  return {
    ParamName: paramName,
    InnerTree: {
      '{0}': values.map(value => ({
        type: type,
        data: String(value)
      }))
    }
  };
}

/**
 * Quick solve: File drop → Convert to base64 → Solve directly
 * (No upload/caching step, sends base64 algo directly)
 * @param {File} ghFile - .gh file from file input
 * @param {Array} values - Parameter values
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Solve results
 */
export async function solveFromFile(ghFile, values = [], options = {}) {
  // Convert file to base64
  const algo = await ghFileToBase64(ghFile);
  
  // Solve directly with base64 algo
  return solveGrasshopper({
    algo,
    pointer: null,
    fileName: ghFile.name,
    values,
    ...options
  });
}

/**
 * Two-step workflow: Upload once, then solve (for reusing cached definition)
 * @param {File} ghFile - .gh file from file input
 * @param {Array} values - Parameter values
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Solve results with pointer for reuse
 */
export async function uploadAndSolve(ghFile, values = [], options = {}) {
  // Step 1: Convert file to base64
  const ghFileBase64 = await ghFileToBase64(ghFile);
  
  // Step 2: Upload to get pointer
  const uploadResult = await uploadGrasshopper(ghFileBase64, ghFile.name, options.backendUrl);
  const pointer = uploadResult.pointer || uploadResult;
  
  // Step 3: Solve with the pointer
  const solveResult = await solveGrasshopper({
    algo: null,
    pointer,
    fileName: ghFile.name,
    values,
    ...options
  });
  
  return {
    pointer,
    ...solveResult
  };
}

/**
 * Example usage:
 * 
 * // Option 1: Quick solve (sends base64 algo directly, no caching)
 * import { solveFromFile, formatNumberParam } from './utils/grasshopperSolver';
 * 
 * const handleFileDrop = async (file) => {
 *   const values = [
 *     formatNumberParam('Number 1', 5.0),
 *     formatNumberParam('Number 2', 10.0),
 *     formatNumberParam('Integer 1', 3, 'System.Int32')
 *   ];
 *   
 *   try {
 *     const result = await solveFromFile(file, values);
 *     console.log('Solve results:', result);
 *   } catch (error) {
 *     console.error('Solve failed:', error);
 *   }
 * };
 * 
 * // Option 2: Upload once, solve multiple times (cached with pointer)
 * import { uploadAndSolve, solveGrasshopper, formatNumberParam } from './utils/grasshopperSolver';
 * 
 * const handleFileDrop = async (file) => {
 *   // First solve - uploads and caches
 *   const result1 = await uploadAndSolve(file, [
 *     formatNumberParam('Number 1', 5.0)
 *   ]);
 *   
 *   console.log('Pointer for reuse:', result1.pointer);
 *   
 *   // Subsequent solves - use cached pointer (faster)
 *   const result2 = await solveGrasshopper({
 *     pointer: result1.pointer,
 *     values: [formatNumberParam('Number 1', 10.0)]
 *   });
 *   
 *   const result3 = await solveGrasshopper({
 *     pointer: result1.pointer,
 *     values: [formatNumberParam('Number 1', 15.0)]
 *   });
 * };
 * 
 * // Option 3: Direct solve with base64 (manual control)
 * import { ghFileToBase64, solveGrasshopper, formatNumberParam } from './utils/grasshopperSolver';
 * 
 * const handleFileDrop = async (file) => {
 *   const algo = await ghFileToBase64(file);
 *   const result = await solveGrasshopper({
 *     algo,
 *     pointer: null,
 *     values: [formatNumberParam('Number 1', 5.0)]
 *   });
 * };
 */
