const labels = {
  leadership:"Leadership",
  service:"Service",
  drill:"Drill & Color Guard",
  adventure:"Adventure",
  academics:"Academics",
  events:"Events"
};

let photos = Array.isArray(window.CALLAWAY_GALLERY) ? window.CALLAWAY_GALLERY : [];
let visible = [...photos];
let current = 0;

const galleryGrid = document.getElementById("galleryGrid");
const miniRail = document.getElementById("miniRail");
const heroMedia = document.getElementById("heroMedia");

const heroTitle = document.getElementById("heroTitle");
const heroCategory = document.getElementById("heroCategory");
const heroCaption = document.getElementById("heroCaption");
const heroPhotoCount = document.getElementById("heroPhotoCount");
const heroSlideNumber = document.getElementById("heroSlideNumber");
const heroProgress = document.getElementById("heroProgress");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lbCategory = document.getElementById("lbCategory");
const lbTitle = document.getElementById("lbTitle");
const lbCaption = document.getElementById("lbCaption");
const lbCount = document.getElementById("lbCount");
const bigNum = document.getElementById("bigNum");
const lightboxProgress = document.getElementById("lightboxProgress");
const autoplayState = document.getElementById("autoplayState");

const HERO_DELAY = 5000;
const LIGHTBOX_DELAY = 5000;

let heroIndex = 0;
let heroTimer = null;
let heroProgressTimer = null;
let heroAutoplay = true;

let lightboxTimer = null;
let lightboxProgressTimer = null;
let lightboxAutoplay = true;

heroPhotoCount.textContent = `${String(photos.length).padStart(2,"0")} PHOTOS`;

function esc(s=""){
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[m]));
}

function featuredPhotos(){
  return photos.slice(0, Math.min(photos.length, 6));
}

function buildHeroSlides(){
  heroMedia.innerHTML = "";
  featuredPhotos().forEach((p, i) => {
    const slide = document.createElement("div");
    slide.className = "hero-slide" + (i === 0 ? " active" : "");
    slide.style.backgroundImage = `url("${p.image}")`;
    heroMedia.appendChild(slide);
  });
  updateHeroCard();
  renderMiniRail();
}

function updateHeroCard(){
  const list = featuredPhotos();
  if(!list.length) return;
  const p = list[heroIndex];
  [...heroMedia.children].forEach((el, i) => el.classList.toggle("active", i === heroIndex));
  heroTitle.textContent = p.title || "Featured Photo";
  heroCategory.textContent = labels[p.category] || p.category || "Gallery";
  heroCaption.textContent = p.caption || "Callaway JROTC visual highlight";
  heroSlideNumber.textContent = String(heroIndex + 1).padStart(2,"0");
}

function animateProgress(bar, duration){
  clearInterval(bar._timer);
  bar.style.width = "0%";
  const start = performance.now();
  bar._timer = setInterval(() => {
    const elapsed = performance.now() - start;
    const pct = Math.min(100, (elapsed / duration) * 100);
    bar.style.width = pct + "%";
    if(pct >= 100){
      clearInterval(bar._timer);
    }
  }, 40);
}

function startHeroAutoplay(){
  stopHeroAutoplay();
  if(!heroAutoplay || featuredPhotos().length <= 1) return;
  animateProgress(heroProgress, HERO_DELAY);
  heroTimer = setTimeout(() => {
    nextHero();
    startHeroAutoplay();
  }, HERO_DELAY);
}

function stopHeroAutoplay(){
  clearTimeout(heroTimer);
  clearInterval(heroProgress? heroProgress._timer : null);
}

function nextHero(){
  const list = featuredPhotos();
  if(!list.length) return;
  heroIndex = (heroIndex + 1) % list.length;
  updateHeroCard();
}

function prevHero(){
  const list = featuredPhotos();
  if(!list.length) return;
  heroIndex = (heroIndex - 1 + list.length) % list.length;
  updateHeroCard();
}

function renderMiniRail(){
  miniRail.innerHTML = "";
  featuredPhotos().forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "mini-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${esc(p.title)}">
      <div class="mini-copy">
        <span>${esc(labels[p.category] || p.category || "Gallery")}</span>
        <h4>${esc(p.title || "Photo")}</h4>
      </div>`;
    card.onclick = () => {
      heroIndex = i;
      updateHeroCard();
      openLightboxByPhotoIndex(i);
      if(heroAutoplay) startHeroAutoplay();
    };
    miniRail.appendChild(card);
  });
}

function renderGallery(filter = "all"){
  visible = filter === "all" ? [...photos] : photos.filter(p => p.category === filter);
  galleryGrid.innerHTML = "";

  visible.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = `card ${p.layout || "normal"}`;
    card.innerHTML = `
      <img src="${p.image}" alt="${esc(p.title)}" loading="lazy">
      <div class="card-num">${String(i + 1).padStart(2, "0")}</div>
      <div class="card-copy">
        <span>${esc(labels[p.category] || p.category || "Gallery")}</span>
        <h3>${esc(p.title || "Photo")}</h3>
        <p>${esc(p.caption || "")}</p>
      </div>
    `;
    card.onclick = () => openLightbox(i);
    galleryGrid.appendChild(card);
  });
}

function updateLightbox(){
  const p = visible[current];
  if(!p) return;
  lightboxImage.src = p.image;
  lightboxImage.alt = p.title || "Photo";
  lbCategory.textContent = labels[p.category] || p.category || "Gallery";
  lbTitle.textContent = p.title || "Photo";
  lbCaption.textContent = p.caption || "";
  lbCount.textContent = `${String(current + 1).padStart(2,"0")} / ${String(visible.length).padStart(2,"0")}`;
  bigNum.textContent = String(current + 1).padStart(2,"0");
}

function startLightboxAutoplay(){
  stopLightboxAutoplay();
  if(!lightboxAutoplay || visible.length <= 1) return;
  autoplayState.textContent = "ON";
  document.getElementById("toggleAutoplayBtn").textContent = "PAUSE AUTOPLAY";
  animateProgress(lightboxProgress, LIGHTBOX_DELAY);
  lightboxTimer = setTimeout(() => {
    nextLightbox();
    startLightboxAutoplay();
  }, LIGHTBOX_DELAY);
}

function stopLightboxAutoplay(){
  clearTimeout(lightboxTimer);
  clearInterval(lightboxProgress? lightboxProgress._timer : null);
  lightboxProgress.style.width = "0%";
}

function nextLightbox(){
  current = (current + 1) % visible.length;
  updateLightbox();
}

function prevLightbox(){
  current = (current - 1 + visible.length) % visible.length;
  updateLightbox();
}

function openLightbox(index){
  current = index;
  updateLightbox();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  lightboxAutoplay = true;
  startLightboxAutoplay();
}

function openLightboxByPhotoIndex(indexInPhotos){
  visible = [...photos];
  current = indexInPhotos;
  updateLightbox();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  lightboxAutoplay = true;
  startLightboxAutoplay();
}

function closeLightbox(){
  stopLightboxAutoplay();
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function toggleLightboxAutoplay(){
  lightboxAutoplay = !lightboxAutoplay;
  autoplayState.textContent = lightboxAutoplay ? "ON" : "OFF";
  document.getElementById("toggleAutoplayBtn").textContent = lightboxAutoplay ? "PAUSE AUTOPLAY" : "PLAY AUTOPLAY";
  if(lightboxAutoplay){
    startLightboxAutoplay();
  }else{
    stopLightboxAutoplay();
  }
}

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderGallery(btn.dataset.filter);
  });
});

document.getElementById("heroPrevBtn").onclick = () => { prevHero(); if(heroAutoplay) startHeroAutoplay(); };
document.getElementById("heroNextBtn").onclick = () => { nextHero(); if(heroAutoplay) startHeroAutoplay(); };
document.getElementById("heroOpenBtn").onclick = () => openLightboxByPhotoIndex(heroIndex);
document.getElementById("heroPauseBtn").onclick = () => {
  heroAutoplay = !heroAutoplay;
  document.getElementById("heroPauseBtn").textContent = heroAutoplay ? "PAUSE HERO AUTOPLAY" : "PLAY HERO AUTOPLAY";
  if(heroAutoplay){
    startHeroAutoplay();
  }else{
    stopHeroAutoplay();
  }
};

document.getElementById("closeBtn").onclick = closeLightbox;
document.getElementById("nextBtn").onclick = () => { nextLightbox(); if(lightboxAutoplay) startLightboxAutoplay(); };
document.getElementById("prevBtn").onclick = () => { prevLightbox(); if(lightboxAutoplay) startLightboxAutoplay(); };
document.getElementById("toggleAutoplayBtn").onclick = toggleLightboxAutoplay;

lightbox.addEventListener("click", e => {
  if(e.target === lightbox){
    closeLightbox();
  }
});

document.addEventListener("keydown", e => {
  if(!lightbox.classList.contains("open")) return;
  if(e.key === "Escape") closeLightbox();
  if(e.key === "ArrowRight"){ nextLightbox(); if(lightboxAutoplay) startLightboxAutoplay(); }
  if(e.key === "ArrowLeft"){ prevLightbox(); if(lightboxAutoplay) startLightboxAutoplay(); }
});

buildHeroSlides();
renderGallery();
startHeroAutoplay();
