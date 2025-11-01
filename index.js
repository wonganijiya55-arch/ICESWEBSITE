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

document.addEventListener("DOMContentLoaded", () => {
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
      const data = {
        fullName: studentForm.fullName.value,
        regNumber: studentForm.regNumber.value,
        email: studentForm.email.value,
        password: studentForm.password.value,
        yearOfStudy: studentForm.yearOfStudy.value
      };

      try {
        const res = await fetch('http://localhost:5000/api/auth/register/student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(result.message || "Registration successful!");
        studentForm.reset();
      } catch (err) {
        console.error(err);
        alert("Error registering. Check console.");
      }
    });
  }

  /* ===========================================================
     SECTION 3: LOGIN PAGE TABS & POST
     =========================================================== */
  const studentLoginTab = document.getElementById('studentLoginTab');
  const adminLoginTab = document.getElementById('adminLoginTab');
  const studentLoginForm = document.getElementById('studentLoginForm');
  const adminLoginForm = document.getElementById('adminLoginForm');

  // Tab switching for login
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

  // ================= Login POST (Student) =================
  if (studentLoginForm) {
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

  // ================= Login POST (Admin) =================
  if (adminLoginForm) {
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

}); // End DOMContentLoaded
// ===== SLIDESHOW FUNCTIONALITY =====
let slideIndex = 0;
let slideTimer;

function showSlides() {
  const slides = document.getElementsByClassName("slide");
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  if (slideIndex > slides.length) {slideIndex = 1}
  if (slideIndex < 1) {slideIndex = slides.length}
  if (slides.length > 0) {
    slides[slideIndex-1].style.display = "block";
  }
}

function showSlidesAuto() {
  slideIndex++;
  showSlides();
  slideTimer = setTimeout(showSlidesAuto, 5000); // Change slide every 5 seconds
}

// Start the slideshow
showSlides();
showSlidesAuto();
