/* ===========================================================
   ICES UNIVERSAL JAVASCRIPT FILE
   Author: Wongani Jiya
   Description: Handles all interactivity across the Civil Engineering Society website.
   Sections:
   1. Global Navigation
   2. Registration Page Tabs & POST
   3. Login Page Tabs & POST
   4. Innovations Page Functionality
   5. Executives Page Functionality
   =========================================================== */

// Replace static import with dynamic import to avoid "import outside module" errors
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
    const studentTab = document.getElementById('studentTab');
    const adminTab = document.getElementById('adminTab');
    const studentForm = document.getElementById('studentForm');
    const adminForm = document.getElementById('adminForm');

    // Tab switching
    if (studentTab && adminTab && studentForm && adminForm) {
      studentTab.addEventListener('click', () => {
        studentTab.classList.add('active');
        adminTab.classList.remove('active');
        studentForm.classList.add('active');
        adminForm.classList.remove('active');
      });

      adminTab.addEventListener('click', () => {
        adminTab.classList.add('active');
        studentTab.classList.remove('active');
        adminForm.classList.add('active');
        studentForm.classList.remove('active');
      });

      // Hide tab buttons on large screens
      function handleTabVisibility() {
        const tabButtons = document.querySelector('.tab-buttons');
        if (!tabButtons) return;
        tabButtons.style.display = (window.innerWidth >= 992) ? 'none' : 'flex';
      }
      window.addEventListener('load', handleTabVisibility);
      window.addEventListener('resize', handleTabVisibility);
    }

    // ================= Registration POST (Student) =================
    if (studentForm) {
      studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          name: studentForm.fullName?.value || '',
          email: studentForm.email?.value || '',
          password: studentForm.password?.value || '',
          year: parseInt(studentForm.yearOfStudy?.value || '0', 10)
        };
        try {
          const result = await API.registerUser(payload);
          alert(result.message || 'Registration successful!');
          studentForm.reset();
        } catch (err) {
          console.error(err);
          alert('Error registering. Check console.');
        }
      });
    }

    // ================= Registration POST (Unified form on register.html) =================
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
      // Disable native validation to avoid "not focusable" errors for hidden fields
      registrationForm.setAttribute('novalidate', 'true');

      // Toggle required attributes based on role selection
      const roleRadios = document.querySelectorAll('input[name="role"]');
      const studentFields = document.getElementById('student-fields');
      const adminFields = document.getElementById('admin-fields');
      const yearInput = document.getElementById('year');
      const regNumberInput = document.getElementById('regnumber');
      const passwordInput = document.getElementById('password');
      const passwordLabel = document.getElementById('password-label');

      // Utility: toggle required/disabled for all inputs in a container
      function setInputsState(container, { required, disabled }) {
        if (!container) return;
        const controls = container.querySelectorAll('input, select, textarea');
        controls.forEach(ctrl => {
          ctrl.required = !!required;
          ctrl.disabled = !!disabled;
        });
      }

      function applyRoleRequirements(role) {
        const isStudent = role === 'student';
        // Show/hide sections
        if (studentFields) studentFields.style.display = isStudent ? 'block' : 'none';
        if (adminFields) adminFields.style.display = !isStudent ? 'block' : 'none';

        // Enable visible section, disable hidden section
        setInputsState(studentFields, { required: isStudent, disabled: !isStudent });
        setInputsState(adminFields,   { required: !isStudent, disabled: isStudent });

        // Explicitly handle known fields
        if (yearInput) { yearInput.required = true; yearInput.disabled = false; }
        if (regNumberInput) { regNumberInput.required = true; regNumberInput.disabled = false; }
        // Admins don't use password; students do
        if (passwordInput && passwordLabel) {
          if (isStudent) {
            passwordInput.required = true;
            passwordInput.disabled = false;
            passwordInput.style.display = '';
            passwordLabel.style.display = '';
          } else {
            passwordInput.required = false;
            passwordInput.disabled = true;
            passwordInput.style.display = 'none';
            passwordLabel.style.display = 'none';
          }
        }
      }

      // Initialize on load based on selected role
      const initialRole = (document.querySelector('input[name="role"]:checked')?.value || 'student').toLowerCase();
      applyRoleRequirements(initialRole);

      roleRadios.forEach(radio => {
        radio.addEventListener('change', () => applyRoleRequirements(radio.value.toLowerCase()));
      });

      /* === Updated registration form submit handler (replace the existing handler block) === */
      registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const role = (document.querySelector('input[name="role"]:checked')?.value || 'student').toLowerCase();
        const fullName = document.getElementById('fullname')?.value?.trim() || '';
        const email = document.getElementById('email')?.value?.trim() || '';
        const password = document.getElementById('password')?.value || '';

        try {
          let endpoint = '';
          let payload = {};

          if (role === 'student') {
            const yearRaw = (document.getElementById('year')?.value || '0');
            const year = parseInt(yearRaw, 10);
            endpoint = '/api/students/register';
            payload = { name: fullName, email, password, year };
          } else {
            const regNumber = regNumberInput?.value?.trim() || '';
            const yearRaw = (yearInput?.value || '0');
            const year = parseInt(yearRaw, 10);
            if (!regNumber || !year) {
              alert('Please provide registration number and year of study');
              return;
            }
            // Use canonical backend keys: name, email, regNumber, year
            endpoint = '/api/admins/register-code';
            payload = { name: fullName, email, regNumber, year };
          }

          // Find submit button and set busy state
          const submitBtn = registrationForm.querySelector('button[type="submit"]') || document.querySelector('#registrationSubmit');
          const prevBtnText = submitBtn ? (submitBtn.textContent || submitBtn.innerText) : null;
          if (submitBtn) {
            submitBtn.disabled = true;
            try { submitBtn.textContent = 'Registering...'; } catch (e) { /* ignore DOM write errors */ }
          }

          // Call the appropriate endpoint with canonical payload
          let result = await safeFetch(endpoint, { method: 'POST', body: payload });

          alert(result.message || (role === 'admin' ? 'Registration successful! Admin code sent to your email.' : 'Registration successful!'));
          registrationForm.reset();
          // Reapply role requirements after reset
          applyRoleRequirements((document.querySelector('input[name="role"]:checked')?.value || 'student').toLowerCase());

          if (confirm('Registration successful! Click OK to proceed to login page.')) {
            window.location.href = 'login.html';
          }
        } catch (err) {
          console.error(err);
          // Prefer server-side validation messages if present
          const serverErrors = err?.data?.errors || err?.errors || err?.response?.errors;
          if (serverErrors && serverErrors.length) {
            alert(serverErrors[0].msg || JSON.stringify(serverErrors));
          } else if (err?.message) {
            alert(err.message);
          } else {
            alert('Error registering. Check console.');
          }
        } finally {
          // Restore submit button state
          const submitBtn = registrationForm.querySelector('button[type="submit"]') || document.querySelector('#registrationSubmit');
          if (submitBtn) {
            submitBtn.disabled = false;
            try {
              if (typeof prevBtnText !== 'undefined' && prevBtnText !== null) submitBtn.textContent = prevBtnText;
            } catch (e) { /* ignore */ }
          }
        }
      });
      /* === End updated handler === */
    }

    // ================= Unified Login =================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      // Role toggle for login
      const loginRoleRadios = document.querySelectorAll('input[name="loginRole"]');
      const studentLoginFields = document.getElementById('student-login-fields');
      const adminLoginFields = document.getElementById('admin-login-fields');
      function applyLoginRole(role){
        const isStudent = role === 'student';
        if (studentLoginFields) studentLoginFields.style.display = isStudent ? 'block' : 'none';
        if (adminLoginFields) adminLoginFields.style.display = isStudent ? 'none' : 'block';
        // Required toggles
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const loginFullname = document.getElementById('loginFullname');
        const loginRegNumber = document.getElementById('loginRegNumber');
        const loginAdminCode = document.getElementById('loginAdminCode');
        if (email) email.required = isStudent;
        if (password) password.required = isStudent;
        if (loginFullname) loginFullname.required = !isStudent;
        if (loginRegNumber) loginRegNumber.required = !isStudent;
        if (loginAdminCode) loginAdminCode.required = !isStudent;
      }
      const initialLoginRole = (document.querySelector('input[name="loginRole"]:checked')?.value || 'student').toLowerCase();
      applyLoginRole(initialLoginRole);
      loginRoleRadios.forEach(r => r.addEventListener('change', () => applyLoginRole(r.value.toLowerCase())));

      // Request Admin Code button logic
      const requestAdminCodeBtn = document.getElementById('requestAdminCodeBtn');
      if (requestAdminCodeBtn) {
        // Update button visibility based on role
        function updateRequestCodeBtnVisibility(role) {
          requestAdminCodeBtn.style.display = (role === 'admin') ? 'block' : 'none';
        }
        updateRequestCodeBtnVisibility(initialLoginRole);
        loginRoleRadios.forEach(r => r.addEventListener('change', () => updateRequestCodeBtnVisibility(r.value.toLowerCase())));

        // Handle button click
        requestAdminCodeBtn.addEventListener('click', async () => {
          const name = document.getElementById('loginFullname')?.value?.trim();
          const regNumber = document.getElementById('loginRegNumber')?.value?.trim();
          const email = document.getElementById('loginAdminEmail')?.value?.trim();
          
          // Validate all required fields
          if (!name || !regNumber || !email) {
            alert('Please fill in full name, registration number, and email address');
            return;
          }
          
          // Validate email format
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(email)) {
            alert('Please enter a valid email address');
            return;
          }
          
          // Prompt for year of study
          const yearRaw = prompt('Enter your year of study (1, 2, 3, 4, or 5):')?.trim();
          const year = parseInt(yearRaw || '', 10);
          
          if (!yearRaw || isNaN(year) || year < 1 || year > 5) {
            alert('Please provide a valid year of study (1-5)');
            return;
          }

          const originalBtnText = requestAdminCodeBtn.textContent;
          requestAdminCodeBtn.disabled = true;
          requestAdminCodeBtn.textContent = 'Sending...';

          try {
            // Try the primary endpoint first, with fallback
            let result;
            try {
              result = await safeFetch('/api/admins/register-code', {
                method: 'POST',
                body: { name, email, regNumber, year }
              });
            } catch (primaryErr) {
              console.warn('Primary endpoint failed, trying fallback:', primaryErr);
              // Fallback to alternate endpoint if available
              result = await safeFetch('/api/admins/resend-code', {
                method: 'POST',
                body: { name, email, regNumber, year }
              });
            }
            alert(result.message || 'Admin code sent successfully! Check your email for the code.');
          } catch (err) {
            console.error('Request admin code error:', err);
            const serverErrors = err?.data?.errors || err?.errors;
            if (serverErrors && serverErrors.length) {
              alert(serverErrors[0].msg || JSON.stringify(serverErrors));
            } else {
              alert(err.message || 'Failed to send admin code. Please try again.');
            }
          } finally {
            requestAdminCodeBtn.disabled = false;
            requestAdminCodeBtn.textContent = originalBtnText;
          }
        });
      }

      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const role = (document.querySelector('input[name="loginRole"]:checked')?.value || 'student').toLowerCase();
        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value;
        const loginFullname = document.getElementById('loginFullname')?.value?.trim();
        const loginRegNumber = document.getElementById('loginRegNumber')?.value?.trim();
        const loginAdminCode = document.getElementById('loginAdminCode')?.value?.trim();

        if (role === 'student') {
          if (!email || !password) {
            alert('Please enter both email and password');
            return;
          }
        } else {
          if (!loginFullname || !loginRegNumber || !loginAdminCode) {
            alert('Please enter full name, registration number, and admin code');
            return;
          }
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        try {
          let data;
          if (role === 'student') {
            // Try multiple endpoints/payloads to match backend
            let result;
            if (API_TEST?.tryLoginVariants) {
              result = await API_TEST.tryLoginVariants(email, password);
            } else {
              result = await API_TEST.tryLogin(email, password);
            }
            data = result?.res || result;
          } else {
            // Admin code login (passwordless) - canonical endpoint only
            data = await safeFetch('/api/admins/login-code', {
              method: 'POST',
              body: { regNumber: loginRegNumber, name: loginFullname, adminCode: loginAdminCode }
            });
          }

          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;

          if (data.role) {
            const userData = {
              userId: data.userId,
              email: data.email || '',
              name: data.name || data.username || loginFullname || '',
              username: data.username || '',
              role: data.role,
              loginTime: new Date().toISOString()
            };
            localStorage.setItem('userData', JSON.stringify(userData));

            // Compute base-aware redirect paths for GitHub Pages compatibility
            const currentPath = window.location.pathname;
            const baseMatch = currentPath.match(/^(.*?)\/docs\//);
            const basePath = baseMatch ? baseMatch[1] : '';
            
            if (data.role === 'admin') {
              // Redirect to admin dashboard (clean path)
              window.location.href = basePath + '/docs/admin.html';
            } else if (data.role === 'student') {
              // Redirect to student dashboard (clean path)
              window.location.href = basePath + '/docs/students.html';
            } else {
              throw new Error('Unknown user role');
            }
          } else {
            alert(data?.error || data?.message || 'Login failed. Please try again.');
          }
        } catch (error) {
          console.error('Login error:', error);
          alert('Network error. Please check your connection and try again.');
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
        }
      });
    }

    /**
     * Check for existing user session on login page
     * If user is already logged in, offer to continue to dashboard
     */
    function checkExistingSession() {
      // Only run on login page
      if (!loginForm) return;

      const userData = localStorage.getItem('userData');
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          console.log('Existing session found:', user.email || user.name || user.username || '');
          
          // Ask user if they want to continue with existing session
          const who = user.name || user.username || user.email || 'your account';
          const continueSession = confirm(`You're already logged in as ${who}. Continue to dashboard?`);
          
          if (continueSession) {
            // Compute base-aware redirect paths for GitHub Pages compatibility
            const currentPath = window.location.pathname;
            const baseMatch = currentPath.match(/^(.*?)\/docs\//);
            const basePath = baseMatch ? baseMatch[1] : '';
            
            if (user.role === 'admin') {
              window.location.href = basePath + '/docs/admin.html';
            } else if (user.role === 'student') {
              window.location.href = basePath + '/docs/students.html';
            }
          } else {
            // User wants to login with different account
            localStorage.removeItem('userData');
            console.log('Previous session cleared for new login');
          }
        } catch (error) {
          console.error('Error checking session:', error);
          localStorage.removeItem('userData'); // Clear corrupted data
        }
      }
    }

    // Check for existing session when page loads
    checkExistingSession();

    // Legacy login forms (kept for backwards compatibility if needed)
    const studentLoginTab = document.getElementById('studentLoginTab');
    const adminLoginTab = document.getElementById('adminLoginTab');
    const studentLoginForm = document.getElementById('studentLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');

    // Tab switching for login (if using tabbed login)
    if (studentLoginTab && adminLoginTab && studentLoginForm && adminLoginForm) {
      studentLoginTab.addEventListener('click', () => {
        studentLoginTab.classList.add('active');
        adminLoginTab.classList.remove('active');
        studentLoginForm.classList.add('active');
        adminLoginForm.classList.remove('active');
      });
      adminLoginTab.addEventListener('click', () => {
        adminLoginTab.classList.add('active');
        studentLoginTab.classList.remove('active');
        adminLoginForm.classList.add('active');
        studentLoginForm.classList.remove('active');
      });
    }

    // Legacy Student Login (updated to use centralized API)
    if (studentLoginForm && !loginForm) {
      studentLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const creds = {
          email: studentLoginForm.email.value,
          password: studentLoginForm.password.value
        };
        try {
          const data = await safeFetch('/api/login', {
            method: 'POST',
            body: creds
          });
          if (data.role === 'student') {
            window.location.href = 'students.html'; // Clean direct path
          } else {
            alert(data.error || data.message || 'Login failed!');
          }
        } catch (err) {
          console.error('Student login error:', err);
          alert('Error logging in. Check console.');
        }
      });
    }

    // Legacy Admin Login (updated to use centralized API)
    if (adminLoginForm && !loginForm) {
      adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const creds = {
          email: adminLoginForm.email.value,
          password: adminLoginForm.password.value
        };
        try {
          const data = await safeFetch('/api/login', {
            method: 'POST',
            body: creds
          });
          if (data.role === 'admin') {
            window.location.href = 'admin.html'; // Clean direct path
          } else {
            alert(data.error || data.message || 'Login failed!');
          }
        } catch (err) {
          console.error('Admin login error:', err);
          alert('Error logging in. Check console.');
        }
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

    /* ===========================================================
       SECTION 5: EXECUTIVES PAGE FUNCTIONALITY
       =========================================================== */
    const execCards = document.querySelectorAll(".exec-card");
    execCards.forEach(card => {
      const readMoreBtn = card.querySelector(".read-more");
      if (readMoreBtn) {
        readMoreBtn.addEventListener("click", () => {
          card.classList.toggle("expanded");
        });
      }
    });

    const quoteElement = document.getElementById("quote");
    if (quoteElement) {
      const quotes = [
        "Leadership is service, not position.",
        "Innovation distinguishes between a leader and a follower.",
        "Great leaders inspire others to lead.",
        "Success is built on teamwork and vision."
      ];
      let quoteIndex = 0;
      function rotateQuotes() {
        quoteElement.textContent = quotes[quoteIndex];
        quoteIndex = (quoteIndex + 1) % quotes.length;
      }
      rotateQuotes();
      setInterval(rotateQuotes, 6000);
    }

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

  function resolveDocsPath(fileName){
    try {
      const p = window.location.pathname;
      const baseMatch = p.match(/^(.*?)\/docs\//);
      const basePath = baseMatch ? baseMatch[1] : '';
      return basePath + '/docs/' + fileName;
    } catch { return '/docs/' + fileName; }
  }

  function autoLogout(reason) {
    try { localStorage.removeItem('userData'); localStorage.removeItem(LAST_ACTIVITY_KEY); } catch (e) {}
    try { alert(reason || 'You have been logged out.'); } catch (e) {}
    window.location.href = resolveDocsPath('login.html');
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