const T = window.THREE;
import { BSpline } from '../fairing/BSpline.js';

export class SternCurve {
  constructor(ref, sheerLine) {
    this.ref = ref;
    this.p = ref.p;
    this.sheerLine = sheerLine;
  }

  getPoints(numPoints = 20) {
    const xAP = this.ref.ap;
    const zSheer = this.sheerLine.getSheerZ(0.0);
    
    let ctrlPoints = [];
    
    if (this.p.at > 0) {
      // Transom stern: Flat transom drop from sheer to transom height
      const zTransomLimit = this.p.draft * 0.45;
      ctrlPoints = [
        new T.Vector3(xAP, 0, 0), // Keel at AP
        new T.Vector3(xAP - 0.015 * this.p.lpp, 0, zTransomLimit * 0.5),
        new T.Vector3(xAP - 0.02 * this.p.lpp, 0, zTransomLimit), // Transom bottom
        new T.Vector3(xAP - 0.02 * this.p.lpp, 0, zSheer) // Transom top at sheer
      ];
    } else {
      // Cruiser stern: Curved overhang aft of AP
      ctrlPoints = [
        new T.Vector3(xAP, 0, 0), // Keel at AP
        new T.Vector3(xAP - 0.02 * this.p.lpp, 0, zSheer * 0.35),
        new T.Vector3(xAP - 0.04 * this.p.lpp, 0, zSheer * 0.75),
        new T.Vector3(xAP - 0.03 * this.p.lpp, 0, zSheer) // Overhang head at sheer
      ];
    }

    const spline = new BSpline(ctrlPoints, 3);
    return spline.getCurvePoints(numPoints);
  }
}
