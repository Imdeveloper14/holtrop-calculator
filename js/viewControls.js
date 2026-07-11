/* Lightweight Orbit/Pan/Zoom controller so the viewer has no addon dependency. */
(function(global){'use strict';
  function ViewControls(camera, element, target, change){this.camera=camera;this.el=element;this.target=target;this.change=change;this.theta=.68;this.phi=1.05;this.radius=80;this.drag=null;this.enabled=true;this.bind();this.update();}
  ViewControls.prototype.bind=function(){const self=this;
    this.el.addEventListener('pointerdown',e=>{self.drag={x:e.clientX,y:e.clientY,pan:e.button===2};self.el.setPointerCapture(e.pointerId);});
    this.el.addEventListener('pointermove',e=>{if(!self.drag)return;const dx=e.clientX-self.drag.x,dy=e.clientY-self.drag.y;self.drag.x=e.clientX;self.drag.y=e.clientY;if(self.drag.pan){const scale=self.radius/500;const right=new THREE.Vector3().setFromMatrixColumn(self.camera.matrix,0);const up=new THREE.Vector3().setFromMatrixColumn(self.camera.matrix,1);self.target.addScaledVector(right,-dx*scale).addScaledVector(up,dy*scale);}else{self.theta-=dx*.008;self.phi=Math.max(.08,Math.min(Math.PI-.08,self.phi-dy*.008));}self.update();});
    this.el.addEventListener('pointerup',()=>self.drag=null);this.el.addEventListener('contextmenu',e=>e.preventDefault());
    this.el.addEventListener('wheel',e=>{e.preventDefault();self.radius=Math.max(3,Math.min(1000,self.radius*Math.exp(e.deltaY*.001)));self.update();},{passive:false});
  };
  ViewControls.prototype.update=function(){const s=Math.sin(this.phi);this.camera.position.set(this.target.x+this.radius*s*Math.cos(this.theta),this.target.y+this.radius*s*Math.sin(this.theta),this.target.z+this.radius*Math.cos(this.phi));this.camera.lookAt(this.target);this.change();};
  ViewControls.prototype.setView=function(name,scale){this.target.set(0,0,scale.draft*.45);this.radius=Math.max(scale.lpp,scale.beam*3)*1.05;const p={iso:[.68,1.05],top:[0,.03],side:[0,Math.PI/2],front:[Math.PI/2,Math.PI/2],aft:[-Math.PI/2,Math.PI/2],bottom:[0,Math.PI-.03],section:[.18,Math.PI/2]}[name]||[.68,1.05];this.theta=p[0];this.phi=p[1];this.update();};
  ViewControls.prototype.reset=function(scale){this.setView('iso',scale);};global.ViewControls=ViewControls;
}(window));
