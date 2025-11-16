import { Router } from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildHeaders(extra = {}) {
  const { RHINO_COMPUTE_KEY } = process.env;
  const headers = { ...extra };
  if (RHINO_COMPUTE_KEY) {
    headers['Authorization'] = `Bearer ${RHINO_COMPUTE_KEY}`;
  }
  return headers;
}

/**
 * POST /test-script
 * 
 * Run the test-script.gh file with optional parameter values
 * 
 * Request body (optional):
 * {
 *   values: [
 *     {
 *       ParamName: "Number 1",
 *       InnerTree: { "{0}": [{ type: "System.Double", data: "5.0" }] }
 *     }
 *   ],
 *   cachesolve: true,
 *   absolutetolerance: 0.01,
 *   angletolerance: 1.0,
 *   modelunits: "Meters"
 * }
 */
router.post('/', async (req, res, next) => {
  const { RHINO_COMPUTE_URL } = process.env;
  
  if (!RHINO_COMPUTE_URL) {
    return res.status(500).json({ 
      error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } 
    });
  }

  const { 
    values = [], 
    cachesolve = true,
    absolutetolerance = 0.01,
    angletolerance = 1.0,
    modelunits = "Meters",
    dataversion = 7
  } = req.body || {};

  try {
    const computeBaseUrl = RHINO_COMPUTE_URL.replace(/\/$/, '');
    
    // Load the test script file
    const scriptPath = path.resolve(__dirname, '../scripts/test-script.gh');
    console.log(`[test-script] Loading test script from ${scriptPath}`);
    
    const ghBuffer = await fs.readFile(scriptPath);
    const algo = ghBuffer.toString('base64');
    
    console.log(`[test-script] Loaded test-script.gh (${ghBuffer.length} bytes)`);
    
    // Build the solve request with base64 algo
    const solvePayload = {
      absolutetolerance,
      angletolerance,
      modelunits,
      dataversion,
      algo: algo,
      filename: 'test-script.gh',
      pointer: null,
      cachesolve: cachesolve,
      values: values,
      warnings: [],
      errors: []
    };
    
    // Send solve request to /grasshopper endpoint
    const solveUrl = `${computeBaseUrl}/grasshopper`;
    console.log(`[test-script] Solving test-script.gh at ${solveUrl}`);
    console.log(`[test-script] Parameters:`, values.map(v => v.ParamName).join(', ') || 'none');
    
    const solveResponse = await axios.post(solveUrl, solvePayload, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      validateStatus: () => true,
      timeout: 60000, // 60 second timeout
    });
    
    console.log(`[test-script] Solve response status: ${solveResponse.status}`);
    
    // Return the solve results
    return res.status(solveResponse.status).json(solveResponse.data);
    
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('[test-script] test-script.gh not found at expected path');
      return res.status(404).json({
        error: { 
          message: 'test-script.gh not found. Please ensure the file exists at backend-compute-gateway/src/scripts/test-script.gh'
        }
      });
    }
    console.error('[test-script] Error:', err.message);
    next(err);
  }
});

export default router;
