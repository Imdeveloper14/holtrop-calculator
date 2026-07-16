const T = window.THREE;

export class CameraManager {
  constructor(renderer, el, change) {
    this.el = el;
    this.change = change;
    this.target = new T.Vector3();
    this.theta = Math.PI / 4;
    this.phi = 1.17;
    this.radius = 100;
    this.orthographic = false;
    this.camera = new T.PerspectiveCamera(45, 1, 0.01, 10000);
    this.bind(renderer.domElement);
  }

  bind(el) {
    let drag = null;
    const end = () => {
      drag = null;
      this.change();
    };
    el.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, pan: e.button === 2 };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (drag.pan) {
        const r = new T.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
        const u = new T.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
        this.target.addScaledVector(r, -dx * this.radius / 700).addScaledVector(u, dy * this.radius / 700);
      } else {
        this.theta -= dx * 0.008;
        this.phi = Math.max(0.02, Math.min(Math.PI - 0.02, this.phi - dy * 0.008));
      }
      this.update();
    });
    el.addEventListener('wheel', e => {
      e.preventDefault();
      this.radius = Math.max(0.5, Math.min(10000, this.radius * Math.exp(e.deltaY * 0.001)));
      this.update();
    }, { passive: false });
    el.addEventListener('contextmenu', e => e.preventDefault());
  }

  fit(geometry) {
    if (!geometry) {
      throw new Error('Camera auto-fit failed: The geometry is undefined.');
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
    // Set orbit target to (LPP / 2, 0, Draft / 2) based on geometry bounding box
    const box = geometry.boundingBox;
    const LPP = box.max.x;
    const draft = box.max.z;
    this.target.set(LPP / 2, 0, draft / 2);

    const sphere = geometry.boundingSphere;
    const fov = T.MathUtils.degToRad(this.camera.isPerspectiveCamera ? this.camera.fov : 45);
    this.radius = Math.max(sphere.radius / Math.sin(fov / 2) * 1.25, 5);
    this.camera.near = Math.max(0.1, this.radius / 50);
    this.camera.far = Math.max(1000, this.radius * 10);
    this.theta = Math.PI / 4;
    this.phi = 1.17;
    this.camera.up.set(0, 0, 1);
    this.update();
  }

  update() {
    const s = Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * s * Math.cos(this.theta),
      this.target.y + this.radius * s * Math.sin(this.theta),
      this.target.z + this.radius * Math.cos(this.phi)
    );
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
    this.change();
  }

  view(name, geometry) {
    if (geometry) {
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      
      // Target is always hull center: (LPP / 2, 0, Draft / 2)
      const box = geometry.boundingBox;
      const LPP = box.max.x;
      const draft = box.max.z;
      this.target.set(LPP / 2, 0, draft / 2);

      const sphere = geometry.boundingSphere;
      const fov = T.MathUtils.degToRad(this.camera.isPerspectiveCamera ? this.camera.fov : 45);
      this.radius = Math.max(sphere.radius / Math.sin(fov / 2) * 1.25, 5);
      this.camera.near = Math.max(0.1, this.radius / 50);
      this.camera.far = Math.max(1000, this.radius * 10);
    }

    const upVectors = {
      iso: [0, 0, 1],
      front: [0, 0, 1],
      top: [0, 1, 0],
      bottom: [0, -1, 0],
      side: [0, 0, 1],
      aft: [0, 0, 1],
      section: [0, 0, 1]
    };

    const angles = {
      iso: [Math.PI / 4, 1.17],
      front: [Math.PI / 2, Math.PI / 2],
      top: [0, 0.02],
      bottom: [0, Math.PI - 0.02],
      side: [0, Math.PI / 2],
      aft: [Math.PI, Math.PI / 2],
      section: [0.1, Math.PI / 2]
    };

    const up = upVectors[name] || [0, 0, 1];
    const angle = angles[name] || [Math.PI / 4, 1.17];

    this.camera.up.set(up[0], up[1], up[2]);
    this.theta = angle[0];
    this.phi = angle[1];
    this.update();
  }

  setOrtho(on) {
    if (on === this.orthographic) return;
    const old = this.camera;
    this.orthographic = on;
    if (on) {
      const h = this.radius * 0.75;
      this.camera = new T.OrthographicCamera(-h, h, h, h, old.near, old.far);
    } else {
      this.camera = new T.PerspectiveCamera(45, old.aspect, old.near, old.far);
    }
    this.camera.up.copy(old.up);
    this.resize(this.el.clientWidth, this.el.clientHeight);
    this.update();
  }

  resize(w, h) {
    if (!w || !h) return;
    this.camera.aspect = w / h;
    if (this.camera.isOrthographicCamera) {
      const h2 = this.radius * 0.75;
      this.camera.left = -h2 * w / h;
      this.camera.right = h2 * w / h;
      this.camera.top = h2;
      this.camera.bottom = -h2;
    }
    this.camera.updateProjectionMatrix();
  }
}
