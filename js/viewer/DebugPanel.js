export class DebugPanel {
  /**
   * Developer debug panel overlay manager.
   * @param {HTMLElement} host - The viewer container.
   */
  constructor(host) {
    this.host = host;
    this.enabled = !!window.__HULL_VIEWER_DIAGNOSTIC__;
    this.element = null;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.renderTimes = [];
    
    // Auto-initialize if global flag is true
    if (this.enabled) {
      this.setEnabled(true);
    }
  }

  /**
   * Toggle debug mode and show/hide display.
   * @param {boolean} enabled 
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    window.__HULL_VIEWER_DIAGNOSTIC__ = enabled;
    if (enabled) {
      if (!this.element) {
        this.element = document.createElement('div');
        this.element.className = 'hull-debug-panel';
        Object.assign(this.element.style, {
          position: 'absolute',
          left: '12px',
          top: '12px',
          background: 'rgba(20, 25, 30, 0.92)',
          color: '#00ffcc',
          fontFamily: 'Consolas, monospace',
          fontSize: '11px',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #3A424D',
          pointerEvents: 'none',
          zIndex: '10',
          lineHeight: '1.4',
          minWidth: '220px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        });
        this.host.appendChild(this.element);
      }
      this.element.style.display = 'block';
    } else if (this.element) {
      this.element.style.display = 'none';
    }
  }

  recordFrame() {
    if (!this.enabled) return;
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsUpdate;
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  /**
   * Tracks render execution time in ms.
   * @param {number} timeMs 
   */
  recordRenderTime(timeMs) {
    if (!this.enabled) return;
    this.renderTimes.push(timeMs);
    if (this.renderTimes.length > 20) this.renderTimes.shift();
  }

  getAverageRenderTime() {
    if (this.renderTimes.length === 0) return 0;
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return (sum / this.renderTimes.length).toFixed(1);
  }

  /**
   * Updates rendering stats and draws contents.
   * @param {Object} stats 
   */
  update(stats) {
    this.recordFrame();
    if (!this.enabled) return;
    if (!this.element) {
      this.setEnabled(true);
    }

    const {
      vertexCount = 0,
      triangleCount = 0,
      boundingBox = null,
      boundingSphere = null,
      cameraPos = null,
      orbitTarget = null,
      sceneObjectCount = 0
    } = stats;

    let bboxStr = 'N/A';
    if (boundingBox) {
      const sz = boundingBox.getSize(new window.THREE.Vector3());
      bboxStr = `Min: [${boundingBox.min.x.toFixed(1)}, ${boundingBox.min.y.toFixed(1)}, ${boundingBox.min.z.toFixed(1)}]<br>  Max: [${boundingBox.max.x.toFixed(1)}, ${boundingBox.max.y.toFixed(1)}, ${boundingBox.max.z.toFixed(1)}]<br>  Size: [${sz.x.toFixed(1)}, ${sz.y.toFixed(1)}, ${sz.z.toFixed(1)}]`;
    }

    let sphereStr = 'N/A';
    if (boundingSphere) {
      sphereStr = `Center: [${boundingSphere.center.x.toFixed(1)}, ${boundingSphere.center.y.toFixed(1)}, ${boundingSphere.center.z.toFixed(1)}]<br>  Radius: ${boundingSphere.radius.toFixed(2)}`;
    }

    const camStr = cameraPos ? `[${cameraPos.x.toFixed(1)}, ${cameraPos.y.toFixed(1)}, ${cameraPos.z.toFixed(1)}]` : 'N/A';
    const trgStr = orbitTarget ? `[${orbitTarget.x.toFixed(1)}, ${orbitTarget.y.toFixed(1)}, ${orbitTarget.z.toFixed(1)}]` : 'N/A';

    this.element.innerHTML = `
<div style="font-weight:bold;margin-bottom:6px;border-bottom:1px solid #3A424D;padding-bottom:3px;color:#fff;">Developer Diagnostics</div>
<strong>FPS:</strong> ${this.fps}<br>
<strong>Render Time:</strong> ${this.getAverageRenderTime()} ms<br>
<strong>Vertices:</strong> ${vertexCount}<br>
<strong>Triangles:</strong> ${triangleCount}<br>
<strong>Scene Objects:</strong> ${sceneObjectCount}<br>
<strong>Camera Pos:</strong> ${camStr}<br>
<strong>Orbit Target:</strong> ${trgStr}<br>
<strong>Bounding Box:</strong><br>  ${bboxStr}<br>
<strong>Bounding Sphere:</strong><br>  ${sphereStr}
    `.trim();
  }
}
