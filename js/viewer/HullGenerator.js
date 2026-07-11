const T = window.THREE;

// Fair, station-driven display hull: no engineering values are calculated or changed here.
export class HullGenerator {
  constructor(data, stations = 120, divisions = 80) { this.d = data; this.stations = stations; this.divisions = divisions; }
  breadth(u) {
    const d = this.d, bow = Math.pow(Math.sin(Math.PI * u), 0.38 + (1 - d.cb) * .5);
    const asymmetry = 1 - .10 * Math.max(0, u - .72) / .28;
    return d.beam * .5 * bow * (.78 + .22 * d.cwp) * asymmetry;
  }
  point(u, v) {
    const d = this.d, phi = Math.PI * 2 * v;
    const b = this.breadth(u), fullness = .86 + .14 * d.cm;
    // A smooth rounded bilge: keel at phi 0/2π, sheer at phi π.
    const y = b * Math.sin(phi) * (0.94 + .06 * Math.sin(phi) ** 2);
    const z = d.draft * Math.pow(Math.sin(phi * .5), fullness);
    const sheer = .025 * d.draft * Math.sin(Math.PI * u) * Math.sin(phi * .5);
    // Centre the display geometry on the world origin; baseline is at -T/2.
    return new T.Vector3((u - .5) * d.lpp, y, z + sheer - d.draft * .5);
  }
  section(u) { const p=[]; for(let j=0;j<=this.divisions;j++) p.push(this.point(u,j/this.divisions)); return p; }
  build() {
    const p=[], ind=[];
    for(let i=0;i<=this.stations;i++) for(let j=0;j<=this.divisions;j++) { const q=this.point(i/this.stations,j/this.divisions); p.push(q.x,q.y,q.z); }
    for(let i=0;i<this.stations;i++) for(let j=0;j<this.divisions;j++) { const a=i*(this.divisions+1)+j,b=a+this.divisions+1; ind.push(a,b,a+1,b,b+1,a+1); }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ind);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
  }
}
