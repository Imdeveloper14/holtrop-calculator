import { ViewerManager } from './viewer/ViewerManager.js';
import { ExportManager } from './viewer/ExportManager.js';
import { bindToolbar } from './viewer/ViewerToolbar.js';

const T = window.THREE;

function init() {
  const el = document.getElementById('hullViewer');
  if (!el) return;
  if (!T) {
    console.error('[Hull Viewer] Three.js failed to load');
    const error = document.createElement('div');
    error.className = 'hull-status error';
    error.textContent = 'Hull generation failed';
    el.appendChild(error);
    return;
  }
  const v = window.hullViewer = new ViewerManager(el);
  v.exports = new ExportManager(v);
  bindToolbar(v);

  document.querySelectorAll('.hull-panel h3').forEach(h => {
    h.tabIndex = 0;
    h.title = 'Toggle card';
    h.addEventListener('click', () => {
      const body = h.nextElementSibling;
      if (body) body.hidden = !body.hidden;
    });
  });

  ['lpp', 'lwl', 'beam', 'draft', 'cb', 'cm', 'cwp', 'lcb', 'abt', 'hb', 'at', 'envShipType'].forEach(id => 
    document.getElementById(id)?.addEventListener('change', () => v.rebuild())
  );

  const slider = document.getElementById('stationSlider');
  slider?.addEventListener('input', e => {
    v.section?.set(Number(e.target.value));
    const valEl = document.getElementById('stationValue');
    if (valEl) valEl.value = e.target.value + '%';
    v.render();
  });

  document.getElementById('hullOpacity')?.addEventListener('input', e => {
    if (v.surface) {
      v.surface.opacity = Number(e.target.value) / 100;
    }
    const opacityValEl = document.getElementById('hullOpacityValue');
    if (opacityValEl) opacityValEl.value = e.target.value + '%';
    v.render();
  });

  document.getElementById('stationAnimateBtn')?.addEventListener('click', () => {
    if (v.timer) {
      clearInterval(v.timer);
      v.timer = null;
      return;
    }
    v.timer = setInterval(() => {
      slider.value = (Number(slider.value) + 1) % 101;
      slider.dispatchEvent(new Event('input'));
    }, 45);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
