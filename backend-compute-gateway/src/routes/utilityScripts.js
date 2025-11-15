import { Router } from 'express';
import axios from 'axios';

const router = Router();

const { RHINO_COMPUTE_URL, RHINO_COMPUTE_KEY } = process.env;

if (!RHINO_COMPUTE_URL) {
  console.warn('[backend-compute-gateway] RHINO_COMPUTE_URL is not set. Utility script endpoints will not work until configured.');
}

function buildHeaders(extra = {}) {
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
  if (!RHINO_COMPUTE_URL) {
    return res.status(500).json({ error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } });
  }

  try {
    const targetUrl = `${RHINO_COMPUTE_URL}/utility/parse-gh-to-json`;
    const response = await axios.post(targetUrl, req.body, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
});

// 2) Convert JSON description into a .gh file (via dedicated Compute/Hops endpoint)
// Expects body like: { definitionJson: {...} }
// Forwards to: `${RHINO_COMPUTE_URL}/utility/json-to-gh`
router.post('/json-to-gh', async (req, res, next) => {
  if (!RHINO_COMPUTE_URL) {
    return res.status(500).json({ error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } });
  }

  try {
    const targetUrl = `${RHINO_COMPUTE_URL}/utility/json-to-gh`;
    const response = await axios.post(targetUrl, req.body, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    // Pass through status and send as a GH file download by default
    res
      .status(response.status)
      .set({
        'Content-Type': response.headers['content-type'] || 'application/octet-stream',
        'Content-Disposition': response.headers['content-disposition'] || 'attachment; filename="definition.gh"',
      })
      .send(response.data);
  } catch (err) {
    next(err);
  }
});

export default router;
