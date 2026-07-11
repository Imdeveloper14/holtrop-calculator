const T=window.THREE;
export class OrientationCube { constructor(){this.group=new T.Group();const cube=new T.Mesh(new T.BoxGeometry(2,2,2),new T.MeshBasicMaterial({color:0x1976d2,wireframe:true,transparent:true,opacity:.9}));this.group.add(cube);this.group.position.set(-7,-7,7);this.group.renderOrder=10;} update(camera){this.group.quaternion.copy(camera.quaternion).invert();} }
