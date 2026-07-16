import { HullMeshBuilder } from '../mesh/HullMeshBuilder.js';
import { CameraManager } from './CameraManager.js';
import { SectionViewer } from './SectionViewer.js';
import { renderMeasurements } from './MeasurementOverlay.js';
import { SceneManager } from './SceneManager.js';
import { RendererManager } from './RendererManager.js';
import { GridManager } from './GridManager.js';
import { OrientationCube } from './OrientationCube.js';
import { ViewerStatus } from './ViewerStatus.js';
import { DebugPanel } from './DebugPanel.js';

const T = window.THREE;

const num = (id, fallback) => {
  const n = Number(document.getElementById(id)?.value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export class ViewerManager {
  constructor(el) {
    this.el = el;
    this.dirty = false;
    this.firstRender = true;
    this.geomStats = null;
    this.hasLoggedRender = false;
    this.hasLoggedAnimate = false;

    this.status = new ViewerStatus(el);
    this.status.show('Initializing Curves Engine...');

    try {
      this.sceneManager = new SceneManager();
      this.scene = this.sceneManager.scene;
      console.info("Scene initialized");
    } catch (e) {
      console.error("Scene initialization failed:", e.message);
      this.status.show("Scene initialization failed: " + e.message, true);
      throw e;
    }

    try {
      this.rendererManager = new RendererManager(el);
      this.renderer = this.rendererManager.renderer;
      console.info("Renderer initialized");
    } catch (e) {
      console.error("Renderer initialization failed:", e.message);
      this.status.show("Renderer initialization failed: " + e.message, true);
      throw e;
    }

    try {
      this.camera = new CameraManager(this.renderer, el, () => this.render());
      console.info("Camera initialized");
    } catch (e) {
      console.error("Camera initialization failed:", e.message);
      this.status.show("Camera initialization failed: " + e.message, true);
      throw e;
    }

    try {
      this.gridManager = new GridManager();
      this.grid = this.gridManager.grid;
      this.axes = this.gridManager.axes;
      this.scene.add(this.gridManager.group);

      this.orientation = new OrientationCube();
      this.scene.add(this.orientation.group);
      console.info("Controls initialized");
    } catch (e) {
      console.error("Controls init warning:", e);
    }

    this.debugPanel = new DebugPanel(el);
    this.debugPanel.setEnabled(true);

    new ResizeObserver(() => this.resize()).observe(el);

    console.info("Viewer initialized");

    this.rebuild();
  }

  data() {
    return {
      lpp: num('lpp', 100),
      lwl: num('lwl', 102),
      beam: num('beam', 18),
      draft: num('draft', 5.5),
      cb: num('cb', 0.70),
      cm: num('cm', 0.98),
      cwp: num('cwp', 0.80),
      lcb: Number(document.getElementById('lcb')?.value) || 0,
      abt: Number(document.getElementById('abt')?.value) || 0,
      hb: Number(document.getElementById('hb')?.value) || 0,
      at: Number(document.getElementById('at')?.value) || 0,
      shipType: document.getElementById('envShipType')?.value || 'Bulk Carrier'
    };
  }

  rebuild() {
    this.status.show('Lofting Hull Surface...');
    this.d = this.data();
    
    if (this.group) this.scene.remove(this.group);
    if (this.section?.line) this.scene.remove(this.section.line);

    this.group = new T.Group();

    // Offset the baseline grid to center longitudinally around midship
    if (this.gridManager) {
      this.gridManager.group.position.set(this.d.lpp / 2, 0, 0);
    }

    let geometry;

    console.info("Hull generation started");
    try {
      this.builder = new HullMeshBuilder(this.d, this.d.shipType);
      geometry = this.builder.buildHullGeometry();
      console.info("Hull generation completed");
    } catch (error) {
      console.error("Hull generation failed:", error.message);
      this.status.show("Lofting failed: " + error.message, true);
      return;
    }

    // Geometry Validation (AP at X = 0)
    try {
      const pos = geometry.getAttribute('position');
      const vertexCount = pos ? pos.count : 0;
      const triangleCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;
      const box = geometry.boundingBox;
      const sphere = geometry.boundingSphere;
      
      const size = new T.Vector3();
      box.getSize(size);

      console.info("Vertex Count:", vertexCount);
      console.info("Triangle Count:", triangleCount);
      console.info("Bounding Box Size:", `X/Length=${size.x}, Y/Width=${size.y}, Z/Height=${size.z}`);
      console.info("Bounding Box Min:", `X=${box.min.x}, Y=${box.min.y}, Z=${box.min.z}`);
      console.info("Bounding Box Max:", `X=${box.max.x}, Y=${box.max.y}, Z=${box.max.z}`);
      console.info("Bounding Sphere Center:", `[${sphere.center.x}, ${sphere.center.y}, ${sphere.center.z}]`, "Radius:", sphere.radius);

      this.geomStats = { vertexCount, triangleCount, boundingBox: box, boundingSphere: sphere };
    } catch (e) {
      console.error("Geometry validation failed:", e.message);
      this.status.show("Geometry validation failed: " + e.message, true);
      return;
    }

    // Mesh Creation
    try {
      const mat = new T.MeshPhysicalMaterial({
        color: 0x062a4d,
        metalness: 0.18,
        roughness: 0.3,
        clearcoat: 0.28,
        transparent: true,
        opacity: 0.94,
        side: T.DoubleSide
      });
      
      this.surface = {
        mesh: new T.Mesh(geometry, mat),
        wire: new T.LineSegments(new T.WireframeGeometry(geometry), new T.LineBasicMaterial({
          color: 0x83c9e8,
          transparent: true,
          opacity: 0.7
        }))
      };
      this.surface.wire.visible = false;
      this.group.add(this.surface.mesh, this.surface.wire);

      // Bulbous Bow Mesh (if enabled)
      const bulbGeom = this.builder.buildBulbGeometry();
      if (bulbGeom) {
        this.bulbMesh = new T.Mesh(bulbGeom, mat.clone());
        this.bulbMesh.name = "Bulbous Bow";
        this.group.add(this.bulbMesh);
      }

      // Draw Curves via Mathematical Intersections (AP at X = 0)
      this.stations = this.buildStationsLayer();
      this.waterlines = this.buildWaterlinesLayer();
      this.buttocks = this.buildButtocksLayer();
      this.diagonals = this.buildDiagonalsLayer();
      this.references = this.makeReferences();

      this.group.add(this.stations, this.waterlines, this.buttocks, this.diagonals, this.references);

      // Debug Helpers & Naval Architecture Custom Debug Markers
      const axesHelper = new T.AxesHelper(20);
      const gridHelper = new T.GridHelper(100, 10);
      const boxHelper = new T.BoxHelper(this.surface.mesh, 0xffff00);
      const cameraHelper = new T.CameraHelper(this.camera.camera);
      this.group.add(axesHelper, gridHelper, boxHelper, cameraHelper);
      
      this.addDebugMarkers(geometry);

      // Add to scene
      this.scene.add(this.group);
      console.info("Mesh added to scene");

    } catch (e) {
      console.error("Mesh validation failed:", e.message);
      this.status.show("Mesh validation failed: " + e.message, true);
      return;
    }

    // Camera Fitting (Task 8 - Centroid targeting centered relative to AP=0 system)
    try {
      this.camera.fit(geometry);
      console.info("Camera Position:", `[${this.camera.camera.position.x}, ${this.camera.camera.position.y}, ${this.camera.camera.position.z}]`);
      console.info("Orbit Target:", `[${this.camera.target.x}, ${this.camera.target.y}, ${this.camera.target.z}]`);
      console.info("Near Plane:", this.camera.camera.near);
      console.info("Far Plane:", this.camera.camera.far);
      console.info("Distance:", this.camera.radius);
    } catch (e) {
      console.error("Camera fitting failed:", e.message);
      this.status.show("Camera fitting failed: " + e.message, true);
      return;
    }

    this.section = new SectionViewer(this.surface, { d: this.d, section: (u) => this.builder.intersection.getStation(u * this.d.lpp) }, this.scene);
    this.section.set(50);

    renderMeasurements(this.d);
    this.status.show('Ready');
    setTimeout(() => this.status.hide(), 700);

    this.scene.updateMatrixWorld(true);
    this.renderer.render(this.scene, this.camera.camera);
    this.render(true);
  }

  buildStationsLayer() {
    const group = new T.Group();
    const numStations = 21;
    const L = this.d.lpp;
    for (let i = 0; i < numStations; i++) {
      const u = i / (numStations - 1);
      const x = u * L; // AP is at 0, FP is at L
      const pts = this.builder.intersection.getStation(x);
      group.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({
        color: 0x3bcbd0,
        transparent: true,
        opacity: 0.58
      })));
    }
    return group;
  }

  buildWaterlinesLayer() {
    const group = new T.Group();
    const heights = [0.2, 0.45, 0.7, 0.93];
    heights.forEach(fr => {
      const pts = this.builder.intersection.getWaterline(this.d.draft * fr);
      group.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({
        color: 0x9adcf0,
        transparent: true,
        opacity: 0.55
      })));
    });
    return group;
  }

  buildButtocksLayer() {
    const group = new T.Group();
    const offsets = [-0.6, -0.3, 0, 0.3, 0.6];
    offsets.forEach(f => {
      const pts = this.builder.intersection.getButtock(this.d.beam * 0.5 * f);
      group.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({
        color: 0x669bb8,
        transparent: true,
        opacity: 0.55
      })));
    });
    return group;
  }

  buildDiagonalsLayer() {
    const group = new T.Group();
    const ratios = [0.35, 0.65];
    ratios.forEach(r => {
      const pts = this.builder.intersection.getDiagonal(r);
      group.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({
        color: 0x9c27b0,
        transparent: true,
        opacity: 0.5
      })));
    });
    return group;
  }

  makeReferences() {
    const g = new T.Group();
    const line = (a, b, c) => g.add(new T.Line(new T.BufferGeometry().setFromPoints([a, b]), new T.LineBasicMaterial({ color: c })));
    const d = this.d;
    const L = d.lpp;
    const z0 = 0;
    const z1 = d.draft;

    // References sitting on Z=0 baseline
    line(new T.Vector3(0, 0, z0), new T.Vector3(L, 0, z0), 0xd8e2e9); // AP to FP baseline
    line(new T.Vector3(0, 0, z1), new T.Vector3(L, 0, z1), 0x95d9ef); // Design waterline
    
    // FP, AP, Midship Reference lines
    line(new T.Vector3(0, -d.beam * 0.6, z0), new T.Vector3(0, -d.beam * 0.6, z1 * 1.2), 0xe4e8ec); // AP
    line(new T.Vector3(L, -d.beam * 0.6, z0), new T.Vector3(L, -d.beam * 0.6, z1 * 1.2), 0xe4e8ec); // FP
    line(new T.Vector3(L / 2, -d.beam * 0.6, z0), new T.Vector3(L / 2, -d.beam * 0.6, z1 * 1.2), 0xffd166); // Midship

    const water = new T.Mesh(new T.PlaneGeometry(d.lpp * 1.2, d.beam * 2), new T.MeshBasicMaterial({
      color: 0x3e9ac3,
      transparent: true,
      opacity: 0.12,
      side: T.DoubleSide
    }));
    water.position.set(L / 2, 0, z1);
    g.add(water);
    return g;
  }

  addDebugMarkers(geometry) {
    const d = this.d;
    const L = d.lpp;
    const group = new T.Group();
    group.name = "Engineering Helpers";

    const line = (p1, p2, color) => {
      const g = new T.BufferGeometry().setFromPoints([p1, p2]);
      return new T.Line(g, new T.LineBasicMaterial({ color }));
    };

    const point = (pos, color, size = 1.5) => {
      const g = new T.BufferGeometry().setFromPoints([pos]);
      return new T.Points(g, new T.PointsMaterial({ color, size, sizeAttenuation: true }));
    };

    // Baseline (Green)
    group.add(line(new T.Vector3(-L * 0.1, 0, 0), new T.Vector3(L * 1.1, 0, 0), 0x228b22));
    
    // Centerline (Blue)
    group.add(line(new T.Vector3(-L * 0.1, 0, 0), new T.Vector3(L * 1.1, 0, 0), 0x0000ff));

    // FP (Red vertical)
    group.add(line(new T.Vector3(L, 0, 0), new T.Vector3(L, 0, d.draft * 1.3), 0xff0000));

    // AP (Red vertical)
    group.add(line(new T.Vector3(0, 0, 0), new T.Vector3(0, 0, d.draft * 1.3), 0xff0000));

    // Midship section (Yellow plane outline)
    const midPoints = [];
    for (let a = 0; a <= Math.PI * 2; a += 0.1) {
      midPoints.push(new T.Vector3(L / 2, d.beam * 0.55 * Math.sin(a), d.draft * 0.5 * Math.cos(a) + d.draft * 0.5));
    }
    const midGeom = new T.BufferGeometry().setFromPoints(midPoints);
    group.add(new T.LineLoop(midGeom, new T.LineBasicMaterial({ color: 0xffff00 })));

    // Hull Centroid (White point)
    group.add(point(this.camera.target, 0xffffff, 2));

    // Stem point (Cyan point)
    group.add(point(new T.Vector3(L, 0, d.draft), 0x00ffff, 2));

    // Stern point (Magenta point)
    group.add(point(new T.Vector3(0, 0, d.draft * 0.3), 0xff00ff, 2));

    // Bulb center (Orange point)
    if (d.abt > 0) {
      group.add(point(new T.Vector3(L + 0.035 * L, 0, d.hb), 0xffa500, 2.5));
    }

    this.group.add(group);
  }

  layer(name, on) {
    const map = {
      surface: this.surface?.mesh,
      wireframe: this.surface?.wire,
      stations: this.stations,
      buttocks: this.buttocks,
      waterlines: this.waterlines,
      grid: this.grid,
      axes: this.axes,
      labels: this.references,
      bounds: this.surface?.wire
    };
    if (map[name]) map[name].visible = on;
    this.render();
  }

  action(a) {
    if (a === 'reset') this.camera.fit(this.surface.mesh.geometry);
    if (a === 'camera') this.camera.setOrtho(!this.camera.orthographic);
    if (a === 'wireframe') this.layer('wireframe', !this.surface.wire.visible);
    if (a === 'screenshot') this.exports.screenshot();
    if (a === 'fullscreen') this.el.parentElement.requestFullscreen?.();
    if (a === 'grid') this.layer('grid', !this.grid.visible);
    if (a === 'labels') this.layer('stations', !this.stations.visible);
    this.render();
  }

  resize() {
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    if (!w || !h) return;
    this.rendererManager.resize(w, h);
    this.camera.resize(w, h);
    this.render(true);
  }

  countSceneObjects() {
    let count = 0;
    this.scene.traverse(() => { count++; });
    return count;
  }

  render(force = false) {
    if (force) {
      this.dirty = false;
    }
    if (this.dirty) return;
    this.dirty = true;
    requestAnimationFrame(() => {
      if (!this.hasLoggedAnimate) {
        console.info("Animation loop running");
        this.hasLoggedAnimate = true;
      }
      this.dirty = false;
      try {
        if (!this.hasLoggedRender) {
          console.info("Renderer.render() executing");
          this.hasLoggedRender = true;
        }
        this.scene.updateMatrixWorld(true);
        this.renderer.render(this.scene, this.camera.camera);
        
        if (this.debugPanel && this.debugPanel.enabled && this.geomStats) {
          const stats = {
            vertexCount: this.geomStats.vertexCount,
            triangleCount: this.geomStats.triangleCount,
            boundingBox: this.geomStats.boundingBox,
            boundingSphere: this.geomStats.boundingSphere,
            cameraPos: this.camera.camera.position,
            orbitTarget: this.camera.target,
            sceneObjectCount: this.countSceneObjects()
          };
          this.debugPanel.update(stats);
        }
      } catch (error) {
        console.error(error);
      }
    });
  }
}
