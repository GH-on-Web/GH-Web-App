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
 * POST /json-to-gh
 * 
 * Convert JSON description into a .gh file using the compute-json-to-gh.gh script
 * Loads the script, encodes to base64, and sends JSON as input to Rhino Compute
 * 
 * Request body: The JSON definition you want to convert
 * {
 *   nodes: [...],
 *   links: [...],
 *   ... your JSON structure
 * }
 * 
 * Response: Result from running the grasshopper script with your JSON
 */
router.post('/', async (req, res, next) => {
  const { RHINO_COMPUTE_URL } = process.env;
  
  if (!RHINO_COMPUTE_URL) {
    return res.status(500).json({ 
      error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } 
    });
  }

  try {
    const computeBaseUrl = RHINO_COMPUTE_URL.replace(/\/$/, '');
    
    // Load the compute-json-to-gh.gh script
    const scriptPath = path.resolve(__dirname, '../scripts/compute-json-to-gh.gh');
    console.log(`[json-to-gh] Loading compute-json-to-gh.gh from ${scriptPath}`);
    
    const ghBuffer = await fs.readFile(scriptPath);
    const algo = ghBuffer.toString('base64');
    
    console.log(`[json-to-gh] Loaded compute-json-to-gh.gh (${ghBuffer.length} bytes)`);
    
    // Build the solve request - same structure as grasshopper endpoint
    const solvePayload = {
      absolutetolerance: 0.01,
      angletolerance: 1.0,
      modelunits: "Meters",
      dataversion: 7,
      algo: algo,
      filename: 'compute-json-to-gh.gh',
      pointer: null,
      cachesolve: true,
      values: [
        {
          ParamName: "JSON",
          InnerTree: {
            "{0}": [
              {
                type: "System.String",
                data: JSON.stringify(req.body)
              }
            ]
          }
        }
      ],
      warnings: [],
      errors: []
    };
    
    // Send to /grasshopper endpoint (same as grasshopper/solve)
    const solveUrl = `${computeBaseUrl}/grasshopper`;
    console.log(`[json-to-gh] Solving at ${solveUrl}`);
    
    const solveResponse = await axios.post(solveUrl, solvePayload, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      validateStatus: () => true,
      timeout: 60000, // 60 second timeout
    });
    
    console.log(`[json-to-gh] Response status: ${solveResponse.status}`);
    
    if (solveResponse.data && solveResponse.data.values) {
      console.log(`[json-to-gh] Output values count: ${solveResponse.data.values.length}`);
      solveResponse.data.values.forEach((val, idx) => {
        const innerTreeKeys = Object.keys(val.InnerTree || {});
        const firstKey = innerTreeKeys[0];
        const itemCount = firstKey ? val.InnerTree[firstKey]?.length : 0;
        console.log(`[json-to-gh] Output ${idx}: ${val.ParamName} - InnerTree keys: ${innerTreeKeys.join(', ')} - Items: ${itemCount}`);
      });
    }
    
    return res.status(solveResponse.status).json(solveResponse.data);
    
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('[json-to-gh] compute-json-to-gh.gh not found');
      return res.status(404).json({
        error: { 
          message: 'compute-json-to-gh.gh not found at backend-compute-gateway/src/scripts/'
        }
      });
    }
    console.error('[json-to-gh] Error:', err.message);
    next(err);
  }
});

export default router;
