const T = window.THREE;
import { BSpline } from '../fairing/BSpline.js';

export class StationGenerator {
  constructor(ref, sheerLine) {
    this.ref = ref;
    this.p = ref.p;
    this.sheerLine = sheerLine;
  }

  breadth(u) {
    const d = this.p;
    const mid = 0.55;
    let factor = 0;
    
    if (u < mid) {
      const t = u / mid;
      if (d.at > 0) {
        const transomFactor = 0.3 * Math.min(1.0, d.at / (d.beam * d.draft));
        factor = transomFactor + (1 - transomFactor) * Math.sin(t * Math.PI * 0.5);
      } else {
        factor = Math.sin(t * Math.PI * 0.5);
      }
    } else {
      const t = (1 - u) / (1 - mid);
      factor = Math.sin(t * Math.PI * 0.5);
    }
    
    const bowFactor = Math.pow(factor, 0.4 + (1 - d.cb) * 0.4);
    return d.beam * 0.5 * bowFactor;
  }

  getStationPoints(u, divisions = 40) {
    const B_x = this.breadth(u);
    const T_x = this.p.draft;
    const Z_sheer = this.sheerLine.getSheerZ(u);
    const x = this.ref.ap + u * this.p.lpp;
    
    // Construct control points for starboard side
    const ctrlStarboard = [
      new T.Vector3(x, 0, 0), // Keel
      new T.Vector3(x, B_x * this.p.cm * 0.35, 0), // Flat bottom
      new T.Vector3(x, B_x * (0.7 + 0.3 * this.p.cm), T_x * (1 - this.p.cm) * 0.25), // Bilge corner
      new T.Vector3(x, B_x, T_x * 0.75), // Side wall
      new T.Vector3(x, B_x, Z_sheer) // Sheer line deck edge
    ];

    const splineStarboard = new BSpline(ctrlStarboard, 3);
    const ptsStarboard = splineStarboard.getCurvePoints(divisions + 1);

    // Mirror points to get the port side
    const ptsPort = ptsStarboard.map(pt => new T.Vector3(pt.x, -pt.y, pt.z)).reverse();
    
    // Combine to get single continuous section curve from Port sheer to Starboard sheer
    ptsPort.pop(); // Remove duplicate keel point
    return ptsPort.concat(ptsStarboard);
  }
}
