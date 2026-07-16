const T = window.THREE;

export class HullGenerator {
  constructor(data, stations = 120, divisions = 80) {
    this.d = data;
    this.stations = stations;
    this.divisions = divisions;
  }

  validateInputs() {
    const d = this.d;
    if (!d) throw new Error("Vessel data is missing.");
    if (d.lwl <= 0) throw new Error("LWL must be greater than 0.");
    if (d.beam <= 0) throw new Error("Beam must be greater than 0.");
    if (d.draft <= 0) throw new Error("Draft must be greater than 0.");
    if (d.cb < 0.1 || d.cb > 1.0) throw new Error("Block Coefficient (Cb) must be between 0.1 and 1.0.");
    if (d.cm < 0.1 || d.cm > 1.0) throw new Error("Midship Coefficient (Cm) must be between 0.1 and 1.0.");
    if (d.cwp < 0.1 || d.cwp > 1.0) throw new Error("Waterplane Coefficient (Cwp) must be between 0.1 and 1.0.");
  }

  breadth(u) {
    const d = this.d;
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

  point(u, v) {
    const d = this.d;
    let b = this.breadth(u);
    const fullness = .86 + .14 * d.cm;
    
    // v goes from 0 (port sheer) to 0.5 (keel) to 1.0 (starboard sheer)
    const angle = v * Math.PI;
    const factor = Math.sin(angle); // 0 at sheer, 1 at keel, 0 at sheer
    
    const cosAngle = Math.cos(angle);
    let y = -b * cosAngle * (0.94 + .06 * cosAngle ** 2);
    
    // z goes from draft (port sheer) to 0 (keel) to draft (starboard sheer)
    let z = d.draft * (1 - Math.pow(factor, fullness));
    
    const sheer = .025 * d.draft * Math.sin(Math.PI * u) * (1 - factor);
    
    // Naval Architecture coordinates: AP at X = 0, FP at X = LPP
    let x = u * d.lpp;

    // BULBOUS BOW (If abt > 0)
    if (d.abt > 0 && u > 0.82) {
      const t_bulb = (u - 0.82) / 0.18;
      const r_bulb = Math.sqrt(d.abt / Math.PI);
      const z_bulb = d.hb;
      
      const bulb_r = r_bulb * Math.sin(t_bulb * Math.PI * 0.5);
      const bulb_x_ext = 0.035 * d.lpp * Math.pow(t_bulb, 2);
      
      const bulb_y = -bulb_r * cosAngle;
      const bulb_z = z_bulb + bulb_r * (1 - factor);
      
      y = y * (1 - t_bulb) + bulb_y * t_bulb;
      z = z * (1 - t_bulb) + bulb_z * t_bulb;
      x += bulb_x_ext;
    }

    return new T.Vector3(x, y, z + sheer);
  }

  section(u) {
    const p = [];
    for (let j = 0; j <= this.divisions; j++) {
      p.push(this.point(u, j / this.divisions));
    }
    return p;
  }

  build() {
    this.validateInputs();
    const p = [];
    const ind = [];
    
    for (let i = 0; i <= this.stations; i++) {
      for (let j = 0; j <= this.divisions; j++) {
        const q = this.point(i / this.stations, j / this.divisions);
        p.push(q.x, q.y, q.z);
      }
    }
    
    for (let i = 0; i < this.stations; i++) {
      for (let j = 0; j < this.divisions; j++) {
        const a = i * (this.divisions + 1) + j;
        const b = a + this.divisions + 1;
        ind.push(a, b, a + 1);
        ind.push(b, b + 1, a + 1);
      }
    }
    
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    g.setIndex(ind);
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}
