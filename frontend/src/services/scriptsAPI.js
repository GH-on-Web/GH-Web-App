const BASE = process.env.REACT_APP_COMPUTE_GATEWAY_URL || 'http://localhost:4001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || `Request failed: ${res.status}`);
  return body;
}

/** GET /scripts — returns summary list with component_count */
export function listScripts() {
  return request('/scripts');
}

/** GET /scripts/:id — returns full doc with components[] and links[] */
export function getScript(id) {
  return request(`/scripts/${id}`);
}

/**
 * POST /scripts — ingest a new script
 * @param {{ name, description?, author?, tags?, graph: { nodes[], links[] } }} payload
 * @returns {{ docId, componentCount, wireCount }}
 */
export function submitScript(payload) {
  return request('/scripts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** DELETE /scripts/:id */
export function deleteScript(id) {
  return request(`/scripts/${id}`, { method: 'DELETE' });
}

/**
 * Convert a full document from GET /scripts/:id into the canvas simplified format.
 *
 * API shape:
 *   { id, name, components: [{ local_id, guid, nickname, position_x, position_y, properties_json }],
 *     links: [{ fromNode, fromParam, toNode, toParam }] }
 *
 * Canvas shape:
 *   { nodes: [{ id, guid, nickname, x, y, properties? }], links: [...same...] }
 */
export function docToCanvasGraph(doc) {
  return {
    nodes: (doc.components || []).map(c => {
      const node = {
        id: c.local_id,
        guid: c.guid,
        nickname: c.nickname,
        x: c.position_x,
        y: c.position_y,
      };
      if (c.properties_json) {
        try { node.properties = JSON.parse(c.properties_json); } catch (_) {}
      }
      return node;
    }),
    links: doc.links || [],
  };
}
