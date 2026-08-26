const labels={leadership:"Leadership",service:"Service",drill:"Drill & Color Guard",adventure:"Adventure",academics:"Academics",events:"Events"};
let photos=Array.isArray(window.CALLAWAY_GALLERY)?window.CALLAWAY_GALLERY:[],visible=[...photos],current=0;
const grid=document.getElementById("galleryGrid");
document.getElementById("photoCount").textContent=String(photos.length).padStart(2,"0");

function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function render(filter="all"){grid.innerHTML="";visible=filter==="all"?[...photos]:photos.filter(p=>p.category===filter);visible.forEach((p,i)=>{const c=document.createElement("article");c.className=`card ${p.layout||"normal"}`;c.innerHTML=`<img src="${p.image}" alt="${esc(p.title)}"><div class="card-num">${String(i+1).padStart(2,"0")}</div><div class="card-copy"><span>${labels[p.category]||p.category}</span><h3>${esc(p.title)}</h3><p>${esc(p.caption||"")}</p></div>`;c.onclick=()=>openLb(i);grid.appendChild(c)})}
function openLb(i){if(!visible.length)return;current=i;updateLb();document.getElementById("lightbox").classList.add("open");document.body.classList.add("no-scroll")}
function updateLb(){const p=visible[current];document.getElementById("lightboxImage").src=p.image;document.getElementById("lbCategory").textContent=labels[p.category]||p.category;document.getElementById("lbTitle").textContent=p.title;document.getElementById("lbCaption").textContent=p.caption||"";document.getElementById("lbCount").textContent=`${String(current+1).padStart(2,"0")} / ${String(visible.length).padStart(2,"0")}`;document.getElementById("bigNum").textContent=String(current+1).padStart(2,"0")}
function closeLb(){document.getElementById("lightbox").classList.remove("open");document.body.classList.remove("no-scroll")}
function next(){current=(current+1)%visible.length;updateLb()}function prev(){current=(current-1+visible.length)%visible.length;updateLb()}
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");render(b.dataset.filter)});
document.getElementById("randomBtn").onclick=()=>{visible=[...photos];openLb(Math.floor(Math.random()*visible.length))};
document.getElementById("closeBtn").onclick=closeLb;document.getElementById("nextBtn").onclick=next;document.getElementById("prevBtn").onclick=prev;
document.addEventListener("keydown",e=>{if(!document.getElementById("lightbox").classList.contains("open"))return;if(e.key==="Escape")closeLb();if(e.key==="ArrowRight")next();if(e.key==="ArrowLeft")prev()});
render();