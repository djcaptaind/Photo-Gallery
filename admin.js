
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
  const button=document.getElementById("exportBtn");
  const oldText=button.textContent;
  button.disabled=true;
  button.textContent="BUILDING PACKAGE...";
  try{
    const ordered=await getAll();
    ordered.sort((a,b)=>(a.order??0)-(b.order??0));
    if(!ordered.length){toast("Nothing to export","error");return}

    const entries=[];
    const out=[];
    const used=new Set();

    function slugify(text){
      return String(text||"photo").toLowerCase()
        .replace(/[^a-z0-9]+/g,"-")
        .replace(/^-+|-+$/g,"")
        .slice(0,60)||"photo";
    }
    function uniqueName(base,ext){
      let name=base+ext,n=2;
      while(used.has(name)){name=base+"-"+n+ext;n++}
      used.add(name);return name;
    }

    for(let i=0;i<ordered.length;i++){
      const p=ordered[i];
      let imagePath=p.image;
      if(typeof p.image==="string" && p.image.startsWith("data:image/")){
        const m=p.image.match(/^data:image\/([^;]+);base64,(.+)$/);
        if(m){
          let ext=m[1].toLowerCase();
          if(ext==="jpeg")ext="jpg";
          if(!["jpg","png","webp","gif"].includes(ext))ext="jpg";
          const filename=uniqueName(slugify(p.title||("photo-"+(i+1))),"."+ext);
          entries.push({name:"images/"+filename,data:m[2],base64:true});
          imagePath="images/"+filename;
        }
      }
      const {id,order,...rest}=p;
      out.push({...rest,image:imagePath});
    }

    const galleryText="window.CALLAWAY_GALLERY = "+JSON.stringify(out,null,2)+";";
    entries.push({name:"gallery-data.js",data:galleryText});
    entries.push({name:"UPLOAD-INSTRUCTIONS.txt",data:
`CALLAWAY JROTC GALLERY - GITHUB UPLOAD PACKAGE

1. Extract this ZIP.
2. Upload gallery-data.js to the ROOT of your GitHub Photo-Gallery repository and replace the old file.
3. Open the repository's images folder.
4. Upload every image contained in this package's images folder.
5. Commit the changes.
6. Wait for GitHub Pages to redeploy.

IMPORTANT: Do not upload this ZIP file itself to GitHub.
`});

    const blob=await window.makeStoredZip(entries);
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="Callaway_JROTC_Gallery_Upload_Package.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast("Upload package created");
  }catch(err){
    console.error(err);
    toast("Could not build upload package: "+(err.message||"unknown error"),"error");
  }finally{
    button.disabled=false;
    button.textContent=oldText;
  }
};



// ============================================================
// DIRECT GITHUB PUBLISH
// Uses GitHub Contents API from the browser.
// Token is intentionally never stored in IndexedDB/localStorage.
// ============================================================
function ghValue(id){return document.getElementById(id).value.trim()}
function githubHeaders(token){
  return {
    "Accept":"application/vnd.github+json",
    "Authorization":"Bearer "+token,
    "X-GitHub-Api-Version":"2022-11-28",
    "Content-Type":"application/json"
  };
}
function utf8ToBase64(text){
  const bytes=new TextEncoder().encode(text);
  let bin="";
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk){
    bin+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  }
  return btoa(bin);
}
function dataUrlParts(dataUrl){
  const m=String(dataUrl||"").match(/^data:image\/([^;]+);base64,(.+)$/);
  if(!m)return null;
  let ext=m[1].toLowerCase();
  if(ext==="jpeg")ext="jpg";
  if(!["jpg","png","webp","gif"].includes(ext))ext="jpg";
  return {ext,base64:m[2]};
}
function ghSlug(text){
  return String(text||"photo").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .slice(0,55)||"photo";
}
async function ghJson(url,options={}){
  const res=await fetch(url,options);
  let body=null;
  try{body=await res.json()}catch(_){}
  if(!res.ok){
    const msg=(body&&body.message)?body.message:`GitHub returned ${res.status}`;
    throw new Error(msg);
  }
  return body;
}
function setPublishProgress(done,total,text){
  const wrap=document.getElementById("publishProgress");
  wrap.hidden=false;
  const pct=total?Math.round(done/total*100):0;
  document.getElementById("progressText").textContent=text;
  document.getElementById("progressPct").textContent=pct+"%";
  document.getElementById("progressBar").style.width=pct+"%";
}
async function getExistingContentSha(owner,repo,path,branch,token){
  const url=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`;
  const res=await fetch(url,{headers:githubHeaders(token)});
  if(res.status===404)return null;
  let body=null;try{body=await res.json()}catch(_){}
  if(!res.ok)throw new Error((body&&body.message)||`GitHub returned ${res.status}`);
  return body.sha||null;
}
async function putGitHubFile(owner,repo,path,branch,token,contentBase64,message){
  const sha=await getExistingContentSha(owner,repo,path,branch,token);
  const payload={message,content:contentBase64,branch};
  if(sha)payload.sha=sha;
  const url=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
  return ghJson(url,{method:"PUT",headers:githubHeaders(token),body:JSON.stringify(payload)});
}

document.getElementById("testGitHubBtn").onclick=async()=>{
  const owner=ghValue("ghOwner"),repo=ghValue("ghRepo"),branch=ghValue("ghBranch"),token=ghValue("ghToken");
  if(!owner||!repo||!branch||!token){toast("Complete all GitHub fields","error");return}
  const btn=document.getElementById("testGitHubBtn");
  const old=btn.textContent;btn.disabled=true;btn.textContent="TESTING...";
  try{
    const info=await ghJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,{headers:githubHeaders(token)});
    await ghJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`,{headers:githubHeaders(token)});
    toast(`Connected to ${info.full_name}`);
  }catch(err){
    console.error(err);toast("GitHub connection failed: "+err.message,"error");
  }finally{btn.disabled=false;btn.textContent=old}
};

document.getElementById("publishGitHubBtn").onclick=async()=>{
  const owner=ghValue("ghOwner"),repo=ghValue("ghRepo"),branch=ghValue("ghBranch"),token=ghValue("ghToken");
  if(!owner||!repo||!branch||!token){toast("Complete all GitHub fields","error");return}
  const btn=document.getElementById("publishGitHubBtn");
  const testBtn=document.getElementById("testGitHubBtn");
  const old=btn.textContent;btn.disabled=true;testBtn.disabled=true;btn.textContent="PUBLISHING...";
  try{
    const ordered=await getAll();
    ordered.sort((a,b)=>(a.order??0)-(b.order??0));
    if(!ordered.length)throw new Error("There are no photos to publish.");

    // Confirm repo + branch before writing.
    await ghJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,{headers:githubHeaders(token)});
    await ghJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`,{headers:githubHeaders(token)});

    const output=[];
    const used=new Set();
    const uploads=[];
    for(let i=0;i<ordered.length;i++){
      const p=ordered[i];
      let imagePath=p.image;
      const parts=dataUrlParts(p.image);
      if(parts){
        let base=ghSlug(p.title||("photo-"+(i+1)));
        let filename=base+"."+parts.ext,n=2;
        while(used.has(filename)){filename=base+"-"+n+"."+parts.ext;n++}
        used.add(filename);
        imagePath="images/"+filename;
        uploads.push({path:imagePath,base64:parts.base64,title:p.title||filename});
      }
      const {id,order,...rest}=p;
      output.push({...rest,image:imagePath});
    }

    const total=uploads.length+1;
    let done=0;
    setPublishProgress(done,total,"Preparing GitHub upload…");

    for(const file of uploads){
      setPublishProgress(done,total,"Uploading "+file.path+"…");
      await putGitHubFile(owner,repo,file.path,branch,token,file.base64,"Gallery photo: "+file.title);
      done++;
      setPublishProgress(done,total,"Uploaded "+file.path);
    }

    const galleryText="window.CALLAWAY_GALLERY = "+JSON.stringify(output,null,2)+";";
    setPublishProgress(done,total,"Updating gallery-data.js…");
    await putGitHubFile(owner,repo,"gallery-data.js",branch,token,utf8ToBase64(galleryText),"Update Callaway JROTC photo gallery");
    done++;
    setPublishProgress(done,total,"Published successfully");
    toast("Gallery published to GitHub");

    // Update local records so already-published data URLs become repository paths.
    for(let i=0;i<ordered.length;i++){
      const updated=output[i];
      ordered[i].image=updated.image;
      await putRecord(ordered[i]);
    }
    await refresh();
  }catch(err){
    console.error(err);
    setPublishProgress(0,1,"Publish failed");
    toast("Publish failed: "+err.message,"error");
  }finally{
    btn.disabled=false;testBtn.disabled=false;btn.textContent=old;
  }
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
