/* ===== Settings: edit these ===== */
const CONFIG = {
  // Optional: a form endpoint (e.g. https://formspree.io/f/xxxx).
  // Leave empty and the form copies the message so visitors can paste it into Discord.
  // If you set one: also add its origin to connect-src in the Content-Security-Policy
  // tag at the top of index.html, or the browser will block the request.
  // Never paste a Discord webhook URL here: this file is public, and anyone who reads
  // the URL can post to (or delete) that webhook.
  formEndpoint: ""
};

const GAMES = [
  {u:8585667092,  p:84994213239994,  n:"A Monorail Ride",              g:"Obby",          v:1378289, f:4884, s:"A-Monorail-Ride"},
  {u:9916557889,  p:86053795421622,  n:"Hunt a Brainrot",              g:"Simulator",     v:184735,  f:297,  s:"Hunt-A-Brainrot"},
  {u:10319306193, p:139648596178872, n:"Merge a TNT",                  g:"Merge & Idle",  v:142277,  f:416,  s:"Merge-a-TNT"},
  {u:10768504535, p:110792173847365, n:"Verity Backrooms: No Escape",  g:"Horror",        v:30889,   f:84,   s:"Verity-Backrooms-No-Escape"},
  {u:10770538710, p:127463583969828, n:"Glove Battles",                g:"Combat",        v:26228,   f:70,   s:"Glove-Battles"},
  {u:10619460800, p:133710219148575, n:"Idle Pong Balls",              g:"Merge & Idle",  v:13870,   f:49,   s:"Idle-Pong-Balls"},
  {u:10766831071, p:128411887206110, n:"Build & Destroy",              g:"Simulator",     v:12392,   f:59,   s:"Build-Destroy"},
  {u:10774546125, p:75588506525233,  n:"Eat the Giant Cheese",         g:"Simulator",     v:12329,   f:272,  s:"Eat-the-Giant-Cheese", badge:"New"},
  {u:9378596381,  p:125925064997115, n:"Countries",                    g:"Obby",          v:11546,   f:65,   s:"Countries"},
  {u:10764652629, p:93988446378800,  n:"Slime Defense",                g:"Tower Defense", v:9890,    f:210,  s:"Slime-Defense"},
  {u:10773640095, p:112130395459413, n:"Shred a Million",              g:"Simulator",     v:3154,    f:22,   s:"Shred-a-Million", badge:"New"},
  {u:10769914290, p:78992008733421,  n:"Destroy the Squishy",          g:"Simulator",     v:2386,    f:15,   s:"Destroy-the-Squishy", badge:"Beta"}
];

const fmt = n => n>=1e6 ? (n/1e6).toFixed(n>=1e7?0:2).replace(/\.?0+$/,'')+'M' : n>=1e3 ? (n/1e3).toFixed(n>=1e4?0:1).replace(/\.0$/,'')+'K' : String(n);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s,el=document)=>el.querySelector(s), $$ = (s,el=document)=>[...el.querySelectorAll(s)];

/* ----- games grid ----- */
const grid = $('#gameGrid');
grid.innerHTML = GAMES.map(g=>`
  <a class="game reveal" data-genre="${g.g}" href="https://www.roblox.com/games/${g.p}/${g.s}" target="_blank" rel="noopener" aria-label="Play ${g.n} on Roblox">
    <div class="thumb"><img src="assets/games/${g.u}-thumb.webp" alt="" loading="lazy"><span class="tag">${g.badge?'<span class="live"></span>'+g.badge+' · ':''}${g.g}</span></div>
    <span class="play"><svg><use href="#play"/></svg></span>
    <div class="info">
      <img class="icon" src="assets/games/${g.u}-icon.webp" alt="" loading="lazy">
      <div><h3>${g.n}</h3><div class="sub"><span><svg><use href="#eye"/></svg><span data-visits="${g.u}">${fmt(g.v)}</span> visits</span><span><svg><use href="#heart"/></svg><span data-favs="${g.u}">${fmt(g.f)}</span></span></div></div>
    </div>
  </a>`).join('');

/* ----- live stats: data/stats.json is refreshed weekly by GitHub Actions ----- */
async function loadStats(){
  try{
    const st = await fetch('data/stats.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null);
    let visits=0, favs=0;
    for(const g of GAMES){
      const s = st && st.games && st.games[g.u];
      if(s){ g.v=s.visits; g.f=s.favorites; }
      visits+=g.v; favs+=g.f;
      const v=$(`[data-visits="${g.u}"]`), f=$(`[data-favs="${g.u}"]`);
      if(v) v.textContent=fmt(g.v);
      if(f) f.textContent=fmt(g.f);
      if(g.u===8585667092){
        $('#kpiVisits').textContent=fmt(g.v); $('#kpiFavs').textContent=fmt(g.f);
        if(s && s.upVotes+s.downVotes>0) $('#kpiRate').textContent=Math.round(100*s.upVotes/(s.upVotes+s.downVotes))+'%';
      }
    }
    const hv=$('[data-count][data-suffix="M+"]'), hf=$('[data-count][data-suffix="K+"]');
    if(hv) hv.dataset.count=(Math.floor(visits/1e5)/10).toFixed(1);
    if(hf) hf.dataset.count=(Math.floor(favs/100)/10).toFixed(1);
    if(st && st.updatedAt){
      const d=new Date(st.updatedAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
      $('#statsNote').textContent=`Stats from Roblox, updated weekly (last update ${d}).`;
    }
  }catch(e){ /* keep the built-in numbers */ }
}
const statsReady = loadStats();

const genres = ['All', ...new Set(GAMES.map(g=>g.g))];
const filters = $('#filters');
filters.innerHTML = genres.map((g,i)=>`<button class="chip${i?'':' active'}" role="tab" aria-selected="${!i}" data-g="${g}">${g}</button>`).join('');
filters.addEventListener('click', e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  $$('.chip',filters).forEach(c=>{c.classList.toggle('active',c===b);c.setAttribute('aria-selected',c===b)});
  $$('.game',grid).forEach(card=>{
    const show = b.dataset.g==='All' || card.dataset.genre===b.dataset.g;
    card.classList.toggle('hide',!show);
    if(show){card.classList.add('in')}
  });
});

/* card tilt */
if(!reduce && matchMedia('(hover:hover)').matches){
  $$('.game').forEach(c=>{
    c.addEventListener('mousemove',e=>{
      const r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      c.style.transform=`perspective(900px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-4px)`;
    });
    c.addEventListener('mouseleave',()=>c.style.transform='');
  });
  $$('.svc').forEach(c=>c.addEventListener('mousemove',e=>{
    const r=c.getBoundingClientRect(); c.style.setProperty('--mx',(e.clientX-r.left)+'px'); c.style.setProperty('--my',(e.clientY-r.top)+'px');
  }));
  const stack=$('#stack');
  window.addEventListener('mousemove',e=>{
    const x=e.clientX/innerWidth-.5, y=e.clientY/innerHeight-.5;
    $$('.card',stack).forEach((c,i)=>{const d=(i+1)*10; c.style.translate=`${x*d}px ${y*d}px`});
  },{passive:true});
}

/* ----- marquee ----- */
const words=['Simulators','Obbies','Horror','Tower Defense','Combat','Idle','Merge','Live Ops','Game Design','Full-Stack Luau','Monetization'];
const chunk=words.map(w=>`<span>${w}<svg><use href="#star"/></svg></span>`).join('');
$('#marquee').innerHTML=chunk+chunk;

/* ----- process tabs ----- */
const steps=$$('.step'), panels=$$('.panel');
let stepTimer, stepIdx=0;
function setStep(i){
  stepIdx=i;
  steps.forEach((s,j)=>{s.classList.toggle('active',j===i);s.setAttribute('aria-selected',j===i)});
  panels.forEach((p,j)=>p.classList.toggle('active',j===i));
  $('#bigNum').textContent=String(i+1).padStart(2,'0');
}
steps.forEach((s,i)=>s.addEventListener('click',()=>{setStep(i);clearInterval(stepTimer)}));
if(!reduce){
  const po=new IntersectionObserver(([en])=>{
    clearInterval(stepTimer);
    if(en.isIntersecting) stepTimer=setInterval(()=>setStep((stepIdx+1)%steps.length),6000);
  },{threshold:.4});
  po.observe($('#process'));
}

/* ----- reveal + counters ----- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
$$('.reveal').forEach((el,i)=>{el.style.transitionDelay=(i%3)*70+'ms';io.observe(el)});

function count(el){
  const to=parseFloat(el.dataset.count), dec=+(el.dataset.dec||0), suf=el.dataset.suffix||'';
  if(reduce){el.textContent=to.toFixed(dec)+suf;return}
  const t0=performance.now(), dur=1600;
  (function tick(t){
    const k=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-k,4);
    el.textContent=(to*e).toFixed(dec)+suf;
    if(k<1) requestAnimationFrame(tick);
  })(t0);
}
Promise.race([statsReady, new Promise(r=>setTimeout(r,1200))]).then(()=>setTimeout(()=>$$('[data-count]').forEach(count),200));

/* ----- nav ----- */
const nav=$('#nav'), menuBtn=$('#menuBtn');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>20),{passive:true});
menuBtn.addEventListener('click',()=>{const o=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',o)});
$$('#mobileMenu a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuBtn.setAttribute('aria-expanded',false)}));

/* ----- copy discord + toast ----- */
const toast=$('#toast');
function showToast(t){toast.textContent=t;toast.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toast.classList.remove('show'),2600)}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){return false}}
$$('[data-copy]').forEach(b=>b.addEventListener('click',async e=>{
  e.preventDefault();
  const ok=await copyText(b.dataset.copy);
  showToast(ok?`Copied "${b.dataset.copy}" · add us on Discord`:`Discord: ${b.dataset.copy}`);
}));

/* ----- contact form ----- */
$('#contactForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const f=e.target, msg=$('#formMsg');
  if(!f.checkValidity()){msg.textContent='Please fill in your name, Discord and a message.';return}
  const data=Object.fromEntries(new FormData(f));
  if(CONFIG.formEndpoint){
    try{
      const r=await fetch(CONFIG.formEndpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data)});
      if(!r.ok) throw 0;
      msg.textContent='Thanks! We got your message and will reach out on Discord.'; f.reset(); return;
    }catch(_){ /* fall through to copy */ }
  }
  const text=`Hi Tenfold! I'm ${data.name} (Discord: ${data.discord}).\nTopic: ${data.topic}\n\n${data.message}`;
  const ok=await copyText(text);
  msg.textContent= ok ? 'Message copied. Paste it to cls_lux or roadkill_official on Discord.' : 'Send this to cls_lux or roadkill_official on Discord.';
});

$('#year').textContent=new Date().getFullYear();

/* ----- starfield ----- */
(function(){
  const c=$('#stars'), x=c.getContext('2d'); let w,h,stars=[],dpr=Math.min(devicePixelRatio||1,2);
  function size(){w=c.width=innerWidth*dpr;h=c.height=innerHeight*dpr;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';
    const n=Math.round(innerWidth*innerHeight/9000);
    stars=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:(Math.random()*1.1+.2)*dpr,p:Math.random()*6.28,s:.4+Math.random()*1.2}));}
  function draw(t){
    x.clearRect(0,0,w,h);
    for(const s of stars){const a=.25+.55*(.5+.5*Math.sin(s.p+t*.001*s.s));x.globalAlpha=a;x.fillStyle='#fff';x.beginPath();x.arc(s.x,s.y,s.r,0,6.28);x.fill()}
    if(!reduce) requestAnimationFrame(draw);
  }
  size(); addEventListener("resize",()=>{size(); if(reduce) draw(0)}); requestAnimationFrame(draw);
})();
