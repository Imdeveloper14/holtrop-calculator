const T = window.THREE;
import { BSpline } from '../fairing/BSpline.js';

export class DiagonalGenerator {
  constructor(ref, stationGen) {
    this.ref = ref;
    this.p = ref.p;
    this.stationGen = stationGen;
  }

  getDiagonalPoints(angleRatio = 0.5, numPoints = 60) {
    // Generates a diagonal curve at an angle between vertical and horizontal
    const stations = [];
    const numStations = 21;
    
    for (let i = 0; i < numStations; i++) {
      const u = i / (numStations - 1);
      const B_x = this.stationGen.breadth(u);
      
      // Interpolate diagonal intersection
      const y = B_x * angleRatio;
      const z = this.p.draft * (1 - angleRatio);
      const x = this.ref.ap + u * this.p.lpp;
      stations.push(new T.Vector3(x, y, z));
    }
    
    const spline = new BSpline(stations, 3);
    const ptsStarboard = spline.getCurvePoints(numPoints);
    return ptsStarboard;
  }
}
