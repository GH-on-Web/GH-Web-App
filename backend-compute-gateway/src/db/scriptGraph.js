/**
 * scriptGraph.js
 *
 * Domain layer for Grasshopper script storage in Neo4j.
 *
 * Graph model
 * -----------
 *  (:GHDocument  { id, name, description, author, created_at, tags[] })
 *  (:GHComponent { id, doc_id, local_id, guid, nickname, position_x, position_y, properties_json })
 *
 *  (doc)-[:HAS_COMPONENT]->(comp)
 *  (compA)-[:WIRE { from_param, to_param, order }]->(compB)
 *
 * The WIRE relationship lives directly between GHComponent nodes so that
 * Cypher traversal queries (ancestors, descendants, paths) are fast without
 * the extra hop through a parameter node layer.
 */

import { session } from './driver.js';
import { v4 as uuidv4 } from 'uuid';

// ─── helpers ────────────────────────────────────────────────────────────────

function toNative(record, key) {
  const v = record.get(key);
  // neo4j Integer → JS number
  if (neo4jInteger(v)) return v.toNumber();
  return v;
}

function neo4jInteger(v) {
  return v && typeof v === 'object' && 'low' in v && 'high' in v;
}

function compProps(c) {
  return {
    id:             c.id,
    doc_id:         c.doc_id,
    local_id:       c.local_id,
    guid:           c.guid,
    nickname:       c.nickname,
    position_x:     c.position_x,
    position_y:     c.position_y,
    properties_json: c.properties_json,
  };
}

// ─── documents ──────────────────────────────────────────────────────────────

/**
 * Ingest a parsed GH JSON script into Neo4j.
 *
 * @param {object} opts
 * @param {string} opts.name
 * @param {string} [opts.description]
 * @param {string} [opts.author]
 * @param {string[]} [opts.tags]
 * @param {{ nodes: object[], links: object[] }} opts.graph  – parsed JSON
 * @returns {{ docId: string, componentCount: number, wireCount: number }}
 */
export async function ingestScript({ name, description = '', author = '', tags = [], graph }) {
  const s = session();
  const docId = uuidv4();
  const now   = new Date().toISOString();

  try {
    // Build component node list with stable compound ids
    const components = graph.nodes.map(n => ({
      id:              `${docId}::${n.id}`,
      doc_id:          docId,
      local_id:        n.id,
      guid:            n.guid || '',
      nickname:        n.nickname || n.id,
      position_x:      n.x ?? 0,
      position_y:      n.y ?? 0,
      properties_json: n.properties ? JSON.stringify(n.properties) : null,
    }));

    // MERGE the document node
    await s.run(
      `MERGE (d:GHDocument { id: $id })
       SET   d.name        = $name,
             d.description = $description,
             d.author      = $author,
             d.tags        = $tags,
             d.created_at  = $created_at`,
      { id: docId, name, description, author, tags, created_at: now }
    );

    // MERGE all component nodes + HAS_COMPONENT edges (batched via UNWIND)
    await s.run(
      `UNWIND $components AS c
       MERGE (comp:GHComponent { id: c.id })
       SET   comp += c
       WITH  comp, c
       MATCH (d:GHDocument { id: c.doc_id })
       MERGE (d)-[:HAS_COMPONENT]->(comp)`,
      { components }
    );

    // MERGE WIRE relationships
    const wires = graph.links.map((l, i) => ({
      from_id:    `${docId}::${l.fromNode}`,
      to_id:      `${docId}::${l.toNode}`,
      from_param: String(l.fromParam),
      to_param:   String(l.toParam),
      order:      i,
    }));

    if (wires.length > 0) {
      await s.run(
        `UNWIND $wires AS w
         MATCH (a:GHComponent { id: w.from_id })
         MATCH (b:GHComponent { id: w.to_id })
         MERGE (a)-[r:WIRE { from_param: w.from_param, to_param: w.to_param }]->(b)
         SET r.order = w.order`,
        { wires }
      );
    }

    return { docId, componentCount: components.length, wireCount: wires.length };
  } finally {
    await s.close();
  }
}

/**
 * List all GHDocument nodes (summary only, no components).
 */
export async function listDocuments() {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (d:GHDocument)
       OPTIONAL MATCH (d)-[:HAS_COMPONENT]->(c:GHComponent)
       RETURN d, count(c) AS component_count
       ORDER BY d.created_at DESC`
    );
    return result.records.map(r => ({
      ...r.get('d').properties,
      component_count: r.get('component_count').toNumber?.() ?? r.get('component_count'),
    }));
  } finally {
    await s.close();
  }
}

/**
 * Fetch a single document and its full component+wire graph.
 */
export async function getDocument(docId) {
  const s = session();
  try {
    // Document node
    const docResult = await s.run(
      `MATCH (d:GHDocument { id: $id }) RETURN d`,
      { id: docId }
    );
    if (!docResult.records.length) return null;
    const doc = docResult.records[0].get('d').properties;

    // Components
    const compResult = await s.run(
      `MATCH (d:GHDocument { id: $id })-[:HAS_COMPONENT]->(c:GHComponent)
       RETURN c ORDER BY c.position_y, c.position_x`,
      { id: docId }
    );
    const components = compResult.records.map(r => r.get('c').properties);

    // Wires
    const wireResult = await s.run(
      `MATCH (d:GHDocument { id: $id })-[:HAS_COMPONENT]->(a:GHComponent)
             -[w:WIRE]->(b:GHComponent)
       RETURN a.local_id AS from_node, w.from_param AS from_param,
              b.local_id AS to_node,   w.to_param   AS to_param,
              w.order    AS order
       ORDER BY w.order`,
      { id: docId }
    );
    const links = wireResult.records.map(r => ({
      fromNode:  r.get('from_node'),
      fromParam: r.get('from_param'),
      toNode:    r.get('to_node'),
      toParam:   r.get('to_param'),
    }));

    return { ...doc, components, links };
  } finally {
    await s.close();
  }
}

/**
 * Delete a document and all its components/wires.
 */
export async function deleteDocument(docId) {
  const s = session();
  try {
    await s.run(
      `MATCH (d:GHDocument { id: $id })
       OPTIONAL MATCH (d)-[:HAS_COMPONENT]->(c:GHComponent)
       DETACH DELETE c, d`,
      { id: docId }
    );
  } finally {
    await s.close();
  }
}

// ─── traversal queries ───────────────────────────────────────────────────────

/**
 * Return all upstream (ancestor) components feeding into a given component.
 *
 * @param {string} compId  – global component id  (docId::localId)
 * @param {number} [maxDepth=10]
 */
export async function getAncestors(compId, maxDepth = 10) {
  const s = session();
  try {
    const result = await s.run(
      `MATCH path = (ancestor:GHComponent)-[:WIRE*1..${maxDepth}]->(target:GHComponent { id: $id })
       RETURN DISTINCT ancestor, length(path) AS depth
       ORDER BY depth`,
      { id: compId }
    );
    return result.records.map(r => ({
      ...r.get('ancestor').properties,
      depth: r.get('depth').toNumber?.() ?? r.get('depth'),
    }));
  } finally {
    await s.close();
  }
}

/**
 * Return all downstream (descendant) components reachable from a given component.
 */
export async function getDescendants(compId, maxDepth = 10) {
  const s = session();
  try {
    const result = await s.run(
      `MATCH path = (source:GHComponent { id: $id })-[:WIRE*1..${maxDepth}]->(desc:GHComponent)
       RETURN DISTINCT desc, length(path) AS depth
       ORDER BY depth`,
      { id: compId }
    );
    return result.records.map(r => ({
      ...r.get('desc').properties,
      depth: r.get('depth').toNumber?.() ?? r.get('depth'),
    }));
  } finally {
    await s.close();
  }
}

/**
 * Find documents that share a component type (by guid) with the given document.
 * Useful for "similar scripts" recommendations.
 */
export async function findSimilarDocuments(docId) {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (d:GHDocument { id: $docId })-[:HAS_COMPONENT]->(c:GHComponent)
       MATCH (other:GHDocument)-[:HAS_COMPONENT]->(c2:GHComponent)
       WHERE other.id <> $docId AND c.guid = c2.guid AND c.guid <> ''
       RETURN DISTINCT other, count(DISTINCT c.guid) AS shared_types
       ORDER BY shared_types DESC
       LIMIT 10`,
      { docId }
    );
    return result.records.map(r => ({
      ...r.get('other').properties,
      shared_component_types: r.get('shared_types').toNumber?.() ?? r.get('shared_types'),
    }));
  } finally {
    await s.close();
  }
}
