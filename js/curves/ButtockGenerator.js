const T = window.THREE;
import { BSpline } from '../fairing/BSpline.js';

export class ButtockGenerator {
  constructor(ref, stationGen) {
    this.ref = ref;
    this.p = ref.p;
    this.stationGen = stationGen;
  }

  getButtockPoints(yOffset, numPoints = 60) {
    const stations = [];
    const numStations = 21;
    
    for (let i = 0; i < numStations; i++) {
      const u = i / (numStations - 1);
      const B_x = this.stationGen.breadth(u);
      
      // Calculate Z height where Y matches yOffset
      let z = 0;
      if (Math.abs(yOffset) < B_x) {
        const ratio = Math.abs(yOffset) / B_x;
        z = this.p.draft * Math.pow(ratio, 1.5);
      } else {
        z = this.p.draft; // above the deck/sheer
      }
      
      const x = this.ref.ap + u * this.p.lpp;
      stations.push(new T.Vector3(x, yOffset, z));
    }
    
    const spline = new BSpline(stations, 3);
    return spline.getCurvePoints(numPoints);
  }
}
