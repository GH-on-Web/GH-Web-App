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
 * POST /gh-to-json
 * 
 * Parse a .gh file into JSON format using the compute-gh-to-json.gh script
 * Loads the script, encodes to base64, and sends the .gh file as input to Rhino Compute
 * 
 * Request body:
 * {
 *   ghFileBase64: "base64_encoded_gh_file",
 *   fileName: "optional-filename.gh"
 * }
 * 
 * Response: JSON representation of the .gh file from the grasshopper script
 */
router.post('/', async (req, res, next) => {
  const { RHINO_COMPUTE_URL } = process.env;
  
  if (!RHINO_COMPUTE_URL) {
    return res.status(500).json({ 
      error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } 
    });
  }

  const { ghFileBase64, fileName = 'definition.gh' } = req.body;

  if (!ghFileBase64) {
    return res.status(400).json({ 
      error: { message: 'ghFileBase64 is required' } 
    });
  }

  try {
    const computeBaseUrl = RHINO_COMPUTE_URL.replace(/\/$/, '');
    
    // Load the compute-gh-to-json.gh script
    const scriptPath = path.resolve(__dirname, '../scripts/compute-gh-to-json.gh');
    console.log(`[gh-to-json] Loading compute-gh-to-json.gh from ${scriptPath}`);
    
    const ghBuffer = await fs.readFile(scriptPath);
    const algo = ghBuffer.toString('base64');
    
    console.log(`[gh-to-json] Loaded compute-gh-to-json.gh (${ghBuffer.length} bytes)`);
    console.log(`[gh-to-json] Processing ${fileName}`);
    console.log(`[gh-to-json] Input .gh file size: ${Buffer.from(ghFileBase64, 'base64').length} bytes`);
    
    // Build the solve request - same structure as grasshopper endpoint
    const solvePayload = {
      absolutetolerance: 0.01,
      angletolerance: 1.0,
      modelunits: "Meters",
      dataversion: 7,
      algo: algo,
      filename: 'compute-gh-to-json.gh',
      pointer: null,
      cachesolve: true,
      values: [
        {
          ParamName: "Get String",
          InnerTree: {
            "{0}": [
              {
                type: "System.String",
                data: ghFileBase64
              }
            ]
          }
        }
      ],
      warnings: [],
      errors: []
    };
    
    console.log(`[gh-to-json] Sending parameter "GH_File" with base64 data (${ghFileBase64.length} chars)`);
    
    // Send to /grasshopper endpoint (same as grasshopper/solve)
    const solveUrl = `${computeBaseUrl}/grasshopper`;
    console.log(`[gh-to-json] Solving at ${solveUrl}`);
    
    const solveResponse = await axios.post(solveUrl, solvePayload, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      validateStatus: () => true,
      timeout: 60000, // 60 second timeout
    });
    
    console.log(`[gh-to-json] Response status: ${solveResponse.status}`);
    
    if (solveResponse.data && solveResponse.data.values) {
      console.log(`[gh-to-json] Output values count: ${solveResponse.data.values.length}`);
      solveResponse.data.values.forEach((val, idx) => {
        const innerTreeKeys = Object.keys(val.InnerTree || {});
        const firstKey = innerTreeKeys[0];
        const itemCount = firstKey ? val.InnerTree[firstKey]?.length : 0;
        console.log(`[gh-to-json] Output ${idx}: ${val.ParamName} - InnerTree keys: ${innerTreeKeys.join(', ')} - Items: ${itemCount}`);
        if (itemCount > 0) {
          console.log(`[gh-to-json]   First item type: ${val.InnerTree[firstKey][0]?.type}`);
        }
      });
    }
    
    return res.status(solveResponse.status).json(solveResponse.data);
    
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('[gh-to-json] compute-gh-to-json.gh not found');
      return res.status(404).json({
        error: { 
          message: 'compute-gh-to-json.gh not found at backend-compute-gateway/src/scripts/'
        }
      });
    }
    console.error('[gh-to-json] Error:', err.message);
    next(err);
  }
});

export default router;
