const T = window.THREE;
export class SceneManager { constructor(){this.scene=new T.Scene();this.scene.background=new T.Color(0x1e232a);this.scene.add(new T.HemisphereLight(0xa9c4dc,0x111820,2));this.scene.add(new T.AmbientLight(0xffffff,.28));const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(-80,-90,140);key.castShadow=true;key.shadow.mapSize.set(1024,1024);this.scene.add(key);} }
