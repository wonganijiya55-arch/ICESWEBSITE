(function () {
  'use strict';

  function initNavigation() {
    const nav = document.querySelector('.navbar');
    const hamburger = nav?.querySelector('.hamburger');
    const navLinks = nav?.querySelector('.nav-links');

    if (!nav || !hamburger || !navLinks || nav.dataset.navigationInitialized === 'true') {
      return;
    }

    nav.dataset.navigationInitialized = 'true';
    const menuId = navLinks.id || `site-navigation-${Date.now()}`;
    navLinks.id = menuId;

    hamburger.setAttribute('role', 'button');
    hamburger.setAttribute('tabindex', '0');
    hamburger.setAttribute('aria-controls', menuId);
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation menu');

    const closeButton = navLinks.querySelector('.menu-close-btn');
    const setOpen = (open) => {
      navLinks.classList.toggle('active', open);
      hamburger.classList.toggle('is-open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      document.body.classList.toggle('mobile-menu-open', open);
    };

    const toggle = () => setOpen(!navLinks.classList.contains('active'));

    hamburger.addEventListener('click', toggle);
    hamburger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });

    closeButton?.addEventListener('click', () => setOpen(false));
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('click', (event) => {
      if (!navLinks.classList.contains('active')) return;
      if (nav.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation, { once: true });
  } else {
    initNavigation();
  }
})();
