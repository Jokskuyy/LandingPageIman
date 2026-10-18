import * as THREE from './vendor/three/three.module.js';

// Fictional surfaces echo each project's subject; project facts stay in HTML.
const palettes = [
  ['#182e44', '#35566d', '#638799', '#b2cbd0'],
  ['#173e3f', '#296762', '#5c9d85', '#a4cdb1'],
  ['#342626', '#654334', '#a96b43', '#d9aa72'],
  ['#292b48', '#515375', '#8a8fb1', '#d3d9e7']
];

function surface(index, accent) {
  const canvas = document.createElement('canvas'), glow = document.createElement('canvas');
  canvas.width = glow.width = 192; canvas.height = glow.height = 96;
  const context = canvas.getContext('2d'), lights = glow.getContext('2d');
  lights.fillStyle = '#000'; lights.fillRect(0, 0, 192, 96);
  for (let y=0;y<96;y++) for (let x=0;x<192;x++) {
    const u=x/192*Math.PI*2, v=y/96*Math.PI;
    const terrain=Math.sin(u*5+Math.cos(v*7+index))+.5*Math.cos(u*11-v*9)+.22*Math.sin(u*23+v*19);
    const level=THREE.MathUtils.clamp(Math.floor((terrain+1.7)/3.4*4),0,3);
    context.fillStyle=palettes[index][level]; context.fillRect(x,y,1,1);
    if ((index===0 && level===1 && x%7<2 && y%6<2) || (index===1 && level===0 && x%4===0 && y%3===0) || (index===2 && Math.abs(terrain+.2)<.055) || (index===3 && Math.abs(terrain-.7)<.045)) {
      lights.fillStyle=accent; lights.fillRect(x,y,index===0?2:1,1);
    }
  }
  for (let i=0;i<24;i++) {
    const x=(i*73+index*29)%192, y=14+(i*31+index*7)%68, r=2+(i*7)%6;
    context.strokeStyle=palettes[index][3]+'85'; context.lineWidth=1;
    context.fillStyle=palettes[index][0]+'bb';
    for (const shift of [-192,0,192]) {
      context.beginPath(); context.ellipse(x+shift,y,r,r*.72,0,0,Math.PI*2); context.fill(); context.stroke();
    }
  }
  const texture=image=>{
    const map=new THREE.CanvasTexture(image); map.colorSpace=THREE.SRGBColorSpace;
    map.magFilter=THREE.NearestFilter; return map;
  };
  return {map:texture(canvas),emissiveMap:texture(glow)};
}

export function createProjectMoons(offsets, accents) {
  const group=new THREE.Group(), moons=[], bodies=[], decorations=[], targets=[];
  const geometry=new THREE.SphereGeometry(.6,40,28);
  const metal=new THREE.MeshStandardMaterial({color:0x526874,metalness:.65,roughness:.45});
  offsets.forEach((position,index)=>{
    const moon=new THREE.Group(); moon.position.copy(position); group.add(moon); moons.push(moon);
    const material=new THREE.MeshStandardMaterial({...surface(index,accents[index]),roughness:.88,bumpScale:.035,emissive:0xffffff,emissiveIntensity:.55});
    material.bumpMap=material.map;
    const body=new THREE.Mesh(geometry,material); body.scale.setScalar([1,.94,1.05,.92][index]);
    body.userData.project=index; moon.add(body); bodies.push(body);
    const halo=new THREE.Mesh(geometry,new THREE.ShaderMaterial({
      uniforms:{tint:{value:new THREE.Color(accents[index])}},
      vertexShader:'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal); v=normalize(-p.xyz); gl_Position=projectionMatrix*p;}',
      fragmentShader:'uniform vec3 tint; varying vec3 n; varying vec3 v; void main(){float edge=pow(1.0-abs(dot(normalize(n),normalize(v))),3.0); gl_FragColor=vec4(tint,edge*.28);}',
      transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending
    })); halo.scale.copy(body.scale).multiplyScalar(1.07); moon.add(halo);
    const light=new THREE.MeshBasicMaterial({color:accents[index]});
    const orbital=new THREE.Group(); moon.add(orbital); decorations.push(orbital);
    if (index===0) {
      // A small survey satellite above the blue archive moon.
      const satellite=new THREE.Group(); satellite.position.set(-.16,.83,.1); satellite.rotation.z=-.3;
      satellite.add(new THREE.Mesh(new THREE.BoxGeometry(.16,.12,.12),metal));
      for (const side of [-1,1]) {
        const panel=new THREE.Mesh(new THREE.BoxGeometry(.27,.015,.17),new THREE.MeshStandardMaterial({color:0x183e58,metalness:.6,roughness:.38,emissive:0x22607b,emissiveIntensity:.4}));
        panel.position.x=side*.23; satellite.add(panel);
      }
      const beacon=new THREE.Mesh(new THREE.SphereGeometry(.028,8,6),light); beacon.position.y=.085; satellite.add(beacon); orbital.add(satellite);
    } else if (index===1) {
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.82,.013,5,72),light); ring.rotation.set(.9,.3,-.4); orbital.add(ring);
      for (let i=0;i<3;i++) {
        const node=new THREE.Mesh(new THREE.OctahedronGeometry(.055),light);
        node.position.set(Math.cos(i*Math.PI*2/3)*.82,Math.sin(i*Math.PI*2/3)*.82,0); ring.add(node);
      }
    } else if (index===2) {
      for (let i=0;i<9;i++) {
        const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.04+(i%3)*.015,0),metal);
        const angle=i/9*Math.PI*2; rock.position.set(Math.cos(angle)*.92,Math.sin(angle)*.25,Math.sin(angle)*.85); rock.rotation.set(i,i*.7,0); orbital.add(rock);
      }
    } else {
      for (const [radius,angle] of [[.83,.25],[.92,Math.PI]]) {
        const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.012,4,72,Math.PI*1.25),light);
        ring.rotation.set(1.05,.25,angle); orbital.add(ring);
      }
    }
    const target=new THREE.Group(); target.visible=false; moon.add(target); targets.push(target);
    const targetMaterial=new THREE.MeshBasicMaterial({color:accents[index],transparent:true,opacity:.85,depthWrite:false});
    for (const rotation of [0,Math.PI]) {
      const arc=new THREE.Mesh(new THREE.TorusGeometry(1.05,.012,4,36,Math.PI*.35),targetMaterial);
      arc.rotation.z=rotation; target.add(arc);
    }
  });
  return {group,moons,bodies,update(time,camera,selected){
    bodies.forEach((body,index)=>{
      body.rotation.set(.15+index*.18,index*.8+time*.055,0);
      body.material.emissiveIntensity=index===selected ? .9 : .55;
      decorations[index].rotation.y=time*.035*(index%2?-1:1);
      targets[index].visible=index===selected;
      if (targets[index].visible) { targets[index].quaternion.copy(camera.quaternion); targets[index].rotation.z+=time*.12; }
    });
  }};
}
