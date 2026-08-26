window.makeStoredZip = async function(entries){
  const enc=new TextEncoder();
  const u16=n=>new Uint8Array([n&255,(n>>8)&255]);
  const u32=n=>new Uint8Array([n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255]);
  const cat=arrs=>{let len=arrs.reduce((s,a)=>s+a.length,0),out=new Uint8Array(len),o=0;for(const a of arrs){out.set(a,o);o+=a.length}return out};
  function crc32(buf){
    if(!crc32.table){crc32.table=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;crc32.table[n]=c>>>0}}
    let c=0xffffffff;for(let i=0;i<buf.length;i++)c=crc32.table[(c^buf[i])&255]^(c>>>8);return (c^0xffffffff)>>>0
  }
  const locals=[],centrals=[];let offset=0;
  for(const e of entries){
    const name=enc.encode(e.name);
    let data;
    if(e.base64){
      const bin=atob(e.data);data=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)data[i]=bin.charCodeAt(i)
    } else if(e.data instanceof Uint8Array) data=e.data;
    else data=enc.encode(String(e.data));
    const crc=crc32(data);
    const local=cat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
    locals.push(local);
    const central=cat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
    centrals.push(central);offset+=local.length
  }
  const centralBlob=cat(centrals);
  const end=cat([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralBlob.length),u32(offset),u16(0)]);
  return new Blob([...locals,centralBlob,end],{type:"application/zip"});
};