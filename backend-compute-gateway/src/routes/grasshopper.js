import { Router } from 'express';
import axios from 'axios';

const router = Router();

function buildHeaders(extra = {}) {
  const { RHINO_COMPUTE_KEY } = process.env;
  const headers = { ...extra };
  if (RHINO_COMPUTE_KEY) {
    headers['Authorization'] = `Bearer ${RHINO_COMPUTE_KEY}`;
  }
  return headers;
}

/**
 * POST /grasshopper/upload
 * 
 * Step 1: Upload .gh file to Rhino Compute /io endpoint
 * Returns the pointer for use in solve step
 * 
 * Request body:
 * {
 *   ghFileBase64: "base64 encoded .gh file",
 *   fileName: "optional-filename.gh"
 * }
 * 
 * Response:
 * {
 *   pointer: "returned_pointer_from_compute"
 * }
 */
router.post('/upload', async (req, res, next) => {
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
    
    // Convert base64 to buffer
    const ghBuffer = Buffer.from(ghFileBase64, 'base64');
    
    // Upload to /io endpoint
    const uploadUrl = `${computeBaseUrl}/io`;
    console.log(`[grasshopper] Uploading ${fileName} to ${uploadUrl}`);
    
    const uploadResponse = await axios.post(uploadUrl, ghBuffer, {
      headers: buildHeaders({ 
        'Content-Type': 'application/octet-stream'
      }),
      validateStatus: () => true,
    });
    
    console.log(`[grasshopper] Upload response status: ${uploadResponse.status}`);
    
    if (uploadResponse.status !== 200 && uploadResponse.status !== 201) {
      return res.status(uploadResponse.status).json({
        error: { 
          message: 'Failed to upload .gh file to compute server',
          details: uploadResponse.data
        }
      });
    }
    
    // The response should contain the pointer
    return res.status(uploadResponse.status).json(uploadResponse.data);
    
  } catch (err) {
    console.error('[grasshopper] Upload error:', err.message);
    next(err);
  }
});

/**
 * POST /grasshopper/solve
 * 
 * Solve a Grasshopper definition
 * 
 * Option 1: Send base64 algo directly
 * {
 *   algo: "base64_gh_file",
 *   pointer: null,
 *   fileName: "definition.gh",
 *   values: [...],
 *   cachesolve: true
 * }
 * 
 * Option 2: Use cached pointer (from /upload)
 * {
 *   algo: null,
 *   pointer: "pointer_from_upload",
 *   fileName: "definition.gh",
 *   values: [...],
 *   cachesolve: true
 * }
 */
router.post('/solve', async (req, res, next) => {
  const { RHINO_COMPUTE_URL } = process.env;
  
  if (!RHINO_COMPUTE_URL) {
    return res.status(500).json({ 
      error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } 
    });
  }

  const { 
    algo = null,
    pointer = null,
    fileName = 'definition.gh', 
    values = [], 
    cachesolve = true,
    absolutetolerance = 0.01,
    angletolerance = 1.0,
    modelunits = "Meters",
    dataversion = 7
  } = req.body;

  // Must have either algo or pointer
  if (!algo && !pointer) {
    return res.status(400).json({ 
      error: { message: 'Either algo (base64 .gh file) or pointer is required' } 
    });
  }

  try {
    const computeBaseUrl = RHINO_COMPUTE_URL.replace(/\/$/, '');
    
    // Build the solve request
    const solvePayload = {
      absolutetolerance,
      angletolerance,
      modelunits,
      dataversion,
      algo: algo,
      filename: fileName,
      pointer: pointer,
      cachesolve: cachesolve,
      values: values,
      warnings: [],
      errors: []
    };
    
    // Send solve request to /grasshopper endpoint
    const solveUrl = `${computeBaseUrl}/grasshopper`;
    if (pointer) {
      console.log(`[grasshopper] Solving with pointer ${pointer} at ${solveUrl}`);
    } else {
      console.log(`[grasshopper] Solving ${fileName} with base64 algo at ${solveUrl}`);
      console.log(`[grasshopper] algo length: ${algo?.length || 0} chars`);
    }
    console.log(`[grasshopper] Parameters:`, values.map(v => v.ParamName).join(', ') || 'none');
    console.log(`[grasshopper] Payload keys:`, Object.keys(solvePayload));
    console.log(`[grasshopper] Full payload:`, JSON.stringify(solvePayload, null, 2));
    
    const solveResponse = await axios.post(solveUrl, solvePayload, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      validateStatus: () => true,
      timeout: 60000, // 60 second timeout
    });
    
    console.log(`[grasshopper] Solve response status: ${solveResponse.status}`);
    if (solveResponse.status >= 400) {
      console.error(`[grasshopper] Error response:`, JSON.stringify(solveResponse.data, null, 2));
    }
    
    // Return the solve results
    return res.status(solveResponse.status).json(solveResponse.data);
    
  } catch (err) {
    console.error('[grasshopper] Solve error:', err.message);
    next(err);
  }
});

export default router;
