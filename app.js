const OWNER="djcaptaind";
const REPO="Photo-Gallery";
const BRANCH="main";
const DATA_URL=`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/gallery-data.json`;
const labels={leadership:"Leadership",service:"Service",drill:"Drill & Color Guard",adventure:"Adventure",academics:"Academics",events:"Events"};
const ROTATE_MS=5000;

let photos=[];
let visible=[];
let heroIndex=0;
let heroPlaying=true;
let heroTimer=null;
let spotIndex=0;
let spotPlaying=true;
let spotTimer=null;

const $=id=>document.getElementById(id);

function esc(s=""){
  return String(s).replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

async function loadPhotos(){
  try{
    const r=await fetch(DATA_URL+`?v=${Date.now()}`,{cache:"no-store"});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const data=await r.json();
    photos=Array.isArray(data)?data:[];
  }catch(e){
    console.error("Gallery data load failed:",e);
    photos=[];
  }

  visible=[...photos];
  $("photoCount").textContent=String(photos.length).padStart(2,"0");

  if(!photos.length){
    $("home").hidden=true;
    $("emptyHero").hidden=false;
  }else{
    $("home").hidden=false;
    $("emptyHero").hidden=true;
    heroIndex=0;
    updateHero();
    startHero();
  }

  renderGallery();
}

function animateProgress(el,ms){
  clearInterval(el._progressTimer);
  el.style.width="0%";
  const start=performance.now();
  el._progressTimer=setInterval(()=>{
    const pct=Math.min(100,(performance.now()-start)/ms*100);
    el.style.width=pct+"%";
    if(pct>=100)clearInterval(el._progressTimer);
  },40);
}

function updateHero(){
  if(!photos.length)return;
  const p=photos[heroIndex];
  $("heroBlur").style.backgroundImage=`url("${p.image}")`;
  $("heroImage").classList.remove("motion");
  $("heroImage").src=p.image;
  $("heroImage").alt=p.title||"Callaway JROTC photo";
  requestAnimationFrame(()=>requestAnimationFrame(()=>$('heroImage').classList.add('motion')));
  $("heroTitle").textContent=p.title||"Callaway JROTC";
  $("heroCategory").textContent=labels[p.category]||p.category||"Featured";
  $("heroCaption").textContent=p.caption||`${labels[p.category]||"Callaway JROTC"} highlight`;
  $("heroCurrent").textContent=String(heroIndex+1).padStart(2,"0");
}
function startHero(){stopHero();if(!heroPlaying||photos.length<2)return;animateProgress($("heroProgress"),ROTATE_MS);heroTimer=setTimeout(()=>{heroIndex=(heroIndex+1)%photos.length;updateHero();startHero()},ROTATE_MS)}
function stopHero(){clearTimeout(heroTimer);clearInterval($("heroProgress")._progressTimer)}
$("heroPrev").onclick=()=>{if(!photos.length)return;heroIndex=(heroIndex-1+photos.length)%photos.length;updateHero();if(heroPlaying)startHero()};
$("heroNext").onclick=()=>{if(!photos.length)return;heroIndex=(heroIndex+1)%photos.length;updateHero();if(heroPlaying)startHero()};
$("heroPlay").onclick=()=>{heroPlaying=!heroPlaying;$("heroPlay").textContent=heroPlaying?"PAUSE":"PLAY";heroPlaying?startHero():stopHero()};
$("spotlightBtn").onclick=()=>{visible=[...photos];openSpotlight(heroIndex)};

function renderGallery(filter="all"){
  visible=filter==="all"?[...photos]:photos.filter(p=>p.category===filter);
  const grid=$("galleryGrid");grid.innerHTML="";$("emptyGallery").hidden=photos.length!==0;
  visible.forEach((p,i)=>{
    const c=document.createElement("article");
    c.className=`photo-card ${p.layout||"normal"}`;
    c.innerHTML=`<img src="${esc(p.image)}" alt="${esc(p.title||"Photo")}" loading="lazy"><div class="card-num">${String(i+1).padStart(2,"0")}</div><div class="card-copy"><span>${esc(labels[p.category]||p.category||"Gallery")}</span><h3>${esc(p.title||"Photo")}</h3><p>${esc(p.caption||"")}</p></div>`;
    c.onclick=()=>openSpotlight(i);
    grid.appendChild(c);
  });
}

document.querySelectorAll(".filter").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    renderGallery(btn.dataset.filter);
  };
});

function renderFilmstrip(){
  const rail=$("filmstrip");
  rail.innerHTML="";
  visible.forEach((p,i)=>{
    const t=document.createElement("button");
    t.className="film-thumb"+(i===spotIndex?" active":"");
    t.innerHTML=`<img src="${esc(p.image)}" alt="${esc(p.title||"Photo")}">`;
    t.onclick=()=>{spotIndex=i;updateSpotlight();if(spotPlaying)startSpotlight()};
    rail.appendChild(t);
  });
  setTimeout(()=>{
    const active=rail.querySelector(".film-thumb.active");
    if(active)active.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  },40);
}

function setStageShape(img){
  const wrap=document.querySelector('.spot-photo-wrap');
  const ratio=img.naturalWidth/img.naturalHeight;
  wrap.classList.remove('landscape','square','portrait');
  if(ratio>=1.28)wrap.classList.add('landscape');
  else if(ratio<=0.82)wrap.classList.add('portrait');
  else wrap.classList.add('square');
}

function openSpotlight(i){
  if(!visible.length)return;
  spotIndex=i;
  spotPlaying=true;
  $("autoplayState").textContent="ON";
  $("toggleAutoplay").textContent="PAUSE";
  updateSpotlight();
  $("spotlight").classList.add("open");
  $("spotlight").setAttribute("aria-hidden","false");
  document.body.classList.add("locked");
  startSpotlight();
}

function closeSpotlight(){
  stopSpotlight();
  $("spotlight").classList.remove("open");
  $("spotlight").setAttribute("aria-hidden","true");
  document.body.classList.remove("locked");
}

function updateSpotlight(){
  const p=visible[spotIndex];
  if(!p)return;

  $("spotlightBg").style.backgroundImage=`url("${p.image}")`;
  const wrap=document.querySelector('.spot-photo-wrap');
  wrap.style.setProperty('--spot-img',`url("${p.image}")`);

  const img=$("spotImage");
  img.classList.remove("show");
  img.classList.add("enter");

  const preload=new Image();
  preload.onload=()=>{
    setStageShape(preload);
    img.src=p.image;
    requestAnimationFrame(()=>{
      img.classList.remove("enter");
      img.classList.add("show");
    });
  };
  preload.src=p.image;

  $("spotCategory").textContent=labels[p.category]||p.category||"Gallery";
  $("spotTitle").textContent=p.title||"Photo";
  $("spotCaption").textContent=p.caption||"";
  $("spotCurrent").textContent=String(spotIndex+1).padStart(2,"0");
  $("spotTotal").textContent=String(visible.length).padStart(2,"0");
  renderFilmstrip();
}

function startSpotlight(){
  stopSpotlight();
  if(!spotPlaying||visible.length<2)return;
  animateProgress($("spotProgress"),ROTATE_MS);
  spotTimer=setTimeout(()=>{
    spotIndex=(spotIndex+1)%visible.length;
    updateSpotlight();
    startSpotlight();
  },ROTATE_MS);
}
function stopSpotlight(){clearTimeout(spotTimer);clearInterval($("spotProgress")._progressTimer);$("spotProgress").style.width="0%"}
$("spotPrev").onclick=()=>{spotIndex=(spotIndex-1+visible.length)%visible.length;updateSpotlight();if(spotPlaying)startSpotlight()};
$("spotNext").onclick=()=>{spotIndex=(spotIndex+1)%visible.length;updateSpotlight();if(spotPlaying)startSpotlight()};
$("toggleAutoplay").onclick=()=>{spotPlaying=!spotPlaying;$("autoplayState").textContent=spotPlaying?"ON":"OFF";$("toggleAutoplay").textContent=spotPlaying?"PAUSE":"PLAY";spotPlaying?startSpotlight():stopSpotlight()};
$("closeSpotlight").onclick=closeSpotlight;
document.addEventListener("keydown",e=>{if(!$("spotlight").classList.contains("open"))return;if(e.key==="Escape")closeSpotlight();if(e.key==="ArrowRight")$("spotNext").click();if(e.key==="ArrowLeft")$("spotPrev").click()});

loadPhotos();
