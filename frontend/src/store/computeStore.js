import { create } from 'zustand';

const DEFAULT_BASE_URL = process.env.REACT_APP_COMPUTE_GATEWAY_URL || 'http://localhost:4001';

async function request(path, options = {}) {
  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}${path}`;
  const fetchOptions = { ...options };
  const skipContentType = fetchOptions.skipContentType;
  const optionHeaders = fetchOptions.headers;
  delete fetchOptions.headers;
  delete fetchOptions.skipContentType;

  const headers = { ...(optionHeaders || {}) };
  if (!skipContentType && !headers['Content-Type'] && typeof fetchOptions.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    headers,
    ...fetchOptions,
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

  async parseGhToJson(payload) {
    return request('/gh-to-json', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async jsonToGh(payload) {
    // Returns an ArrayBuffer for the GH file; UI can turn it into a Blob/download.
    return request('/json-to-gh', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async fetchVersion() {
    return request('/version');
  },

  async fetchHealth() {
    return request('/health/alive');
  },

  async runTestScript(payload = {}) {
    return request('/test-script', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
}));

export default useComputeStore;
