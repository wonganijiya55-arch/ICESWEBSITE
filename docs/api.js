// Environment-aware API base config
// <-- UPDATED backend Render URL -->
const RENDER_BASE = 'https://back-end-5-t3cv.onrender.com';
const LOCAL_BASE = 'http://localhost:3000';

// Override via localStorage: localStorage.setItem('apiEnv', 'prod'|'dev')
// Optional manual override: localStorage.setItem('apiBaseOverride', 'https://...') will be honored
const storedEnv = (localStorage.getItem('apiEnv') || '').toLowerCase();
// Default to production unless explicitly forced via localStorage
const useDev = storedEnv === 'dev';

export const API_CONFIG = {
  env: useDev ? 'dev' : 'prod',
  baseUrl: (localStorage.getItem('apiBaseOverride') || (useDev ? LOCAL_BASE : RENDER_BASE)),
  endpoints: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    me: '/api/auth/me',
    data: '/api/data',
    items: '/api/items'
  },
  // request timeout in ms
  timeout: 15000
};

// Small helper to allow runtime base switching for quick debugging
export function setApiBase(newBase) {
  if (!newBase) return;
  API_CONFIG.baseUrl = newBase.replace(/\/+$/, ''); // strip trailing slash
  console.info('[API] base set to', API_CONFIG.baseUrl);
}

// Log current API base/env at startup for visibility
(function logApiBase() {
  const tag = `[API] base=${API_CONFIG.baseUrl} env=${API_CONFIG.env}`;
  console.info(tag, API_CONFIG.endpoints);
})();

// Guard/validation: do not throw (non-fatal), but warn so developer can correct
function validateRequestPath(path) {
  const isAbsolute = /^https?:\/\//i.test(path);
  if (isAbsolute && !path.startsWith(API_CONFIG.baseUrl)) {
    console.warn('Request to an absolute host that does not match API base:', path, 'Expected base:', API_CONFIG.baseUrl);
  }
}

// Minimal timeout wrapper for fetch
function fetchWithTimeout(resource, options = {}) {
  const { timeout = API_CONFIG.timeout } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const opts = { ...options, signal: controller.signal };
  return fetch(resource, opts).finally(() => clearTimeout(id));
}

// Helper: determine default credentials behavior
function defaultCredentialsForBase(baseUrl) {
  try {
    const baseOrigin = new URL(baseUrl).origin;
    return baseOrigin === location.origin ? 'include' : 'omit';
  } catch (e) {
    return 'omit';
  }
}

// Helper: safe JSON fetch with headers and error handling
export async function safeFetch(path, options = {}) {
  validateRequestPath(path);
  const url = /^https?:\/\//i.test(path) ? path : (API_CONFIG.baseUrl.replace(/\/+$/, '') + path);
  const creds = options.credentials ?? defaultCredentialsForBase(API_CONFIG.baseUrl);

  const opts = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: creds
  };

  try {
    const res = await fetchWithTimeout(url, opts);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = typeof data === 'string' ? data : (data?.message || data?.error || res.statusText);
      console.error('API error:', { url, status: res.status, msg, data });
      throw new Error(msg || `HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('Fetch timeout:', url);
      throw new Error('Request timeout');
    }
    console.error('Network/parse error:', { path, err });
    throw err;
  }
}

// Guard: scan all forms for invalid action hosts but do not auto-block with alerts
function scanAndGuardForms() {
  if (typeof document === 'undefined') return;
  const forms = Array.from(document.forms || []);
  forms.forEach((form) => {
    const action = (form.getAttribute('action') || '').trim();
    if (!action) return;

    const isAbsolute = /^https?:\/\//i.test(action);
    const wrongLocalhostInProd = !useDev && action.includes('localhost');
    const wrongBase = isAbsolute && !action.startsWith(API_CONFIG.baseUrl);

    if (wrongLocalhostInProd || wrongBase) {
      console.warn('Form action unusual or non-matching API base:', action, 'Expected base:', API_CONFIG.baseUrl);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.warn('Blocked form submission to a non-matching host. Inspect and correct the `action` attribute or use JS API helpers.');
      });
      try {
        const url = new URL(action);
        if (API_CONFIG.endpoints && Object.values(API_CONFIG.endpoints).some(ep => url.pathname.startsWith(ep.split('/')[1] || ''))) {
          form.setAttribute('action', API_CONFIG.baseUrl + url.pathname + url.search);
          console.info('Form action corrected to:', form.getAttribute('action'));
        }
      } catch {
        // ignore
      }
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', scanAndGuardForms);
}

// Sample API calls for reuse
export const API = {
  async registerUser(payload) {
    return await safeFetch(API_CONFIG.endpoints.register, { method: 'POST', body: payload });
  },
  async loginUser(payload) {
    return await safeFetch(API_CONFIG.endpoints.login, { method: 'POST', body: payload });
  },
  async fetchMe() {
    return await safeFetch(API_CONFIG.endpoints.me, { method: 'GET' });
  },
  async fetchData() {
    return await safeFetch(API_CONFIG.endpoints.data, { method: 'GET' });
  },
  async getItems() {
    return await safeFetch(API_CONFIG.endpoints.items, { method: 'GET' });
  },
  async getItem(id) {
    return await safeFetch(`${API_CONFIG.endpoints.items}/${id}`, { method: 'GET' });
  },
  async createItem(item) {
    return await safeFetch(API_CONFIG.endpoints.items, { method: 'POST', body: item });
  },
  async updateItem(id, updates) {
    return await safeFetch(`${API_CONFIG.endpoints.items}/${id}`, { method: 'PUT', body: updates });
  },
  async deleteItem(id) {
    return await safeFetch(`${API_CONFIG.endpoints.items}/${id}`, { method: 'DELETE' });
  }
};

// Health check and diagnostics (tries common paths)
export async function apiPing() {
  try {
    const healthPaths = ['/health', '/api/health', '/api/status'];
    for (const hp of healthPaths) {
      try {
        const res = await safeFetch(hp, { method: 'GET' });
        console.info('[API] health OK at', hp, res);
        return { ok: true, pathTried: hp, res };
      } catch (e) {
        // try next
      }
    }
    console.warn('[API] health endpoints not responding');
    return { ok: false };
  } catch (e) {
    console.error('[API] ping error:', e);
    return { ok: false, error: e.message };
  }
};

// Endpoint testers
export const API_TEST = {
  async tryAdminRegister(payload) {
    const candidates = ['/api/admins/register', '/api/auth/admin/register'];
    for (const ep of candidates) {
      try {
        console.log('[TEST] admin register via', ep);
        const res = await safeFetch(ep, { method: 'POST', body: payload });
        return { ok: true, endpoint: ep, res };
      } catch (e) {
        console.warn('[TEST] failed', ep, e.message);
      }
    }
    throw new Error('All admin register endpoints failed');
  },
  async tryLogin(email, password) {
    const candidates = [API_CONFIG.endpoints.login, '/api/login', '/api/auth/login'];
    for (const ep of candidates) {
      try {
        console.log('[TEST] login via', ep);
        const res = await safeFetch(ep, { method: 'POST', body: { email, password } });
        return { ok: true, endpoint: ep, res };
      } catch (e) {
        console.warn('[TEST] failed', ep, e.message);
      }
    }
    throw new Error('All login endpoints failed');
  }
};