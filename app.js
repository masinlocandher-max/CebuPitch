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
  prevBtn.disabled=index===0; nextBtn.disabled=index===scenes.length-1;
}

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting && entry.intersectionRatio>.55){
      const index=scenes.indexOf(entry.target); update(index);
      const reveal=entry.target.querySelector('.reveal'); if(reveal) reveal.classList.add('is-visible');
      const metric=entry.target.querySelector('[data-count]'); if(metric && !metric.dataset.done) countMetric(metric);
    }
  });
},{threshold:[.55]});
scenes.forEach(s=>observer.observe(s));

function countMetric(el){
  el.dataset.done='true'; const target=parseFloat(el.dataset.count); const start=performance.now(); const dur=950;
  function tick(now){ const p=Math.min(1,(now-start)/dur); const eased=1-Math.pow(1-p,3); el.textContent=(target*eased).toFixed(1); if(p<1) requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
}

document.querySelectorAll('[data-next]').forEach(btn=>btn.addEventListener('click',()=>goTo(activeIndex+1)));
prevBtn.addEventListener('click',()=>goTo(activeIndex-1)); nextBtn.addEventListener('click',()=>goTo(activeIndex+1));
window.addEventListener('keydown',e=>{
  if(sourcesDialog.open||pilotDialog.open)return;
  if(['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();goTo(activeIndex+1)}
  if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();goTo(activeIndex-1)}
  if(e.key==='Home')goTo(0); if(e.key==='End')goTo(scenes.length-1);
  if(e.key.toLowerCase()==='f')toggleFullscreen();
});

async function toggleFullscreen(){
  try{ if(!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }catch{}
}
document.getElementById('fullscreenBtn').addEventListener('click',toggleFullscreen);
document.getElementById('sourceBtn').addEventListener('click',()=>sourcesDialog.showModal());
document.getElementById('closeSources').addEventListener('click',()=>sourcesDialog.close());
document.querySelectorAll('[data-source]').forEach(btn=>btn.addEventListener('click',()=>sourcesDialog.showModal()));
document.getElementById('pilotBtn').addEventListener('click',()=>pilotDialog.showModal());
document.getElementById('closePilot').addEventListener('click',()=>pilotDialog.close());
[sourcesDialog,pilotDialog].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
update(0); scenes[0].querySelector('.reveal')?.classList.add('is-visible');
