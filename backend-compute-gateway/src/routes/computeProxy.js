import { Router } from 'express';
import axios from 'axios';

const router = Router();

const { RHINO_COMPUTE_URL, RHINO_COMPUTE_KEY } = process.env;

if (!RHINO_COMPUTE_URL) {
  console.warn('[backend-compute-gateway] RHINO_COMPUTE_URL is not set. Compute proxy will not work until configured.');
}

router.all('/*', async (req, res, next) => {
  if (!RHINO_COMPUTE_URL) {
    return res.status(500).json({ error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } });
  }

  try {
    const targetUrl = `${RHINO_COMPUTE_URL}${req.originalUrl.replace(/^\/compute/, '')}`;

    const headers = {
      ...req.headers,
    };

    if (RHINO_COMPUTE_KEY) {
      headers['Authorization'] = `Bearer ${RHINO_COMPUTE_KEY}`;
    }

    delete headers['host'];

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers,
      data: req.body,
      validateStatus: () => true,
    });

    res.status(response.status).set(response.headers).send(response.data);
  } catch (err) {
    next(err);
  }
});

export default router;
