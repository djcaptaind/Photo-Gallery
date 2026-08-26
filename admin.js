
const DB_NAME="CallawayJROTCGalleryDB";
const DB_VERSION=1;
const STORE="photos";
const labels={leadership:"Leadership",service:"Service",drill:"Drill & Color Guard",adventure:"Adventure",academics:"Academics",events:"Events"};
let db;
let items=[];
let selectedDataUrl="";
let selectedFileName="";

function toast(msg,type="ok"){
  const t=document.getElementById("toast");
  t.textContent=msg;
  t.style.borderColor=type==="error"?"#ff4d5e":"rgba(255,255,255,.12)";
  t.style.color=type==="error"?"#ffd4d8":"#fff";
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2600);
}

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const d=req.result;
      if(!d.objectStoreNames.contains(STORE)){
        d.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});
      }
    };
    req.onsuccess=()=>{db=req.result;resolve(db)};
    req.onerror=()=>reject(req.error);
  });
}

function getAll(){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readonly");
    const req=tx.objectStore(STORE).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>reject(req.error);
  });
}

function addRecord(record){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readwrite");
    const req=tx.objectStore(STORE).add(record);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

function putRecord(record){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readwrite");
    const req=tx.objectStore(STORE).put(record);
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}

function deleteRecord(id){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readwrite");
    const req=tx.objectStore(STORE).delete(id);
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}

function clearDB(){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readwrite");
    const req=tx.objectStore(STORE).clear();
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}

async function compressImage(file,maxW=1800,maxH=1400,quality=.86){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("Could not read the photo."));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error("This image format could not be opened."));
      img.onload=()=>{
        let w=img.naturalWidth,h=img.naturalHeight;
        const scale=Math.min(1,maxW/w,maxH/h);
        w=Math.round(w*scale); h=Math.round(h*scale);
        const canvas=document.createElement("canvas");
        canvas.width=w; canvas.height=h;
        const ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0,w,h);
        try{
          const out=canvas.toDataURL("image/jpeg",quality);
          resolve(out);
        }catch(e){reject(e)}
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function seedIfEmpty(){
  items=await getAll();
  if(items.length) return;
  const seed=Array.isArray(window.CALLAWAY_GALLERY)?window.CALLAWAY_GALLERY:[];
  for(let i=0;i<seed.length;i++){
    await addRecord({...seed[i],order:i});
  }
  items=await getAll();
}

async function refresh(){
  items=await getAll();
  items.sort((a,b)=>(a.order??0)-(b.order??0));
  render();
}

function clearForm(){
  selectedDataUrl="";
  selectedFileName="";
  document.getElementById("fileInput").value="";
  document.getElementById("fileName").textContent="No photo selected";
  document.getElementById("urlInput").value="";
  document.getElementById("titleInput").value="";
  document.getElementById("captionInput").value="";
  const preview=document.getElementById("photoPreview");
  if(preview){preview.src="";preview.hidden=true}
}

document.getElementById("fileInput").onchange=async e=>{
  const f=e.target.files[0];
  if(!f) return;
  selectedFileName=f.name;
  document.getElementById("fileName").textContent="Preparing "+f.name+"...";
  try{
    selectedDataUrl=await compressImage(f);
    document.getElementById("fileName").textContent=f.name+" • ready";
    const preview=document.getElementById("photoPreview");
    if(preview){preview.src=selectedDataUrl;preview.hidden=false}
    toast("Photo ready to add");
  }catch(err){
    console.error(err);
    selectedDataUrl="";
    document.getElementById("fileName").textContent="Could not prepare photo";
    toast("Could not read that photo","error");
  }
};

document.getElementById("addBtn").onclick=async()=>{
  const url=document.getElementById("urlInput").value.trim();
  const image=selectedDataUrl||url;
  const title=document.getElementById("titleInput").value.trim();

  if(!image){toast("Choose a photo first","error");return}
  if(!title){toast("Enter a title","error");return}

  const button=document.getElementById("addBtn");
  const old=button.textContent;
  button.disabled=true;
  button.textContent="ADDING...";

  try{
    const current=await getAll();
    await addRecord({
      image,
      title,
      caption:document.getElementById("captionInput").value.trim(),
      category:document.getElementById("categoryInput").value,
      layout:document.getElementById("layoutInput").value,
      order:current.length
    });
    await refresh();
    clearForm();
    toast("Photo added to gallery");
  }catch(err){
    console.error(err);
    toast("Photo could not be added: "+(err.message||"browser storage error"),"error");
  }finally{
    button.disabled=false;
    button.textContent=old;
  }
};

function render(){
  const c=document.getElementById("cards");
  c.innerHTML="";
  document.getElementById("count").textContent=items.length;
  if(!items.length){
    c.innerHTML='<div style="grid-column:1/-1;padding:50px;text-align:center;color:#7890a4;border:1px dashed rgba(255,255,255,.12);border-radius:12px">No photos yet.</div>';
    return;
  }
  items.forEach((p,i)=>{
    const d=document.createElement("div");
    d.className="card";
    d.innerHTML=`<img src="${p.image}" alt=""><div class="body"><span>${labels[p.category]||p.category} • ${p.layout||"normal"}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.caption||"")}</p><div class="buttons"><button data-a="up">↑</button><button data-a="down">↓</button><button data-a="edit">EDIT</button><button data-a="delete">DELETE</button></div></div>`;
    d.querySelector('[data-a="up"]').onclick=()=>move(i,-1);
    d.querySelector('[data-a="down"]').onclick=()=>move(i,1);
    d.querySelector('[data-a="edit"]').onclick=()=>editItem(i);
    d.querySelector('[data-a="delete"]').onclick=()=>removeItem(i);
    c.appendChild(d);
  });
}

function escapeHtml(s=""){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}

async function move(i,delta){
  const j=i+delta;
  if(j<0||j>=items.length)return;
  const a=items[i],b=items[j];
  const ao=a.order??i,bo=b.order??j;
  a.order=bo;b.order=ao;
  await putRecord(a);await putRecord(b);await refresh();
}

async function editItem(i){
  const p=items[i];
  const t=prompt("Title:",p.title); if(t===null)return;
  const cap=prompt("Caption:",p.caption||""); if(cap===null)return;
  p.title=t.trim()||p.title;p.caption=cap.trim();
  await putRecord(p);await refresh();toast("Photo updated");
}

async function removeItem(i){
  const p=items[i];
  if(!confirm(`Delete "${p.title}"?`))return;
  await deleteRecord(p.id);
  await refresh();
  // normalize order
  for(let k=0;k<items.length;k++){items[k].order=k;await putRecord(items[k])}
  await refresh();toast("Photo deleted");
}

document.getElementById("resetBtn").onclick=async()=>{
  if(!confirm("Reset the manager to the original sample gallery?"))return;
  await clearDB();
  const seed=Array.isArray(window.CALLAWAY_GALLERY)?window.CALLAWAY_GALLERY:[];
  for(let i=0;i<seed.length;i++)await addRecord({...seed[i],order:i});
  await refresh();toast("Sample gallery restored");
};

document.getElementById("exportBtn").onclick=async()=>{
  const ordered=await getAll();
  ordered.sort((a,b)=>(a.order??0)-(b.order??0));
  const cleaned=ordered.map(({id,order,...rest})=>rest);
  const text="window.CALLAWAY_GALLERY = "+JSON.stringify(cleaned,null,2)+";";
  const blob=new Blob([text],{type:"text/javascript"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="gallery-data.js";
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast("gallery-data.js exported");
};

(async function init(){
  try{
    await openDB();
    await seedIfEmpty();
    await refresh();
  }catch(err){
    console.error(err);
    toast("Browser storage could not initialize","error");
  }
})();
