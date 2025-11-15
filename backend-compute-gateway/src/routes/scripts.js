import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = process.env.SCRIPTS_MANIFEST_PATH
  ? path.resolve(process.env.SCRIPTS_MANIFEST_PATH)
  : path.resolve(__dirname, '../../../frontend/public/gh-script.json');

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

export default router;
