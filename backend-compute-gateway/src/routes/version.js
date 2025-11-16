import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req, res, next) => {
  const { RHINO_COMPUTE_URL } = process.env;
  const computeBaseUrl = RHINO_COMPUTE_URL ? RHINO_COMPUTE_URL.replace(/\/$/, '') : '';
  
  if (!computeBaseUrl) {
    console.warn('[backend-compute-gateway] RHINO_COMPUTE_URL is not configured');
    return res.status(500).json({ error: { message: 'RHINO_COMPUTE_URL is not configured on the backend.' } });
  }

  try {
    const targetUrl = `${computeBaseUrl}/version`;
    console.log(`[backend-compute-gateway] forwarding /version to ${targetUrl}`);
    const response = await axios.get(targetUrl, {
      headers: {},
      validateStatus: () => true,
      timeout: 10000, // 10 second timeout for version check
    });
    console.log(`[backend-compute-gateway] version response ${response.status}`, response.data);

    return res.status(response.status).json(response.data);
  } catch (err) {
    console.error('[backend-compute-gateway] version error:', err.message);
    next(err);
  }
});

export default router;
