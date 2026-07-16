export function bindToolbar(viewer) {
  document.querySelectorAll('[data-hull-view]').forEach(b => b.addEventListener('click', () => {
    const section = b.dataset.hullView === 'section';
    viewer.section?.setEnabled(section);
    viewer.camera.view(b.dataset.hullView, viewer.surface?.mesh?.geometry);
    viewer.render();
  }));
  
  document.querySelectorAll('[data-hull-layer]').forEach(b => b.addEventListener('change', () => {
    viewer.layer(b.dataset.hullLayer, b.checked);
  }));
  
  document.querySelectorAll('[data-hull-action]').forEach(b => b.addEventListener('click', () => {
    viewer.action(b.dataset.hullAction);
  }));
  
  document.querySelectorAll('[data-hull-export]').forEach(b => b.addEventListener('click', () => {
    viewer.exports[b.dataset.hullExport]();
  }));
}
