// 3D layer: one particle field ("the people of Cebu") that regroups into a
// formation for each scene as the presentation scrolls. If WebGL is unavailable
// the page keeps its plain 2D design.
import * as THREE from './vendor/three.module.min.js';

const scenes=[...document.querySelectorAll('.scene')];
const heroMark=document.querySelector('.hero-mark');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const CAM_Z=10, FOV=45;
const VIEW_H=2*CAM_Z*Math.tan(THREE.MathUtils.degToRad(FOV/2)); // world height visible at z=0

// Tone of each scene's background, read by the shader so particles switch
// colour exactly at section edges: 0 dark, 1 light, 2 blue.
const tones=scenes.map(s=>s.classList.contains('scene-light')||s.classList.contains('scene-cream')?1:s.classList.contains('scene-blue')?2:0);

function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const TAU=Math.PI*2;

// Each formation writes N points into pos (xyz) and hi (0..1 accent weight).
// Units are world units; the visible frame at z=0 is about 8.3 tall.
const formations=[
  // 01 Hero: a core of people inside three orbits, mirroring the hero mark.
  {alpha:1, anchor:'hero', build(N,p,h,r){
    const rings=[[2,0,0],[1.62,.62,.35],[1.26,-.35,-.5]];
    for(let i=0;i<N;i++){
      if(i<N*.42){const u=r()*TAU,v=Math.acos(2*r()-1),rad=.72+r()*.18;
        set(p,i,rad*Math.sin(v)*Math.cos(u),rad*Math.cos(v),rad*Math.sin(v)*Math.sin(u));h[i]=r()<.12?1:0;}
      else{const k=i%3,[R,tx,ty]=rings[k],a=r()*TAU,j=(r()-.5)*.05;
        let x=(R+j)*Math.cos(a),y=(R+j)*Math.sin(a),z=0;
        [y,z]=rot(y,z,tx);[x,z]=rot(x,z,ty);set(p,i,x,y,z);h[i]=k===2?1:0;}
    }}},
  // 02 People: individuals scattered across the frame, a few brighter.
  {alpha:.5, build(N,p,h,r){for(let i=0;i<N;i++){set(p,i,(r()-.5)*15,(r()-.5)*8.5,-3.5+r()*4);h[i]=r()<.05?1:0;}}},
  // 03 Risk: opportunity pools on one side; a sparse group is left behind.
  {alpha:.65, build(N,p,h,r){for(let i=0;i<N;i++){
    if(i<N*.72){const[x,y,z]=ball(r,1.7);set(p,i,x+2.4,y*.9,z);h[i]=r()<.7?1:0;}
    else{const[x,y,z]=ball(r,2.4);set(p,i,x-3.3,y,z*.6-.5);h[i]=0;}}}},
  // 04 Evidence: a field of jobs; roughly one in four lit (ILO: more than 1 in 4 exposed).
  {alpha:.6, build(N,p,h,r){const cols=Math.round(Math.sqrt(N*1.9)),rows=Math.ceil(N/cols);
    for(let i=0;i<N;i++){const c=i%cols,w=Math.floor(i/cols);
      set(p,i,(c/cols-.5)*15,-3.3+(r()-.5)*.04,(w/rows-.5)*4+.5);h[i]=r()<.26?1:0;}}},
  // 05 National direction: DTI, DAP and LGU nodes joined by streams.
  {alpha:.5, side:1, build(N,p,h,r){const n=[[-2.2,-1.3,0],[2.2,-1.3,0],[0,2,0]];
    for(let i=0;i<N;i++){
      if(i<N*.54){const k=i%3,[x,y,z]=ball(r,.62);set(p,i,n[k][0]+x,n[k][1]+y,z);h[i]=1;}
      else{const k=i%3,a=n[k],b=n[(k+1)%3],t=r(),[x,y,z]=ball(r,.12);
        set(p,i,a[0]+(b[0]-a[0])*t+x,a[1]+(b[1]-a[1])*t+y,z);h[i]=0;}}}},
  // 06 Proposition: a bridge across the gap.
  {alpha:.5, build(N,p,h,r){for(let i=0;i<N;i++){
    if(i<N*.4){const s=i%2?1:-1,[x,y,z]=ball(r,.9);set(p,i,s*4+x,-1.8+y*.7,z);h[i]=0;}
    else{const u=r(),x=-4+8*u,y=-1.6+3.2*Math.sin(Math.PI*u),[jx,jy,jz]=ball(r,.22);set(p,i,x+jx,y+jy,jz);h[i]=1;}}}},
  // 07 Six capabilities in a ring.
  {alpha:.42, build(N,p,h,r){for(let i=0;i<N;i++){const k=i%6,a=k/6*TAU+Math.PI/6,[x,y,z]=ball(r,.6);
    set(p,i,Math.cos(a)*2.9+x,Math.sin(a)*2.9+y,z);h[i]=r()<.15?1:0;}}},
  // 08 Product: a platform plane under the Hub mockup.
  {alpha:.45, build(N,p,h,r){const cols=Math.round(Math.sqrt(N*2.2));
    for(let i=0;i<N;i++){const c=i%cols,w=Math.floor(i/cols),rows=Math.ceil(N/cols);
      let x=(c/cols-.5)*12,y=0,z=(w/rows-.5)*6;[y,z]=rot(y,z,1.15);set(p,i,x,y-2.4,z-1);h[i]=(c/cols)<.62&&w%9===0?1:0;}}},
  // 09 The pilot's two jobs: a double helix.
  {alpha:.6, build(N,p,h,r){for(let i=0;i<N;i++){const u=r(),x=(u-.5)*12,a=u*TAU*2.2;
    if(i<N*.88){const s=i%2;const aa=a+s*Math.PI;set(p,i,x,Math.cos(aa)*1.15+(r()-.5)*.1,Math.sin(aa)*1.15+(r()-.5)*.1);h[i]=s;}
    else{const t=r();set(p,i,x,Math.cos(a)*1.15*(1-2*t),Math.sin(a)*1.15*(1-2*t));h[i]=.4;}}}},
  // 10 The engine: a ring of eight segments, one per stage.
  {alpha:.4, build(N,p,h,r){for(let i=0;i<N;i++){const k=i%8,a=(k+.08+r()*.84)/8*TAU,b=r()*TAU,rr=.3*Math.sqrt(r());
    let x=(2.7+rr*Math.cos(b))*Math.cos(a),y=(2.7+rr*Math.cos(b))*Math.sin(a),z=rr*Math.sin(b);
    [y,z]=rot(y,z,1.05);set(p,i,x,y,z);h[i]=k===5?1:0;}}},
  // 11 Measure: six columns of capability gain.
  {alpha:.5, build(N,p,h,r){const H=[1.4,2.1,2.6,3.2,3.7,4.3];for(let i=0;i<N;i++){const k=i%6,y=r()*H[k];
    set(p,i,(k-2.5)*1.55+(r()-.5)*.6,-3+y,(r()-.5)*.6-.5);h[i]=y>H[k]-.45?1:0;}}},
  // 12 Five groups of Cebuanos.
  {alpha:.42, build(N,p,h,r){for(let i=0;i<N;i++){const k=i%5,[x,y,z]=ball(r,.75);
    set(p,i,(k-2)*2.3+x,Math.cos((k-2)*.55)*1.2-1.4+y,z);h[i]=r()<.12?1:0;}}},
  // 13 Transfer: a chain that brightens as ownership moves local.
  {alpha:.55, build(N,p,h,r){for(let i=0;i<N;i++){const u=r(),[x,y,z]=ball(r,u*5%1<.5?.42:.1);
    set(p,i,-5+10*u+x,-1.5+1.2*u+y,-2+2*u+z);h[i]=u;}}},
  // 14 Roadmap: five rising steps.
  {alpha:.6, side:1, build(N,p,h,r){for(let i=0;i<N;i++){const k=i%5,top=r()<.6;
    const x=(k-2)*1.5+(r()-.5)*1.3,y=-2.6+k*.95,z=(r()-.5)*1.3;set(p,i,x,top?y:y-r()*(k*.95+.4),z);h[i]=k===4?1:0;}}},
  // 15 Partnership: two spheres; their overlap is the initiative.
  {alpha:.5, build(N,p,h,r){for(let i=0;i<N;i++){const s=i%2?1:-1,[x,y,z]=ball(r,1.9),px=s*1.25+x;
    set(p,i,px,y,z);h[i]=Math.hypot(px+1.25,y,z)<1.9&&Math.hypot(px-1.25,y,z)<1.9?1:0;}}},
  // 16 Finale: everyone in one form.
  {alpha:.55, build(N,p,h,r){for(let i=0;i<N;i++){
    if(i<N*.7){const y=1-2*(i+.5)/(N*.7),rad=Math.sqrt(1-y*y),a=i*2.39996;set(p,i,Math.cos(a)*rad*2.7,y*2.7,Math.sin(a)*rad*2.7);}
    else{const[x,y,z]=ball(r,2.3);set(p,i,x,y,z);}h[i]=r()<.3?1:0;}}},
];
function set(p,i,x,y,z){p[i*3]=x;p[i*3+1]=y;p[i*3+2]=z}
function rot(a,b,t){const c=Math.cos(t),s=Math.sin(t);return[a*c-b*s,a*s+b*c]}
function ball(r,R){const u=r()*TAU,v=Math.acos(2*r()-1),d=R*Math.cbrt(r());return[d*Math.sin(v)*Math.cos(u),d*Math.cos(v),d*Math.sin(v)*Math.sin(u)]}

function init(){
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:false,alpha:true,powerPreference:'high-performance'})}catch{return}
  if(!renderer.getContext())return;
  const canvas=renderer.domElement;canvas.id='stage';canvas.setAttribute('aria-hidden','true');
  document.body.prepend(canvas);
  document.documentElement.classList.add('webgl');

  const small=innerWidth<700;
  const N=small?2600:6000;
  const camera=new THREE.PerspectiveCamera(FOV,1,.1,100);camera.position.z=CAM_Z;
  const scene=new THREE.Scene();

  // Unscaled formations are built once; placed copies are rebuilt on resize.
  const raw=formations.map((f,k)=>{const p=new Float32Array(N*3),h=new Float32Array(N);f.build(N,p,h,rng(101+k));return{p,h}});
  let placed=[];

  const geo=new THREE.BufferGeometry();
  const posA=new THREE.BufferAttribute(new Float32Array(N*3),3),posB=new THREE.BufferAttribute(new Float32Array(N*3),3);
  const hiA=new THREE.BufferAttribute(new Float32Array(N),1),hiB=new THREE.BufferAttribute(new Float32Array(N),1);
  const rand=new Float32Array(N*4);const rr=rng(7);
  for(let i=0;i<N;i++){rand[i*4]=rr();rand[i*4+1]=.55+rr()*.9;rand[i*4+2]=rr();rand[i*4+3]=.3+rr()*.8}
  geo.setAttribute('position',posA);geo.setAttribute('aPosB',posB);geo.setAttribute('aHiA',hiA);geo.setAttribute('aHiB',hiB);
  geo.setAttribute('aRand',new THREE.BufferAttribute(rand,4));

  const c=hex=>new THREE.Color(hex);
  const uniforms={
    uT:{value:0},uTime:{value:0},uMotion:{value:1},uAlpha:{value:1},
    uSize:{value:small?2.6:2.3},uPR:{value:1},uViewH:{value:1},
    uEdges:{value:new THREE.Vector4(1e5,1e5,1e5,1e5)},uTones:{value:new THREE.Vector4()},
    cDark:{value:c('#8fb8ff')},cDarkHi:{value:c('#e3bd77')},
    cLight:{value:c('#1b3a63')},cLightHi:{value:c('#1e65d6')},
    cBlue:{value:c('#dbe8ff')},cBlueHi:{value:c('#ffdd9b')},
  };
  const mat=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
    vertexShader:`
      attribute vec3 aPosB;attribute float aHiA;attribute float aHiB;attribute vec4 aRand;
      uniform float uT,uTime,uMotion,uSize,uPR;varying float vHi;
      void main(){
        float t=clamp((uT-aRand.x*.35)/.65,0.,1.);t=t*t*(3.-2.*t);
        vec3 p=mix(position,aPosB,t);
        float ph=aRand.z*6.2831853;
        p.xy+=sin(t*3.1415926)*.45*vec2(cos(ph),sin(ph));
        p+=uMotion*.07*vec3(sin(uTime*aRand.w+ph),cos(uTime*aRand.w*.8+ph*1.3),sin(uTime*aRand.w*.6+ph*.7));
        vHi=mix(aHiA,aHiB,t);
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=uSize*aRand.y*(1.+vHi*.5)*uPR*(10./-mv.z);
      }`,
    fragmentShader:`
      uniform vec4 uEdges,uTones;uniform float uViewH,uPR,uAlpha;
      uniform vec3 cDark,cDarkHi,cLight,cLightHi,cBlue,cBlueHi;varying float vHi;
      void main(){
        float r=length(gl_PointCoord-.5);if(r>.5)discard;
        float y=uViewH-gl_FragCoord.y/uPR;
        float b=step(uEdges.x,y)+step(uEdges.y,y)+step(uEdges.z,y);
        float tone=b<.5?uTones.x:b<1.5?uTones.y:b<2.5?uTones.z:uTones.w;
        vec3 base=tone<.5?cDark:tone<1.5?cLight:cBlue;
        vec3 hi=tone<.5?cDarkHi:tone<1.5?cLightHi:cBlueHi;
        float k=tone>.5&&tone<1.5?.75:1.;
        gl_FragColor=vec4(mix(base,hi,vHi),smoothstep(.5,.12,r)*uAlpha*k*(.5+.5*vHi));
      }`});
  const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);

  let pair=[-1,-1],vw=1,vh=1,tops=[];
  function load(a,b){
    if(pair[0]===a&&pair[1]===b)return;pair=[a,b];
    posA.array.set(placed[a].p);posB.array.set(placed[b].p);hiA.array.set(raw[a].h);hiB.array.set(raw[b].h);
    posA.needsUpdate=posB.needsUpdate=hiA.needsUpdate=hiB.needsUpdate=true;
  }
  function place(){
    const aspect=vw/vh,viewW=VIEW_H*aspect,wide=aspect>1.25;
    const fit=Math.min(1,Math.max(.36,viewW/11.5));
    placed=raw.map(({p},k)=>{
      const f=formations[k];let s=fit,ox=0,oy=0;
      if(f.anchor==='hero'&&heroMark&&heroMark.offsetWidth){
        const m=heroMark.getBoundingClientRect(),top=m.top+scrollY-scenes[0].offsetTop,px=VIEW_H/vh;
        ox=(m.left+m.width/2-vw/2)*px;oy=-(top+m.height/2-vh/2)*px;s=(m.width/2*px)/2;
      }else if(f.anchor==='hero'){s=fit*.9;ox=viewW*.28;oy=VIEW_H*.3}
      else if(f.side&&wide){ox=viewW*.2;s=fit*.8}
      const q=new Float32Array(p.length);
      for(let i=0;i<p.length;i+=3){q[i]=p[i]*s+ox;q[i+1]=p[i+1]*s+oy;q[i+2]=p[i+2]*s}
      return{p:q};
    });
    pair=[-1,-1];
  }
  function resize(){
    vw=innerWidth;vh=innerHeight;const pr=Math.min(devicePixelRatio||1,small?1.5:2);
    renderer.setPixelRatio(pr);renderer.setSize(vw,vh,false);
    camera.aspect=vw/vh;camera.updateProjectionMatrix();
    uniforms.uPR.value=pr;uniforms.uViewH.value=vh;
    tops=scenes.map(s=>s.offsetTop);place();
  }
  addEventListener('resize',resize);resize();

  // Scroll position as a continuous scene index: 3.0 means scene 4 is at the top.
  function progress(){
    const y=scrollY;let i=0;while(i<tops.length-1&&tops[i+1]<=y)i++;
    if(i>=tops.length-1)return tops.length-1;
    return i+Math.min(1,(y-tops[i])/(tops[i+1]-tops[i]));
  }
  function bands(){
    const e=[1e5,1e5,1e5,1e5],t=[0,0,0,0];let n=0;
    for(let i=0;i<scenes.length&&n<4;i++){const r=scenes[i].getBoundingClientRect();
      if(r.bottom<=0||r.top>=vh)continue;if(n>0)e[n-1]=r.top;t[n]=tones[i];n++;}
    for(let k=n;k<4;k++)t[k]=t[Math.max(0,n-1)];
    uniforms.uEdges.value.set(e[0],e[1],e[2],e[3]);uniforms.uTones.value.set(t[0],t[1],t[2],t[3]);
  }

  const mouse={x:0,y:0},cam={x:0,y:0};
  addEventListener('pointermove',e=>{mouse.x=e.clientX/vw-.5;mouse.y=e.clientY/vh-.5},{passive:true});
  const clock=new THREE.Clock();
  function frame(){
    const time=clock.getElapsedTime(),still=reduceMotion.matches;
    const p=progress(),a=Math.floor(p),b=Math.min(formations.length-1,a+1),f=p-a;
    load(a,b);
    const t=THREE.MathUtils.smoothstep(f,.12,.88);
    uniforms.uT.value=t;uniforms.uTime.value=time;uniforms.uMotion.value=still?0:1;
    uniforms.uAlpha.value=THREE.MathUtils.lerp(formations[a].alpha,formations[b].alpha,t)*(small?.8:1);
    bands();
    if(!still){cam.x+=(mouse.x*.9-cam.x)*.04;cam.y+=(-mouse.y*.6-cam.y)*.04;points.rotation.y=Math.sin(time*.12)*.28;}
    else{cam.x=cam.y=0;points.rotation.y=0}
    camera.position.set(cam.x,cam.y,CAM_Z);camera.lookAt(0,0,0);
    renderer.render(scene,camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
init();
