const T = window.THREE;
export class HullSurface {
  constructor(geometry) { this.material=new T.MeshPhysicalMaterial({color:0x062a4d,metalness:.18,roughness:.3,clearcoat:.28,transparent:true,opacity:.94,side:T.DoubleSide,clippingPlanes:[]});this.mesh=new T.Mesh(geometry,this.material);this.mesh.name='Fair displacement hull';this.mesh.castShadow=true;this.mesh.receiveShadow=true;this.wire=new T.LineSegments(new T.WireframeGeometry(geometry),new T.LineBasicMaterial({color:0x83c9e8,transparent:true,opacity:.7}));this.wire.visible=false; }
  set opacity(value) { this.material.opacity=value; this.material.transparent=value<1; this.material.needsUpdate=true; }
}
