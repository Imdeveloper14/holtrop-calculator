const T = window.THREE;
export function makeStations(generator) { const group=new T.Group();for(let i=0;i<=generator.stations;i+=5){const g=new T.BufferGeometry().setFromPoints(generator.section(i/generator.stations));group.add(new T.Line(g,new T.LineBasicMaterial({color:0x3bcbd0,transparent:true,opacity:.58})));}return group; }
export function stationLine(generator, percent) { const g=new T.BufferGeometry().setFromPoints(generator.section(percent/100));return new T.Line(g,new T.LineBasicMaterial({color:0xffcf62})); }
