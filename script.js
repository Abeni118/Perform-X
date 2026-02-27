// script.js — vanilla javascript, sidebar toggle + mobile

(function() {
  'use strict';

  // DOM elements
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');

  // Toggle desktop collapsed state
  if (collapseBtn) {
    collapseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      sidebar.classList.toggle('collapsed');

      // rotate arrow icon (text content)
      const isCollapsed = sidebar.classList.contains('collapsed');
      collapseBtn.textContent = isCollapsed ? '▶' : '◀';
    });
  }

  // mobile detection: if window width <= 768, we hide sidebar by default (add mobile behavior)
  function handleMobile() {
    if (window.innerWidth <= 768) {
      // ensure sidebar starts hidden (no .mobile-visible)
      sidebar.classList.remove('mobile-visible');
      // optionally add a hamburger? but we use collapse btn as toggle for mobile too.
      // reuse collapse button to show/hide on mobile: we interpret click differently
      // but we don't want double toggles. we'll rebind for mobile.
    } else {
      // ensure no mobile-visible, and if previously collapsed desktop keep it
      sidebar.classList.remove('mobile-visible');
    }
  }

  // enhance: collapse button also acts as mobile menu toggle
  function mobileToggleHandler() {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('mobile-visible');
      // when mobile visible, we might want to remove collapsed class for proper width
      sidebar.classList.remove('collapsed'); // ensure full width mobile menu
      collapseBtn.textContent = sidebar.classList.contains('mobile-visible') ? '✕' : '☰';
    } else {
      // desktop: classic collapsed toggle
      sidebar.classList.toggle('collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');
      collapseBtn.textContent = isCollapsed ? '▶' : '◀';
    }
  }

  // replace click handler
  if (collapseBtn) {
    collapseBtn.removeEventListener('click', collapseBtn.handler); // clean if any
    collapseBtn.addEventListener('click', mobileToggleHandler);
  }

  // initial call
  handleMobile();

  // on resize adjust
  window.addEventListener('resize', function() {
    handleMobile();
    // reset button text if we leave mobile
    if (window.innerWidth > 768) {
      sidebar.classList.remove('mobile-visible');
      if (sidebar.classList.contains('collapsed')) {
        collapseBtn.textContent = '▶';
      } else {
        collapseBtn.textContent = '◀';
      }
    } else {
      // on mobile, button text indicates menu
      if (!sidebar.classList.contains('mobile-visible')) {
        collapseBtn.textContent = '☰';
      } else {
        collapseBtn.textContent = '✕';
      }
    }
  });

  // simple user dropdown simulation (no actual menu, but visual)
  const userBtn = document.querySelector('.user-btn');
  if (userBtn) {
    userBtn.addEventListener('click', function() {
      // just a demo: could add active class, but we skip to keep clean
      console.log('user dropdown clicked — design placeholder');
    });
  }

  // notification icon
  const notifBtn = document.querySelector('.icon-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => console.log('notifications'));
  }

})();