const scenes=[...document.querySelectorAll('.scene')];
const progressBar=document.getElementById('progressBar');
const currentSection=document.getElementById('currentSection');
const totalSections=document.getElementById('totalSections');
const prevBtn=document.getElementById('prevBtn');
const nextBtn=document.getElementById('nextBtn');
const sourcesDialog=document.getElementById('sourcesDialog');
const pilotDialog=document.getElementById('pilotDialog');
let activeIndex=0;
totalSections.textContent=String(scenes.length).padStart(2,'0');

function goTo(index){
  const next=Math.max(0,Math.min(scenes.length-1,index));
  scenes[next].scrollIntoView({behavior:'smooth',block:'start'});
}
function update(index){
  activeIndex=index;
  currentSection.textContent=String(index+1).padStart(2,'0');
  progressBar.style.width=`${((index+1)/scenes.length)*100}%`;
  prevBtn.disabled=index===0;
  nextBtn.disabled=index===scenes.length-1;
}
function revealScene(scene){
  scene.querySelector('.reveal')?.classList.add('is-visible');
  const metric=scene.querySelector('[data-count]');
  if(metric && !metric.dataset.done) countMetric(metric);
}

const observer=new IntersectionObserver(entries=>{
  const visible=entries
    .filter(entry=>entry.isIntersecting)
    .sort((a,b)=>b.intersectionRatio-a.intersectionRatio);

  if(visible.length){
    const scene=visible[0].target;
    const index=scenes.indexOf(scene);
    update(index);
  }

  entries.forEach(entry=>{
    if(entry.isIntersecting) revealScene(entry.target);
  });
},{threshold:[0,.08,.2,.4,.6],rootMargin:'-6% 0px -6% 0px'});

scenes.forEach(scene=>observer.observe(scene));

function countMetric(el){
  el.dataset.done='true';
  const target=parseFloat(el.dataset.count);
  const start=performance.now();
  const dur=950;
  function tick(now){
    const p=Math.min(1,(now-start)/dur);
    const eased=1-Math.pow(1-p,3);
    el.textContent=(target*eased).toFixed(1);
    if(p<1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

document.querySelectorAll('[data-next]').forEach(btn=>btn.addEventListener('click',()=>goTo(activeIndex+1)));
prevBtn.addEventListener('click',()=>goTo(activeIndex-1));
nextBtn.addEventListener('click',()=>goTo(activeIndex+1));

window.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(sourcesDialog.open||pilotDialog.open)return;
  if(['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();goTo(activeIndex+1)}
  if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();goTo(activeIndex-1)}
  if(e.key==='Home')goTo(0);
  if(e.key==='End')goTo(scenes.length-1);
  if(e.key.toLowerCase()==='f')toggleFullscreen();
});

async function toggleFullscreen(){
  try{
    if(!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  }catch{}
}

function openSources(sourceId){
  document.querySelectorAll('.source-list a').forEach(a=>a.classList.remove('source-focus'));
  sourcesDialog.showModal();
  if(sourceId){
    const target=document.getElementById(sourceId);
    if(target){
      target.classList.add('source-focus');
      requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'center'}));
    }
  }
}

document.getElementById('fullscreenBtn').addEventListener('click',toggleFullscreen);
document.getElementById('sourceBtn').addEventListener('click',()=>openSources());
document.getElementById('closeSources').addEventListener('click',()=>sourcesDialog.close());
document.querySelectorAll('[data-source]').forEach(btn=>btn.addEventListener('click',()=>openSources(btn.dataset.source)));
document.getElementById('pilotBtn').addEventListener('click',()=>pilotDialog.showModal());
document.getElementById('closePilot').addEventListener('click',()=>pilotDialog.close());

[sourcesDialog,pilotDialog].forEach(dialog=>{
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
});

update(0);
revealScene(scenes[0]);