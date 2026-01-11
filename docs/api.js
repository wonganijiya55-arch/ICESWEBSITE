// Environment-aware API base config
// <-- UPDATED backend Render URL -->
const RENDER_BASE = 'https://back-end-11-uvgh.onrender.com';
const LOCAL_BASE = 'http://localhost:5000';

// Override via localStorage:
// - localStorage.setItem('apiEnv', 'dev') to force localhost dev
// - localStorage.setItem('apiEnv', 'prod') to force production base
// Optional: localStorage.setItem('apiBaseOverride', 'https://...') to hard override base
const storedEnv = (localStorage.getItem('apiEnv') || '').toLowerCase();
// IMPORTANT: Default to prod even on localhost unless explicitly forced via apiEnv='dev'
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

// Helpers to inspect/switch environment programmatically
export function isDevLocalBase() {
  try {
    const base = API_CONFIG.baseUrl;
    return API_CONFIG.env === 'dev' && /localhost|127\.0\.0\.1/.test(new URL(base).hostname);
  } catch { return false; }
}

export function forceProdBase() {
  API_CONFIG.env = 'prod';
  API_CONFIG.baseUrl = RENDER_BASE;
  console.info('[API] forced prod base:', API_CONFIG.baseUrl);
}

export function currentBase() {
  return API_CONFIG.baseUrl;
}

// Token storage helpers
/**
 * Save JWT authentication token to localStorage
 * @param {string} token - JWT token from successful login
 */
export function saveToken(token) {
  if (token) localStorage.setItem('authToken', token);
}

/**
 * Retrieve JWT authentication token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export function getToken() {
  return localStorage.getItem('authToken');
}

/**
 * Clear JWT authentication token from localStorage
 */
export function clearToken() {
  localStorage.removeItem('authToken');
}

// Log current API base/env at startup for visibility
(function logApiBase() {
  const tag = `[API] base=${API_CONFIG.baseUrl} env=${API_CONFIG.env}`;
  console.info(tag, API_CONFIG.endpoints);
})();

// If in dev and local API seems down, auto-fallback to Render base
(async function autoFallbackDevBase() {
  try {
    if (API_CONFIG.env !== 'dev') return;
    const probeUrl = API_CONFIG.baseUrl.replace(/\/+$/, '') + '/health';
    const res = await fetch(probeUrl, { method: 'GET' });
    if (!res.ok) throw new Error('health not ok');
    console.info('[API] dev health OK at', probeUrl);
  } catch (e) {
    console.warn('[API] local dev API unreachable, switching to Render base');
    API_CONFIG.baseUrl = RENDER_BASE;
    console.info('[API] base now', API_CONFIG.baseUrl);
  }
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

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Add JWT token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const opts = {
    method: options.method || 'GET',
    headers: headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: creds
  };

  try {
    const res = await fetchWithTimeout(url, opts);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      // Handle expired/invalid token
      if (res.status === 401 || res.status === 403) {
        clearToken();
        localStorage.removeItem('userData');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
          window.location.href = 'login.html';
        }
      }
      const msg = typeof data === 'string' ? data : (data?.message || data?.error || res.statusText);
      console.error('API error:', { url, status: res.status, msg, data });
      const err = new Error(msg || `HTTP ${res.status}`);
      err.data = data;
      err.status = res.status;
      throw err;
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

// Endpoint testers (kept for student login compatibility)
export const API_TEST = {
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
  },
  async tryLoginVariants(identifier, password) {
    const endpoints = [API_CONFIG.endpoints.login, '/api/login', '/api/auth/login', '/api/admins/login', '/api/students/login'];
    const payloads = [
      { email: identifier, password },
      { username: identifier, password },
      { identifier, password },
    ];
    for (const ep of endpoints) {
      for (const body of payloads) {
        try {
          console.log('[TEST] login via', ep, 'with keys', Object.keys(body));
          const res = await safeFetch(ep, { method: 'POST', body });
          return { ok: true, endpoint: ep, payloadKeys: Object.keys(body), res };
        } catch (e) {
          console.warn('[TEST] failed', ep, 'keys', Object.keys(body), e.message);
        }
      }
    }
    throw new Error('All login endpoint/payload variants failed');
  }
};