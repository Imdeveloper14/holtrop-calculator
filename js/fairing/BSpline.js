const T = window.THREE;

export class BSpline {
  constructor(controlPoints, degree = 3) {
    this.points = controlPoints; // Array of THREE.Vector3
    this.p = degree;
    this.n = controlPoints.length - 1;
    this.knots = [];
    this.generateKnots();
  }

  generateKnots() {
    // Clamped/uniform knots vector
    const numKnots = this.n + this.p + 2;
    this.knots = new Array(numKnots);
    for (let i = 0; i <= this.p; i++) {
      this.knots[i] = 0;
    }
    for (let i = this.p + 1; i < this.n + 1; i++) {
      this.knots[i] = (i - this.p) / (this.n - this.p + 1);
    }
    for (let i = this.n + 1; i < numKnots; i++) {
      this.knots[i] = 1.0;
    }
  }

  basis(i, k, t) {
    if (k === 0) {
      return (t >= this.knots[i] && t < this.knots[i + 1]) ||
             (t === 1.0 && i === this.n) ? 1.0 : 0.0;
    }

    let denom1 = this.knots[i + k] - this.knots[i];
    let denom2 = this.knots[i + k + 1] - this.knots[i + 1];

    let w1 = 0;
    let w2 = 0;

    if (denom1 > 0) {
      w1 = ((t - this.knots[i]) / denom1) * this.basis(i, k - 1, t);
    }
    if (denom2 > 0) {
      w2 = ((this.knots[i + k + 1] - t) / denom2) * this.basis(i + 1, k - 1, t);
    }

    return w1 + w2;
  }

  getPoint(t) {
    t = Math.max(0.0, Math.min(1.0, t));
    const pt = new T.Vector3(0, 0, 0);
    for (let i = 0; i <= this.n; i++) {
      const b = this.basis(i, this.p, t);
      pt.addScaledVector(this.points[i], b);
    }
    return pt;
  }

  getCurvePoints(numPoints = 50) {
    const pts = [];
    for (let i = 0; i < numPoints; i++) {
      pts.push(this.getPoint(i / (numPoints - 1)));
    }
    return pts;
  }
}
