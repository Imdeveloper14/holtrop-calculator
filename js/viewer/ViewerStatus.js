export class ViewerStatus {
  /**
   * Status overlay manager for the 3D viewport.
   * @param {HTMLElement} host - The container element of the viewer.
   */
  constructor(host) {
    this.host = host;
    this.element = this.host.querySelector('.hull-status') || this.createStatusElement();
  }

  createStatusElement() {
    const el = document.createElement('div');
    el.className = 'hull-status';
    el.hidden = true;
    this.host.appendChild(el);
    return el;
  }

  /**
   * Displays a status message in the overlay.
   * @param {string} message 
   * @param {boolean} isError 
   */
  show(message, isError = false) {
    if (!message) {
      this.hide();
      return;
    }
    this.element.textContent = message;
    this.element.classList.toggle('error', isError);
    this.element.hidden = false;
  }

  hide() {
    this.element.hidden = true;
  }
}
