/**
 * loggedin.js – Frontend-only authentication & session guard
 */

// --- Base Path Configuration ---
// Must match the configuration in index.js
(function() {
  if (window.SITE_BASE_PATH) return; // Already configured
  
  const scriptPath = document.currentScript?.src || '';
  let basePath = '/';
  
  if (scriptPath.includes('/ICESWEBSITE/')) {
    basePath = '/ICESWEBSITE/';
  } else {
    const pathname = window.location.pathname;
    // Match pattern: /something/docs/... where something is not empty
    const match = pathname.match(/^(\/[^\/]+)\/docs\//);
    if (match && match[1] !== '') {
      basePath = match[1] + '/';
    }
  }
  
  const metaBase = document.querySelector('meta[name="base-path"]');
  if (metaBase && metaBase.content) {
    basePath = metaBase.content;
  }
  
  if (!basePath.endsWith('/')) basePath += '/';
  window.SITE_BASE_PATH = basePath;
})();

function resolveUrl(path) {
  if (!path) return window.SITE_BASE_PATH || '/';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const base = window.SITE_BASE_PATH || '/';
  return base + cleanPath;
}

// Resolve page paths so they work whether /docs/ is part of the URL or not
function resolvePage(path) {
  if (!path) return resolveUrl('');
  const hasDocsInPath = window.location.pathname.includes('/docs/');
  const clean = path.startsWith('/') ? path.slice(1) : path;
  const normalized = hasDocsInPath
    ? (clean.startsWith('docs/') ? clean : `docs/${clean}`)
    : (clean.startsWith('docs/') ? clean.replace(/^docs\//, '') : clean);
  return resolveUrl(normalized);
}

function redirectToPage(pagePath) {
  const target = resolvePage(pagePath);
  redirectTo(target);
}

// --- Clean URL and robust auth guard ---
(function() {
  function cleanUrlOnce() {
    const url = new URL(window.location.href);
    if (url.searchParams.has('p')) {
      url.searchParams.delete('p');
      window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash);
    }
  }
  cleanUrlOnce();

  function redirectCleanly(path) {
    if (!path) return;
    const fullPath = resolvePage(path);
    const normalized = fullPath.split('?')[0].split('#')[0];
    if (window.location.pathname === normalized) return;
    window.location.replace(normalized);
  }

  const raw = localStorage.getItem('userData');
  let userData = null;
  try {
    userData = raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to parse userData:', e);
    userData = null;
  }

  if (!userData) {
    redirectCleanly('login.html');
  } else {
    const current = window.location.pathname;
    const adminPath = resolvePage('admin.html');
    const studentsPath = resolvePage('students.html');
    if (current === adminPath && userData.role !== 'admin') {
      localStorage.removeItem('userData');
      redirectCleanly('login.html');
    }
    if (current === studentsPath && userData.role !== 'student') {
      localStorage.removeItem('userData');
      redirectCleanly('login.html');
    }
  }
})();
// --- End clean URL/auth guard ---

function redirectTo(path) {
  if (!path) return;
  const fullPath = resolveUrl(path);
  const normalized = fullPath.split('?')[0].split('#')[0];
  if (window.location.pathname === normalized) return;
  window.location.replace(normalized);
}

(function() {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function() {

    // ------------------ Helpers ------------------
    const THEME_KEY = 'ices_theme_pref_v1';
    const LAST_ACTIVITY_KEY = 'lastActivityAt';
    const IDLE_LIMIT_MS = 20 * 60 * 1000; // 20 min

    function getUserData() {
      try {
        const raw = localStorage.getItem('userData');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    function saveLastActivity() {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now());
    }

    function checkIdleLogout() {
      const user = getUserData();
      if (!user) return;
      const last = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      if (Date.now() - last >= IDLE_LIMIT_MS) {
        alert('Session expired due to inactivity.');
        localStorage.removeItem('userData');
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        redirectToPage('login.html');
      }
    }

    function applyTheme(theme) {
      const html = document.documentElement;
      if (theme === 'dark') html.setAttribute('data-theme', 'dark');
      else html.removeAttribute('data-theme');
      updateThemeToggleUI(theme);
    }

    function updateThemeToggleUI(theme) {
      const btn = document.getElementById('themeToggleBtn');
      if (!btn) return;
      const icon = btn.querySelector('i');
      const label = btn.querySelector('.label');
      if (!icon || !label) return;
      if (theme === 'dark') {
        icon.className = 'fas fa-moon';
        label.textContent = 'Dark';
        btn.title = 'Switch to light theme';
      } else {
        icon.className = 'fas fa-sun';
        label.textContent = 'Light';
        btn.title = 'Switch to dark theme';
      }
    }

    function initTheme() {
      let theme = localStorage.getItem(THEME_KEY);
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      applyTheme(theme);
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    }

    function handleLogout() {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken'); // Clear JWT token
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        redirectToPage('login.html');
      }
    }

    // ------------------ Authentication Guard ------------------
    function checkAuthentication() {
      const user = getUserData();
      const currentPath = window.location.pathname.toLowerCase();
      const adminPages = [
        resolvePage('admin.html').toLowerCase(),
        resolvePage('paymentsdata.html').toLowerCase(),
        resolvePage('studentrecords.html').toLowerCase(),
        resolvePage('updatevents.html').toLowerCase(),
        resolvePage('admin-profile.html').toLowerCase()
      ];
      const studentPages = [
        resolvePage('students.html').toLowerCase(),
        resolvePage('student-events.html').toLowerCase(),
        resolvePage('student-payments.html').toLowerCase(),
        resolvePage('student-support.html').toLowerCase(),
        resolvePage('profile.html').toLowerCase()
      ];

      if (!user) {
        alert('Please login to access this page.');
        redirectToPage('login.html');
        return false;
      }

      if (adminPages.includes(currentPath) && user.role !== 'admin') {
        alert('Access denied. Admins only.');
        localStorage.removeItem('userData');
        redirectToPage('login.html');
        return false;
      }

      if (studentPages.includes(currentPath) && user.role !== 'student') {
        alert('Access denied. Students only.');
        localStorage.removeItem('userData');
        redirectTo('docs/login.html');
        return false;
      }

      const userNameEl = document.getElementById('userName');
      if (userNameEl) {
        userNameEl.textContent = user.name || user.username || (user.email ? user.email.split('@')[0] : 'User');
      }

      return true;
    }

    // ------------------ Init ------------------
    checkAuthentication();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    window.addEventListener('storage', (e) => {
      if (e.key === 'userData' && !e.newValue) redirectToPage('login.html');
      if (e.key === THEME_KEY && e.newValue) applyTheme(e.newValue);
    });

    ['mousemove','keydown','click','scroll','touchstart'].forEach(evt => window.addEventListener(evt, saveLastActivity, {passive:true}));
    saveLastActivity();
    setInterval(checkIdleLogout, 30000);

    initTheme();
  });
})();
