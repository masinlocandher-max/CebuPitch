document.documentElement.classList.add('js');
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
  if(index===activeIndex&&currentSection.textContent!=='')return;
  activeIndex=index;
  currentSection.textContent=String(index+1).padStart(2,'0');
  progressBar.style.width=`${((index+1)/scenes.length)*100}%`;
  prevBtn.disabled=index===0; nextBtn.disabled=index===scenes.length-1;
}

// The active scene is the last one whose top has passed the middle of the
// viewport. Unlike an intersection ratio, this works for scenes taller than the screen.
function syncActive(){
  const mid=innerHeight*.5;let index=0;
  scenes.forEach((s,i)=>{if(s.getBoundingClientRect().top<=mid)index=i});
  if(innerHeight+scrollY>=document.documentElement.scrollHeight-2)index=scenes.length-1;
  update(index);
}
let ticking=false;
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>{ticking=false;syncActive()})}},{passive:true});
addEventListener('resize',syncActive);

// Reveal content as soon as any part of a scene enters the lower 85% of the viewport.
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    entry.target.querySelector('.reveal')?.classList.add('is-visible');
    const metric=entry.target.querySelector('[data-count]'); if(metric && !metric.dataset.done) countMetric(metric);
    observer.unobserve(entry.target);
  });
},{threshold:0,rootMargin:'0px 0px -15% 0px'});
scenes.forEach(s=>observer.observe(s));

function countMetric(el){
  el.dataset.done='true'; const target=parseFloat(el.dataset.count);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=target.toFixed(1);return}
  const start=performance.now(); const dur=950;
  function tick(now){ const p=Math.min(1,(now-start)/dur); const eased=1-Math.pow(1-p,3); el.textContent=(target*eased).toFixed(1); if(p<1) requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
}

document.querySelectorAll('[data-next]').forEach(btn=>btn.addEventListener('click',()=>goTo(activeIndex+1)));
prevBtn.addEventListener('click',()=>goTo(activeIndex-1)); nextBtn.addEventListener('click',()=>goTo(activeIndex+1));
window.addEventListener('keydown',e=>{
  if(sourcesDialog.open||pilotDialog.open)return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();goTo(activeIndex+1)}
  if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();goTo(activeIndex-1)}
  if(e.key==='Home')goTo(0); if(e.key==='End')goTo(scenes.length-1);
  if(e.key.toLowerCase()==='f')toggleFullscreen();
});

async function toggleFullscreen(){
  try{ if(!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }catch{}
}
function openSource(id){
  sourcesDialog.showModal();
  const item=id&&document.getElementById(id); if(!item)return;
  item.scrollIntoView({block:'nearest'});
  item.classList.remove('flash'); void item.offsetWidth; item.classList.add('flash');
}
document.getElementById('fullscreenBtn').addEventListener('click',toggleFullscreen);
document.getElementById('sourceBtn').addEventListener('click',()=>openSource());
document.getElementById('closeSources').addEventListener('click',()=>sourcesDialog.close());
document.querySelectorAll('[data-source]').forEach(btn=>btn.addEventListener('click',()=>openSource(btn.dataset.source)));
document.getElementById('pilotBtn').addEventListener('click',()=>pilotDialog.showModal());
document.getElementById('closePilot').addEventListener('click',()=>pilotDialog.close());
[sourcesDialog,pilotDialog].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
currentSection.textContent=''; update(0); syncActive(); scenes[0].querySelector('.reveal')?.classList.add('is-visible');
