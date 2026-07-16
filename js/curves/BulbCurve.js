const T = window.THREE;
import { BSpline } from '../fairing/BSpline.js';

export class BulbCurve {
  constructor(ref) {
    this.ref = ref;
    this.p = ref.p;
  }

  getPoints(numPoints = 20) {
    if (this.p.abt <= 0) return [];
    
    const xFP = this.ref.fp;
    const r_bulb = Math.sqrt(this.p.abt / Math.PI);
    const z_bulb = this.p.hb;
    const l_bulb = 0.035 * this.p.lpp; // Bulb extension length forward
    
    // Bulbous bow contour points
    const ctrlPoints = [
      new T.Vector3(xFP, 0, 0), // Base blend
      new T.Vector3(xFP + l_bulb * 0.45, 0, z_bulb - r_bulb * 0.8), // Bulb underbelly
      new T.Vector3(xFP + l_bulb, 0, z_bulb), // Bulb nose
      new T.Vector3(xFP + l_bulb * 0.45, 0, z_bulb + r_bulb * 0.8), // Bulb top crown
      new T.Vector3(xFP, 0, z_bulb * 1.5) // Re-blend to bow stem
    ];

    const spline = new BSpline(ctrlPoints, 3);
    return spline.getCurvePoints(numPoints);
  }
}
