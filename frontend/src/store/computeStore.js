import { create } from 'zustand';

const DEFAULT_BASE_URL = process.env.REACT_APP_COMPUTE_GATEWAY_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}${path}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errorBody = null;
    try {
      if (contentType.includes('application/json')) {
        errorBody = await res.json();
      } else {
        errorBody = await res.text();
      }
    } catch (_) {
      // ignore parse errors
    }
    const err = new Error(`Request failed with status ${res.status}`);
    err.status = res.status;
    err.body = errorBody;
    throw err;
  }

  if (contentType.includes('application/json')) {
    return res.json();
  }

  return res.arrayBuffer();
}

const useComputeStore = create((set, get) => ({
  baseUrl: DEFAULT_BASE_URL,

  async fetchScriptsManifest() {
    return request('/scripts');
  },

  async parseGhToJson(payload) {
    return request('/utility/parse-gh-to-json', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async jsonToGh(payload) {
    // Returns an ArrayBuffer for the GH file; UI can turn it into a Blob/download.
    return request('/utility/json-to-gh', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async compute(path, payload) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return request(`/compute${normalized}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
}));

export default useComputeStore;
