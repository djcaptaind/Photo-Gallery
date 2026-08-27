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
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

async function loadPhotos(){
  try{
    const r=await fetch(DATA_URL+`?v=${Date.now()}`,{cache:"no-store"});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const data=await r.json();
    photos=Array.isArray(data)?data:[];
  }catch(e){
    console.error("Gallery load failed",e);
    photos=[];
  }
  visible=[...photos];
  $("photoCount").textContent=String(photos.length).padStart(2,"0");
  if(!photos.length){$("home").hidden=true;$("emptyHero").hidden=false;}
  else{$("home").hidden=false;$("emptyHero").hidden=true;updateHero();startHero();}
  renderGallery();
}

function animateBar(el,ms){
  clearInterval(el._timer);el.style.width="0%";
  const start=performance.now();
  el._timer=setInterval(()=>{
    const pct=Math.min(100,(performance.now()-start)/ms*100);
    el.style.width=pct+"%";
    if(pct>=100)clearInterval(el._timer);
  },40);
}

function updateHero(){
  const p=photos[heroIndex]; if(!p)return;
  $("heroBg").style.backgroundImage=`url("${p.image}")`;
  $("heroImage").src=p.image;
  $("heroImage").alt=p.title||"Callaway JROTC";
  $("heroTitle").textContent=p.title||"Callaway JROTC";
  $("heroCaption").textContent=p.caption||`${labels[p.category]||"Callaway JROTC"} • Building legacy.`;
  $("heroCurrent").textContent=String(heroIndex+1).padStart(2,"0");
}
function stopHero(){clearTimeout(heroTimer);clearInterval($("heroProgress")._timer)}
function startHero(){
  stopHero();
  if(!heroPlaying||photos.length<2)return;
  animateBar($("heroProgress"),ROTATE_MS);
  heroTimer=setTimeout(()=>{heroIndex=(heroIndex+1)%photos.length;updateHero();startHero();},ROTATE_MS);
}
$("heroPrev").onclick=()=>{if(!photos.length)return;heroIndex=(heroIndex-1+photos.length)%photos.length;updateHero();if(heroPlaying)startHero();};
$("heroNext").onclick=()=>{if(!photos.length)return;heroIndex=(heroIndex+1)%photos.length;updateHero();if(heroPlaying)startHero();};
$("heroPlay").onclick=()=>{heroPlaying=!heroPlaying;$("heroPlay").textContent=heroPlaying?"Ⅱ":"▶";heroPlaying?startHero():stopHero();};

function renderGallery(filter="all"){
  visible=filter==="all"?[...photos]:photos.filter(p=>p.category===filter);
  const grid=$("galleryGrid");grid.innerHTML="";$("emptyGallery").hidden=photos.length!==0;
  visible.forEach((p,i)=>{
    const card=document.createElement("article");
    card.className=`photo-card ${p.layout||"normal"}`;
    card.innerHTML=`<img src="${esc(p.image)}" alt="${esc(p.title||"Photo")}" loading="lazy"><div class="card-copy"><span>${esc(labels[p.category]||p.category||"Gallery")}</span><h3>${esc(p.title||"Photo")}</h3><p>${esc(p.caption||"")}</p></div><div class="card-num">${String(i+1).padStart(2,"0")}</div>`;
    card.onclick=()=>openSpotlight(i);
    grid.appendChild(card);
  });
}
document.querySelectorAll(".filter").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));btn.classList.add("active");renderGallery(btn.dataset.filter);});

function detectShape(img){
  const stage=$("spotStage");
  const ratio=img.naturalWidth/img.naturalHeight;
  stage.classList.remove("landscape","portrait","square");
  if(ratio>=1.25)stage.classList.add("landscape");
  else if(ratio<=0.82)stage.classList.add("portrait");
  else stage.classList.add("square");
}
function renderFilmstrip(){
  const rail=$("filmstrip");rail.innerHTML="";
  visible.forEach((p,i)=>{
    const t=document.createElement("button");
    t.className="film-thumb"+(i===spotIndex?" active":"");
    t.innerHTML=`<img src="${esc(p.image)}" alt="${esc(p.title||"Photo")}">`;
    t.onclick=()=>{spotIndex=i;updateSpotlight();if(spotPlaying)startSpotlight();};
    rail.appendChild(t);
  });
  setTimeout(()=>{const active=rail.querySelector(".film-thumb.active");if(active)active.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});},30);
}
function updateSpotlight(){
  const p=visible[spotIndex]; if(!p)return;
  $("spotBg").style.backgroundImage=`url("${p.image}")`;
  $("spotStage").style.setProperty("--spot-img",`url("${p.image}")`);
  const pre=new Image();
  pre.onload=()=>{detectShape(pre);$("spotImage").src=p.image;};
  pre.src=p.image;
  $("spotCategory").textContent=labels[p.category]||p.category||"Gallery";
  $("spotTitle").textContent=p.title||"Photo";
  $("spotCaption").textContent=p.caption||"";
  $("spotCurrent").textContent=String(spotIndex+1).padStart(2,"0");
  $("spotTotal").textContent=String(visible.length).padStart(2,"0");
  renderFilmstrip();
}
function openSpotlight(i){
  if(!visible.length)return;
  spotIndex=i;spotPlaying=true;
  $("autoplayState").textContent="ON";$("toggleAutoplay").textContent="Ⅱ PAUSE";
  updateSpotlight();$("spotlight").classList.add("open");document.body.classList.add("locked");startSpotlight();
}
function closeSpotlight(){stopSpotlight();$("spotlight").classList.remove("open");document.body.classList.remove("locked");}
function stopSpotlight(){clearTimeout(spotTimer);clearInterval($("spotProgress")._timer);$("spotProgress").style.width="0%";}
function startSpotlight(){
  stopSpotlight();
  if(!spotPlaying||visible.length<2)return;
  animateBar($("spotProgress"),ROTATE_MS);
  spotTimer=setTimeout(()=>{spotIndex=(spotIndex+1)%visible.length;updateSpotlight();startSpotlight();},ROTATE_MS);
}
$("spotPrev").onclick=()=>{spotIndex=(spotIndex-1+visible.length)%visible.length;updateSpotlight();if(spotPlaying)startSpotlight();};
$("spotNext").onclick=()=>{spotIndex=(spotIndex+1)%visible.length;updateSpotlight();if(spotPlaying)startSpotlight();};
$("toggleAutoplay").onclick=()=>{spotPlaying=!spotPlaying;$("autoplayState").textContent=spotPlaying?"ON":"OFF";$("toggleAutoplay").textContent=spotPlaying?"Ⅱ PAUSE":"▶ PLAY";spotPlaying?startSpotlight():stopSpotlight();};
$("closeSpotlight").onclick=closeSpotlight;
$("spotlightBtn").onclick=()=>{visible=[...photos];openSpotlight(heroIndex);};
$("legacySpotlight").onclick=()=>{visible=[...photos];openSpotlight(0);};
document.addEventListener("keydown",e=>{if(!$("spotlight").classList.contains("open"))return;if(e.key==="Escape")closeSpotlight();if(e.key==="ArrowLeft")$("spotPrev").click();if(e.key==="ArrowRight")$("spotNext").click();});

loadPhotos();
