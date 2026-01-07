// Admin login uses student login logic (no separate admin code)
/* ===========================================================
   ICES UNIVERSAL JAVASCRIPT FILE
   Author: Wongani Jiya
   Description: Handles all interactivity across the Civil Engineering Society website.
   Sections:
   1. Global Navigation
   2. Registration Page Tabs & POST
   3. Login Page Tabs & POST
   4. Innovations Page Functionality
   5. Announcements page Functionality
   =========================================================== */

// Replace static import with dynamic import to avoid "import outside module" errors

// --- Base Path Configuration ---
// Detects the base path where the site is hosted (e.g., "/ICESWEBSITE/" for GitHub Pages)
// This allows the site to work both at root ("/") and under a subdirectory
(function() {
  // Get base path from document.currentScript or infer from pathname
  const scriptPath = document.currentScript?.src || '';
  let basePath = '/';
  
  // Try to detect from GitHub Pages pattern or script location
  if (scriptPath.includes('/ICESWEBSITE/')) {
    basePath = '/ICESWEBSITE/';
  } else {
    // Infer from current pathname - look for pattern like /project-name/docs/
    const pathname = window.location.pathname;
    // Match pattern: /something/docs/... where something is not empty
    const match = pathname.match(/^(\/[^\/]+)\/docs\//);
    if (match && match[1] !== '') {
      // Only use as base if it's not just /docs (i.e., there's a project folder)
      basePath = match[1] + '/';
    }
  }
  
  // Allow manual override via meta tag: <meta name="base-path" content="/ICESWEBSITE/">
  const metaBase = document.querySelector('meta[name="base-path"]');
  if (metaBase && metaBase.content) {
    basePath = metaBase.content;
  }
  
  // Ensure basePath ends with /
  if (!basePath.endsWith('/')) basePath += '/';
  
  window.SITE_BASE_PATH = basePath;
})();

// Helper to resolve paths relative to base
function resolveUrl(path) {
  if (!path) return window.SITE_BASE_PATH || '/';
  // If path is absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const base = window.SITE_BASE_PATH || '/';
  return base + cleanPath;
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
})();
// --- End clean URL/auth guard ---

// Universal redirect helper (used for login success and auth guards)
function redirectTo(path) {
  if (!path) return;
  // Resolve path with base path
  const fullPath = resolveUrl(path);
  const normalized = fullPath.split('?')[0].split('#')[0];
  const current = window.location.pathname;
  if (current === normalized) return; // Termination condition
  window.location.replace(normalized);
}
let API, safeFetch, apiPing, API_TEST, forceProdBase, isDevLocalBase, currentBase;
(async function initApi() {
  try {
    const mod = await import('./api.js');
    API = mod.API;
    safeFetch = mod.safeFetch;
    apiPing = mod.apiPing;
    API_TEST = mod.API_TEST;
    forceProdBase = mod.forceProdBase;
    isDevLocalBase = mod.isDevLocalBase;
    currentBase = mod.currentBase;
  } catch (e) {
    console.error('Failed to load API module:', e);
    alert('Failed to initialize API module. Check console for details.');
    return;
  }

  // Startup ping to verify backend connectivity
  try {
    const ping = await apiPing();
    if (!ping.ok) {
      console.warn('Backend health check failed. Verify Render is up and CORS allows this origin.');
    }
  } catch (e) {
    console.warn('Ping error:', e);
  }

  // Ensure init runs whether DOMContentLoaded already fired or not
  function onReady(cb) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cb);
    } else {
      cb();
    }
  }

  onReady(() => {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Touch swipe support for slideshow
    const slideshowContainer = document.querySelector('.slideshow-container');
    let touchStartX = 0;
    let touchEndX = 0;
    
    function handleGesture() {
      const slides = document.getElementsByClassName('slide');
      if (!slides.length) return;
      // Use 0-based indexing consistently
      if (touchEndX < touchStartX && touchStartX - touchEndX > 50) {
        // Swipe left - next slide
        slideIndex = (slideIndex + 1) % slides.length;
      }
      if (touchEndX > touchStartX && touchEndX - touchStartX > 50) {
        // Swipe right - previous slide
        slideIndex = (slideIndex - 1 + slides.length) % slides.length;
      }
      renderSlide(slideIndex);
    }

    if (slideshowContainer) {
      slideshowContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      });

      slideshowContainer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleGesture();
      });
    }

    /* ===========================================================
       SECTION 1: GLOBAL NAVIGATION (Hamburger Menu)
       =========================================================== */
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        // Optional: accessibility
        hamburger.setAttribute('aria-expanded', navLinks.classList.contains('active'));
      });
    }

    /* ===========================================================
       SECTION 2: REGISTRATION PAGE TABS & POST
       =========================================================== */
const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://back-end-9-qudx.onrender.com";

// Robust safeFetch
async function safeFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method: options.method || "GET",
      headers: {"Content-Type": "application/json"},
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "include"
    });
  } catch (err) { throw {error: `Network error: ${err.message || err}`}; }

  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {error: 'Invalid JSON response'};
  }

  if (!res.ok) throw {...data, status: res.status};
  return data;
}

// Registration
const registrationForm = document.getElementById("registration-form");
if (registrationForm) {
  registrationForm.addEventListener("submit", async e => {
    e.preventDefault();
    const role = (document.querySelector('input[name="role"]:checked')?.value || 'student').toLowerCase();
    const payload = {
      name: document.getElementById("fullname")?.value?.trim(),
      email: document.getElementById("email")?.value?.trim(),
      password: document.getElementById("password")?.value
    };
    try {
      const endpoint = role === 'student' ? '/api/students/register' : '/api/admins/register';
      const res = await safeFetch(endpoint, {method:'POST', body:payload});
      alert(res.message || 'Registration successful');
      registrationForm.reset();
      redirectTo('docs/login.html');
    } catch (err) { alert(err.error || err.message || 'Registration failed'); }
  });
}

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const role = (document.querySelector('input[name="loginRole"]:checked')?.value || 'student').toLowerCase();
    const email = document.getElementById("email")?.value?.trim();
    const password = document.getElementById("password")?.value;
    if (!email || !password) { alert("Enter email and password"); return; }

    const endpoint = role === 'student' ? '/api/login' : '/api/admins/login';
    try {
      const data = await safeFetch(endpoint, {method:'POST', body:{email,password}});
      localStorage.setItem('userData', JSON.stringify(data));
      // Use frontend to redirect safely, no repeated ?p parameters
      if (data.role === 'admin') redirectTo('docs/admin.html');
      else if (data.role === 'student') redirectTo('docs/students.html');
      else alert('Login successful but no redirect defined.');
    } catch (err) { alert(err.error || err.message || 'Login failed'); }
  });
}

    /* ===========================================================
       SECTION 4: INNOVATIONS PAGE FUNCTIONALITY
       =========================================================== */
    const innovationCards = document.querySelectorAll(".innovation-card");
    innovationCards.forEach(card => {
      const toggleBtn = card.querySelector(".toggle-details");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          card.classList.toggle("expanded");
        });
      }
    });

    const commentForm = document.querySelector("#commentForm");
    const commentList = document.querySelector("#commentList");
    if (commentForm && commentList) {
      const savedComments = localStorage.getItem("ices_comments");
      if (savedComments) commentList.innerHTML = savedComments;

      commentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.querySelector("#name").value.trim();
        const comment = document.querySelector("#comment").value.trim();
        if (name && comment) {
          const commentItem = document.createElement("div");
          commentItem.classList.add("comment");
          commentItem.innerHTML = `<strong>${name}</strong>: ${comment}`;
          commentList.appendChild(commentItem);
          localStorage.setItem("ices_comments", commentList.innerHTML);
          commentForm.reset();
        } else alert("Please enter both your name and comment.");
      });
    }

    const uploadForm = document.querySelector("#uploadForm");
    if (uploadForm) {
      uploadForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("✅ Your innovation idea has been submitted for review. Thank you!");
        uploadForm.reset();
      });
    }

    // Executives section removed: no longer needed

    /* ===========================================================
       SECTION 6: CONTACT PAGE – SIMPLE FORM HANDLER
       Purpose: keep contact page JS centralized (no inline scripts)
       How it works:
       - Looks for #contactForm and #contactSuccess on contact.html
       - Prevents default submit, shows success message, resets form
       Notes:
       - If you change the IDs on contact.html, update the selectors here.
       - This is a placeholder; wire to backend by replacing with API call.
       =========================================================== */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      const contactSuccess = document.getElementById('contactSuccess');
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // TODO: Replace with API call (e.g., safeFetch('/api/contact', { method:'POST', body:{...} }))
        if (contactSuccess) contactSuccess.style.display = 'block';
        contactForm.reset();
      });
    }

  }); // End onReady

  // ================= Session Activity & Auto-Logout (20 min) =================
  const IDLE_LIMIT_MS = 20 * 60 * 1000; // 20 minutes
  const LAST_ACTIVITY_KEY = 'lastActivityAt';

  function markActivity() {
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    } catch (e) { /* ignore storage errors */ }
  }

  function getLastActivity() {
    const v = localStorage.getItem(LAST_ACTIVITY_KEY);
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  }



  function autoLogout(reason) {
    try { localStorage.removeItem('userData'); localStorage.removeItem(LAST_ACTIVITY_KEY); } catch (e) {}
    try { alert(reason || 'You have been logged out.'); } catch (e) {}
    redirectTo('docs/login.html');
  }

  function checkIdleLogout() {
    const userData = localStorage.getItem('userData');
    if (!userData) return; // not logged in
    const last = getLastActivity();
    if (!last) { markActivity(); return; }
    const now = Date.now();
    if (now - last >= IDLE_LIMIT_MS) {
      autoLogout('Session expired due to 20 minutes of inactivity.');
    }
  }

  // Update activity on common interactions
  ['mousemove','keydown','click','scroll','touchstart'].forEach(evt => {
    window.addEventListener(evt, markActivity, { passive: true });
  });
  // Share activity across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === LAST_ACTIVITY_KEY) { /* no-op; just keeping in sync */ }
  });
  // Initialize
  markActivity();
  // Periodic idle check
  setInterval(checkIdleLogout, 30000);

  // ===== NEW SLIDESHOW (Clean Implementation) =====
  let slideIndex = 0;
  let slideInterval;
  let activeSlides = [];

  function collectSlides() {
    const container = document.querySelector('.slideshow-container');
    if (!container) return [];
    // Only direct children to avoid accidental nesting
    return Array.from(container.children).filter(el => el.classList.contains('slide'));
  }

  function setActiveSlides(slides) {
    activeSlides = slides;
  }

  function renderSlide(index) {
    if (!activeSlides.length) return;
    activeSlides.forEach(s => s.classList.remove('active'));
    const i = ((index % activeSlides.length) + activeSlides.length) % activeSlides.length;
    activeSlides[i].classList.add('active');
  }

  function nextSlide() {
    if (activeSlides.length <= 1) return;
    slideIndex = (slideIndex + 1) % activeSlides.length;
    renderSlide(slideIndex);
  }

  async function preloadImages(slides) {
    const results = await Promise.all(slides.map(slide => new Promise(resolve => {
      const img = slide.querySelector('img');
      if (!img) return resolve({ slide, ok: false });
      if (img.complete) return resolve({ slide, ok: true });
      img.addEventListener('load', () => resolve({ slide, ok: true }), { once: true });
      img.addEventListener('error', () => resolve({ slide, ok: false }), { once: true });
    })));
    return results.filter(r => r.ok).map(r => r.slide);
  }

  async function startSlideshowClean() {
    const slides = collectSlides();
    if (!slides.length) return;

    const loadedSlides = await preloadImages(slides);
    // Fallback: if none loaded (e.g., still decoding), keep originals
    setActiveSlides(loadedSlides.length ? loadedSlides : slides);

    // If fewer than 2 slides are usable, rebuild from fallback images that exist in repo
    if (activeSlides.length < 2) {
      const container = document.querySelector('.slideshow-container');
      const fallbackPaths = [
        'images/image 9.jpg',
        'images/image 6.jpg',
        'images/image 7.jpg',
        'images/image 5.jpg',
        'images/ICES-BRAND-ID.jpg',
        'images/ices web 1.jpg'
      ];
      // Try to create slides only for images that load
      const created = await Promise.all(fallbackPaths.map(src => new Promise(resolve => {
        const probe = new Image();
        probe.onload = () => {
          const slide = document.createElement('div');
          slide.className = 'slide fade';
          const img = document.createElement('img');
          img.src = src;
          img.alt = 'Slide image';
          slide.appendChild(img);
          resolve(slide);
        };
        probe.onerror = () => resolve(null);
        probe.src = src;
      })));
      const validSlides = created.filter(Boolean);
      if (validSlides.length >= 2 && container) {
        // Replace container children with valid fallback slides
        container.innerHTML = '';
        validSlides.forEach(s => container.appendChild(s));
        setActiveSlides(validSlides);
      }
    }
    slideIndex = 0;
    renderSlide(slideIndex);
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 8000);
  }

  // Start on window load
  window.addEventListener('load', () => {
    startSlideshowClean();
    // Remove hover-pause to avoid accidental permanent pause
  });
  // ===== END NEW SLIDESHOW =====
  /* ===============Registartion form validation================= */
  function validateRegistrationForm() {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const email = document.getElementById("email").value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return false;
    }
    return true;
  }

  /*end of role registration form jac*/

  // Removed duplicate role toggler to avoid conflicts with applyRoleRequirements

  // Expose TEST_API only after API is ready (updated for code-based admin flow)
  window.TEST_API = {
    adminRegister: async ({ name, email, regNumber, year }) => {
      if (!name || !email || !regNumber || !year) {
        alert('Provide name, email, registration number, and year');
        return;
      }
      try {
        console.log('Registering admin (code flow) via /api/admins/register-code...');
        const res = await safeFetch('/api/admins/register-code', {
          method: 'POST',
          body: { name, email, regNumber, year: Number(year) || 0 }
        });
        console.log('Admin register-code response:', res);
        alert(res.message || 'Admin registration successful; code emailed');
        return res;
      } catch (err) {
        console.error('Admin registration (code) failed:', err);
        alert('Admin registration failed. See console for details.');
        throw err;
      }
    },
    adminLoginCode: async ({ regNumber, name, adminCode }) => {
      if (!regNumber || !name || !adminCode) {
        alert('Provide registration number, full name, and admin code');
        return;
      }
      try {
        console.log('Logging in admin (code flow) via /api/admins/login-code...');
        const data = await safeFetch('/api/admins/login-code', {
          method: 'POST',
          body: { regNumber, name, adminCode }
        });
        console.log('Admin login-code response:', data);

        if (data.role === 'admin') {
          const userData = {
            userId: data.userId,
            email: data.email,
            name: data.name || '',
            role: data.role,
            loginTime: new Date().toISOString()
          };
          localStorage.setItem('userData', JSON.stringify(userData));
          alert('Admin login successful');
          // window.location.href = data.redirect || 'admin.html';
        } else {
          alert(data.message || 'Login did not return admin role');
        }
        return data;
      } catch (err) {
        console.error('Admin login (code) failed:', err);
        alert('Admin login failed. See console for details.');
        throw err;
      }
    }
  };

})(); // end initApi IIFE

    /* ===========================================================
       SECTION 7: FORGOT PASSWORD PAGE FUNCTIONALITY
       Handles all logic for forgot-password.html (OTP, reset, etc.)
       =========================================================== */
    if (window.location.pathname.endsWith('forgot-password.html')) {
      // State management
      let currentStep = 1;
      let userEmail = '';
      let otpToken = '';
      let resendTimeout = null;

      // Use centralized API helper for all POSTs
      async function callApi(path, body) {
        const { safeFetch } = await import('./api.js');
        return await safeFetch(path, { method: 'POST', body });
      }

      // DOM Elements
      const emailForm = document.getElementById('emailForm');
      const otpForm = document.getElementById('otpForm');
      const resetPasswordForm = document.getElementById('resetPasswordForm');
      const messageBox = document.getElementById('messageBox');
      const otpInputs = document.querySelectorAll('.otp-input');
      const resendBtn = document.getElementById('resendOtpBtn');
      const resendTimer = document.getElementById('resendTimer');

      // Utility Functions
      function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message ${type} show`;
        setTimeout(() => {
          messageBox.classList.remove('show');
        }, 5000);
      }

      function setLoading(button, isLoading) {
        if (isLoading) {
          button.disabled = true;
          button.innerHTML += '<span class="loading"></span>';
        } else {
          button.disabled = false;
          const loading = button.querySelector('.loading');
          if (loading) loading.remove();
        }
      }

      function goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.step').forEach(s => {
          s.classList.remove('active', 'completed');
        });

        // Show current step
        document.getElementById(`step${step}`).classList.add('active');
        document.getElementById(`step${step}Indicator`).classList.add('active');

        // Mark previous steps as completed
        for (let i = 1; i < step; i++) {
          document.getElementById(`step${i}Indicator`).classList.add('completed');
        }

        currentStep = step;
      }

      function startResendTimer() {
        let timeLeft = 60;
        resendBtn.disabled = true;
        resendTimeout = setInterval(() => {
          timeLeft--;
          resendTimer.textContent = `(${timeLeft}s)`;
          if (timeLeft <= 0) {
            clearInterval(resendTimeout);
            resendBtn.disabled = false;
            resendTimer.textContent = '';
          }
        }, 1000);
      }

      // OTP Input Handler
      otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
          if (e.target.value.length === 1) {
            if (index < otpInputs.length - 1) {
              otpInputs[index + 1].focus();
            }
          }
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
          }
        });
        // Allow paste
        input.addEventListener('paste', (e) => {
          e.preventDefault();
          const pastedData = e.clipboardData.getData('text').slice(0, 6);
          pastedData.split('').forEach((char, i) => {
            if (otpInputs[i]) {
              otpInputs[i].value = char;
            }
          });
          if (pastedData.length === 6) {
            otpInputs[5].focus();
          }
        });
      });

      // Password Validation
      const newPasswordInput = document.getElementById('newPassword');
      newPasswordInput?.addEventListener('input', (e) => {
        const password = e.target.value;
        document.getElementById('req-length').classList.toggle('valid', password.length >= 6);
        document.getElementById('req-uppercase').classList.toggle('valid', /[A-Z]/.test(password));
        document.getElementById('req-lowercase').classList.toggle('valid', /[a-z]/.test(password));
        document.getElementById('req-number').classList.toggle('valid', /[0-9]/.test(password));
      });

      // Step 1: Send OTP
      emailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const sendBtn = document.getElementById('sendOtpBtn');
        setLoading(sendBtn, true);
        try {
          const data = await callApi('/password-reset/request-otp', { email });
          userEmail = email;
          document.getElementById('emailDisplay').textContent = email;
          showMessage(data.message || 'OTP sent successfully', 'success');
          goToStep(2);
          startResendTimer();
          otpInputs[0].focus();
        } catch (error) {
          showMessage(error?.message || 'Network error. Please try again.', 'error');
        } finally {
          setLoading(sendBtn, false);
        }
      });

      // Resend OTP
      resendBtn?.addEventListener('click', async () => {
        setLoading(resendBtn, true);
        try {
          await callApi('/password-reset/request-otp', { email: userEmail });
          showMessage('OTP resent successfully!', 'success');
          startResendTimer();
          otpInputs.forEach(input => input.value = '');
          otpInputs[0].focus();
        } catch (error) {
          showMessage(error?.message || 'Network error. Please try again.', 'error');
        } finally {
          setLoading(resendBtn, false);
        }
      });

      // Step 2: Verify OTP
      otpForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        const verifyBtn = document.getElementById('verifyOtpBtn');
        if (otp.length !== 6) {
          showMessage('Please enter all 6 digits', 'error');
          return;
        }
        setLoading(verifyBtn, true);
        try {
          const data = await callApi('/password-reset/verify-otp', { email: userEmail, otp });
          otpToken = data.resetToken;
          showMessage('OTP verified successfully!', 'success');
          goToStep(3);
          clearInterval(resendTimeout);
        } catch (error) {
          showMessage(error?.message || 'Invalid OTP', 'error');
          otpInputs.forEach(input => input.value = '');
          otpInputs[0].focus();
        } finally {
          setLoading(verifyBtn, false);
        }
      });

      // Step 3: Reset Password
      resetPasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const resetBtn = document.getElementById('resetPasswordBtn');
        // Validation
        if (newPassword.length < 6) {
          showMessage('Password must be at least 6 characters', 'error');
          return;
        }
        if (newPassword !== confirmPassword) {
          showMessage('Passwords do not match', 'error');
          return;
        }
        setLoading(resetBtn, true);
        try {
          await callApi('/password-reset/reset-password', { resetToken: otpToken, newPassword });
          showMessage('Password reset successfully! Redirecting to login...', 'success');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        } catch (error) {
          showMessage(error?.message || 'Failed to reset password', 'error');
        } finally {
          setLoading(resetBtn, false);
        }
      });
    }
// --- Unified Login Functions ---
async function studentLogin(email, password) {
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    let data = {};
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = {}; }
    }
    if (res.ok && data.redirect) {
      window.location.replace(data.redirect);
    } else {
      alert(data.error || "Login failed. Check credentials.");
    }
  } catch (err) {
    console.error("Student login error:", err);
    alert("An unexpected error occurred.");
  }
}