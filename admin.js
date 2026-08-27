const OWNER="djcaptaind";
const REPO="Photo-Gallery";
const BRANCH="main";
const API_BASE=`https://api.github.com/repos/${OWNER}/${REPO}`;
const labels={leadership:"Leadership",service:"Service",drill:"Drill & Color Guard",adventure:"Adventure",academics:"Academics",events:"Events"};
const themeLabels={
  "military-ball":"Military Ball / Gala",
  "color-guard":"Color Guard / Ceremony",
  "drill-competition":"Drill Competition",
  "cadet-challenge":"Cadet Challenge / Fitness",
  "adventure-training":"Adventure Training / ATU",
  "academics-college":"Academics / College Visit",
  "stem-aviation":"STEM / Aviation",
  "community-service":"Community Service",
  "awards-promotion":"Awards / Promotion",
  "classroom":"Classroom / Instruction",
  "auto":"Auto From Category"
};
let published=[];
let queue=[];
let selectedFiles=[];
const $=id=>document.getElementById(id);
function toast(msg,type="ok"){const t=$("toast");t.textContent=msg;t.style.color=type==="error"?"#ffd2d7":"#fff";t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function status(msg,type="ok"){const b=$("statusBox");b.hidden=false;b.className=`status-box ${type}`;b.textContent=msg}
function formatBytes(n){if(n<1024)return n+" B";if(n<1048576)return(n/1024).toFixed(1)+" KB";return(n/1048576).toFixed(1)+" MB"}
function headers(token=""){const h={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};if(token)h.Authorization="Bearer "+token;return h}
async function api(url,opts={}){let r;try{r=await fetch(url,opts)}catch(e){throw new Error("Browser could not reach GitHub: "+e.message)}let b=null;try{b=await r.json()}catch(_){ }if(!r.ok){let m=b&&b.message?b.message:`GitHub HTTP ${r.status}`;if(r.status===401)m+=" — token invalid or expired.";if(r.status===403)m+=" — token needs Contents: Read and write.";if(r.status===404)m+=" — repository/file not accessible.";if(r.status===409)m+=" — gallery changed during publish; reload and try again.";throw new Error(m)}return b}
function decode64(s){const bin=atob(String(s||"").replace(/\s/g,""));const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new TextDecoder().decode(bytes)}
function encode64(s){const bytes=new TextEncoder().encode(s);let bin="";for(let i=0;i<bytes.length;i+=32768)bin+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(bin)}
async function getRemote(token=""){try{const b=await api(`${API_BASE}/contents/gallery-data.json?ref=${BRANCH}&t=${Date.now()}`,{headers:headers(token)});const data=JSON.parse(decode64(b.content));return{items:Array.isArray(data)?data:[],sha:b.sha}}catch(e){if(/404/.test(e.message))return{items:[],sha:null};throw e}}
function readFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error("Could not read this photo."));r.onload=()=>resolve(r.result);r.readAsDataURL(file)})}
async function optimize(file){const raw=await readFile(file);try{const img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=raw});const maxW=1800,maxH=1400,scale=Math.min(1,maxW/img.naturalWidth,maxH/img.naturalHeight),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));const c=document.createElement("canvas");c.width=w;c.height=h;const ctx=c.getContext("2d",{alpha:false});ctx.fillStyle="#000";ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);return c.toDataURL("image/jpeg",.84)}catch(_){return raw}}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function renderPublished(){
  const g=$("publishedGrid"); g.innerHTML=""; $("publishedCount").textContent=published.length;
  if(!published.length){g.innerHTML='<div class="empty">Gallery is empty. Add your first real Callaway JROTC photo.</div>';return;}
  published.forEach((p,i)=>{
    const c=document.createElement("article"); c.className="card";
    const categoryOptions=Object.entries(labels).map(([v,l])=>`<option value="${v}" ${v===(p.category||"events")?"selected":""}>${esc(l)}</option>`).join("");
    const themeOptions=Object.entries(themeLabels).map(([v,l])=>`<option value="${v}" ${v===(p.eventTheme||"auto")?"selected":""}>${esc(l)}</option>`).join("");
    const layoutOptions=["normal","wide","tall"].map(v=>`<option value="${v}" ${v===(p.layout||"normal")?"selected":""}>${v[0].toUpperCase()+v.slice(1)}</option>`).join("");
    c.innerHTML=`<img src="${p.image}" alt=""><div class="card-body">
      <span>${esc(labels[p.category]||p.category||"Gallery")}</span><h3>${esc(p.title||"Photo")}</h3>
      <div class="edit-grid">
        <div class="full"><label>Title</label><input class="edit-title" value="${esc(p.title||"")}"></div>
        <div class="full"><label>Caption</label><textarea class="edit-caption" rows="3">${esc(p.caption||"")}</textarea></div>
        <div><label>Category</label><select class="edit-category">${categoryOptions}</select></div>
        <div><label>Layout</label><select class="edit-layout">${layoutOptions}</select></div>
        <div class="full"><label>Event Theme</label><select class="edit-theme">${themeOptions}</select></div>
      </div>
      <button class="save-details-btn">SAVE PHOTO CHANGES</button>
      <div class="card-actions"><button class="danger">REMOVE FROM GALLERY</button></div>
    </div>`;
    const save=c.querySelector(".save-details-btn"), remove=c.querySelector(".danger");
    save.onclick=()=>{
      p.title=c.querySelector(".edit-title").value.trim()||p.title||"Photo";
      p.caption=c.querySelector(".edit-caption").value.trim();
      p.category=c.querySelector(".edit-category").value;
      p.layout=c.querySelector(".edit-layout").value;
      p.eventTheme=c.querySelector(".edit-theme").value;
      save.textContent="CHANGES SAVED"; save.classList.add("saved");
      setTimeout(()=>{save.textContent="SAVE PHOTO CHANGES";save.classList.remove("saved")},1200);
      toast("Photo changes saved — Publish to GitHub to make them live");
    };
    remove.onclick=()=>{if(confirm(`Remove "${p.title||"this photo"}" from the published gallery on next publish?`)){p._remove=true;c.style.opacity=.35;remove.textContent="MARKED FOR REMOVAL"}};
    g.appendChild(c);
  });
}

function renderQueue(){
  const g=$("queueGrid"); g.innerHTML=""; $("queueCount").textContent=queue.length;
  if(!queue.length){g.innerHTML='<div class="empty">No new photos queued.</div>';return;}
  queue.forEach((p,i)=>{
    const c=document.createElement("article"); c.className="card";
    const categoryOptions=Object.entries(labels).map(([v,l])=>`<option value="${v}" ${v===p.category?"selected":""}>${esc(l)}</option>`).join("");
    const themeOptions=Object.entries(themeLabels).map(([v,l])=>`<option value="${v}" ${v===p.eventTheme?"selected":""}>${esc(l)}</option>`).join("");
    const layoutOptions=["normal","wide","tall"].map(v=>`<option value="${v}" ${v===p.layout?"selected":""}>${v[0].toUpperCase()+v.slice(1)}</option>`).join("");
    c.innerHTML=`<img src="${p.data}" alt=""><div class="card-body"><div class="edit-grid">
      <div class="full"><label>Title</label><input class="q-title" value="${esc(p.title)}"></div>
      <div class="full"><label>Caption</label><textarea class="q-caption" rows="2">${esc(p.caption||"")}</textarea></div>
      <div><label>Category</label><select class="q-category">${categoryOptions}</select></div>
      <div><label>Layout</label><select class="q-layout">${layoutOptions}</select></div>
      <div class="full"><label>Event Theme</label><select class="q-theme">${themeOptions}</select></div>
    </div><div class="card-actions"><button class="q-save">SAVE</button><button class="q-remove">REMOVE</button></div></div>`;
    c.querySelector(".q-save").onclick=()=>{
      p.title=c.querySelector(".q-title").value.trim()||p.title;
      p.caption=c.querySelector(".q-caption").value.trim();
      p.category=c.querySelector(".q-category").value;
      p.layout=c.querySelector(".q-layout").value;
      p.eventTheme=c.querySelector(".q-theme").value;
      toast("Queued photo updated");
    };
    c.querySelector(".q-remove").onclick=()=>{queue.splice(i,1);renderQueue()};
    g.appendChild(c);
  });
}

async function reload(){try{const r=await getRemote();published=r.items;renderPublished();status(`LOADED FROM GITHUB\nPublished photos: ${published.length}`,"ok")}catch(e){status("LOAD FAILED\n"+e.message,"error")}}
$("fileInput").onchange=async e=>{
  const files=[...(e.target.files||[])]; selectedFiles=[]; $("multiPreview").innerHTML=""; $("preview").hidden=true;
  if(!files.length){$("fileStatus").textContent="No photos selected";return;}
  const valid=files.filter(f=>f.size<=20*1024*1024);
  if(valid.length!==files.length)toast(`${files.length-valid.length} photo(s) over 20 MB were skipped`,"error");
  $("fileStatus").textContent=`Preparing ${valid.length} photo(s)...`;
  for(let i=0;i<valid.length;i++){
    const f=valid[i];
    try{
      const data=await optimize(f);
      const base=f.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim();
      selectedFiles.push({file:f,data,defaultTitle:base||`Photo ${i+1}`});
      const t=document.createElement("div"); t.className="mini-preview";
      t.innerHTML=`<img src="${data}" alt=""><span>${esc(f.name)}</span>`; $("multiPreview").appendChild(t);
      $("fileStatus").textContent=`Prepared ${selectedFiles.length} of ${valid.length} photo(s)...`;
    }catch(err){console.error(err)}
  }
  $("fileStatus").textContent=`${selectedFiles.length} PHOTO(S) READY`; toast(`${selectedFiles.length} photo(s) ready`);
};

$("queueBtn").onclick=()=>{
  if(!selectedFiles.length)return toast("Choose one or more photos first","error");
  const sharedTitle=$("titleInput").value.trim(), sharedCaption=$("captionInput").value.trim();
  const category=$("categoryInput").value, layout=$("layoutInput").value, eventTheme=$("eventThemeInput").value;
  selectedFiles.forEach(item=>{
    queue.push({data:item.data,title:(selectedFiles.length===1&&sharedTitle)?sharedTitle:item.defaultTitle,caption:sharedCaption,category,layout,eventTheme});
  });
  selectedFiles=[];$("fileInput").value="";$("multiPreview").innerHTML="";$("fileStatus").textContent="No photos selected";$("titleInput").value="";$("captionInput").value="";
  renderQueue();toast("Photos added to publish queue");
};

$("clearQueueBtn").onclick=()=>{queue=[];renderQueue()};
$("reloadBtn").onclick=reload;
$("testBtn").onclick=async()=>{const token=$("tokenInput").value.trim();if(!token)return status("Paste your GitHub token first.","error");try{const repo=await api(API_BASE,{headers:headers(token)});status(`CONNECTED\n${repo.full_name}\nBranch: ${BRANCH}\nReady to publish.`,"ok")}catch(e){status("CONNECTION FAILED\n"+e.message,"error")}};
function slug(s){return String(s||"photo").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,50)||"photo"}
function dataParts(data){const m=String(data).match(/^data:image\/([^;]+);base64,(.+)$/);if(!m)return null;let ext=m[1].toLowerCase();if(ext==="jpeg")ext="jpg";if(!["jpg","png","webp"].includes(ext))ext="jpg";return{ext,base64:m[2]}}
async function existingSha(path,token){const r=await fetch(`${API_BASE}/contents/${path}?ref=${BRANCH}`,{headers:headers(token)});if(r.status===404)return null;let b=null;try{b=await r.json()}catch(_){ }if(!r.ok)throw new Error((b&&b.message)||`GitHub HTTP ${r.status}`);return b.sha}
async function putBase64(path,base64,token,message,sha=null){const body={message,content:base64,branch:BRANCH};if(sha)body.sha=sha;return api(`${API_BASE}/contents/${path}`,{method:"PUT",headers:{...headers(token),"Content-Type":"application/json"},body:JSON.stringify(body)})}
function setProgress(done,total,text){$("progressWrap").hidden=false;const pct=total?Math.round(done/total*100):0;$("progressText").textContent=text;$("progressPct").textContent=pct+"%";$("progressBar").style.width=pct+"%"}
$("publishBtn").onclick=async()=>{const token=$("tokenInput").value.trim();if(!token)return status("Paste your GitHub token first.","error");const btn=$("publishBtn");btn.disabled=true;btn.textContent="PUBLISHING...";try{const remote=await getRemote(token);let next=remote.items
      .filter(r=>!published.some(p=>p._remove&&p.id&&p.id===r.id))
      .map(r=>{
        const edited=published.find(p=>p.id&&r.id&&p.id===r.id);
        return edited?{...r,title:edited.title||r.title||"Photo",caption:edited.caption||"",category:edited.category||r.category||"events",layout:edited.layout||r.layout||"normal",eventTheme:edited.eventTheme||r.eventTheme||"auto"}:r;
      });const additions=[];for(const q of queue){const parts=dataParts(q.data);if(!parts)throw new Error("A queued image could not be encoded.");const id=`p-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;const filename=`${slug(q.title)}-${id.slice(-6)}.${parts.ext}`;const path=`images/${filename}`;const raw=`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;additions.push({id,path,raw,base64:parts.base64,title:q.title,caption:q.caption,category:q.category,layout:q.layout,eventTheme:q.eventTheme||"auto"})}const total=additions.length+1;let done=0;for(const a of additions){setProgress(done,total,`Uploading ${a.title}...`);await putBase64(a.path,a.base64,token,`Add gallery photo: ${a.title}`);next.push({id:a.id,image:a.raw,title:a.title,caption:a.caption,category:a.category,layout:a.layout,eventTheme:a.eventTheme||"auto"});done++;setProgress(done,total,`Uploaded ${a.title}`)}setProgress(done,total,"Updating gallery list...");const json=JSON.stringify(next,null,2)+"\n";await putBase64("gallery-data.json",encode64(json),token,"Update Callaway JROTC gallery",remote.sha);done++;setProgress(done,total,"Published successfully");queue=[];published=next;renderQueue();renderPublished();status(`PUBLISHED SUCCESSFULLY\nExisting photos preserved: ${remote.items.length}\nNew photos added: ${additions.length}\nTotal live photos: ${next.length}\n\nOpen the gallery and refresh — no Pages redeploy is required for photo updates.`,"ok");toast("Gallery published") }catch(e){console.error(e);status("PUBLISH FAILED\n"+e.message,"error");setProgress(0,1,"Publish failed");}finally{btn.disabled=false;btn.textContent="PUBLISH TO GITHUB"}};
reload();renderQueue();