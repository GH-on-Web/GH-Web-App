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

  console.log('[json-to-gh] ========== RECEIVED REQUEST FROM FRONTEND ==========');
  console.log('[json-to-gh] Request body type:', typeof req.body);
  console.log('[json-to-gh] Request body keys:', Object.keys(req.body));
  console.log('[json-to-gh] Request body:', JSON.stringify(req.body, null, 2));

  try {
    const computeBaseUrl = RHINO_COMPUTE_URL.replace(/\/$/, '');
    
    // Load the compute-json-to-gh.gh script
    const scriptPath = path.resolve(__dirname, '../scripts/compute-json-to-gh.gh');
    console.log(`[json-to-gh] Loading compute-json-to-gh.gh from ${scriptPath}`);
    
    const ghBuffer = await fs.readFile(scriptPath);
    const algo = ghBuffer.toString('base64');
    
    console.log(`[json-to-gh] Loaded compute-json-to-gh.gh (${ghBuffer.length} bytes)`);
    
    // Build the solve request - same structure as grasshopper endpoint
    // Convert the JSON object to a string (but don't double-stringify it)
    const jsonString = JSON.stringify(req.body);
    console.log(`[json-to-gh] JSON string length: ${jsonString.length} chars`);
    console.log(`[json-to-gh] JSON string preview: ${jsonString.substring(0, 200)}...`);
    
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
          ParamName: "Get String",
          InnerTree: {
            "{0}": [
              {
                type: "System.String",
                data: jsonString
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
    console.log('[json-to-gh] ========== SENDING TO RHINO COMPUTE ==========');
    console.log('[json-to-gh] Payload values array:', JSON.stringify(solvePayload.values, null, 2));
    
    const solveResponse = await axios.post(solveUrl, solvePayload, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      validateStatus: () => true,
      timeout: 60000, // 60 second timeout
    });
    
    console.log(`[json-to-gh] Response status: ${solveResponse.status}`);
    console.log('[json-to-gh] Full compute response:', JSON.stringify(solveResponse.data, null, 2));
    
    if (solveResponse.data && solveResponse.data.values) {
      console.log(`[json-to-gh] Output values count: ${solveResponse.data.values.length}`);
      solveResponse.data.values.forEach((val, idx) => {
        const innerTreeKeys = Object.keys(val.InnerTree || {});
        const firstKey = innerTreeKeys[0];
        const itemCount = firstKey ? val.InnerTree[firstKey]?.length : 0;
        console.log(`[json-to-gh] Output ${idx}: ${val.ParamName} - InnerTree keys: ${innerTreeKeys.join(', ')} - Items: ${itemCount}`);
      });
      
      // Extract the gh_file output (base64 string) and convert to binary
      const ghFileParam = solveResponse.data.values.find(v => v.ParamName === 'gh_file');
      if (ghFileParam) {
        console.log('[json-to-gh] Found gh_file parameter:', JSON.stringify(ghFileParam, null, 2));
        const innerTree = ghFileParam.InnerTree?.['{0}']?.[0];
        if (innerTree?.data) {
          console.log('[json-to-gh] Found gh_file output in InnerTree');
          console.log(`[json-to-gh] Base64 data type: ${typeof innerTree.data}, length: ${innerTree.data?.length}`);
          console.log(`[json-to-gh] First 100 chars of base64: ${innerTree.data.substring(0, 100)}`);
          
          // The data is a base64 string - convert it to binary buffer
          const base64Data = innerTree.data;
          const buffer = Buffer.from(base64Data, 'base64');
          console.log(`[json-to-gh] Decoded buffer length: ${buffer.length} bytes`);
          console.log(`[json-to-gh] First 20 bytes as hex: ${buffer.slice(0, 20).toString('hex')}`);
          
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', 'attachment; filename="generated.gh"');
          console.log('[json-to-gh] Sending binary buffer to frontend');
          return res.send(buffer);
        } else {
          console.error('[json-to-gh] gh_file InnerTree data is missing');
        }
      } else {
        console.error('[json-to-gh] gh_file parameter not found in response values');
      }
      
      console.warn('[json-to-gh] gh_file output not found in response');
    }
    
    // Fallback: return the full response if gh_file not found
    console.error('[json-to-gh] Falling back to JSON response');
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
