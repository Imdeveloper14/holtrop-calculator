const T = window.THREE;
import { BSpline } from '../fairing/BSpline.js';

export class WaterlineGenerator {
  constructor(ref, stationGen) {
    this.ref = ref;
    this.p = ref.p;
    this.stationGen = stationGen;
  }

  getWaterlinePoints(zHeight, numPoints = 60) {
    const stations = [];
    const numStations = 21;
    
    for (let i = 0; i < numStations; i++) {
      const u = i / (numStations - 1);
      const B_x = this.stationGen.breadth(u);
      const zRatio = Math.max(0, Math.min(1.0, zHeight / this.p.draft));
      const y = B_x * Math.pow(zRatio, 0.45 + (1 - this.p.cb) * 0.2);
      const x = this.ref.ap + u * this.p.lpp;
      stations.push(new T.Vector3(x, y, zHeight));
    }
    
    const spline = new BSpline(stations, 3);
    const ptsStarboard = spline.getCurvePoints(numPoints);
    const ptsPort = ptsStarboard.map(pt => new T.Vector3(pt.x, -pt.y, pt.z)).reverse();
    
    ptsPort.pop();
    return ptsPort.concat(ptsStarboard);
  }
}
