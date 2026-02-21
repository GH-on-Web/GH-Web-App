/**
 * /scripts  –  CRUD + graph traversal API for GH scripts stored in Neo4j
 *
 * POST   /scripts                          ingest a new script
 * GET    /scripts                          list all documents
 * GET    /scripts/:id                      fetch full document graph
 * DELETE /scripts/:id                      delete document + components
 * GET    /scripts/:id/ancestors/:compLocalId   upstream components
 * GET    /scripts/:id/descendants/:compLocalId downstream components
 * GET    /scripts/:id/similar              documents sharing component types
 */

import { Router } from 'express';
import {
  ingestScript,
  listDocuments,
  getDocument,
  deleteDocument,
  getAncestors,
  getDescendants,
  findSimilarDocuments,
} from '../db/scriptGraph.js';

const router = Router();

// POST /scripts
router.post('/', async (req, res, next) => {
  const { name, description, author, tags, graph } = req.body;

  if (!name)  return res.status(400).json({ error: { message: 'name is required' } });
  if (!graph) return res.status(400).json({ error: { message: 'graph is required' } });
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.links)) {
    return res.status(400).json({ error: { message: 'graph must have nodes[] and links[]' } });
  }

  try {
    const result = await ingestScript({ name, description, author, tags, graph });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /scripts
router.get('/', async (req, res, next) => {
  try {
    res.json(await listDocuments());
  } catch (err) {
    next(err);
  }
});

// GET /scripts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await getDocument(req.params.id);
    if (!doc) return res.status(404).json({ error: { message: 'Document not found' } });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// DELETE /scripts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteDocument(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /scripts/:id/ancestors/:compLocalId
router.get('/:id/ancestors/:compLocalId', async (req, res, next) => {
  const compId = `${req.params.id}::${req.params.compLocalId}`;
  const depth  = parseInt(req.query.depth, 10) || 10;
  try {
    res.json(await getAncestors(compId, depth));
  } catch (err) {
    next(err);
  }
});

// GET /scripts/:id/descendants/:compLocalId
router.get('/:id/descendants/:compLocalId', async (req, res, next) => {
  const compId = `${req.params.id}::${req.params.compLocalId}`;
  const depth  = parseInt(req.query.depth, 10) || 10;
  try {
    res.json(await getDescendants(compId, depth));
  } catch (err) {
    next(err);
  }
});

// GET /scripts/:id/similar
router.get('/:id/similar', async (req, res, next) => {
  try {
    res.json(await findSimilarDocuments(req.params.id));
  } catch (err) {
    next(err);
  }
});

export default router;
