const OWNER="djcaptaind";
const REPO="Photo-Gallery";
const BRANCH="main";
const DATA_URL=`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/gallery-data.json`;
const labels={leadership:"Leadership",service:"Service",drill:"Drill & Color Guard",adventure:"Adventure",academics:"Academics",events:"Events"};
const SLIDE_MS=5000;
let photos=[];
let visible=[];
let heroIndex=0;
let heroPlaying=true;
let heroTimer=null;
let current=0;
let lightboxPlaying=true;
let lightboxTimer=null;
const $=id=>document.getElementById(id);
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
async function loadPhotos(){
  try{
    const r=await fetch(DATA_URL+`?v=${Date.now()}`,{cache:"no-store"});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const data=await r.json();
    photos=Array.isArray(data)?data:[];
  }catch(e){console.error("Gallery load failed",e);photos=[]}
  visible=[...photos];
  $("photoCount").textContent=String(photos.length).padStart(2,"0");
  setupHero();
  renderGallery();
}
function setupHero(){
  const hero=$("home"),empty=$("emptyHero"),card=$("heroCard");
  if(!photos.length){hero.hidden=true;empty.hidden=false;card.hidden=true;return}
  hero.hidden=false;empty.hidden=true;card.hidden=false;
  $("heroSlides").innerHTML=photos.map((p,i)=>`<div class="hero-slide${i===0?' active':''}" style="background-image:url('${String(p.image).replace(/'/g,"%27")}')"></div>`).join("");
  heroIndex=0;updateHero();startHero();
}
function updateHero(){
  if(!photos.length)return;
  const p=photos[heroIndex];
  [...$("heroSlides").children].forEach((el,i)=>el.classList.toggle("active",i===heroIndex));
  $("heroTitle").textContent=p.title||"Callaway JROTC";
  $("heroCaption").textContent=p.caption||labels[p.category]||"Callaway JROTC";
  $("heroCounter").textContent=String(heroIndex+1).padStart(2,"0");
}
function animateBar(el,ms){clearInterval(el._timer);el.style.width="0%";const start=performance.now();el._timer=setInterval(()=>{const pct=Math.min(100,(performance.now()-start)/ms*100);el.style.width=pct+"%";if(pct>=100)clearInterval(el._timer)},40)}
function startHero(){stopHero();if(!heroPlaying||photos.length<2)return;animateBar($("heroProgressBar"),SLIDE_MS);heroTimer=setTimeout(()=>{heroIndex=(heroIndex+1)%photos.length;updateHero();startHero()},SLIDE_MS)}
function stopHero(){clearTimeout(heroTimer);clearInterval($("heroProgressBar")._timer)}
function renderGallery(filter="all"){
  visible=filter==="all"?[...photos]:photos.filter(p=>p.category===filter);
  const grid=$("galleryGrid");grid.innerHTML="";$("emptyGallery").hidden=photos.length!==0;
  visible.forEach((p,i)=>{const c=document.createElement("article");c.className=`photo-card ${p.layout||"normal"}`;c.innerHTML=`<img src="${esc(p.image)}" alt="${esc(p.title||'Photo')}" loading="lazy"><div class="card-num">${String(i+1).padStart(2,"0")}</div><div class="card-copy"><span>${esc(labels[p.category]||p.category||"Gallery")}</span><h3>${esc(p.title||"Photo")}</h3><p>${esc(p.caption||"")}</p></div>`;c.onclick=()=>openLightbox(i);grid.appendChild(c)})
}
function updateLightbox(){const p=visible[current];if(!p)return;$("lightboxImage").src=p.image;$("lbCategory").textContent=labels[p.category]||p.category||"Gallery";$("lbTitle").textContent=p.title||"Photo";$("lbCaption").textContent=p.caption||"";$("lbCounter").textContent=`${String(current+1).padStart(2,"0")} / ${String(visible.length).padStart(2,"0")}`;$("bigNumber").textContent=String(current+1).padStart(2,"0")}
function openLightbox(i){if(!visible.length)return;current=i;updateLightbox();$("lightbox").classList.add("open");$("lightbox").setAttribute("aria-hidden","false");document.body.classList.add("locked");lightboxPlaying=true;$("autoplayState").textContent="ON";$("toggleAutoplay").textContent="PAUSE AUTOPLAY";startLightbox()}
function closeLightbox(){stopLightbox();$("lightbox").classList.remove("open");document.body.classList.remove("locked")}
function startLightbox(){stopLightbox();if(!lightboxPlaying||visible.length<2)return;animateBar($("lightboxProgressBar"),SLIDE_MS);lightboxTimer=setTimeout(()=>{current=(current+1)%visible.length;updateLightbox();startLightbox()},SLIDE_MS)}
function stopLightbox(){clearTimeout(lightboxTimer);clearInterval($("lightboxProgressBar")._timer);$("lightboxProgressBar").style.width="0%"}
$("heroPrev").onclick=()=>{if(!photos.length)return;heroIndex=(heroIndex-1+photos.length)%photos.length;updateHero();if(heroPlaying)startHero()};
$("heroNext").onclick=()=>{if(!photos.length)return;heroIndex=(heroIndex+1)%photos.length;updateHero();if(heroPlaying)startHero()};
$("heroPause").onclick=()=>{heroPlaying=!heroPlaying;$("heroPause").textContent=heroPlaying?"PAUSE":"PLAY";heroPlaying?startHero():stopHero()};
$("openHeroBtn").onclick=()=>{visible=[...photos];openLightbox(heroIndex)};
$("closeBtn").onclick=closeLightbox;
$("prevBtn").onclick=()=>{current=(current-1+visible.length)%visible.length;updateLightbox();if(lightboxPlaying)startLightbox()};
$("nextBtn").onclick=()=>{current=(current+1)%visible.length;updateLightbox();if(lightboxPlaying)startLightbox()};
$("toggleAutoplay").onclick=()=>{lightboxPlaying=!lightboxPlaying;$("autoplayState").textContent=lightboxPlaying?"ON":"OFF";$("toggleAutoplay").textContent=lightboxPlaying?"PAUSE AUTOPLAY":"PLAY AUTOPLAY";lightboxPlaying?startLightbox():stopLightbox()};
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderGallery(b.dataset.filter)});
document.addEventListener("keydown",e=>{if(!$("lightbox").classList.contains("open"))return;if(e.key==="Escape")closeLightbox();if(e.key==="ArrowRight")$("nextBtn").click();if(e.key==="ArrowLeft")$("prevBtn").click()});
loadPhotos();