// Environment-aware API base config
const RENDER_BASE = 'https://back-end-2-lwx2.onrender.com';
const LOCAL_BASE = 'http://localhost:3000';

// Resolve environment: prefer URL query, then localStorage, default to 'prod'
function resolveEnv() {
  try {
    const params = new URLSearchParams(location.search);
    const qEnv = (params.get('apiEnv') || '').toLowerCase();
    if (qEnv === 'dev' || qEnv === 'prod') return qEnv;
  } catch {}
  const storedEnv = (localStorage.getItem('apiEnv') || '').toLowerCase();
  if (storedEnv === 'dev' || storedEnv === 'prod') return storedEnv;
  return 'prod';
}

let ENV = resolveEnv();

export const API_CONFIG = {
  env: ENV,
  baseUrl: ENV === 'dev' ? LOCAL_BASE : RENDER_BASE,
  endpoints: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    me: '/api/auth/me',
    data: '/api/data',
    items: '/api/items'
  }
};

// Log current API base/env at startup for visibility
(function logApiBase() {
  const tag = `[API] base=${API_CONFIG.baseUrl} env=${API_CONFIG.env}`;
  console.info(tag, API_CONFIG.endpoints);
})();

// Prevent localhost base in production host and auto-correct
if (API_CONFIG.env === 'prod' && API_CONFIG.baseUrl.startsWith('http://localhost')) {
  console.warn('Detected prod env with localhost API. Switching to Render base.');
  API_CONFIG.baseUrl = RENDER_BASE;
  API_CONFIG.env = 'prod';
}

// Validate request path/base to avoid wrong API hosts
function validateRequestPath(path) {
  // If path is absolute, ensure it matches our base
  const isAbsolute = /^https?:\/\//i.test(path);
  if (isAbsolute && !path.startsWith(API_CONFIG.baseUrl)) {
    console.error('Blocked request to mismatched API host:', path, 'Expected base:', API_CONFIG.baseUrl);
    alert('Blocked request to wrong API host.\nPlease use API helpers or relative endpoint paths.');
    throw new Error('Disallowed cross-base URL: ' + path);
  }
}

// Helper: safe JSON fetch with headers and error handling
export async function safeFetch(path, options = {}) {
  validateRequestPath(path);
  const url = /^https?:\/\//i.test(path) ? path : (API_CONFIG.baseUrl + path);
  const opts = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: options.credentials || 'include'
  };

  try {
    const res = await fetch(url, opts);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = typeof data === 'string' ? data : (data?.message || data?.error || res.statusText);
      console.error('API error:', { url, status: res.status, msg, data });
      alert(`Request failed [${res.status}]: ${msg || 'Unknown error'}`);
      throw new Error(msg || `HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error('Network/parse error:', { path, err });
    alert('Network error: ' + err.message);
    throw err;
  }
}

// Guard: scan all forms for invalid action hosts and prevent wrong submissions
function scanAndGuardForms() {
  if (typeof document === 'undefined') return;
  const forms = Array.from(document.forms || []);
  forms.forEach((form) => {
    const action = (form.getAttribute('action') || '').trim();
    if (!action) return; // no action -> likely handled via JS

    const isAbsolute = /^https?:\/\//i.test(action);
    const wrongLocalhostInProd = !useDev && action.includes('localhost');
    const wrongBase = isAbsolute && !action.startsWith(API_CONFIG.baseUrl);

    if (wrongLocalhostInProd || wrongBase) {
      console.warn('Form action blocked:', action, 'Expected base:', API_CONFIG.baseUrl);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Form submission blocked: wrong API host.\nPlease update to use API helpers or relative paths.');
      });
      // Optional: auto-fix by stripping host when it matches known endpoints
      try {
        const url = new URL(action);
        form.setAttribute('action', API_CONFIG.baseUrl + url.pathname + url.search);
        console.info('Form action corrected to:', form.getAttribute('action'));
      } catch {
        // If not a valid URL, leave as-is but keep the guard
      }
    }
  });
}

// Auto-enable guards on page load
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

// Health check and diagnostics
export async function apiPing() {
  try {
    // Try common health endpoints; adjust if your backend differs
    const healthPaths = ['/health', '/api/health', '/api/status'];
    for (const hp of healthPaths) {
      try {
        const res = await safeFetch(hp, { method: 'GET' });
        console.info('[API] health OK at', hp, res);
        return { ok: true, pathTried: hp, res };
      } catch {
        // try next
      }
    }
    console.warn('[API] health endpoints not responding');
    return { ok: false };
  } catch (e) {
    console.error('[API] ping error:', e);
    return { ok: false, error: e.message };
  }
}

// Endpoint testers to help verify backend wiring
export const API_TEST = {
  async tryAdminRegister(payload) {
    // Tries both unified and admin-specific routes
    const candidates = [
      '/api/admins/register',
      '/api/auth/admin/register'
    ];
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
    const candidates = [
      API_CONFIG.endpoints.login,
      '/api/login',
      '/api/auth/login'
    ];
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

// Minimal hints to toggle environment:
// localStorage.setItem('apiEnv', 'prod'); // force Render
// localStorage.setItem('apiEnv', 'dev');  // force localhost
// localStorage.removeItem('apiEnv');      // auto based on hostname
