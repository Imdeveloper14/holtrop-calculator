const T = window.THREE;
import { BSpline } from '../fairing/BSpline.js';

export class SheerLine {
  constructor(ref) {
    this.ref = ref;
    this.p = ref.p;
  }

  getSheerZ(u) {
    // Standard parabolic sheer curve (lowest at u = 0.55 midship)
    // Bow rises to sheer height, stern rises slightly less
    const x = this.ref.ap + u * this.p.lpp;
    const mid = 0.55;
    const standardSheerBow = 0.05 * this.p.draft; // Rise at FP
    const standardSheerStern = 0.02 * this.p.draft; // Rise at AP
    
    let sheerRise = 0;
    if (u < mid) {
      sheerRise = standardSheerStern * Math.pow((mid - u) / mid, 2);
    } else {
      sheerRise = standardSheerBow * Math.pow((u - mid) / (1 - mid), 2);
    }
    
    return this.p.draft + sheerRise;
  }
}
