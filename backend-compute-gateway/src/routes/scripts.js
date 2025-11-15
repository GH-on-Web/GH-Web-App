import { Router } from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = process.env.SCRIPTS_MANIFEST_PATH
  ? path.resolve(process.env.SCRIPTS_MANIFEST_PATH)
  : path.resolve(__dirname, '../../../frontend/public/gh-script.json');

function buildHeaders(extra = {}) {
  const { RHINO_COMPUTE_KEY } = process.env;
  const headers = { ...extra };
  if (RHINO_COMPUTE_KEY) {
    headers['Authorization'] = `Bearer ${RHINO_COMPUTE_KEY}`;
  }
  return headers;
}

router.get('/', async (req, res, next) => {
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);

    res.json({
      manifestPath,
      ...manifest,
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({
        error: {
          message: 'Scripts manifest not found. Set SCRIPTS_MANIFEST_PATH or create gh-script.json.',
          manifestPath,
        },
      });
    }
    next(err);
  }
});

router.post('/compute-gh-to-json', async (req, res, next) => {
  const { RHINO_COMPUTE_URL } = process.env;
  const computeBaseUrl = RHINO_COMPUTE_URL ? RHINO_COMPUTE_URL.replace(/\/$/, '') : '';
  
  if (!computeBaseUrl) {
    return res.status(500).json({ error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } });
  }

  try {
    const targetUrl = `${computeBaseUrl}/utility/parse-gh-to-json`;
    console.log(`[scripts] compute-gh-to-json -> ${targetUrl}`);
    const response = await axios.post(targetUrl, req.body, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      validateStatus: () => true,
    });

    console.log(`[scripts] compute-gh-to-json response ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('[scripts] compute-gh-to-json error:', err.message);
    next(err);
  }
});

router.post('/compute-json-to-gh', async (req, res, next) => {
  const { RHINO_COMPUTE_URL } = process.env;
  const computeBaseUrl = RHINO_COMPUTE_URL ? RHINO_COMPUTE_URL.replace(/\/$/, '') : '';
  
  if (!computeBaseUrl) {
    return res.status(500).json({ error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } });
  }

  try {
    const targetUrl = `${computeBaseUrl}/utility/json-to-gh`;
    console.log(`[scripts] compute-json-to-gh -> ${targetUrl}`);
    const response = await axios.post(targetUrl, req.body, {
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    console.log(`[scripts] compute-json-to-gh response ${response.status}`);
    res
      .status(response.status)
      .set({
        'Content-Type': response.headers['content-type'] || 'application/octet-stream',
        'Content-Disposition': response.headers['content-disposition'] || 'attachment; filename="definition.gh"',
      })
      .send(response.data);
  } catch (err) {
    console.error('[scripts] compute-json-to-gh error:', err.message);
    next(err);
  }
});

export default router;
