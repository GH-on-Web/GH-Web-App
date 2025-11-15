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

// 1) Parse a .gh script into JSON (via a dedicated Compute/Hops endpoint)
// Expects body like: { ghPath: string, ...otherInputs }
// Forwards to: `${RHINO_COMPUTE_URL}/utility/parse-gh-to-json`
router.post('/parse-gh-to-json', async (req, res, next) => {
  const { RHINO_COMPUTE_URL } = process.env;
  
  if (!RHINO_COMPUTE_URL) {
    return res.status(500).json({ error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } });
  }

  try {
    const targetUrl = `${RHINO_COMPUTE_URL}/utility/parse-gh-to-json`;
    console.log(`[utility] parse-gh-to-json -> ${targetUrl}`);
    const response = await axios.post(targetUrl, req.body, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      validateStatus: () => true,
    });

    console.log(`[utility] parse-gh-to-json response ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('[utility] parse-gh-to-json error:', err.message);
    next(err);
  }
});

// 2) Convert JSON description into a .gh file (via dedicated Compute/Hops endpoint)
// Expects body like: { definitionJson: {...} }
// Forwards to: `${RHINO_COMPUTE_URL}/utility/json-to-gh`
router.post('/json-to-gh', async (req, res, next) => {
  const { RHINO_COMPUTE_URL } = process.env;
  
  if (!RHINO_COMPUTE_URL) {
    return res.status(500).json({ error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } });
  }

  try {
    const targetUrl = `${RHINO_COMPUTE_URL}/utility/json-to-gh`;
    console.log(`[utility] json-to-gh -> ${targetUrl}`);
    const response = await axios.post(targetUrl, req.body, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    console.log(`[utility] json-to-gh response ${response.status}`);
    // Pass through status and send as a GH file download by default
    res
      .status(response.status)
      .set({
        'Content-Type': response.headers['content-type'] || 'application/octet-stream',
        'Content-Disposition': response.headers['content-disposition'] || 'attachment; filename="definition.gh"',
      })
      .send(response.data);
  } catch (err) {
    console.error('[utility] json-to-gh error:', err.message);
    next(err);
  }
});

export default router;
