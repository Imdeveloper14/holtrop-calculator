/* =============================================================
   ui.js — NavCalc Pro UI Controller
   Handles: Sidebar navigation, Lucide icons, collapsible panels,
            dark mode, KPI card updates, auxiliary button bindings.
   ============================================================= */

(function () {
  'use strict';

  /* ===========================================================
     1. LUCIDE ICONS INITIALIZATION
     =========================================================== */
  function initIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  /* ===========================================================
     2. SIDEBAR NAVIGATION
     =========================================================== */
  const navItems = document.querySelectorAll('.nav-item[data-nav]');
  const sections = document.querySelectorAll('.workspace-section');

  /**
   * Switch the visible workspace section.
   * @param {string} targetId - the ID of the section to show.
   */
  function switchSection(targetId) {
    // Deactivate all nav items
    navItems.forEach(function (item) { item.classList.remove('active'); });

    // Activate the correct nav item
    const activeNavItem = document.querySelector('.nav-item[data-nav="' + targetId + '"]');
    if (activeNavItem) { activeNavItem.classList.add('active'); }

    // Hide all sections, show target
    sections.forEach(function (sec) { sec.classList.remove('active'); });
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  // Expose globally so onclick attributes in HTML can call it
  window.switchNav = switchSection;

  // Bind nav item click events
  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var targetId = item.getAttribute('data-nav');
      switchSection(targetId);
    });
  });

  /* ===========================================================
     3. COLLAPSIBLE PANEL HEADERS
     =========================================================== */
  function initCollapsibles() {
    var headers = document.querySelectorAll('.collapsible-header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        var targetId = header.getAttribute('data-target');
        var body = document.getElementById(targetId);
        if (!body) return;

        var isOpen = body.classList.contains('expanded');

        if (isOpen) {
          body.classList.remove('expanded');
          header.classList.remove('open');
        } else {
          body.classList.add('expanded');
          header.classList.add('open');
        }
      });
    });
  }

  /* ===========================================================
     5. AUXILIARY BUTTON BINDINGS
     Topbar buttons trigger the same handlers as the original IDs
     in projectManager.js. We proxy the project section buttons.
     =========================================================== */
  function proxyBtn(sourceId, targetId) {
    var src = document.getElementById(sourceId);
    var tgt = document.getElementById(targetId);
    if (src && tgt) {
      src.addEventListener('click', function () { tgt.click(); });
    }
  }

  // Project section buttons → topbar buttons (which have the real handlers)
  proxyBtn('newProjectBtnProj',    'newProjectBtn');
  proxyBtn('openProjectBtnProj',   'openProjectBtn');
  proxyBtn('saveProjectBtnProj',   'saveProjectBtn');
  proxyBtn('exportJsonBtnProj',    'exportJsonBtn');

  // "Calculate" button in the Vessel Inputs panel → topbar Calculate
  var calcFromVesselBtn = document.getElementById('calcFromVesselBtn');
  if (calcFromVesselBtn) {
    calcFromVesselBtn.addEventListener('click', function () {
      var mainCalcBtn = document.getElementById('calculateBtn');
      if (mainCalcBtn) { mainCalcBtn.click(); }
    });
  }

  /* ===========================================================
     6. KPI DASHBOARD CARD UPDATER
     Reads result DOM elements after calculation and copies
     values into the dashboard KPI cards.
     =========================================================== */
  function updateKpiCards() {
    // We read the text content of the result elements set by main.js
    var rtEl       = document.getElementById('rtResult');
    var peEl       = document.getElementById('peResult');
    var pbEl       = document.getElementById('pbResult');
    var fuelEl     = document.getElementById('fuelTonday');
    var co2El      = document.getElementById('co2Emissions');
    var eexiEl     = document.getElementById('attainedEEXI');
    var ciiRatEl   = document.getElementById('ciiRating');

    function safeText(el) {
      if (!el) return '\u2014';
      var t = (el.textContent || el.innerText || '').trim();
      return t || '\u2014';
    }

    // Extract just the numeric part (strip units appended by main.js)
    function numPart(el) {
      var t = safeText(el);
      var m = t.match(/^[\d,.\-+eE]+/);
      return m ? m[0] : t;
    }

    var kpiRt   = document.getElementById('kpi-rt');
    var kpiPe   = document.getElementById('kpi-pe');
    var kpiPb   = document.getElementById('kpi-pb');
    var kpiFuel = document.getElementById('kpi-fuel');
    var kpiCo2  = document.getElementById('kpi-co2');
    var kpiEexi = document.getElementById('kpi-eexi');
    var kpiCii  = document.getElementById('kpi-cii');
    var kpiApplicability = document.getElementById('kpi-applicability');

    if (kpiRt)   kpiRt.textContent   = numPart(rtEl);
    if (kpiPe)   kpiPe.textContent   = numPart(peEl);
    if (kpiPb)   kpiPb.textContent   = numPart(pbEl);

    // Fuel: strip " t/day"
    if (kpiFuel && fuelEl) {
      var fuelTxt = safeText(fuelEl).replace(/\s*t\/day\s*/i, '');
      kpiFuel.textContent = fuelTxt || '\u2014';
    }

    // CO2: strip " kg/h"
    if (kpiCo2 && co2El) {
      var co2Txt = safeText(co2El).replace(/\s*kg\/h\s*/i, '');
      kpiCo2.textContent = co2Txt || '\u2014';
    }

    // EEXI: just first number before space
    if (kpiEexi && eexiEl) {
      var eexiTxt = safeText(eexiEl).split(' ')[0];
      kpiEexi.textContent = eexiTxt || '\u2014';
    }

    // CII rating letter
    if (kpiCii && ciiRatEl) {
      var ciiTxt = safeText(ciiRatEl);
      kpiCii.textContent = ciiTxt || '\u2014';
      // Mirror the background color
      kpiCii.style.color = ciiRatEl.style.backgroundColor || '';
    }

    // Applicability: count passes
    if (kpiApplicability) {
      var valList = document.getElementById('validationList');
      if (valList) {
        var allLi   = valList.querySelectorAll('li');
        var passLi  = valList.querySelectorAll('li[style*="#e8f5e9"], li[style*="#2e7d32"]');
        // More reliable: count by text content prefix
        var passCount = 0; var warnCount = 0; var failCount = 0;
        allLi.forEach(function (li) {
          var txt = li.textContent || '';
          if (txt.indexOf('[PASS]') !== -1)          passCount++;
          else if (txt.indexOf('[WARNING]') !== -1)  warnCount++;
          else if (txt.indexOf('[OUT OF RANGE]') !== -1) failCount++;
        });
        if (allLi.length === 0) {
          kpiApplicability.textContent = '\u2014';
        } else if (failCount > 0) {
          kpiApplicability.textContent = failCount + ' Out-of-Range';
          kpiApplicability.style.color = 'var(--color-danger)';
        } else if (warnCount > 0) {
          kpiApplicability.textContent = warnCount + ' Warnings';
          kpiApplicability.style.color = 'var(--color-warning)';
        } else {
          kpiApplicability.textContent = 'All Pass';
          kpiApplicability.style.color = 'var(--color-success)';
        }
      }
    }
  }

  // Hook into the Calculate buttons to trigger KPI update after a short delay
  function hookCalculateBtn(btnId) {
    var btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', function () {
        setTimeout(updateKpiCards, 200);
      });
    }
  }
  hookCalculateBtn('calculateBtn');
  hookCalculateBtn('calculateBtnWorkspace');
  hookCalculateBtn('calcFromVesselBtn');

  /* ===========================================================
     7. PROJECT NAME DISPLAY
     =========================================================== */
  // When projectManager.js sets window.currentProjectName, reflect it
  var projectNameInput = document.getElementById('projectNameDisplay');
  if (projectNameInput) {
    projectNameInput.addEventListener('change', function () {
      // Allow user to rename project in topbar
      if (typeof window.currentProjectName !== 'undefined') {
        window.currentProjectName = projectNameInput.value;
      }
    });
  }

  // Poll for project name changes from projectManager.js
  setInterval(function () {
    if (projectNameInput && window.currentProjectName &&
        window.currentProjectName !== projectNameInput.value &&
        document.activeElement !== projectNameInput) {
      projectNameInput.value = window.currentProjectName;
    }
  }, 1000);

  /* ===========================================================
     8. INITIALIZATION
     =========================================================== */
  function init() {
    initIcons();
    initCollapsibles();

    // Ensure Dashboard is active on load
    switchSection('dashboardSection');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
