const T = window.THREE;
import { HullParameters } from '../hull/HullParameters.js';
import { ReferenceSystem } from '../hull/ReferenceSystem.js';
import { SheerLine } from '../curves/SheerLine.js';
import { KeelLine } from '../curves/KeelLine.js';
import { StemCurve } from '../curves/StemCurve.js';
import { SternCurve } from '../curves/SternCurve.js';
import { BulbCurve } from '../curves/BulbCurve.js';
import { StationGenerator } from '../curves/StationGenerator.js';
import { WaterlineGenerator } from '../curves/WaterlineGenerator.js';
import { ButtockGenerator } from '../curves/ButtockGenerator.js';
import { DiagonalGenerator } from '../curves/DiagonalGenerator.js';
import { LoftSurface } from '../fairing/LoftSurface.js';
import { SurfaceTriangulation } from './SurfaceTriangulation.js';
import { SurfaceIntersection } from '../fairing/SurfaceIntersection.js';
import { getPresetParameters } from '../hull/VesselPresets.js';

export class HullMeshBuilder {
  constructor(data, shipType = "Bulk Carrier") {
    const presetData = getPresetParameters(shipType, data);
    this.p = new HullParameters(presetData);
    this.p.lpp = data.lpp || 100;
    this.p.beam = data.beam || 18;
    this.p.draft = data.draft || 5.5;
    this.p.lcb = data.lcb || 0;
    this.p.abt = data.abt || 0;
    this.p.hb = data.hb || 0;
    this.p.at = data.at || 0;

    this.ref = new ReferenceSystem(this.p, 41); // 41 stations
    this.sheerLine = new SheerLine(this.ref);
    this.keelLine = new KeelLine(this.ref);
    this.stemCurve = new StemCurve(this.ref, this.sheerLine);
    this.sternCurve = new SternCurve(this.ref, this.sheerLine);
    this.bulbCurve = new BulbCurve(this.ref);
    
    this.stationGen = new StationGenerator(this.ref, this.sheerLine);
    this.waterlineGen = new WaterlineGenerator(this.ref, this.stationGen);
    this.buttockGen = new ButtockGenerator(this.ref, this.stationGen);
    this.diagonalGen = new DiagonalGenerator(this.ref, this.stationGen);
    
    this.grid = null;
    this.intersection = null;
  }

  buildHullGeometry() {
    const rawStations = [];
    const numStations = this.ref.numStations;
    
    for (let i = 0; i < numStations; i++) {
      const u = i / (numStations - 1);
      const points = this.stationGen.getStationPoints(u, 40); // 81 points
      rawStations.push(points);
    }
    
    const loftEngine = new LoftSurface(rawStations);
    this.grid = loftEngine.loft(120); // 120 longitudinal divisions
    this.intersection = new SurfaceIntersection(this.grid);
    
    const vertices = [];
    const numLong = this.grid.length;
    const numDiv = this.grid[0].length;
    
    for (let i = 0; i < numLong; i++) {
      for (let j = 0; j < numDiv; j++) {
        const pt = this.grid[i][j];
        vertices.push(pt.x, pt.y, pt.z);
      }
    }
    
    const indices = SurfaceTriangulation.triangulate(numLong, numDiv);
    
    const geom = new T.BufferGeometry();
    geom.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
    
    return geom;
  }

  buildBulbGeometry() {
    if (this.p.abt <= 0) return null;
    
    const bulbPoints = this.bulbCurve.getPoints(20);
    if (bulbPoints.length === 0) return null;
    
    const vertices = [];
    const indices = [];
    const slices = 16;
    
    for (let i = 0; i < bulbPoints.length; i++) {
      const pt = bulbPoints[i];
      const r_local = Math.sqrt(this.p.abt / Math.PI) * Math.sin((i / (bulbPoints.length - 1)) * Math.PI);
      
      for (let j = 0; j < slices; j++) {
        const phi = (j / slices) * Math.PI * 2;
        const y = r_local * Math.sin(phi);
        const z = pt.z + r_local * Math.cos(phi);
        vertices.push(pt.x, y, z);
      }
    }
    
    for (let i = 0; i < bulbPoints.length - 1; i++) {
      for (let j = 0; j < slices; j++) {
        const next_j = (j + 1) % slices;
        const a = i * slices + j;
        const b = a + slices;
        const c = i * slices + next_j;
        const d = c + slices;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    
    const geom = new T.BufferGeometry();
    geom.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
    
    return geom;
  }
}
