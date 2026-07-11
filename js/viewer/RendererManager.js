const T = window.THREE;
export class RendererManager {
  constructor(host) { this.renderer = new T.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true, alpha:false }); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=T.PCFSoftShadowMap; this.renderer.localClippingEnabled=true; host.appendChild(this.renderer.domElement); }
  resize(width,height) { this.renderer.setSize(Math.max(1,width),Math.max(1,height),false); }
}
