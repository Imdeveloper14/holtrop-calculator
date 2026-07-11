/* Procedural, display-only hull geometry. Dimensions are in metres. */
(function (global) {
  'use strict';
  const T = global.THREE;
  function line(points, color, opacity) {
    const g = new T.BufferGeometry().setFromPoints(points);
    return new T.Line(g, new T.LineBasicMaterial({ color, transparent: opacity !== undefined, opacity: opacity || 1 }));
  }
  function HullGeometryBuilder(data) { this.data = data; this.nx = 32; this.ny = 18; }
  HullGeometryBuilder.prototype.section = function (u, v) {
    const d = this.data, L = d.lpp, Tdraft = d.draft;
    const fullness = 0.72 + 0.28 * d.cwp;
    const end = Math.pow(Math.sin(Math.PI * u), 0.42 + (1 - d.cb) * 0.6);
    const vertical = 0.63 + 0.37 * Math.sin(Math.PI * v);
    const halfB = d.beam * 0.5 * end * fullness * vertical;
    const x = (u - 0.5) * L;
    return new T.Vector3(x, (v * 2 - 1) * halfB, v * Tdraft);
  };
  HullGeometryBuilder.prototype.build = function () {
    const d = this.data, pos = [], idx = [], sections = [];
    for (let i = 0; i <= this.nx; i++) {
      const row = [], u = i / this.nx;
      for (let j = 0; j <= this.ny; j++) { const p = this.section(u, j / this.ny); pos.push(p.x, p.y, p.z); row.push(p); }
      sections.push(row);
    }
    for (let i = 0; i < this.nx; i++) for (let j = 0; j < this.ny; j++) {
      const a = i * (this.ny + 1) + j, b = a + this.ny + 1;
      idx.push(a,b,a+1,b,b+1,a+1);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const group = new T.Group(), material = new T.MeshStandardMaterial({color:0x082a4a, metalness:0.18, roughness:0.34, side:T.DoubleSide, transparent:true, opacity:0.93});
    const hull = new T.Mesh(g, material); hull.name = 'Hull surface'; hull.castShadow = true; hull.receiveShadow = true; group.add(hull);
    const wire = new T.LineSegments(new T.WireframeGeometry(g), new T.LineBasicMaterial({color:0x87b9d8})); wire.visible = false; wire.name = 'Wireframe'; group.add(wire);
    if (d.bulb) { const bulb = new T.Mesh(new T.SphereGeometry(1, 20, 12), material.clone()); bulb.name='Bulb'; bulb.scale.set(Math.max(1,d.beam*.08),Math.max(.7,d.beam*.11),Math.max(.6,d.draft*.12)); bulb.position.set(-d.lpp*.49,0,d.draft*.35); group.add(bulb); }
    const layers = { surface: hull, wireframe: wire, stations:new T.Group(), buttocks:new T.Group(), waterlines:new T.Group(), grid:new T.Group(), axes:new T.Group(), labels:new T.Group(), bounds:new T.Group() };
    for (let i=0;i<=this.nx;i+=4) { const pts=sections[i]; layers.stations.add(line(pts,0x39c7c9,.78)); }
    [0.2,.5,.8].forEach(v=>{ const pts=[]; for(let i=0;i<=this.nx;i++) pts.push(this.section(i/this.nx,v)); layers.waterlines.add(line(pts,0x99d8ed,.8)); });
    [-.55,0,.55].forEach(yf=>{const pts=[]; for(let i=0;i<=this.nx;i++){const u=i/this.nx, p=this.section(u,.5); pts.push(new T.Vector3(p.x,p.y*yf*2,d.draft*.5));} layers.buttocks.add(line(pts,0x7fb8cc,.7));});
    const span=Math.max(d.lpp,d.beam)*.62; const grid=new T.GridHelper(span*2,20,0x33576d,0x183448); grid.rotation.x=Math.PI/2; grid.position.z=0; layers.grid.add(grid);
    layers.axes.add(line([new T.Vector3(-d.lpp*.58,0,0),new T.Vector3(d.lpp*.58,0,0)],0xff4b4b));
    layers.axes.add(line([new T.Vector3(0,-d.beam*.7,0),new T.Vector3(0,d.beam*.7,0)],0x4bff75));
    layers.axes.add(line([new T.Vector3(0,0,0),new T.Vector3(0,0,d.draft*1.35)],0x4b83ff));
    const reference = new T.Group(); reference.name='Reference geometry';
    const ref=[['Baseline',new T.Vector3(-d.lpp/2,0,0),new T.Vector3(d.lpp/2,0,0)],['Waterline',new T.Vector3(-d.lwl/2,0,d.draft),new T.Vector3(d.lwl/2,0,d.draft)],['FP',new T.Vector3(-d.lpp/2,-d.beam*.55,0),new T.Vector3(-d.lpp/2,-d.beam*.55,d.draft*1.2)],['AP',new T.Vector3(d.lpp/2,-d.beam*.55,0),new T.Vector3(d.lpp/2,-d.beam*.55,d.draft*1.2)],['Midship',new T.Vector3(0,-d.beam*.55,0),new T.Vector3(0,-d.beam*.55,d.draft*1.2)],['LCB',new T.Vector3(d.lcb||0,0,0),new T.Vector3(d.lcb||0,0,d.draft*1.1)]];
    ref.forEach(r=>{ reference.add(line([r[1],r[2]],0xd6dee5)); this.label(r[0],r[2],layers.labels); }); group.add(reference);
    const box=new T.Box3().setFromObject(hull); layers.bounds.add(new T.Box3Helper(box,0xffcf4b));
    Object.keys(layers).forEach(k=>group.add(layers[k])); layers.bounds.visible=false;
    return { group, hull, geometry:g, sections, layers, bounds:box };
  };
  HullGeometryBuilder.prototype.label=function(text,position,group){const c=document.createElement('canvas');c.width=256;c.height=48;const x=c.getContext('2d');x.font='600 20px Arial';x.fillStyle='#eaf4fa';x.fillText(text,5,28);const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthTest:false}));s.position.copy(position);s.scale.set(2.8,.53,1);group.add(s);};
  global.HullGeometryBuilder = HullGeometryBuilder;
}(window));
