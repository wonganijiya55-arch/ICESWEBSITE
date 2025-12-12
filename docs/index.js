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
let API, safeFetch, apiPing, API_TEST;
(async function initApi() {
  try {
    const mod = await import('./api.js');
    API = mod.API;
    safeFetch = mod.safeFetch;
    apiPing = mod.apiPing;
    API_TEST = mod.API_TEST;
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
      const slides = document.getElementsByClassName("slide");
      if (touchEndX < touchStartX && touchStartX - touchEndX > 50) {
        // Swipe left - next slide
        slideIndex = (slideIndex % slides.length) + 1;
      }
      if (touchEndX > touchStartX && touchEndX - touchStartX > 50) {
        // Swipe right - previous slide
        slideIndex = slideIndex <= 1 ? slides.length : slideIndex - 1;
      }
      showSlides();
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
      const adminCodeInput = document.getElementById('adminCode');

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
        if (yearInput) {
          yearInput.required = isStudent;
          yearInput.disabled = !isStudent;
        }
        if (adminCodeInput) {
          adminCodeInput.required = !isStudent;
          adminCodeInput.disabled = isStudent;
          // Ensure focusable when required
          if (!isStudent) {
            adminCodeInput.tabIndex = 0;
          } else {
            adminCodeInput.removeAttribute('tabindex');
          }
        }
      }

      // Initialize on load based on selected role
      const initialRole = (document.querySelector('input[name="role"]:checked')?.value || 'student').toLowerCase();
      applyRoleRequirements(initialRole);

      roleRadios.forEach(radio => {
        radio.addEventListener('change', () => applyRoleRequirements(radio.value.toLowerCase()));
      });

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
            const adminCode = (document.getElementById('adminCode')?.value || '').trim();
            // Guard for hidden/disabled or empty adminCode
            if (!adminCode || (adminCodeInput && (adminCodeInput.disabled || adminCodeInput.offsetParent === null))) {
              alert('Please select an admin code from the dropdown');
              if (adminFields) {
                adminFields.style.display = 'block'; // ensure visible
                setInputsState(adminFields, { required: true, disabled: false });
                if (adminCodeInput) adminCodeInput.focus();
              }
              return;
            }
            endpoint = '/api/admins/register';
            payload = { username: fullName, email, password, adminCode };
          }

          const result = await safeFetch(endpoint, { method: 'POST', body: payload });

          alert(result.message || 'Registration successful!');
          registrationForm.reset();
          // Reapply role requirements after reset
          applyRoleRequirements((document.querySelector('input[name="role"]:checked')?.value || 'student').toLowerCase());

          if (confirm('Registration successful! Click OK to proceed to login page.')) {
            window.location.href = 'login.html';
          }
        } catch (err) {
          console.error(err);
          alert('Error registering. Check console.');
        }
      });
    }

    // ================= Unified Login =================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;

        if (!email || !password) {
          alert('Please enter both email and password');
          return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        try {
          const data = await safeFetch('/api/login', {
            method: 'POST',
            body: { email, password }
          });

          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;

          if (data.role) {
            const userData = {
              userId: data.userId,
              email: data.email,
              name: data.name || data.username || '',
              username: data.username || '',
              role: data.role,
              loginTime: new Date().toISOString()
            };
            localStorage.setItem('userData', JSON.stringify(userData));

            if (data.role === 'admin') {
              window.location.href = data.redirect || '../dashboards/admin.html';
            } else if (data.role === 'student') {
              window.location.href = data.redirect || '../dashboards/students.html';
            } else {
              throw new Error('Unknown user role');
            }
          } else {
            alert(data.error || data.message || 'Login failed. Please try again.');
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
          console.log('Existing session found:', user.email);
          
          // Ask user if they want to continue with existing session
          const continueSession = confirm(`You're already logged in as ${user.email}. Continue to dashboard?`);
          
          if (continueSession) {
            if (user.role === 'admin') {
              window.location.href = '../dashboards/admin.html';
            } else if (user.role === 'student') {
              window.location.href = '../dashboards/students.html';
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

    // Legacy Student Login (deprecated - use unified loginForm above)
    if (studentLoginForm && !loginForm) {
      studentLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          email: studentLoginForm.email.value,
          password: studentLoginForm.password.value
        };
        try {
          const res = await fetch('http://localhost:5000/api/auth/login/student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const result = await res.json();
          if (res.ok) window.location.href = 'student-dashboard.html';
          else alert(result.message || "Login failed!");
        } catch (err) {
          console.error(err);
          alert("Error logging in. Check console.");
        }
      });
    }

    // Legacy Admin Login (deprecated - use unified loginForm above)
    if (adminLoginForm && !loginForm) {
      adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          email: adminLoginForm.email.value,
          password: adminLoginForm.password.value
        };
        try {
          const res = await fetch('http://localhost:5000/api/auth/login/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const result = await res.json();
          if (res.ok) window.location.href = 'admin-dashboard.html';
          else alert(result.message || "Login failed!");
        } catch (err) {
          console.error(err);
          alert("Error logging in. Check console.");
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

  }); // End onReady

  // ===== SLIDESHOW FUNCTIONALITY =====
  let slideIndex = 0;
  let slideInterval;

  function renderSlide(index) {
    const slides = document.querySelectorAll('.slide');
    slides.forEach(s => s.classList.remove('active'));
    if (slides.length > 0) {
      const i = ((index % slides.length) + slides.length) % slides.length;
      slides[i].classList.add('active');
    }
  }

  function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length <= 1) return; // nothing to rotate
    slideIndex = (slideIndex + 1) % slides.length;
    renderSlide(slideIndex);
  }

  function startSlideshow() {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    slideIndex = 0;
    renderSlide(slideIndex);
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 8000); // 8s cadence per request
  }

  // Ensure DOM and images are present before starting
  window.addEventListener('load', () => {
    startSlideshow();
    const container = document.querySelector('.slideshow-container');
    if (container) {
      container.addEventListener('mouseenter', () => clearInterval(slideInterval));
      container.addEventListener('mouseleave', () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 8000);
      });
    }
  });

  // ===== END SLIDESHOW FUNCTIONALITY =====
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

  // Expose TEST_API only after API is ready
  window.TEST_API = {
    adminRegister: async ({ username, email, password, adminCode }) => {
      if (!username || !email || !password || !adminCode) {
        alert('Provide username, email, password, and adminCode');
        return;
      }
      try {
        console.log('Registering admin...');
        const res = await API_TEST.tryAdminRegister({ username, email, password, adminCode });
        console.log('Admin register response:', res);
        alert(res.res?.message || 'Admin registration successful');
        return res;
      } catch (err) {
        console.error('Admin registration failed:', err);
        alert('Admin registration failed. See console for details.');
        throw err;
      }
    },
    adminLogin: async (email, password) => {
      if (!email || !password) {
        alert('Provide email and password');
        return;
      }
      try {
        console.log('Logging in admin...');
        const result = await API_TEST.tryLogin(email, password);
        const data = result.res;
        console.log('Admin login response via', result.endpoint, data);

        if (data.role === 'admin') {
          const userData = {
            userId: data.userId,
            email: data.email,
            name: data.name || data.username || '',
            role: data.role,
            loginTime: new Date().toISOString()
          };
          localStorage.setItem('userData', JSON.stringify(userData));
          alert('Admin login successful');
          // window.location.href = data.redirect || '../dashboards/admin.html';
        } else {
          alert(data.message || 'Login did not return admin role');
        }
        return data;
      } catch (err) {
        console.error('Admin login failed:', err);
        alert('Admin login failed. See console for details.');
        throw err;
      }
    }
  };

})(); // end initApi IIFE