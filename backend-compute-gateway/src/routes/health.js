import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'backend-compute-gateway',
    timestamp: new Date().toISOString(),
  });
});

router.get('/alive', (req, res) => {
  res.type('text/plain').send('alive');
});

export default router;
