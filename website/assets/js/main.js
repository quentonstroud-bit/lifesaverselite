// Earning tiers
(function(){
  const tiers=[
    {n:"Star 1",s:1},
    {n:"Star 2",s:2},
    {n:"Star 3",s:3,b:"Most Earned",cls:"hot"},
    {n:"Star 4",s:4,b:"Most Earned",cls:"hot"},
    {n:"Star 5 Elite",s:5,b:"Highest Payout",cls:"elite"}
  ];
  const star=(on)=>`<svg viewBox="0 0 24 24" fill="${on?'#c9a45c':'#2f2a2c'}"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18.3 5.5 22l1.7-7.4-5.7-5 7.5-.7z"/></svg>`;
  const medal=(cls)=>`<div class="medal"><svg viewBox="0 0 24 24" fill="none" stroke="${cls==='elite'?'#c9a45c':cls==='hot'?'#c41e3a':'#b3a9a6'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10l-2 6H9z"/><circle cx="12" cy="15" r="6"/><path d="M12 12.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/></svg></div>`;
  const lock=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
  document.getElementById('tiers').innerHTML=tiers.map(t=>`
    <div class="tier reveal ${t.cls||''}">
      ${t.b?`<span class="badge">${t.b}</span>`:''}
      ${medal(t.cls)}
      <h3>${t.n}</h3>
      <div class="stars">${[1,2,3,4,5].map(i=>star(i<=t.s)).join('')}</div>
      <a href="#join" class="lock">${lock}Apply to unlock</a>
    </div>`).join('');
})();


// Real photos inside the avatar circles (the drawn avatar stays underneath as a backup)
(function(){
  const NS='http://www.w3.org/2000/svg';
  document.querySelectorAll('use[data-photo],use[data-src]').forEach(u=>{
    const img=document.createElementNS(NS,'image');
    ['x','y','width','height'].forEach(a=>img.setAttribute(a,u.getAttribute(a)));
    const size=Math.max(120,Math.round(parseFloat(u.getAttribute('width'))*3));
    img.setAttribute('href',u.dataset.src||`https://images.unsplash.com/photo-${u.dataset.photo}?auto=format&fit=crop&crop=faces&w=${size}&h=${size}&q=80`);
    img.setAttribute('preserveAspectRatio','xMidYMid slice');
    img.setAttribute('clip-path','url(#photoClip)');
    if(u.dataset.hide){img.addEventListener('load',()=>{const h=document.getElementById(u.dataset.hide);if(h)h.style.display='none';});}
    img.addEventListener('error',()=>img.remove());
    u.after(img);
  });
})();

// Header background on scroll
const header=document.querySelector('header');
const onScroll=()=>header.classList.toggle('scrolled',window.scrollY>20);
window.addEventListener('scroll',onScroll,{passive:true});onScroll();

// Mobile menu
const burger=document.getElementById('burger'),links=document.getElementById('links');
burger.addEventListener('click',()=>{const o=links.classList.toggle('open');burger.setAttribute('aria-expanded',o)});
links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');burger.setAttribute('aria-expanded',false)}));

// Reveal on scroll
const els=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
  els.forEach(el=>io.observe(el));
}else els.forEach(el=>el.classList.add('in'));

// Apply form: sends to the form service in the form's action URL, then shows a message
(function(){
  const form=document.getElementById('applyForm');
  if(!form) return;
  const status=document.getElementById('formStatus');
  const btn=document.getElementById('applyBtn');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(form.action.includes('YOUR_FORM_ID')){
      console.warn('Apply form is not connected yet: set your Formspree form ID in index.html');
      status.textContent='Something went wrong. Please try again.';status.className='form-status full err';return;
    }
    btn.disabled=true;btn.style.opacity=.7;status.textContent='';status.className='form-status full';
    try{
      const r=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
      if(!r.ok) throw new Error(r.status);
      form.reset();
      status.textContent='Thank you! We will reach out within 24 hours.';status.className='form-status full ok';
    }catch(err){
      status.textContent='Something went wrong. Please try again.';status.className='form-status full err';
    }finally{btn.disabled=false;btn.style.opacity=1;}
  });
})();

