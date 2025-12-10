// Environment-aware API base config
const RENDER_BASE = 'https://back-end-2-lwx2.onrender.com';
const LOCAL_BASE = 'http://localhost:3000';

// Override via localStorage: localStorage.setItem('apiEnv', 'prod'|'dev')
const storedEnv = (localStorage.getItem('apiEnv') || '').toLowerCase();
const isDevHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const useDev = storedEnv ? storedEnv === 'dev' : isDevHost;

export const API_CONFIG = {
  env: useDev ? 'dev' : 'prod',
  baseUrl: useDev ? LOCAL_BASE : RENDER_BASE,
  endpoints: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    me: '/api/auth/me',
    data: '/api/data',
    items: '/api/items'
  }
};

// Prevent localhost base in production host and auto-correct
if (!useDev && API_CONFIG.baseUrl.startsWith('http://localhost')) {
  console.warn('Detected production host with localhost API. Switching to Render base.');
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
    credentials: options.credentials || 'include' // remove if not using cookies/sessions
  };

  try {
    const res = await fetch(url, opts);
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      console.error('API error:', res.status, data);
      alert('Request failed: ' + (data?.message || res.statusText || 'Unknown error'));
      throw new Error(typeof data === 'string' ? data : (data?.message || 'Request failed'));
    }
    return data;
  } catch (err) {
    console.error('Network/parse error:', err);
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

// Minimal hints to toggle environment:
// localStorage.setItem('apiEnv', 'prod'); // force Render
// localStorage.setItem('apiEnv', 'dev');  // force localhost
// localStorage.removeItem('apiEnv');      // auto based on hostname
