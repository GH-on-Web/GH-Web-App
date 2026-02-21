/**
 * scriptGraph.test.js
 *
 * Unit tests for the Neo4j graph DB layer.
 * The neo4j driver is fully mocked so these run without a live database.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── mock neo4j driver before importing the module under test ──────────────
const mockRun = vi.fn();
const mockClose = vi.fn();
const mockVerify = vi.fn().mockResolvedValue(true);

vi.mock('../src/db/driver.js', () => ({
  session: () => ({ run: mockRun, close: mockClose }),
  getDriver: () => ({ verifyConnectivity: mockVerify }),
  initSchema: vi.fn().mockResolvedValue(undefined),
  closeDriver: vi.fn().mockResolvedValue(undefined),
}));

// uuid is deterministic in tests
vi.mock('uuid', () => ({ v4: () => 'test-uuid-1234' }));

const {
  ingestScript,
  listDocuments,
  getDocument,
  deleteDocument,
  getAncestors,
  getDescendants,
} = await import('../src/db/scriptGraph.js');

// Clear all mock state (calls, instances, results) before every test
// so call indices are always relative to the current test only.
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

// ── helpers ───────────────────────────────────────────────────────────────

/** Wrap a plain JS value to look like a Neo4j Integer */
function neo4jInt(n) {
  return { low: n, high: 0, toNumber: () => n };
}

/** Build a fake neo4j record */
function fakeRecord(map) {
  return {
    get: (key) => map[key],
    keys: Object.keys(map),
  };
}

/** Minimal graph fixture used across tests */
const SAMPLE_GRAPH = {
  nodes: [
    { id: 'slider_x', guid: 'guid-slider', nickname: 'X', x: 40, y: 40,
      properties: { Min: -10, Max: 10, Value: 2 } },
    { id: 'pt', guid: 'guid-pt', nickname: 'Pt', x: 260, y: 100 },
  ],
  links: [
    { fromNode: 'slider_x', fromParam: '0', toNode: 'pt', toParam: 'X' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────
describe('ingestScript', () => {
  beforeEach(() => {
    // Default: every session.run() succeeds with an empty result set
    mockRun.mockResolvedValue({ records: [] });
    mockClose.mockResolvedValue(undefined);
  });


  it('returns docId, componentCount, wireCount', async () => {
    const result = await ingestScript({
      name: 'Test Script',
      graph: SAMPLE_GRAPH,
    });

    expect(result).toMatchObject({
      docId: 'test-uuid-1234',
      componentCount: 2,
      wireCount: 1,
    });
  });

  it('runs MERGE for document, components, and wires', async () => {
    await ingestScript({ name: 'Test Script', graph: SAMPLE_GRAPH });

    const queries = mockRun.mock.calls.map(([cypher]) => cypher.trim());

    // Document MERGE
    expect(queries.some(q => q.startsWith('MERGE (d:GHDocument'))).toBe(true);

    // Component UNWIND MERGE
    expect(queries.some(q => q.includes('UNWIND $components') && q.includes('GHComponent'))).toBe(true);

    // Wire UNWIND MERGE
    expect(queries.some(q => q.includes('UNWIND $wires') && q.includes('WIRE'))).toBe(true);
  });

  it('passes component properties to neo4j', async () => {
    await ingestScript({ name: 'Test Script', graph: SAMPLE_GRAPH });

    const compCall = mockRun.mock.calls.find(([cypher]) =>
      cypher.includes('UNWIND $components')
    );
    expect(compCall).toBeDefined();

    const { components } = compCall[1];
    const slider = components.find(c => c.local_id === 'slider_x');

    expect(slider).toBeDefined();
    expect(slider.guid).toBe('guid-slider');
    expect(slider.nickname).toBe('X');
    expect(slider.position_x).toBe(40);
    expect(slider.properties_json).toBe(JSON.stringify({ Min: -10, Max: 10, Value: 2 }));
  });

  it('prefixes component ids with docId', async () => {
    await ingestScript({ name: 'Test Script', graph: SAMPLE_GRAPH });

    const compCall = mockRun.mock.calls.find(([cypher]) =>
      cypher.includes('UNWIND $components')
    );
    const { components } = compCall[1];

    expect(components[0].id).toBe('test-uuid-1234::slider_x');
  });

  it('skips WIRE run when graph has no links', async () => {
    await ingestScript({ name: 'Empty', graph: { nodes: [], links: [] } });

    const wireCall = mockRun.mock.calls.find(([cypher]) =>
      cypher.includes('UNWIND $wires')
    );
    expect(wireCall).toBeUndefined();
  });

  it('tags, description, author default to empty when omitted', async () => {
    await ingestScript({ name: 'Bare', graph: SAMPLE_GRAPH });

    const docCall = mockRun.mock.calls.find(([cypher]) =>
      cypher.startsWith('MERGE (d:GHDocument')
    );
    const params = docCall[1];

    expect(params.description).toBe('');
    expect(params.author).toBe('');
    expect(params.tags).toEqual([]);
  });

  it('stores tags when provided', async () => {
    await ingestScript({
      name: 'Tagged',
      tags: ['parametric', 'geometry'],
      graph: SAMPLE_GRAPH,
    });

    const docCall = mockRun.mock.calls.find(([cypher]) =>
      cypher.startsWith('MERGE (d:GHDocument')
    );
    expect(docCall[1].tags).toEqual(['parametric', 'geometry']);
  });

  it('closes the session even on error', async () => {
    mockRun.mockRejectedValueOnce(new Error('DB error'));
    await expect(
      ingestScript({ name: 'X', graph: SAMPLE_GRAPH })
    ).rejects.toThrow('DB error');
    expect(mockClose).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('listDocuments', () => {
  it('returns documents with component_count', async () => {
    mockRun.mockResolvedValueOnce({
      records: [
        fakeRecord({
          d: { properties: { id: 'doc1', name: 'Script A', tags: [] } },
          component_count: neo4jInt(3),
        }),
        fakeRecord({
          d: { properties: { id: 'doc2', name: 'Script B', tags: ['geo'] } },
          component_count: neo4jInt(7),
        }),
      ],
    });

    const results = await listDocuments();

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ id: 'doc1', name: 'Script A', component_count: 3 });
    expect(results[1]).toMatchObject({ id: 'doc2', name: 'Script B', component_count: 7 });
  });

  it('returns empty array when no documents exist', async () => {
    mockRun.mockResolvedValueOnce({ records: [] });
    const results = await listDocuments();
    expect(results).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('getDocument', () => {
  it('returns null when document not found', async () => {
    mockRun.mockResolvedValueOnce({ records: [] });
    const result = await getDocument('missing-id');
    expect(result).toBeNull();
  });

  it('assembles document with components and links', async () => {
    // 1st run: document node
    mockRun.mockResolvedValueOnce({
      records: [fakeRecord({ d: { properties: { id: 'doc1', name: 'Test' } } })],
    });
    // 2nd run: components
    mockRun.mockResolvedValueOnce({
      records: [
        fakeRecord({ c: { properties: { id: 'doc1::slider_x', local_id: 'slider_x', nickname: 'X' } } }),
      ],
    });
    // 3rd run: wires
    mockRun.mockResolvedValueOnce({
      records: [
        fakeRecord({
          from_node: 'slider_x',
          from_param: '0',
          to_node: 'pt',
          to_param: 'X',
          order: neo4jInt(0),
        }),
      ],
    });

    const doc = await getDocument('doc1');

    expect(doc).toMatchObject({ id: 'doc1', name: 'Test' });
    expect(doc.components).toHaveLength(1);
    expect(doc.components[0].local_id).toBe('slider_x');
    expect(doc.links).toHaveLength(1);
    expect(doc.links[0]).toMatchObject({
      fromNode: 'slider_x',
      fromParam: '0',
      toNode: 'pt',
      toParam: 'X',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('deleteDocument', () => {
  it('runs DETACH DELETE on doc and components', async () => {
    mockRun.mockResolvedValueOnce({ records: [] });

    await deleteDocument('doc-abc');

    const [cypher, params] = mockRun.mock.calls[0];
    expect(cypher).toContain('DETACH DELETE');
    expect(params.id).toBe('doc-abc');
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('getAncestors / getDescendants', () => {
  const ancestorRecord = fakeRecord({
    ancestor: { properties: { id: 'doc::comp_a', nickname: 'A' } },
    depth: neo4jInt(1),
  });

  it('queries ancestors with correct node id and depth', async () => {
    mockRun.mockResolvedValueOnce({ records: [ancestorRecord] });

    const results = await getAncestors('doc::comp_b', 5);

    const [cypher, params] = mockRun.mock.calls[0];
    expect(cypher).toContain('WIRE*1..5');
    expect(params.id).toBe('doc::comp_b');
    expect(results[0]).toMatchObject({ id: 'doc::comp_a', depth: 1 });
  });

  it('queries descendants in forward direction', async () => {
    mockRun.mockResolvedValueOnce({
      records: [
        fakeRecord({
          desc: { properties: { id: 'doc::comp_c', nickname: 'C' } },
          depth: neo4jInt(2),
        }),
      ],
    });

    const results = await getDescendants('doc::comp_a', 3);

    const [cypher, params] = mockRun.mock.calls[0];
    expect(cypher).toContain('WIRE*1..3');
    expect(cypher).toContain('source:GHComponent');
    expect(params.id).toBe('doc::comp_a');
    expect(results[0].depth).toBe(2);
  });
});
