/* ========================================
   sidebar.js — Sidebar navigation & progress
   ======================================== */
(function () {

  function initSidebar() {
    var sidebarNav = document.getElementById('sidebarNav');
    var mobileToggle = document.getElementById('sidebarMobileToggle');
    var navItems = document.querySelectorAll('.sidebar-nav-item');

    // Mobile overlay
    var overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function closeMobile() {
      if (sidebarNav) sidebarNav.classList.remove('mobile-open');
      overlay.classList.remove('visible');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    }

    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        var isOpen = sidebarNav.classList.toggle('mobile-open');
        overlay.classList.toggle('visible', isOpen);
        mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    overlay.addEventListener('click', closeMobile);

    // Section elements
    var sections = Array.from(navItems).map(item => {
      return document.getElementById(item.getAttribute('data-section'));
    }).filter(Boolean);

    var visited = new Set();

    function updateActiveSection() {
      var scrollPos = window.scrollY + 120;
      var activeIndex = 0;

      sections.forEach((section, index) => {
        if (section.offsetTop <= scrollPos) activeIndex = index;
      });

      for (var i = 0; i <= activeIndex; i++) visited.add(i);

      navItems.forEach((item, index) => {
        var dot = item.querySelector('.nav-dot');
        item.classList.toggle('active', index === activeIndex);
        if (dot) {
          dot.classList.toggle('active', index === activeIndex);
          dot.classList.toggle('visited', visited.has(index) && index !== activeIndex);
        }
      });

      updateProgressBar();
    }

    function updateProgressBar() {
      var total = sections.length;
      var completed = visited.size;
      var fill = document.getElementById('progressFill');
      var text = document.getElementById('progressText');
      if (fill) fill.style.width = `${(completed / total) * 100}%`;
      if (text) text.textContent = `${completed} / ${total} sections`;
    }

    window.addEventListener('scroll', AppUtils.debounce(updateActiveSection, 80));
    updateActiveSection();

    // Smooth scroll
    navItems.forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        var target = document.getElementById(item.getAttribute('data-section'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          closeMobile();
        }
      });
    });
  }

  window.AppSidebar = { initSidebar };
})();
