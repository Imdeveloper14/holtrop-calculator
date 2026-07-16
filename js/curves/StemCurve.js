const T = window.THREE;
import { BSpline } from '../fairing/BSpline.js';

export class StemCurve {
  constructor(ref, sheerLine) {
    this.ref = ref;
    this.p = ref.p;
    this.sheerLine = sheerLine;
  }

  getPoints(numPoints = 20) {
    // Generate Stem Profile Points at bow (u = 1.0)
    // Runs from keel up to sheer height
    const xFP = this.ref.fp;
    const zSheer = this.sheerLine.getSheerZ(1.0);
    
    // Control points for bow stem curve
    const ctrlPoints = [
      new T.Vector3(xFP, 0, 0), // Keel at FP
      new T.Vector3(xFP + 0.01 * this.p.lpp, 0, zSheer * 0.4), // Raked forward
      new T.Vector3(xFP + 0.02 * this.p.lpp, 0, zSheer * 0.8), // Flared stem
      new T.Vector3(xFP + 0.02 * this.p.lpp, 0, zSheer) // Stem head at sheer
    ];

    const spline = new BSpline(ctrlPoints, 3);
    return spline.getCurvePoints(numPoints);
  }
}
