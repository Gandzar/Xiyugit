"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { unzipSync, strFromU8 } from "fflate";
import { UploadCloud, FolderUp, FileArchive, FilePlus2, Link2, Search, X, Check, Github, LockKeyhole, Globe, ChevronDown, Trash2, RefreshCw, LoaderCircle, CheckCircle2, AlertTriangle, FileCode2, Plus, Sparkles } from "lucide-react";

type Item = { path:string; data:Uint8Array; size:number; selected:boolean };
type Repo = { id:number; name:string; full_name:string; private:boolean; default_branch:string|null; description?:string };
const MAX_FILE = 2.8*1024*1024, MAX_TOTAL=150*1024*1024, MAX_FILES=1500;
const licenses:Record<string,string> = {
  MIT: "MIT License\\n\\nCopyright (c) YEAR AUTHOR\\n\\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \\"Software\\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\\n\\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\\n\\nTHE SOFTWARE IS PROVIDED \\"AS IS\\", WITHOUT WARRANTY OF ANY KIND.",
  Unlicense: "This is free and unencumbered software released into the public domain."
};
function formatBytes(n:number){return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`;}
function cleanPath(path:string){const p=path.replace(/\\/g,"/").replace(/^\/+/,"");if(!p||p.split("/").some(x=>x===".."||x==="."||!x)||p.includes("\0"))throw new Error(`Path tidak aman: ${path}`);return p;}
function b64(bytes:Uint8Array){let binary="";const step=0x8000;for(let i=0;i<bytes.length;i+=step)binary+=String.fromCharCode(...bytes.subarray(i,i+step));return btoa(binary);}
export default function Uploader({login}:{login:string}) {
  const [items,setItems]=useState<Item[]>([]);
  const [repos,setRepos]=useState<Repo[]>([]);
  const [repoMode,setRepoMode]=useState<"new"|"existing">("new");
  const [repoName,setRepoName]=useState("");
  const [repoDescription,setRepoDescription]=useState("");
  const [visibility,setVisibility]=useState<"private"|"public">("private");
  const [selectedRepo,setSelectedRepo]=useState("");
  const [branch,setBranch]=useState("main");
  const [message,setMessage]=useState("Upload project with XIYU Studio");
  const [readme,setReadme]=useState("none");
  const [license,setLicense]=useState("none");
  const [gitignore,setGitignore]=useState("none");
  const [ignoreGit,setIgnoreGit]=useState(true);
  const [query,setQuery]=useState("");
  const [tab,setTab]=useState<"archive"|"folder"|"files"|"paste">("archive");
  const [manualPath,setManualPath]=useState("README.md");
  const [manualContent,setManualContent]=useState("# Proyek Baru\\n\\nDitambahkan melalui XIYU Studio.\\n");
  const [drag,setDrag]=useState(false);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState(0);
  const [status,setStatus]=useState("");
  const [logs,setLogs]=useState<string[]>([]);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [loadingRepos,setLoadingRepos]=useState(true);
  const zipRef=useRef<HTMLInputElement>(null),folderRef=useRef<HTMLInputElement>(null),filesRef=useRef<HTMLInputElement>(null);
  const total=items.filter(x=>x.selected).reduce((a,x)=>a+x.size,0);
  const selected=items.filter(x=>x.selected);
  const filtered=useMemo(()=>items.filter(x=>x.path.toLowerCase().includes(query.toLowerCase())),[items,query]);
  const addLog=(s:string)=>setLogs(v=>[`${new Date().toLocaleTimeString("id-ID")} · ${s}`,...v].slice(0,30));
  useEffect(()=>{fetch("/api/github/repos").then(r=>r.json()).then(d=>{if(Array.isArray(d)){setRepos(d);if(d[0])setSelectedRepo(d[0].full_name);}}).catch(()=>{}).finally(()=>setLoadingRepos(false));},[]);
  const ingest=useCallback(async(files:FileList|File[])=>{
    setError("");setSuccess("");
    const next:Item[]=[];let totalSize=0;
    try{
      for(const file of Array.from(files)){
        if(file.size>MAX_TOTAL)throw new Error(`${file.name} terlalu besar.`);
        const path=cleanPath((file as any).webkitRelativePath||file.name);
        if(ignoreGit&&path.split("/").some(p=>p===".git"))continue;
        const data=new Uint8Array(await file.arrayBuffer());
        totalSize+=data.length;if(totalSize>MAX_TOTAL)throw new Error("Total file melebihi 150 MiB.");
        if(data.length>MAX_FILE)throw new Error(`${path} melebihi batas 2,8 MiB per file.`);
        next.push({path,data,size:data.length,selected:true});
        if(next.length>MAX_FILES)throw new Error("Jumlah file melebihi 1.500.");
      }
      setItems(prev=>{const map=new Map(prev.map(x=>[x.path,x]));next.forEach(x=>map.set(x.path,x));return [...map.values()];});
      addLog(`${next.length} file diproses dari perangkat.`);
    }catch(e){setError(e instanceof Error?e.message:"Gagal membaca file.");}
  },[ignoreGit]);
  async function ingestZip(file?:File){
    if(!file)return;setError("");setSuccess("");
    try{
      if(file.size>MAX_TOTAL)throw new Error("Ukuran ZIP melebihi 150 MiB.");
      const archive=unzipSync(new Uint8Array(await file.arrayBuffer()));
      const next:Item[]=[];let sum=0;
      for(const [raw,data] of Object.entries(archive)){
        if(raw.endsWith("/"))continue;
        const path=cleanPath(raw);
        if(ignoreGit&&path.split("/").some(p=>p===".git"))continue;
        if(data.length>MAX_FILE)throw new Error(`${path} melebihi 2,8 MiB per file.`);
        sum+=data.length;if(sum>MAX_TOTAL)throw new Error("Hasil ekstraksi melebihi 150 MiB.");
        next.push({path,data,size:data.length,selected:true});
        if(next.length>MAX_FILES)throw new Error("ZIP berisi lebih dari 1.500 file.");
      }
      setItems(prev=>{const map=new Map(prev.map(x=>[x.path,x]));next.forEach(x=>map.set(x.path,x));return [...map.values()];});
      addLog(`Arsip dibuka: ${next.length} file ditemukan.`);
    }catch(e){setError(e instanceof Error?e.message:"ZIP tidak dapat dibaca.");}
  }
  function addManual(){try{const path=cleanPath(manualPath);const data=new TextEncoder().encode(manualContent);if(data.length>MAX_FILE)throw new Error("File teks terlalu besar.");setItems(v=>[...v.filter(x=>x.path!==path),{path,data,size:data.length,selected:true}]);addLog(`File ${path} ditambahkan.`);}catch(e){setError(e instanceof Error?e.message:"Path tidak valid.");}}
  function toggle(path:string){setItems(v=>v.map(x=>x.path===path?{...x,selected:!x.selected}:x));}
  function remove(path:string){setItems(v=>v.filter(x=>x.path!==path));}
  function selectAll(value:boolean){setItems(v=>v.map(x=>({...x,selected:value})));}
  async function pushProject(){
    setError("");setSuccess("");setLogs([]);if(!selected.length){setError("Tambahkan minimal satu file.");return;}
    if(total>MAX_TOTAL){setError("Total file terlalu besar.");return;}
    if(!message.trim()){setError("Pesan commit wajib diisi.");return;}
    setBusy(true);setProgress(0);
    try{
      let target:Repo|undefined;
      if(repoMode==="new"){
        if(!repoName.trim())throw new Error("Nama repository wajib diisi.");
        setStatus("Membuat repository…");addLog("Membuat repository GitHub.");
        const r=await fetch("/api/github/create-repo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:repoName,description:repoDescription,visibility})});
        const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal membuat repository.");
        target=d;setRepos(v=>[d,...v]);setSelectedRepo(d.full_name);addLog(`Repository ${d.full_name} dibuat.`);
      }else{target=repos.find(r=>r.full_name===selectedRepo);if(!target)throw new Error("Pilih repository tujuan.");}
      const [owner,repo]=target!.full_name.split("/");
      const finalItems=[...selected];
      const addText=(path:string,content:string)=>{if(!finalItems.some(x=>x.path===path)){const data=new TextEncoder().encode(content);finalItems.push({path,data,size:data.length,selected:true});}};
      if(readme==="starter")addText("README.md",`# ${repo}\\n\\n${repoDescription||"Deskripsi proyek."}\\n\\n## Tentang\\n\\nDibuat dan diunggah menggunakan XIYU Studio.\\n`);
      if(readme==="ai")addText("README.md",`# ${repo}\\n\\n${repoDescription||"Dokumentasi proyek."}\\n\\n## Fitur\\n- Jelaskan fitur utama proyek di sini.\\n\\n## Instalasi\\nTambahkan petunjuk instalasi proyek.\\n\\n## Penggunaan\\nTambahkan cara menggunakan proyek.\\n\\n## Lisensi\\nLihat berkas LICENSE.\\n`);
      if(license!=="none")addText("LICENSE",licenses[license].replaceAll("YEAR",String(new Date().getFullYear())).replaceAll("AUTHOR",login));
      if(gitignore!=="none"){
        const templates:Record<string,string>={Node:"node_modules\\n.next\\ndist\\nbuild\\n.env*\\n!.env.example\\n",React:"node_modules\\ndist\\nbuild\\n.env*\\n!.env.example\\n",Nextjs:"node_modules\\n.next\\nout\\n.env*\\n!.env.example\\n",Python:"__pycache__/\\n*.py[cod]\\n.venv/\\nvenv/\\n.env\\n",Android:".gradle/\\nbuild/\\nlocal.properties\\n*.iml\\n"};
        addText(".gitignore",templates[gitignore]);
      }
      if(finalItems.length>MAX_FILES)throw new Error("Jumlah file termasuk berkas tambahan melewati 1.500.");
      const uploaded:{path:string;sha:string}[] = new Array(finalItems.length);
      let completed = 0;
      let cursor = 0;
      let firstFailure: Error | null = null;
      // Empat request paralel menjaga kecepatan tanpa membanjiri GitHub API.
      const worker = async () => {
        while (true) {
          const index = cursor++;
          if (index >= finalItems.length || firstFailure) return;
          const item = finalItems[index];
          setStatus(`Mengirim ${completed+1}/${finalItems.length}: ${item.path}`);
          try {
            const response = await fetch("/api/github/blob", {
              method:"POST", headers:{"Content-Type":"application/json"},
              body:JSON.stringify({owner,repo,path:item.path,content:b64(item.data)})
            });
            const data = await response.json();
            if (!response.ok) throw new Error(`${item.path}: ${data.error||"Gagal upload"}`);
            uploaded[index] = data;
            completed++;
            setProgress(Math.round((completed/finalItems.length)*92));
            addLog(`Terkirim: ${item.path}`);
          } catch (err) {
            firstFailure = err instanceof Error ? err : new Error("Upload file gagal.");
            return;
          }
        }
      };
      await Promise.all(Array.from({length:Math.min(4, finalItems.length)}, () => worker()));
      if (firstFailure) throw firstFailure;
      setStatus("Menyusun commit Git…");
      const commit=await fetch("/api/github/commit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({owner,repo,branch:branch||target!.default_branch||"main",message,files:uploaded})});
      const result=await commit.json();if(!commit.ok)throw new Error(result.error||"Commit gagal.");
      setProgress(100);setStatus("Selesai · commit berhasil");setSuccess(`Berhasil mengirim ${uploaded.length} file ke ${target!.full_name} (${result.branch}).`);
      addLog(`Commit berhasil: ${result.commit.slice(0,10)}.`);
      if(result.url)window.open(result.url,"_blank","noopener,noreferrer");
    }catch(e){const msg=e instanceof Error?e.message:"Proses upload gagal.";setError(msg);setStatus("Proses dihentikan");addLog(`Gagal: ${msg}`);}
    finally{setBusy(false);}
  }
  return <div className="content-wrap upload-content">
    <div className="page-top"><div><div className="eyebrow">YOUR PROJECT · YOUR LITTLE SPACE</div><h1>Push ke <em>GitHub.</em></h1><p>Masukkan file, periksa daftar, lalu kirim saat semuanya siap.</p></div><div className="connected-chip"><span/> @{login} terhubung</div></div>
    <div className="upload-layout"><section className="upload-main">
      <div className="panel">
        <div className="panel-heading"><div><div className="eyebrow">01 · IMPOR PROYEK</div><h2>Masukkan file kamu</h2></div><span className="soft-tag">Browser-side processing</span></div>
        <div className="import-tabs"><button className={tab==="archive"?"active":""} onClick={()=>setTab("archive")}><FileArchive size={16}/> Arsip ZIP</button><button className={tab==="folder"?"active":""} onClick={()=>setTab("folder")}><FolderUp size={16}/> Folder</button><button className={tab==="files"?"active":""} onClick={()=>setTab("files")}><FilePlus2 size={16}/> Banyak file</button><button className={tab==="paste"?"active":""} onClick={()=>setTab("paste")}><Plus size={16}/> Teks manual</button></div>
        {tab==="archive"&&<div className={`dropzone ${drag?"dragging":""}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)ingestZip(f);}} onClick={()=>zipRef.current?.click()}><input ref={zipRef} hidden type="file" accept=".zip,application/zip" onChange={e=>ingestZip(e.target.files?.[0])}/><div className="drop-icon"><UploadCloud size={25}/></div><b>Jatuhkan ZIP proyek di sini</b><span>atau klik untuk memilih file dari perangkat</span><small>ZIP · Maks. 150 MiB · 1.500 file · 2,8 MiB per file</small></div>}
        {tab==="folder"&&<div className="dropzone" onClick={()=>folderRef.current?.click()}><input ref={folderRef} hidden type="file" multiple {...({webkitdirectory:""} as any)} onChange={e=>e.target.files&&ingest(e.target.files)}/><div className="drop-icon"><FolderUp size={25}/></div><b>Pilih satu folder proyek</b><span>Struktur subfolder akan dipertahankan.</span><small>Folder dibaca langsung di browser.</small></div>}
        {tab==="files"&&<div className="dropzone" onClick={()=>filesRef.current?.click()}><input ref={filesRef} hidden type="file" multiple onChange={e=>e.target.files&&ingest(e.target.files)}/><div className="drop-icon"><FilePlus2 size={25}/></div><b>Pilih beberapa file sekaligus</b><span>Cocok untuk menambahkan file tertentu.</span><small>Nama dan struktur relatif dipertahankan.</small></div>}
        {tab==="paste"&&<div className="manual-box"><label>Path file<input value={manualPath} onChange={e=>setManualPath(e.target.value)} placeholder="src/README.md"/></label><label>Isi file<textarea value={manualContent} onChange={e=>setManualContent(e.target.value)} rows={5}/></label><button className="btn-secondary" onClick={addManual}><Plus size={15}/> Tambahkan file</button></div>}
        <div className="limits-row"><span>150 MiB total</span><span>1.500 file</span><span>2,8 MiB / file</span></div>
      </div>
      <div className="panel files-panel"><div className="panel-heading"><div><div className="eyebrow">02 · FILE REVIEW</div><h2>Daftar file <span className="count-pill">{selected.length} dipilih</span></h2></div><div className="file-tools"><button onClick={()=>selectAll(true)}>Pilih semua</button><button onClick={()=>selectAll(false)}>Kosongkan</button></div></div>
        {items.length>0&&<div className="file-summary"><span>{items.length} file · {formatBytes(total)} dipilih</span><div className="search-box"><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nama file…"/></div></div>}
        {items.length===0?<div className="empty-files"><FileCode2 size={25}/><b>Belum ada file di sini</b><span>File yang kamu pilih akan muncul untuk diperiksa.</span></div>:<div className="file-list">{filtered.slice(0,250).map(item=><div className={`file-row ${!item.selected?"unselected":""}`} key={item.path}><button className="file-check" onClick={()=>toggle(item.path)}>{item.selected&&<Check size={12}/>}</button><FileCode2 size={16}/><span className="file-path" title={item.path}>{item.path}</span><small>{formatBytes(item.size)}</small><button className="icon-button danger" onClick={()=>remove(item.path)} title="Hapus"><Trash2 size={14}/></button></div>)}{filtered.length>250&&<div className="list-more">Menampilkan 250 dari {filtered.length} file. Gunakan pencarian untuk menemukan file lain.</div>}</div>}
        <label className="check-option"><input type="checkbox" checked={ignoreGit} onChange={e=>setIgnoreGit(e.target.checked)}/> Abaikan folder `.git` bersarang saat impor folder/ZIP</label>
      </div>
      <div className="panel"><div className="panel-heading"><div><div className="eyebrow">03 · TUJUAN</div><h2>Mau dikirim ke mana?</h2></div></div>
        <div className="segmented"><button className={repoMode==="new"?"active":""} onClick={()=>setRepoMode("new")}>Repository baru</button><button className={repoMode==="existing"?"active":""} onClick={()=>setRepoMode("existing")}>Repository yang ada</button></div>
        {repoMode==="new"?<div className="form-grid"><label>Nama repository<input value={repoName} onChange={e=>setRepoName(e.target.value)} placeholder="nama-proyek-kamu"/><small>github.com/{login}/{repoName||"nama-repository"}</small></label><label>Visibilitas<div className="visibility-pick"><button className={visibility==="private"?"chosen":""} onClick={()=>setVisibility("private")}><LockKeyhole size={15}/> Private</button><button className={visibility==="public"?"chosen":""} onClick={()=>setVisibility("public")}><Globe size={15}/> Public</button></div></label><label className="full">Deskripsi (opsional)<input value={repoDescription} onChange={e=>setRepoDescription(e.target.value)} placeholder="Penjelasan singkat proyek"/></label></div>:<div className="form-grid"><label className="full">Pilih repository{loadingRepos?<span className="inline-loading">Memuat repository…</span>:<select value={selectedRepo} onChange={e=>{setSelectedRepo(e.target.value);const r=repos.find(x=>x.full_name===e.target.value);if(r?.default_branch)setBranch(r.default_branch);}}><option value="">Pilih repository…</option>{repos.map(r=><option key={r.id} value={r.full_name}>{r.full_name} · {r.private?"Private":"Public"}</option>)}</select>}</label><label>Branch tujuan<input value={branch} onChange={e=>setBranch(e.target.value)} placeholder="main"/><small>Branch baru akan dibuat jika belum ada.</small></label></div>}
      </div>
      <div className="panel"><div className="panel-heading"><div><div className="eyebrow">04 · COMMIT OPTIONS</div><h2>Siapkan commit</h2></div></div>
        <div className="form-grid"><label className="full">Pesan commit<input value={message} onChange={e=>setMessage(e.target.value)} maxLength={250}/></label><label>README<select value={readme} onChange={e=>setReadme(e.target.value)}><option value="none">Jangan tambahkan</option><option value="starter">README sederhana</option><option value="ai">README template terstruktur</option></select></label><label>Lisensi<select value={license} onChange={e=>setLicense(e.target.value)}><option value="none">Tanpa lisensi</option><option value="MIT">MIT</option><option value="Unlicense">Unlicense</option></select></label><label className="full">Template .gitignore<select value={gitignore} onChange={e=>setGitignore(e.target.value)}><option value="none">Tidak ada</option><option value="Node">Node.js</option><option value="React">React / Vite</option><option value="Nextjs">Next.js</option><option value="Python">Python</option><option value="Android">Android / Gradle</option></select></label></div>
        <div className="warning-note"><AlertTriangle size={16}/><span>Periksa kembali repository dan file yang dipilih. Setelah commit dibuat, perubahan akan langsung masuk ke GitHub.</span></div>
      </div>
      <div className="push-card"><div><div className="eyebrow">READY WHEN YOU ARE</div><h2>Waktunya mengirim. <em>✿</em></h2><p>{selected.length} file dipilih · {formatBytes(total)}</p></div><button className="btn-primary push-button" disabled={busy||!selected.length} onClick={pushProject}>{busy?<><LoaderCircle className="spin" size={17}/> Sedang mengirim…</>:<><Github size={17}/> Buat repository & push</>}</button></div>
      {(busy||status)&&<div className="panel progress-panel"><div className="progress-title"><span>{status||"Menunggu…"}</span><b>{progress}%</b></div><div className="progress-track"><i style={{width:`${progress}%`}}/></div></div>}
      {error&&<div className="error-box"><AlertTriangle size={16}/>{error}</div>}{success&&<div className="success-box"><CheckCircle2 size={18}/><div>{success}</div></div>}
      {logs.length>0&&<div className="panel log-panel"><div className="panel-heading"><h2>Log aktivitas</h2><button onClick={()=>setLogs([])}>Bersihkan</button></div>{logs.map((l,i)=><div className="log-line" key={i}>{l}</div>)}</div>}
    </section>
    <aside className="upload-aside"><div className="aside-card"><div className="aside-icon"><Sparkles size={19}/></div><div className="eyebrow">UPLOAD CHECKLIST</div><h3>Pelan-pelan, cek dulu.</h3><ul><li><Check size={14}/> Struktur file sudah benar</li><li><Check size={14}/> Repository tujuan sudah tepat</li><li><Check size={14}/> Branch dan pesan commit siap</li><li><Check size={14}/> Visibilitas repository sesuai</li></ul></div><div className="aside-card mini-card"><b>Catatan kecil</b><p>ZIP diproses di perangkatmu. Aplikasi mengirim isi file ke server untuk diteruskan ke GitHub setelah kamu menekan tombol push.</p></div><div className="aside-card mini-card"><b>Butuh bantuan?</b><p>Jika upload terhenti, periksa log aktivitas dan coba ulang. File yang sudah menjadi blob tetapi belum masuk commit tidak mengubah isi branch.</p><a href="https://docs.github.com/en/rest/git" target="_blank" rel="noreferrer">Dokumentasi GitHub API ↗</a></div></aside>
    </div>
  </div>;
}
