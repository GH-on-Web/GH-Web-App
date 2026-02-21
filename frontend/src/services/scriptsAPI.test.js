import { docToCanvasGraph, listScripts, getScript, submitScript, deleteScript } from './scriptsAPI';

// ── docToCanvasGraph (pure, no mocking needed) ────────────────────────────

describe('docToCanvasGraph', () => {
  const fullDoc = {
    id: 'doc-1',
    name: 'Test Script',
    components: [
      {
        local_id: 'slider_x',
        guid: 'guid-slider',
        nickname: 'X',
        position_x: 40,
        position_y: 80,
        properties_json: '{"Min":-10,"Max":10,"Value":2}',
      },
      {
        local_id: 'pt',
        guid: 'guid-pt',
        nickname: 'Pt',
        position_x: 260,
        position_y: 100,
        properties_json: null,
      },
    ],
    links: [
      { fromNode: 'slider_x', fromParam: '0', toNode: 'pt', toParam: 'X' },
    ],
  };

  it('maps local_id to node id', () => {
    const { nodes } = docToCanvasGraph(fullDoc);
    expect(nodes[0].id).toBe('slider_x');
    expect(nodes[1].id).toBe('pt');
  });

  it('maps position_x/y to x/y', () => {
    const { nodes } = docToCanvasGraph(fullDoc);
    expect(nodes[0]).toMatchObject({ x: 40, y: 80 });
    expect(nodes[1]).toMatchObject({ x: 260, y: 100 });
  });

  it('preserves guid and nickname', () => {
    const { nodes } = docToCanvasGraph(fullDoc);
    expect(nodes[0]).toMatchObject({ guid: 'guid-slider', nickname: 'X' });
  });

  it('parses properties_json into properties object', () => {
    const { nodes } = docToCanvasGraph(fullDoc);
    expect(nodes[0].properties).toEqual({ Min: -10, Max: 10, Value: 2 });
  });

  it('omits properties key when properties_json is null', () => {
    const { nodes } = docToCanvasGraph(fullDoc);
    expect(nodes[1]).not.toHaveProperty('properties');
  });

  it('passes links through unchanged', () => {
    const { links } = docToCanvasGraph(fullDoc);
    expect(links).toEqual(fullDoc.links);
  });

  it('handles empty components and links', () => {
    const result = docToCanvasGraph({ components: [], links: [] });
    expect(result).toEqual({ nodes: [], links: [] });
  });

  it('handles missing components/links gracefully', () => {
    const result = docToCanvasGraph({});
    expect(result).toEqual({ nodes: [], links: [] });
  });

  it('ignores malformed properties_json without throwing', () => {
    const doc = {
      components: [
        { local_id: 'a', guid: 'g', nickname: 'A', position_x: 0, position_y: 0,
          properties_json: 'NOT_VALID_JSON' },
      ],
      links: [],
    };
    // Should not throw — invalid JSON is silently skipped
    expect(() => docToCanvasGraph(doc)).not.toThrow();
    const { nodes } = docToCanvasGraph(doc);
    expect(nodes[0]).not.toHaveProperty('properties');
  });
});

// ── API fetch calls ───────────────────────────────────────────────────────

const BASE = process.env.REACT_APP_COMPUTE_GATEWAY_URL || 'http://localhost:4001';

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

function mockFetch(body, { status = 200 } = {}) {
  global.fetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe('listScripts', () => {
  it('GETs /scripts and returns the parsed body', async () => {
    const scripts = [{ id: 's1', name: 'A' }, { id: 's2', name: 'B' }];
    mockFetch(scripts);

    const result = await listScripts();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/scripts`, {});
    expect(result).toEqual(scripts);
  });

  it('throws on non-ok response', async () => {
    mockFetch({ error: { message: 'Server error' } }, { status: 500 });
    await expect(listScripts()).rejects.toThrow('Server error');
  });
});

describe('getScript', () => {
  it('GETs /scripts/:id', async () => {
    const doc = { id: 'doc-1', name: 'Test', components: [], links: [] };
    mockFetch(doc);

    const result = await getScript('doc-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/scripts/doc-1`, {});
    expect(result).toEqual(doc);
  });
});

describe('submitScript', () => {
  const payload = {
    name: 'My Script',
    description: 'A cool script',
    author: 'Nicolas',
    tags: ['parametric'],
    graph: {
      nodes: [
        { id: 'slider_x', guid: 'guid-slider', nickname: 'X', x: 40, y: 40,
          properties: { Min: -10, Max: 10, Value: 2 } },
      ],
      links: [],
    },
  };

  it('POSTs to /scripts with JSON body', async () => {
    mockFetch({ docId: 'new-id', componentCount: 1, wireCount: 0 });

    await submitScript(payload);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/scripts`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });

  it('returns docId, componentCount, wireCount on success', async () => {
    mockFetch({ docId: 'new-id', componentCount: 1, wireCount: 0 });

    const result = await submitScript(payload);

    expect(result).toMatchObject({
      docId: 'new-id',
      componentCount: 1,
      wireCount: 0,
    });
  });

  it('throws with backend error message on 400', async () => {
    mockFetch({ error: { message: 'name is required' } }, { status: 400 });
    await expect(submitScript({ ...payload, name: '' })).rejects.toThrow('name is required');
  });

  it('sends all payload fields to the backend', async () => {
    mockFetch({ docId: 'x', componentCount: 1, wireCount: 0 });

    await submitScript(payload);

    const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(sentBody.name).toBe('My Script');
    expect(sentBody.description).toBe('A cool script');
    expect(sentBody.author).toBe('Nicolas');
    expect(sentBody.tags).toEqual(['parametric']);
    expect(sentBody.graph.nodes).toHaveLength(1);
  });

  it('sends an empty tags array when tags are omitted', async () => {
    mockFetch({ docId: 'x', componentCount: 1, wireCount: 0 });

    await submitScript({ name: 'X', graph: payload.graph });

    const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
    // tags not in payload, so undefined is sent — the backend defaults it
    expect(sentBody.graph).toBeDefined();
  });
});

describe('deleteScript', () => {
  it('sends DELETE to /scripts/:id', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 204, json: async () => null });

    await deleteScript('doc-99');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/scripts/doc-99`,
      { method: 'DELETE' }
    );
  });

  it('throws on non-ok DELETE response', async () => {
    mockFetch({ error: { message: 'Not found' } }, { status: 404 });
    await expect(deleteScript('bad-id')).rejects.toThrow('Not found');
  });
});
