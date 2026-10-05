"use strict";
/* =====================================================================
   ES-Interviu — Romanian for the residence interview.
   Everything is stored on this device.
   ===================================================================== */
const KEY = "esinterviu_v1";
const uid = () => Math.random().toString(36).slice(2,10);
const pad = n => String(n).padStart(2,"0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sum = a => a.reduce((x,y)=>x+(+y||0),0);
const clamp01 = v => Math.max(0, Math.min(1, v));
const mmss = s => `${Math.floor(Math.max(s,0)/60)}:${pad(Math.floor(Math.max(s,0)%60))}`;
const shuffle = a => { const x = a.slice(); for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; };

/* fold: ignore diacritics, case and punctuation — the marking guide forgives these */
function fold(s){
  return String(s).toLowerCase()
    .replace(/ă|â/g,"a").replace(/î/g,"i").replace(/ș|ş/g,"s").replace(/ț|ţ/g,"t")
    .replace(/[^a-z0-9\- ]/g," ").replace(/\s+/g," ").trim();
}
const words = s => String(s).trim().split(/\s+/).filter(Boolean);

/* Romanian numbers 1–100, for the age drills */
const U = ["","unu","doi","trei","patru","cinci","șase","șapte","opt","nouă"];
const TEENS = ["zece","unsprezece","doisprezece","treisprezece","paisprezece","cincisprezece","șaisprezece","șaptesprezece","optsprezece","nouăsprezece"];
const TENS = {20:"douăzeci",30:"treizeci",40:"patruzeci",50:"cincizeci",60:"șaizeci",70:"șaptezeci",80:"optzeci",90:"nouăzeci"};
function roNumber(n){
  if(n === 100) return "o sută";
  if(n < 10) return U[n];
  if(n < 20) return TEENS[n-10];
  const t = Math.floor(n/10)*10, u = n%10;
  return u ? `${TENS[t]} și ${U[u]}` : TENS[t];
}
const needsDe = n => n >= 20;
function ageSentence(n){ return `Am ${roNumber(n)} ${needsDe(n)?"de ":""}ani.`; }

/* =====================================================================
   state
   ===================================================================== */
function blank(){
  return { app:"es-interviu", version:1,
    settings:{ name:"", gender:"f", theme:"royal", rate:0.9, voice:"", mic:true, interviewDate:"", audio:"auto" },
    read:{}, hw:{}, drills:[], sims:[], exams:[], story:{}, notes:{} };
}
function normalize(d){
  const b = blank(); if(!d || typeof d !== "object") return b;
  const s = Object.assign({}, b, d);
  s.settings = Object.assign({}, b.settings, d.settings||{});
  ["read","hw","story","notes"].forEach(k => { if(!s[k] || typeof s[k] !== "object") s[k] = {}; });
  ["drills","sims","exams"].forEach(k => { if(!Array.isArray(s[k])) s[k] = []; });
  s.app = "es-interviu"; return s;
}
let mem = null;
function load(){ try { const r = localStorage.getItem(KEY); if(r) return normalize(JSON.parse(r)); } catch(e){} return mem ? normalize(mem) : blank(); }
let saveT; function save(){ clearTimeout(saveT); saveT = setTimeout(()=>{ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){ mem = JSON.parse(JSON.stringify(S)); } }, 120); }
let S = load();
const UI = { tab:"home", practice:"speak", view:null, session:null, run:null, exam:null, search:"" };

const G = () => S.settings.gender === "m" ? "m" : "f";
const gPick = (mForm, fForm) => G() === "m" ? mForm : fForm;

/* =====================================================================
   speech
   ===================================================================== */
/* ---------- human recordings, kept in this device's database ---------- */
let IDB = null, HUMAN = new Set();
function idbOpen(){
  return new Promise(res => {
    if(IDB) return res(IDB);
    try {
      const r = indexedDB.open("esinterviu-audio", 1);
      r.onupgradeneeded = () => { r.result.createObjectStore("clips"); };
      r.onsuccess = () => { IDB = r.result; res(IDB); };
      r.onerror = () => res(null);
    } catch(e){ res(null); }
  });
}
function idbPut(key, blob){
  return idbOpen().then(db => new Promise(res => {
    if(!db) return res(false);
    const tx = db.transaction("clips","readwrite");
    tx.objectStore("clips").put(blob, key);
    tx.oncomplete = () => { HUMAN.add(key); res(true); };
    tx.onerror = () => res(false);
  }));
}
function idbGet(key){
  return idbOpen().then(db => new Promise(res => {
    if(!db) return res(null);
    const rq = db.transaction("clips","readonly").objectStore("clips").get(key);
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror = () => res(null);
  }));
}
function idbDel(key){
  return idbOpen().then(db => new Promise(res => {
    if(!db) return res(false);
    const tx = db.transaction("clips","readwrite");
    tx.objectStore("clips").delete(key);
    tx.oncomplete = () => { HUMAN.delete(key); res(true); };
    tx.onerror = () => res(false);
  }));
}
function idbKeys(){
  return idbOpen().then(db => new Promise(res => {
    if(!db) return res([]);
    const rq = db.transaction("clips","readonly").objectStore("clips").getAllKeys();
    rq.onsuccess = () => res(rq.result || []);
    rq.onerror = () => res([]);
  }));
}
idbKeys().then(ks => { HUMAN = new Set(ks); if(!UI.view) render(true); });
let humanUrl = null;
function playHuman(key, onend){
  return idbGet(key).then(blob => {
    if(!blob) return false;
    try {
      if(clipAudio){ clipAudio.pause(); clipAudio = null; }
      if(humanUrl){ URL.revokeObjectURL(humanUrl); humanUrl = null; }
      humanUrl = URL.createObjectURL(blob);
      const a = new Audio(humanUrl);
      a.onended = () => { if(onend) onend(); };
      clipAudio = a;
      const pr = a.play(); if(pr && pr.catch) pr.catch(()=>{});
      return true;
    } catch(e){ return false; }
  });
}

/* unlock HTML audio on the first tap — iPhones block playback before that */
let audioUnlocked = false, unlockEl = null;
function unlockAudio(){
  if(audioUnlocked) return;
  audioUnlocked = true;
  try {
    unlockEl = unlockEl || new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v///////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYa4Z+RzAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
    unlockEl.volume = 0;
    const q = unlockEl.play(); if(q && q.catch) q.catch(()=>{});
  } catch(e){}
}

let voices = [];
let speechUnlocked = false;
function loadVoices(){ try { voices = speechSynthesis.getVoices() || []; } catch(e){ voices = []; } return voices; }
if(window.speechSynthesis){ loadVoices(); speechSynthesis.onvoiceschanged = () => { loadVoices(); if(UI.tab === "home" && !UI.view) render(true); }; }
const roVoices = () => voices.filter(v => /^ro/i.test(v.lang));
function hasRo(){ return roVoices().length > 0; }
/* Romanian first; then the languages whose vowels are closest; then anything that speaks. */
const NEAR = [/^ro/i, /^it/i, /^es/i, /^pt/i, /^ca/i, /^fr/i];
function pickVoice(){
  if(!voices.length) loadVoices();
  const want = S.settings.voice;
  if(want){ const exact = voices.find(v => v.name === want); if(exact) return exact; }
  for(const re of NEAR){ const v = voices.find(x => re.test(x.lang)); if(v) return v; }
  return voices[0] || null;
}
function voiceLabel(){
  const v = pickVoice();
  if(!v) return "no voice available on this device";
  return `${v.name} (${v.lang})${/^ro/i.test(v.lang) ? " — Romanian" : " — not Romanian, so the accent is approximate"}`;
}
/* iOS swallows the first utterance unless speech was started by a tap. */
function unlockSpeech(){
  if(speechUnlocked || !window.speechSynthesis) return;
  try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); speechUnlocked = true; } catch(e){}
}
function unlockAll(){ unlockAudio(); unlockSpeech(); }
document.addEventListener("pointerdown", unlockAll, {once:true});
document.addEventListener("touchstart", unlockAll, {once:true});

/* Pre-recorded Romanian clips ship with the app as ONE bundled file; each
   phrase is a byte range inside it. The phone voice is the fallback. */
let CLIPS = window.CLIP_INDEX || null, clipAudio = null, clipBuf = null, clipBufLoading = null, clipUrl = null;
function fnv(str){
  let h = 0x811c9dc5;
  const bytes = new TextEncoder().encode(str);
  for(const b of bytes){ h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8,"0");
}
const clipFor = text => (CLIPS && CLIPS[fnv(String(text).trim())]) ? fnv(String(text).trim()) : null;
function loadBundle(){
  if(clipBuf) return Promise.resolve(clipBuf);
  if(clipBufLoading) return clipBufLoading;
  clipBufLoading = fetch("audio.mp3", {cache:"force-cache"})
    .then(r => r.ok ? r.arrayBuffer() : null)
    .then(buf => { clipBuf = buf; return buf; })
    .catch(() => null);
  return clipBufLoading;
}
function playSlice(key, onend){
  const span = CLIPS[key];
  if(!span || !clipBuf) return false;
  try {
    if(clipAudio){ clipAudio.pause(); clipAudio = null; }
    if(clipUrl){ URL.revokeObjectURL(clipUrl); clipUrl = null; }
    const blob = new Blob([clipBuf.slice(span[0], span[0] + span[1])], {type:"audio/mpeg"});
    clipUrl = URL.createObjectURL(blob);
    const a = new Audio(clipUrl);
    a.playbackRate = Math.max(0.6, Math.min(1.3, (+S.settings.rate || 0.9) + 0.1));
    a.onended = () => { if(onend) onend(); };
    a.onerror = () => { speakTTS(text0, onend); };
    clipAudio = a;
    const pr = a.play();
    if(pr && pr.catch) pr.catch(() => { speakTTS(text0, onend); });
    return true;
  } catch(e){ return false; }
}
function playClip(key, onend){
  if(clipBuf) return playSlice(key, onend);
  loadBundle().then(buf => { if(buf) playSlice(key, onend); else speakTTS(text0, onend); });
  return true;   // the bundle is on its way; nothing else should take over
}
loadBundle();

let text0 = "";
function speak(text, onend){
  text0 = text;
  unlockSpeech();
  stopSpeak();
  const hk = fnv(String(text).trim());
  if(HUMAN.has(hk)){ playHuman(hk, onend); return; }   // a real voice always wins
  const mode = S.settings.audio || "auto";
  const useVoice = mode === "voice" || (mode === "auto" && hasRo());
  if(!useVoice){
    const key = clipFor(text);
    if(key && playClip(key, onend)) return;
  }
  speakTTS(text, onend);
}
function speakTTS(text, onend, retry){
  if(!window.speechSynthesis){ toast("No audio available for this phrase."); if(onend) onend(); return; }
  unlockSpeech();
  try { speechSynthesis.cancel(); } catch(e){}
  if(!voices.length){
    loadVoices();
    if(!voices.length && !retry){ setTimeout(()=>speakTTS(text, onend, true), 450); return; }
  }
  const u = new SpeechSynthesisUtterance(String(text).replace(/\s*\/\s*/g, ", "));
  const v = pickVoice();
  u.lang = (v && v.lang) || "ro-RO";
  try { if(v) u.voice = v; } catch(e){}   // a bad voice object must never stop playback
  u.rate = +S.settings.rate || 0.9;
  u.volume = 1; u.pitch = 1;
  let spoke = false;
  u.onstart = () => { spoke = true; };
  u.onend = () => { if(onend) onend(); };
  u.onerror = () => { if(!spoke){ const k = clipFor(text); if(k && playClip(k, onend)) return; toast("No sound. Check the side switch and the volume."); } if(onend) onend(); };
  try { speechSynthesis.resume(); } catch(e){}
  speechSynthesis.speak(u);
  setTimeout(() => {
    if(spoke || speechSynthesis.speaking) return;
    const k = clipFor(text);
    if(k && playClip(k, onend)) return;        // phone voice stayed silent — use the recording
    if(!retry) speakTTS(text, onend, true);
  }, 700);
}
const stopSpeak = () => { try { speechSynthesis.cancel(); } catch(e){} try { if(clipAudio){ clipAudio.pause(); clipAudio = null; } } catch(e){} };

/* recorder */
const REC = { stream:null, rec:null, chunks:[], url:null, on:false };
async function recStart(){
  if(!S.settings.mic || !navigator.mediaDevices) return false;
  try {
    if(!REC.stream) REC.stream = await navigator.mediaDevices.getUserMedia({audio:true});
    REC.chunks = []; REC.rec = new MediaRecorder(REC.stream);
    REC.rec.ondataavailable = e => { if(e.data.size) REC.chunks.push(e.data); };
    REC.rec.start(); REC.on = true; return true;
  } catch(e){ REC.on = false; return false; }
}
function recStop(){
  return new Promise(res => {
    if(!REC.rec || REC.rec.state === "inactive"){ REC.on = false; return res(null); }
    REC.rec.onstop = () => { REC.on = false;
      const blob = new Blob(REC.chunks, {type:"audio/webm"});
      if(REC.url) URL.revokeObjectURL(REC.url);
      REC.url = URL.createObjectURL(blob); res(REC.url); };
    try { REC.rec.stop(); } catch(e){ REC.on = false; res(null); }
  });
}

/* timers */
let TIMER = null;
function startTimer(sec, onTick, onDone){
  stopTimer(); const end = Date.now() + sec*1000;
  const step = () => { const left = Math.max(0,(end-Date.now())/1000); if(onTick) onTick(left, sec);
    if(left <= 0.05){ stopTimer(); if(onDone) onDone(); } };
  step(); TIMER = setInterval(step, 200);
}
function stopTimer(){ if(TIMER){ clearInterval(TIMER); TIMER = null; } }

/* =====================================================================
   progress
   ===================================================================== */
const sessionsDone = () => COURSE.filter(s => S.read[s.id]).length;
function drillStats(kind){
  const a = S.drills.filter(d => d.kind === kind);
  if(!a.length) return {n:0, recent:null};
  const r = a.slice(-5);
  return {n:a.length, recent: sum(r.map(x=>x.pct))/r.length};
}
function readiness(){
  const parts = [];
  parts.push(clamp01(sessionsDone()/COURSE.length)*100);
  ["ddа","time","plac","gender","past","trans","dict","listen"].forEach(()=>{});
  const kinds = ["time","plac","gender","past","trans","numbers","dict","match","sim"];
  const scored = kinds.map(k => drillStats(k)).filter(s => s.n);
  if(scored.length) parts.push(sum(scored.map(s=>s.recent))/scored.length);
  const lastExam = S.exams[S.exams.length-1];
  if(lastExam) parts.push(lastExam.total);
  return parts.length ? sum(parts)/parts.length : 0;
}
function daysToInterview(){
  const d = S.settings.interviewDate;
  if(!d) return null;
  return Math.round((new Date(d) - new Date(todayISO()))/86400000);
}
function logDrill(kind, pct, n){ S.drills.push({id:uid(), date:todayISO(), kind, pct: Math.round(pct*100), n}); save(); }

/* =====================================================================
   marking
   ===================================================================== */
function markAge(input, n){
  const f = fold(input), want = fold(roNumber(n));
  const hasNumber = f.includes(want);
  const hasAm = /\bam\b/.test(f);
  const hasDeAni = /\bde ani\b/.test(f);
  const hasAni = /\bani\b/.test(f);
  if(!hasAni || !hasAm) return {ok:false, why:"Say it as a full sentence: " + ageSentence(n)};
  if(!hasNumber) return {ok:false, why:"The number should be " + roNumber(n)};
  if(needsDe(n) && !hasDeAni) return {ok:false, why:"Zero: 20 and over needs de — " + ageSentence(n)};
  if(!needsDe(n) && hasDeAni) return {ok:false, why:"Zero: under 20 takes no de — " + ageSentence(n)};
  return {ok:true, why:"Correct."};
}
function hasWord(folded, term){
  const t = fold(term).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return new RegExp(`(^| )${t}( |$)`).test(folded.trim());
}
function markTranslate(input, item){
  const f = " " + fold(input) + " ";
  if(item.reject && item.reject.some(r => hasWord(f, r))) return {ok:false, why:"Zero: " + (item.rule||"wrong structure") + " — " + item.a};
  const missing = (item.must||[]).filter(group => !group.some(g => f.includes(fold(g))));
  if(missing.length) return {ok:false, why:"Missing: " + missing.map(g=>g[0]).join(", ") + " — " + item.a};
  return {ok:true, why:"Correct."};
}
function markKeys(input, item){
  const f = " " + fold(input) + " ";
  const missing = (item.keys||[]).filter(k => !k.split("|").some(x => f.includes(fold(x))));
  return missing.length ? {ok:false, why:"Missing the idea of: " + missing.map(k=>k.split("|")[0]).join(", ") + " — " + item.a}
                        : {ok:true, why:"Correct."};
}
function markExact(input, answers){
  const f = fold(input);
  return answers.some(a => fold(a) === f || f.includes(fold(a)))
    ? {ok:true, why:"Correct."} : {ok:false, why:"Answer: " + answers[0]};
}
function markPast(input, item){
  const f = fold(input);
  if(item.refl && !/\bm-?am\b/.test(f)) return {ok:false, why:"Zero: reflexive past needs m-am — " + item.a};
  const key = fold(item.a).split(" ").filter(w => w.length > 2);
  const hit = key.filter(w => f.includes(w)).length;
  const need = Math.max(1, Math.ceil(key.length*0.6));
  return hit >= need
    ? {ok:true, why:"Correct."} : {ok:false, why:"Expected: " + item.a};
}
/* Despre mine auto-checks */
function checkStory(text){
  const f = fold(text), sentences = text.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  const cov = [
    {k:"greeting and name", ok:/\b(buna|ma numesc|numele meu|ma cheama)\b/.test(f)},
    {k:"age", ok:/\bani\b/.test(f)},
    {k:"home, how long, why", ok:/\b(locuiesc|stau)\b/.test(f) && /\b(de|din|acum)\b/.test(f)},
    {k:"work", ok:/\b(lucrez|sunt profesor|munca|firma|companie)\b/.test(f)},
    {k:"food or drink", ok:/\b(mancarea|sarmale|cafea|beau|papanasi|mananc)\b/.test(f)},
    {k:"family and liking Romania", ok:/\b(casatorit|casatorita|singur|singura|sotia|sotul|familia|copii)\b/.test(f) && /\bplace\b/.test(f)}
  ];
  const sig = [
    {k:"… de ani", ok:/\bde ani\b/.test(f) || /\b(unsprezece|doisprezece|treisprezece|paisprezece|cincisprezece|saisprezece|saptesprezece|optsprezece|nouasprezece) ani\b/.test(f)},
    {k:"de / din / acum", ok:/\b(de \w+ ani|din \w+|acum \w+ ani)\b/.test(f)},
    {k:"place / plac", ok:/\bplac(e)?\b/.test(f)},
    {k:"gender ending", ok: G()==="m" ? /\b(casatorit|singur|necasatorit|englez|american|britanic)\b/.test(f)
                                      : /\b(casatorita|singura|necasatorita|englezoaica|americanca|britanica)\b/.test(f)}
  ];
  const covPts = cov.filter(c=>c.ok).length;
  const sigPts = sig.filter(c=>c.ok).length;
  const lenPts = sentences.length >= 10 ? 2 : 0;
  return {cov, sig, sentences: sentences.length, covPts, sigPts, lenPts,
    total: Math.min(covPts + sigPts + lenPts, sentences.length < 10 ? 8 : 12)};
}

/* =====================================================================
   shared bits
   ===================================================================== */
function ring(pct, size=118, stroke=11, color="var(--gold)", inner=""){
  const r = (size-stroke)/2, C = 2*Math.PI*r, c = size/2, p = clamp01(pct);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${Math.round(p*100)}%">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${p*C} ${C}" transform="rotate(-90 ${c} ${c})"/>
    ${inner?`<text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-size="${size/4.2}" font-weight="700" fill="var(--ink)">${inner}</text>`:""}</svg>`;
}
const say = (txt, label) => `<button class="say" data-a="say" data-t="${esc(txt)}" aria-label="Play ${esc(label||"audio")}">${SPEAKER}</button>`;
function phraseRow(p, opts={}){
  const k = fnv(String(p.ro).trim()), human = HUMAN.has(k);
  return `<div class="phrase">
    <div class="ph-main"><div class="ro">${esc(p.ro)}${human?' <span class="humanmark" title="recorded by a person">●</span>':""}</div>
      ${p.pr?`<div class="pr">${esc(p.pr)}</div>`:""}
      <div class="en">${esc(p.en)}</div></div>
    ${say(p.ro, p.ro)}
    <button class="say rec ${human?"has":""}" data-a="recPhrase" data-t="${esc(p.ro)}" aria-label="Record this phrase">${MIC_ICON}</button></div>`;
}
const card = (inner, cls="") => `<div class="card ${cls}">${inner}</div>`;
const tile = (label, v, s="") => `<div class="tile"><div class="eyebrow">${label}</div><div class="v">${v}</div>${s?`<div class="s">${s}</div>`:""}</div>`;

function recorderView(){
  const t = UI.recPhrase, k = fnv(String(t).trim()), human = HUMAN.has(k);
  return `<div class="reader"><div class="rbar"><button class="icon-btn" data-a="closeRec">‹</button>
      <div><b>Record a human voice</b><small>your teacher, a friend, or a native speaker</small></div><div></div></div>
    <div class="stack">
      ${card(`<div class="eyebrow" style="margin-bottom:8px">The phrase</div>
        <div class="ro big">${esc(t)}</div>
        <div class="btnrow" style="margin-top:14px">
          ${UI.recOn ? `<button class="btn" data-a="recStop">Stop recording</button>` : `<button class="btn" data-a="recGo">${human?"Record again":"Start recording"}</button>`}
          ${human ? `<button class="btn ghost" data-a="recPlay" data-k="${k}">Play what's saved</button>` : ""}
          ${human ? `<button class="btn quiet" data-a="recDelete" data-k="${k}">Delete</button>` : ""}
        </div>
        ${UI.recOn ? `<div class="muted small" style="margin-top:12px">Recording. Say the phrase, then tap stop.</div>` : ""}
        ${UI.recSaved ? `<div class="markcard good" style="margin-top:12px"><b>Saved</b><div>This phrase will now play in that voice everywhere in the app.</div></div>` : ""}`)}
      ${card(`<p class="muted small" style="margin:0">Recordings are stored on this phone only. They survive closing the app, and they override both the built-in audio and the phone voice.</p>`)}
    </div></div>`;
}

/* =====================================================================
   views
   ===================================================================== */
const TABS = [
 {id:"home", label:"Home", icon:"crown", title:"Acasă"},
 {id:"course", label:"Course", icon:"scroll", title:"The course"},
 {id:"practice", label:"Practice", icon:"quill", title:"Practice"},
 {id:"exam", label:"Exam", icon:"seal", title:"Final exam"},
 {id:"book", label:"Phrases", icon:"book", title:"Phrasebook"}
];

const VIEWS = {
 home(){
  const r = readiness(), d = daysToInterview(), next = COURSE.find(s => !S.read[s.id]) || COURSE[COURSE.length-1];
  const lastExam = S.exams[S.exams.length-1];
  const sim = S.sims[S.sims.length-1];
  return `<div class="stack fade-in">
    <div class="hero">
      <div class="crest">${ic("crown",42)}</div>
      <div class="eyebrow">Romanian for the residence interview</div>
      <h2 class="serif">${S.settings.name?`Bună, ${esc(S.settings.name)}`:"Bună ziua"}</h2>
      <div class="muted">${d!=null ? (d>0?`${d} day${d===1?"":"s"} to your interview.`:d===0?"Your interview is today.":"Interview date passed.") : "Set your interview date in Settings."}</div>
      <div class="herorow">
        <div><small>Readiness</small><b>${Math.round(r)}%</b></div>
        <div><small>Sessions</small><b>${sessionsDone()}/10</b></div>
        <div><small>Last exam</small><b>${lastExam?lastExam.total+"%":"—"}</b></div>
      </div>
    </div>

    ${card(`<div class="card-head"><div class="card-title serif">${ic("scroll",26)}<div>Continue the course<small>Day ${next.day} · Session ${next.session}</small></div></div></div>
      <button class="btn block" data-a="openSession" data-id="${next.id}">${esc(next.title)}</button>`)}

    ${card(`<div class="card-head"><div class="card-title serif">${ic("mic",26)}<div>The 18 questions<small>${sim?`last run ${sim.score}/40`:"a full simulated interview"}</small></div></div></div>
      <div class="btnrow"><button class="btn" data-a="startSim">Run the interview</button>
      <button class="btn ghost" data-a="tab" data-tab="practice">Quick drills</button></div>`)}

    ${card(`<div class="card-head"><div class="card-title serif">${ic("quill",26)}<div>Despre mine<small>Your own ten sentences</small></div></div></div>
      <p class="muted small" style="margin:0 0 12px">This paragraph answers half the interview before it is asked. Build yours from the model, then learn it by heart.</p>
      <button class="btn ghost block" data-a="openStory">Open the builder</button>`)}

    ${!hasRo() ? card(`<div class="card-title serif" style="margin-bottom:10px">${ic("ear",26)}<div>Get the natural voice<small>two minutes, free</small></div></div>
      <p class="muted small" style="margin:0 0 10px">You are hearing the recordings built into the app. They are machine-made and flat. Your iPhone can download a real Romanian voice, Ioana, which sounds like a person.</p>
      <ol class="steps" style="margin-bottom:12px"><li>iPhone <b>Settings → Accessibility</b></li><li><b>Spoken Content → Voices → Romanian</b></li><li>Tap <b>Ioana</b> and let it download</li><li>Come back and tap <b>Check again</b></li></ol>
      <div class="btnrow"><button class="btn" data-a="recheckVoice">Check again</button><button class="btn ghost" data-a="testVoice">Test the audio</button></div>`,"warn-card")
      : card(`<div class="card-title serif" style="margin-bottom:8px">${ic("ear",26)}<div>Natural voice is on<small>${esc((pickVoice()||{}).name || "")}</small></div></div>
      <button class="btn sm ghost" data-a="testVoice">Test the audio</button>`)}

    ${card(`<div class="card-title serif" style="margin-bottom:8px">${ic("mic",26)}<div>Record a real person<small>${HUMAN.size ? HUMAN.size + " phrases recorded" : "the most natural option of all"}</small></div></div>
      <p class="muted small" style="margin:0">Tap the dashed microphone beside any phrase and record your teacher, a Romanian friend, or yourself. That recording then plays everywhere in the app, ahead of any machine voice, and stays on this phone.</p>`)}

    ${card(`<div class="card-head"><div class="card-title serif">${ic("gear",26)}<div>Settings</div></div></div>
      <div class="row"><div class="name">Your name</div><input class="field sm" style="width:150px" value="${esc(S.settings.name)}" data-k="name" placeholder="Name"></div>
      <div class="row"><div class="name">You speak as<small>sets căsătorit / căsătorită everywhere</small></div>
        <div class="seg small"><button class="${G()==="f"?"on":""}" data-a="setGender" data-g="f">Woman</button><button class="${G()==="m"?"on":""}" data-a="setGender" data-g="m">Man</button></div></div>
      <div class="row"><div class="name">Interview date</div><input class="field sm" type="date" style="width:160px" value="${esc(S.settings.interviewDate)}" data-k="interviewDate"></div>
      <div class="row"><div class="name">Voice speed<small>slower is easier to copy</small></div><input class="field sm" style="width:80px;text-align:right" inputmode="decimal" value="${S.settings.rate}" data-k="rate"></div>
      <div class="row"><div class="name">Phone voice<small>${esc(voiceLabel())}</small></div><select class="field sm" style="max-width:180px" data-k="voice"><option value="">Automatic</option>${voices.map(v=>`<option ${v.name===S.settings.voice?"selected":""}>${(/^ro/i.test(v.lang)?"★ ":"")+esc(v.name)+" · "+esc(v.lang)}</option>`).join("")}</select></div>
      <div class="row"><div class="name">Audio source<small>${(S.settings.audio||"auto")==="voice" ? "your phone's own voice" : (S.settings.audio||"auto")==="clips" ? "the recordings built into the app" : (hasRo() ? "your phone's Romanian voice" : "built-in recordings, until a Romanian voice is installed")}</small></div>
        <select class="field sm" style="width:170px" data-k="audio">${[["auto","Automatic"],["clips","Built-in recordings"],["voice","My phone's voice"]].map(([v,l])=>`<option value="${v}" ${v===(S.settings.audio||"auto")?"selected":""}>${l}</option>`).join("")}</select></div>
      <div class="row"><div class="name">Test the audio<small>you should hear: Bună ziua</small></div><button class="btn sm" data-a="testVoice">Play</button></div>
      <div class="row"><div class="name">Record my speaking</div><button class="switch ${S.settings.mic?"on":""}" data-a="toggleMic"></button></div>
      <div class="row"><div class="name">Appearance</div><select class="field sm" style="width:130px" data-k="theme">${[["royal","Royal (dark)"],["light","Light"]].map(([v,l])=>`<option value="${v}" ${v===S.settings.theme?"selected":""}>${l}</option>`).join("")}</select></div>
      <div class="grid2" style="margin-top:12px"><button class="btn" data-a="export">Export JSON</button><button class="btn ghost" data-a="import">Import JSON</button></div>
      <button class="btn danger block" style="margin-top:10px" data-a="reset">Reset everything</button>`)}
  </div>`;
 },

 course(){
  return `<div class="stack fade-in">
    ${card(`<div class="card-title serif" style="margin-bottom:8px">${ic("scroll",26)}<div>Five days, ten sessions</div></div>
      <p class="muted small" style="margin:0">Each session gives you the officer's questions, the answers in several forms, teaching notes and two homeworks. Work through them in order, then sit the final exam.</p>`)}
    ${[1,2,3,4,5].map(day => `<div class="section-label">Day ${day}</div>
      ${COURSE.filter(s=>s.day===day).map(s=>`<button class="listcard" data-a="openSession" data-id="${s.id}">
        <div class="lc-left"><span class="lc-badge ${S.read[s.id]?"done":""}">${S.read[s.id]?"✓":s.session}</span></div>
        <div class="lc-main"><b>${esc(s.title)}</b><small>${s.objectives.length} objectives · homework ${s.hw.n}${S.hw[s.id]?" · done":""}</small></div>
        <span class="go">›</span></button>`).join("")}`).join("")}
    ${card(`<div class="card-title serif" style="margin-bottom:8px">${ic("seal",26)}<div>Then: the final exam</div></div>
      <p class="muted small" style="margin:0 0 12px">Six sections, 100 points, marked by the strict rules from the teacher's guide.</p>
      <button class="btn block" data-a="tab" data-tab="exam">Go to the exam</button>`)}
  </div>`;
 },

 practice(){
  const seg = UI.practice;
  const tabs = [["speak","Speak"],["listen","Listen"],["write","Write"]];
  return `<div class="stack fade-in">
    <div class="seg">${tabs.map(([k,l])=>`<button class="${k===seg?"on":""}" data-a="setPractice" data-p="${k}">${l}</button>`).join("")}</div>
    ${seg === "speak" ? PRACTICE.speak() : seg === "listen" ? PRACTICE.listen() : PRACTICE.write()}
  </div>`;
 },

 exam(){
  const last = S.exams[S.exams.length-1];
  return `<div class="stack fade-in">
    ${card(`<div class="card-title serif" style="margin-bottom:10px">${ic("seal",30)}<div>Final mock exam<small>100 points · six sections</small></div></div>
      <p class="muted small">${esc(REF.exam.intro)}</p>
      <div class="rules"><div class="eyebrow" style="margin-bottom:6px">Zero rules</div>
        <ul>${REF.exam.zeroRules.map(r=>`<li>${esc(r)}</li>`).join("")}</ul>
        <div class="muted small">${esc(REF.exam.forgiven)}</div></div>
      <button class="btn block" style="margin-top:14px" data-a="startExam">${last?"Sit it again":"Start the exam"}</button>`)}
    ${S.exams.length ? card(`<div class="card-head"><div class="card-title serif">${ic("chart",26)}<div>Your attempts</div></div></div>
      ${S.exams.slice().reverse().map(e=>`<button class="row wide" data-a="openExamResult" data-id="${e.id}">
        <div class="name">${e.date}<small>${esc(e.band)}</small></div>
        <b class="score ${e.total>=90?"good":e.total>=70?"mid":"bad"}">${e.total}</b><span class="go">›</span></button>`).join("")}`) : ""}
    ${card(`<div class="card-title serif" style="margin-bottom:8px">${ic("crown",26)}<div>Interview-day tips</div></div>
      <ul class="steps">${REF.tips.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`)}
  </div>`;
 },

 book(){
  const q = fold(UI.search);
  const all = [];
  REF.survival.forEach(p => all.push(Object.assign({}, p, {g:"Survival phrases"})));
  REF.interview.forEach(p => all.push({ro:p.ro, pr:p.pr, en:p.en, g:"The 18 questions"}));
  COURSE.forEach(s => (s.bank||[]).forEach(b => b.items.forEach(p => all.push(Object.assign({}, p, {g:`Day ${s.day}${s.session} · ${b.group}`})))));
  const hits = q ? all.filter(p => fold(p.ro).includes(q) || fold(p.en).includes(q)) : all;
  const groups = {};
  hits.forEach(p => (groups[p.g] = groups[p.g] || []).push(p));
  return `<div class="stack fade-in">
    <input class="field search" placeholder="Search Romanian or English" value="${esc(UI.search)}" data-k="search">
    ${!q ? card(`<div class="card-title serif" style="margin-bottom:10px">${ic("ear",26)}<div>Pronunciation</div></div>
      <div class="ptable">${REF.pron.map(r=>`<div class="prow"><b>${esc(r[0])}</b><span>${esc(r[1])}</span><i>${esc(r[2])} → ${esc(r[3])}</i></div>`).join("")}</div>
      <ul class="steps" style="margin-top:10px">${REF.pronRules.map(r=>`<li>${esc(r)}</li>`).join("")}</ul>`) : ""}
    ${!q ? REF.grammar.map(g=>card(`<div class="card-title serif" style="margin-bottom:8px">${esc(g.title)}</div>
      ${g.note?`<p class="muted small" style="margin:0 0 10px">${esc(g.note)}</p>`:""}
      <div class="gtable">${g.rows.map(r=>`<div class="grow">${r.map((c,i)=>`<span class="${i===0?"k":""}">${esc(c)}</span>`).join("")}</div>`).join("")}</div>`)).join("") : ""}
    ${Object.keys(groups).map(g => card(`<div class="eyebrow" style="margin-bottom:8px">${esc(g)}</div>${groups[g].map(p=>phraseRow(p)).join("")}`)).join("")}
    ${q && !hits.length ? `<div class="empty">Nothing found for “${esc(UI.search)}”.</div>` : ""}
  </div>`;
 }
};

/* =====================================================================
   practice panels
   ===================================================================== */
const DRILLS = {
 time:{name:"de · din · acum", kind:"time", icon:"quill", desc:"The three time patterns. A wrong choice is an exam zero.",
   build(){ const items = REF.exam.A2.items.concat(COURSE.find(s=>s.id==="2A").hw.b.items);
     return shuffle(items).slice(0,6).map(i=>({type:"choice", text:i.text, a:i.a, opts:["de","din","acum"]})); }},
 plac:{name:"place · plac", kind:"plac", icon:"quill", desc:"Singular or a verb takes place. Plural takes plac.",
   build(){ const items = REF.exam.A3.items.concat(COURSE.find(s=>s.id==="3A").hw.b.items);
     return shuffle(items).slice(0,6).map(i=>({type:"choice", text:i.text, a:i.a, opts:["place","plac"], why:i.why})); }},
 gender:{name:"Gender endings", kind:"gender", icon:"quill", desc:"căsătorit or căsătorită, singur or singură.",
   build(){ return shuffle(REF.exam.A4.items).map(i=>({type:"type", text:i.text, a:[i.a], hint:i.en})); }},
 age:{name:"Age sentences", kind:"numbers", icon:"quill", desc:"The de ani rule, on random ages.",
   build(){ const ns = shuffle([19,21,23,35,42,17,68,74,50,16]).slice(0,6);
     return ns.map(n=>({type:"age", n})); }},
 past:{name:"Past tense", kind:"past", icon:"quill", desc:"am + participle, and m-am for reflexives.",
   build(){ return shuffle(REF.exam.B.items).slice(0,6).map(i=>({type:"past", v:i.v, a:i.a, refl:i.refl, item:i})); }},
 trans:{name:"Strict translation", kind:"trans", icon:"quill", desc:"The eight sentences the exam marks hardest.",
   build(){ return shuffle(REF.exam.D.items).slice(0,6).map(i=>({type:"trans", item:i})); }},
 hw:{name:"Session homework", kind:"hw", icon:"scroll", desc:"Every written exercise from the ten sessions.",
   build(){ const out = [];
     COURSE.forEach(s => { const b = s.hw.b; if(!b) return;
       if(b.type === "choice") b.items.forEach(i => out.push({type:"choice", text:i.text, a:i.a, opts:b.opts}));
       if(b.type === "translate") b.items.forEach(i => out.push({type:"type", text:i.en, a:i.a}));
       if(b.type === "type") b.items.forEach(i => out.push({type:"type", text:"Write in Romanian: " + i.q, a:i.a, hint:i.note}));
     });
     return shuffle(out).slice(0,8); }}
};
const LISTEN = {
 match:{name:"What did they say?", kind:"match", desc:"Hear a phrase, choose the meaning.", n:8},
 dict:{name:"Dictation", kind:"dict", desc:"Hear a phrase, type it in Romanian.", n:6},
 numbers:{name:"Numbers", kind:"numbers", desc:"Hear a number, type the digits.", n:8},
 officer:{name:"Officer questions", kind:"listen", desc:"Hear a question, choose what it asks.", n:8}
};
const PRACTICE = {
 speak(){
  const sim = S.sims[S.sims.length-1];
  return `${card(`<div class="card-head"><div class="card-title serif">${ic("mic",28)}<div>Interview simulator<small>All 18 questions, spoken and scored</small></div></div>${sim?`<span class="badge ${sim.score>=32?"good":sim.score>=24?"warn":"bad"}">${sim.score}/40</span>`:""}</div>
    <p class="muted small" style="margin:0 0 12px">The officer asks, you answer out loud within three seconds. Your answer is recorded so you can hear yourself, then you score it 0, 1 or 2 like the marking guide.</p>
    <button class="btn block" data-a="startSim">Start the interview</button>`)}
  ${card(`<div class="card-head"><div class="card-title serif">${ic("ear",28)}<div>Shadowing<small>Hear it, say it, compare</small></div></div></div>
    <p class="muted small" style="margin:0 0 12px">A phrase is played, you repeat it, and your recording plays straight after the model. The fastest way to fix pronunciation.</p>
    <div class="btnrow">${COURSE.filter(s=>s.bank.length).map(s=>`<button class="btn sm ghost" data-a="startShadow" data-id="${s.id}">Day ${s.day}${s.session}</button>`).join("")}
    <button class="btn sm" data-a="startShadow" data-id="survival">Survival phrases</button></div>`)}
  ${card(`<div class="card-head"><div class="card-title serif">${ic("crown",28)}<div>Answer cards<small>One question, your answer, out loud</small></div></div></div>
    <p class="muted small" style="margin:0 0 12px">A random officer question appears with a three-second countdown. Answer aloud, then reveal the model answer.</p>
    <button class="btn ghost block" data-a="startCards">Deal the cards</button>`)}`;
 },
 listen(){
  return `${(!hasRo() && S.settings.audio === "voice") ? card(`<p class="muted small" style="margin:0">These drills use the recordings built into the app. For a natural Romanian voice, install one in iPhone Settings → Accessibility → Spoken Content → Voices → Romanian, then switch Audio source in Settings.</p>`,"warn-card") : ""}
  ${Object.keys(LISTEN).map(k=>{ const d = LISTEN[k], st = drillStats(d.kind);
    return card(`<div class="card-head" style="margin-bottom:8px"><div class="card-title serif" style="font-size:15px">${esc(d.name)}<small>${esc(d.desc)}</small></div>
      ${st.n?`<span class="badge ${st.recent>=80?"good":st.recent>=60?"warn":"bad"}">${Math.round(st.recent)}%</span>`:""}</div>
      <button class="btn block ${st.n?"ghost":""}" data-a="startListen" data-k="${k}">Start · ${d.n} items</button>`);
  }).join("")}`;
 },
 write(){
  return Object.keys(DRILLS).map(k=>{ const d = DRILLS[k], st = drillStats(d.kind);
    return card(`<div class="card-head" style="margin-bottom:8px"><div class="card-title serif" style="font-size:15px">${esc(d.name)}<small>${esc(d.desc)}</small></div>
      ${st.n?`<span class="badge ${st.recent>=80?"good":st.recent>=60?"warn":"bad"}">${Math.round(st.recent)}%</span>`:""}</div>
      <button class="btn block ${st.n?"ghost":""}" data-a="startDrill" data-k="${k}">Start</button>`);
  }).join("");
 }
};

/* =====================================================================
   session reader
   ===================================================================== */
function sessionView(){
  const s = COURSE.find(x => x.id === UI.session);
  const hw = S.hw[s.id] || {};
  return `<div class="reader">
    <div class="rbar"><button class="icon-btn" data-a="closeSession">‹</button>
      <div><b>Day ${s.day} · Session ${s.session}</b><small>${esc(s.title)}</small></div>
      <button class="icon-btn ${S.read[s.id]?"on":""}" data-a="markRead" data-id="${s.id}" aria-label="Mark as done">✓</button></div>
    <div class="stack">
      ${card(`<div class="eyebrow" style="margin-bottom:8px">Objectives</div><ul class="steps">${s.objectives.map(o=>`<li>${esc(o)}</li>`).join("")}</ul>`)}
      ${s.questions.length ? card(`<div class="card-title serif" style="margin-bottom:10px">${ic("mic",24)}<div>What the officer asks</div></div>
        ${s.questions.map(q=>phraseRow(q)).join("")}`) : ""}
      ${(s.bank||[]).map(b => card(`<div class="eyebrow" style="margin-bottom:8px">${esc(b.group)}</div>${b.items.map(p=>phraseRow(p)).join("")}
        <button class="btn ghost sm" style="margin-top:10px" data-a="shadowGroup" data-id="${s.id}" data-g="${esc(b.group)}">Shadow this group</button>`)).join("")}
      ${s.special === "story" ? card(`<div class="card-title serif" style="margin-bottom:10px">${ic("quill",24)}<div>${esc(REF.story.title)}</div></div>
        <p class="muted small">${esc(REF.story.note)}</p>
        ${REF.story.lines.map(l=>`<div class="phrase"><div class="ph-main"><div class="ro">${esc(l[0])}</div><div class="en">${esc(l[1])}</div></div>${say(l[0])}</div>`).join("")}
        <button class="btn block" style="margin-top:12px" data-a="openStory">Build your own</button>`) : ""}
      ${card(`<div class="card-title serif" style="margin-bottom:8px">${ic("crown",24)}<div>Notes</div></div>
        <ul class="steps">${s.notes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>`)}
      ${card(`<div class="card-title serif" style="margin-bottom:8px">${ic("scroll",24)}<div>Homework ${s.hw.n}</div></div>
        <div class="eyebrow">Part A · writing</div>
        <p class="small" style="margin:6px 0 10px">${esc(s.hw.a.brief)}</p>
        <textarea class="field answer" rows="5" placeholder="Write your version here" data-k="hwA" data-id="${s.id}">${esc(hw.a||"")}</textarea>
        <details class="rev"><summary>Show the model answer</summary>
          <div class="model"><div class="ro">${esc(s.hw.a.model)}</div><div class="en">${esc(s.hw.a.modelEn||"")}</div>
          ${s.hw.a.alt?`<div class="ro" style="margin-top:8px">${esc(s.hw.a.alt)}</div>`:""}
          ${s.hw.a.accept?`<div class="muted small" style="margin-top:6px">${esc(s.hw.a.accept)}</div>`:""}</div></details>
        ${s.hw.b ? `<div class="eyebrow" style="margin-top:16px">Part B · exercise</div>
          <p class="small" style="margin:6px 0 10px">${esc(s.hw.b.brief)}</p>
          ${s.hw.b.type === "record" ? `<button class="btn ghost block" data-a="startSim">Run the 18 questions</button>`
            : `<button class="btn block" data-a="startHw" data-id="${s.id}">Do the exercise${hw.b?` · last score ${hw.b.score}/${hw.b.total}`:""}</button>`}` : ""}`)}
    </div></div>`;
}

/* =====================================================================
   runner (drills, listening, shadowing, simulator)
   ===================================================================== */
function startRun(cfg){ UI.run = Object.assign({i:0, results:[], phase:"go", answer:null}, cfg); UI.view = "run"; render(); }
function runFinish(){
  const r = UI.run;
  stopTimer(); stopSpeak();
  const pct = r.results.length ? sum(r.results.map(x=>x.ok?1:(x.part||0)))/r.results.length : 0;
  if(r.logKind) logDrill(r.logKind, pct, r.results.length);
  if(r.hwId){ S.hw[r.hwId] = Object.assign({}, S.hw[r.hwId], {b:{score:r.results.filter(x=>x.ok).length, total:r.results.length}}); save(); }
  r.phase = "summary"; r.pct = pct; render();
}
function runNext(){
  const r = UI.run;
  stopTimer(); stopSpeak();
  if(r.i + 1 >= r.items.length){ runFinish(); return; }
  r.i++; r.phase = "go"; r.answer = null; r.mark = null; r.audioUrl = null; r.revealed = false;
  render();
  if(r.auto) setTimeout(()=>autoPlay(), 220);
}
function autoPlay(){
  const r = UI.run, it = r.items[r.i];
  if(r.mode === "listen"){ speak(it.speak); }
  if(r.mode === "shadow"){ speak(it.ro); }
  if(r.mode === "sim" || r.mode === "cards"){ speak(it.ro); }
}
function markCurrent(){
  const r = UI.run, it = r.items[r.i];
  const val = (document.getElementById("ansField")||{}).value || "";
  let res;
  if(it.type === "choice") res = {ok: r.answer === it.a, why: r.answer === it.a ? "Correct." : `Answer: ${it.a}${it.why?" ("+it.why+")":""}`};
  else if(it.type === "age") res = markAge(val, it.n);
  else if(it.type === "past") res = markPast(val, it.item);
  else if(it.type === "trans") res = markTranslate(val, it.item);
  else if(it.type === "type") res = markExact(val, it.a);
  else if(it.type === "dict") res = dictMark(val, it.ro);
  else if(it.type === "pick") res = {ok: r.answer === it.a, why: r.answer === it.a ? "Correct." : `Answer: ${it.opts[it.a]}`};
  else res = {ok:true, why:""};
  r.mark = res; r.results.push({ok:res.ok, part:res.part});
  r.phase = "marked"; render();
}
function dictMark(input, target){
  const a = fold(input).split(" ").filter(Boolean), b = fold(target).split(" ").filter(Boolean);
  const pool = a.slice(); let hit = 0;
  b.forEach(w => { const k = pool.indexOf(w); if(k>=0){ hit++; pool.splice(k,1); } });
  const part = hit/b.length;
  return {ok: part >= 0.99, part, why: `${hit} of ${b.length} words · ${target}`};
}
function runView(){
  const r = UI.run;
  if(r.phase === "summary"){
    const right = r.results.filter(x=>x.ok).length;
    return `<div class="reader"><div class="rbar"><button class="icon-btn" data-a="closeRun">✕</button><div><b>${esc(r.title)}</b><small>complete</small></div><div></div></div>
      <div class="stack"><div class="hero" style="text-align:center">${ring(r.pct, 130, 12, r.pct>=0.8?"var(--emerald)":r.pct>=0.6?"var(--gold)":"var(--rose)", Math.round(r.pct*100)+"%")}
        <h3 class="serif" style="margin:12px 0 2px">${right} of ${r.results.length} correct</h3>
        <div class="muted small">${r.pct>=0.8?"Strong. Move on.":r.pct>=0.6?"Nearly. Run it once more.":"Re-read the session, then try again."}</div></div>
        <button class="btn block" data-a="closeRun">Done</button></div></div>`;
  }
  const it = r.items[r.i];
  const head = `<div class="rbar"><button class="icon-btn" data-a="closeRun">✕</button>
    <div><b>${esc(r.title)}</b><small>${r.i+1} of ${r.items.length}</small></div>
    <div class="clock" id="clock"></div></div>`;
  let body = "", foot = "";

  if(r.mode === "drill"){
    const prompt = it.type === "age" ? `Write the sentence for this age: <b>${it.n}</b>`
      : it.type === "past" ? `Put this verb into the past, in a full sentence: <b>${esc(it.v)}</b>`
      : it.type === "trans" ? `Translate: <b>${esc(it.item.en)}</b>`
      : it.type === "choice" ? esc(it.text).replace("{0}", '<span class="gap">?</span>')
      : esc(it.text);
    body = `<div class="qcard"><div class="q">${prompt}</div>${it.hint?`<div class="muted small">${esc(it.hint)}</div>`:""}</div>`;
    if(it.type === "choice"){
      body += `<div class="opts">${it.opts.map(o=>`<button class="opt ${r.answer===o?"on":""}" data-a="pickOpt" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
    } else {
      body += `<input class="field big" id="ansField" autocomplete="off" autocapitalize="sentences" placeholder="Your answer in Romanian" value="${esc(r.answer||"")}" ${r.phase==="marked"?"disabled":""}>`;
    }
    if(r.phase === "marked") body += markCard(r.mark);
    foot = r.phase === "marked" ? `<button class="btn block" data-a="runNext">${r.i+1>=r.items.length?"Finish":"Next"}</button>`
      : `<button class="btn block" data-a="markNow">Check</button>`;
  }

  if(r.mode === "listen"){
    body = `<div class="qcard listen"><div class="muted small">${esc(it.prompt)}</div>
      <button class="playbig" data-a="replay">${SPEAKER_BIG}<span>Play</span></button>
      ${it.showPr && r.phase === "marked" ? `<div class="pr big">${esc(it.pr||"")}</div>` : ""}</div>`;
    if(it.type === "pick"){
      body += `<div class="opts">${it.opts.map((o,i)=>`<button class="opt ${r.answer===i?"on":""}" data-a="pickIdx" data-i="${i}">${esc(o)}</button>`).join("")}</div>`;
    } else {
      body += `<input class="field big" id="ansField" autocomplete="off" placeholder="${it.type==="numbers"?"Type the number":"Type what you heard"}" ${r.phase==="marked"?"disabled":""}>`;
    }
    if(r.phase === "marked") body += markCard(r.mark, it.ro);
    foot = r.phase === "marked" ? `<button class="btn block" data-a="runNext">${r.i+1>=r.items.length?"Finish":"Next"}</button>`
      : `<button class="btn block" data-a="markNow">Check</button>`;
  }

  if(r.mode === "shadow"){
    body = `<div class="qcard">
      <div class="ro big">${esc(it.ro)}</div>
      ${it.pr?`<div class="pr">${esc(it.pr)}</div>`:""}
      <div class="en">${esc(it.en)}</div>
      <div class="btnrow" style="margin-top:14px"><button class="btn ghost sm" data-a="replay">Hear it</button>
        ${r.recording ? `<button class="btn sm" data-a="stopRec">Stop</button>` : `<button class="btn sm" data-a="startRec">Record me</button>`}</div>
      ${r.audioUrl ? `<audio controls src="${r.audioUrl}" style="width:100%;margin-top:12px"></audio>` : ""}</div>`;
    foot = `<button class="btn ghost" data-a="replay">Model</button><button class="btn" style="flex:2" data-a="runNext">${r.i+1>=r.items.length?"Finish":"Next phrase"}</button>`;
  }

  if(r.mode === "sim" || r.mode === "cards"){
    const q = it;
    body = `<div class="qcard officer">
      <div class="eyebrow">The officer asks</div>
      <div class="ro big">${esc(q.ro)}</div>
      <div class="pr">${esc(q.pr||"")}</div>
      <button class="btn ghost sm" style="margin-top:10px" data-a="replay">Hear it again</button>
      ${r.phase === "answer" ? `<div class="timerline"><i id="tbar"></i></div><div class="muted small" style="margin-top:6px">Answer out loud now${S.settings.mic?" — recording":""}.</div>` : ""}
      ${r.revealed ? `<div class="model"><div class="eyebrow">A full-credit answer sounds like</div><div class="ro">${esc(q.model||q.en)}</div><div class="en">${esc(q.en)}</div></div>` : ""}
      ${r.audioUrl ? `<audio controls src="${r.audioUrl}" style="width:100%;margin-top:12px"></audio>` : ""}</div>`;
    if(r.phase === "score"){
      body += `<div class="selfcard"><div class="eyebrow">Score this answer</div>
        <div class="rate">${[0,1,2].map(n=>`<button class="ratebtn" data-a="scoreSim" data-v="${n}">${n}</button>`).join("")}</div>
        <div class="muted small">2 = correct and fluent within three seconds · 1 = understandable but with errors or hesitation · 0 = not understandable, English, or a freeze</div></div>`;
    }
    foot = r.phase === "ask" ? `<button class="btn block" data-a="beginAnswer">I'm ready — ask me</button>`
      : r.phase === "answer" ? `<button class="btn block" data-a="doneAnswer">Done answering</button>`
      : r.phase === "score" ? `<button class="btn ghost" data-a="reveal">Show the model</button>`
      : `<button class="btn block" data-a="runNext">Next question</button>`;
  }
  return `<div class="reader">${head}<div class="stack">${body}</div><div class="rfoot">${foot}</div></div>`;
}
const markCard = (m, extra) => `<div class="markcard ${m.ok?"good":(m.part>0?"mid":"bad")}">
  <b>${m.ok?"Correct":(m.part>0?Math.round(m.part*100)+"%":"Not yet")}</b>
  <div>${esc(m.why||"")}</div>${extra&&!m.ok?`<div class="ro" style="margin-top:6px">${esc(extra)}</div>`:""}</div>`;

/* =====================================================================
   story builder
   ===================================================================== */
function storyView(){
  const st = S.story || {};
  const text = (st.text || "");
  const chk = text.trim() ? checkStory(text) : null;
  return `<div class="reader"><div class="rbar"><button class="icon-btn" data-a="closeRun">‹</button><div><b>Despre mine</b><small>your own version</small></div><div></div></div>
    <div class="stack">
      ${card(`<p class="muted small" style="margin:0 0 10px">${esc(REF.story.note)}</p>
        ${REF.story.lines.map(l=>`<div class="phrase"><div class="ph-main"><div class="ro">${esc(l[0])}</div><div class="en">${esc(l[1])}</div></div>${say(l[0])}</div>`).join("")}`)}
      ${card(`<div class="eyebrow" style="margin-bottom:8px">Your version</div>
        <div class="hints">${REF.story.builder.map(b=>`<div class="hint"><b>${esc(b.label)}</b><span>${esc(b.hint)}</span></div>`).join("")}</div>
        <textarea class="field answer" rows="10" id="storyField" placeholder="Bună ziua! Mă numesc…" data-k="storyText">${esc(text)}</textarea>
        <div class="btnrow" style="margin-top:10px"><button class="btn sm" data-a="checkStory">Check it</button>
          <button class="btn sm ghost" data-a="sayStory">Hear it</button></div>`)}
      ${chk ? card(`<div class="eyebrow" style="margin-bottom:8px">Against the exam grid — ${chk.total} of 12</div>
        <div class="checks">${chk.cov.map(c=>`<div class="chk ${c.ok?"ok":""}">${c.ok?"✓":"○"} ${esc(c.k)}</div>`).join("")}</div>
        <div class="eyebrow" style="margin:12px 0 6px">Signature structures</div>
        <div class="checks">${chk.sig.map(c=>`<div class="chk ${c.ok?"ok":""}">${c.ok?"✓":"○"} ${esc(c.k)}</div>`).join("")}</div>
        <div class="muted small" style="margin-top:10px">${chk.sentences} sentences. ${chk.sentences>=10?"Length is fine.":"Under ten sentences caps this section at 8 points."}</div>`) : ""}
    </div></div>`;
}

/* =====================================================================
   exam
   ===================================================================== */
function buildExam(){
  const E = REF.exam, parts = [];
  E.A1.items.forEach((it,i) => parts.push({sec:"A1", pts:1, type:"age", n:it.n, day:"1B", label:`Age ${it.n}`}));
  E.A2.items.forEach((it,i) => parts.push({sec:"A2", pts:1, type:"choice", text:it.text, a:it.a, opts:["de","din","acum"], day:"2A", label:"de/din/acum"}));
  E.A3.items.forEach(it => parts.push({sec:"A3", pts:1, type:"choice", text:it.text, a:it.a, opts:["place","plac"], day:"3A", label:"place/plac"}));
  E.A4.items.forEach(it => parts.push({sec:"A4", pts:1, type:"type", text:it.text, a:[it.a], hint:it.en, day:"5A", label:"gender ending"}));
  E.B.items.forEach(it => parts.push({sec:"B", pts:1, type:"past", v:it.v, item:it, day:"4B", label:"past tense"}));
  E.C1.items.forEach(it => parts.push({sec:"C1", pts:1, type:"pick", prompt:it.ro, opts:shuffle(E.C1.items.map(x=>x.en)), aText:it.en, day:"4A", label:"weather"}));
  E.C2.items.forEach(it => parts.push({sec:"C2", pts:1, type:"keys", item:it, day:"3B", label:"RO→EN"}));
  E.D.items.forEach(it => parts.push({sec:"D", pts:1, type:"trans", item:it, day:"—", label:"strict translation"}));
  return parts;
}
function startExam(){
  UI.exam = {id:uid(), i:0, parts:buildExam(), answers:{}, results:[], phase:"written", started:Date.now(),
    story:"", oral:REF.interview.map(()=>null), conduct:[false,false,false,false], feedback:[]};
  UI.view = "exam"; render();
  startTimer(60*60, l => { const el = document.getElementById("clock"); if(el) el.textContent = mmss(l); }, ()=>{ toast("60 minutes are up. Written part closed."); examGoto("story"); });
}
function examGoto(phase){ UI.exam.phase = phase; UI.exam.i = 0; render(); }
function examMark(){
  const X = UI.exam, p = X.parts[X.i];
  const val = (document.getElementById("ansField")||{}).value || "";
  let res;
  if(p.type === "age") res = markAge(val, p.n);
  else if(p.type === "choice") res = {ok: X.pick === p.a, why:`Answer: ${p.a}`};
  else if(p.type === "type") res = markExact(val, p.a);
  else if(p.type === "past") res = markPast(val, p.item);
  else if(p.type === "keys") res = markKeys(val, p.item);
  else if(p.type === "trans") res = markTranslate(val, p.item);
  else if(p.type === "pick") res = {ok: X.pick === p.aText, why:`Answer: ${p.aText}`};
  X.results.push({sec:p.sec, ok:res.ok, why:res.why, label:p.label, day:p.day});
  if(!res.ok) X.feedback.push({sec:p.sec, item:p.label, fix:res.why, day:p.day});
  X.pick = null;
  if(X.i + 1 >= X.parts.length){ stopTimer(); examGoto("story"); return; }
  X.i++; render();
}
function finishExam(){
  const X = UI.exam;
  const written = X.results.filter(r=>r.ok).length;           // out of 44
  const storyChk = checkStory(X.story || "");
  const oralScore = sum(X.oral.map(v => v||0));               // out of 36
  const conduct = X.conduct.filter(Boolean).length;           // out of 4
  const total = written + storyChk.total + oralScore + conduct;
  const band = REF.exam.bands.find(b => total >= b.min);
  X.oral.forEach((v,i) => { if(v !== null && v < 2) X.feedback.push({sec:"F", item:`Q${i+1} ${REF.interview[i].ro}`, fix:"Re-drill until three clean answers in a row.", day:REF.interview[i].day}); });
  storyChk.cov.filter(c=>!c.ok).forEach(c => X.feedback.push({sec:"E", item:c.k, fix:"Add this block to your Despre mine.", day:"5B"}));
  storyChk.sig.filter(c=>!c.ok).forEach(c => X.feedback.push({sec:"E", item:c.k, fix:"Use this structure somewhere in your story.", day:"5B"}));
  const rec = {id:X.id, date:todayISO(), total, band:band.label, advice:band.advice,
    parts:{written, story:storyChk.total, oral:oralScore, conduct}, feedback:X.feedback.slice(0,40)};
  S.exams.push(rec); save();
  X.phase = "result"; X.record = rec; render();
}
function examView(){
  const X = UI.exam;
  if(X.phase === "result" || X.record && X.phase === "result") return examResultView(X.record);
  const head = (title, sub) => `<div class="rbar"><button class="icon-btn" data-a="quitExam">✕</button><div><b>${title}</b><small>${sub}</small></div><div class="clock" id="clock"></div></div>`;

  if(X.phase === "written"){
    const p = X.parts[X.i];
    const secTitle = {A1:"A1 · Age sentences",A2:"A2 · de / din / acum",A3:"A3 · place / plac",A4:"A4 · Gender endings",
      B:"Section B · Past tense",C1:"C1 · Weather",C2:"C2 · Romanian to English",D:"Section D · Strict translation"}[p.sec];
    let body = "";
    if(p.type === "age") body = `<div class="qcard"><div class="q">Write the full sentence for this age: <b>${p.n}</b></div></div>
      <input class="field big" id="ansField" autocomplete="off" placeholder="Am …">`;
    else if(p.type === "choice") body = `<div class="qcard"><div class="q">${esc(p.text).replace("{0}", '<span class="gap">?</span>')}</div></div>
      <div class="opts">${p.opts.map(o=>`<button class="opt ${X.pick===o?"on":""}" data-a="examPick" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
    else if(p.type === "type") body = `<div class="qcard"><div class="q">${esc(p.text).replace("{0}", '<span class="gap">?</span>')}</div>${p.hint?`<div class="muted small">${esc(p.hint)}</div>`:""}</div>
      <input class="field big" id="ansField" autocomplete="off">`;
    else if(p.type === "past") body = `<div class="qcard"><div class="q">Past tense, full sentence: <b>${esc(p.v)}</b></div></div>
      <input class="field big" id="ansField" autocomplete="off">`;
    else if(p.type === "pick") body = `<div class="qcard"><div class="q">${esc(p.prompt)}</div></div>
      <div class="opts">${p.opts.map(o=>`<button class="opt ${X.pick===o?"on":""}" data-a="examPick" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
    else if(p.type === "keys") body = `<div class="qcard"><div class="q">Translate into English: <b>${esc(p.item.ro)}</b></div></div>
      <input class="field big" id="ansField" autocomplete="off">`;
    else body = `<div class="qcard"><div class="q">Translate into Romanian: <b>${esc(p.item.en)}</b></div></div>
      <input class="field big" id="ansField" autocomplete="off">`;
    return `<div class="reader">${head("Written · "+secTitle, `item ${X.i+1} of ${X.parts.length}`)}
      <div class="stack">${body}<div class="muted small">No feedback until the end — this is the exam.</div></div>
      <div class="rfoot"><button class="btn block" data-a="examNext">${X.i+1>=X.parts.length?"Finish written part":"Next"}</button></div></div>`;
  }
  if(X.phase === "story"){
    return `<div class="reader">${head("Section E · Despre mine", "12 points")}
      <div class="stack">
        ${card(`<p class="muted small" style="margin:0">Write your own presentation, 10 to 12 sentences. It is marked on topic coverage, signature structures and length.</p>`)}
        <textarea class="field answer" rows="12" id="storyExam" placeholder="Bună ziua! Mă numesc…">${esc(X.story||"")}</textarea>
      </div>
      <div class="rfoot"><button class="btn block" data-a="examStoryDone">Continue to the oral</button></div></div>`;
  }
  if(X.phase === "oral"){
    const i = X.i, q = REF.interview[i];
    return `<div class="reader">${head("Section F · Oral", `question ${i+1} of 18`)}
      <div class="stack">
        <div class="qcard officer"><div class="eyebrow">The officer asks</div>
          <div class="ro big">${esc(q.ro)}</div><div class="pr">${esc(q.pr)}</div>
          <button class="btn ghost sm" style="margin-top:10px" data-a="sayText" data-t="${esc(q.ro)}">Hear it</button>
          ${X.audioUrl?`<audio controls src="${X.audioUrl}" style="width:100%;margin-top:12px"></audio>`:""}</div>
        <div class="selfcard"><div class="eyebrow">Answer out loud, then score it</div>
          <div class="btnrow" style="margin:10px 0">${X.recording?`<button class="btn sm" data-a="stopRec">Stop recording</button>`:`<button class="btn sm ghost" data-a="startRec">Record my answer</button>`}
            <button class="btn sm quiet" data-a="revealOral">Show the model</button></div>
          ${X.reveal?`<div class="model"><div class="ro">${esc(q.model)}</div><div class="en">${esc(q.en)}</div></div>`:""}
          <div class="rate">${[0,1,2].map(n=>`<button class="ratebtn ${X.oral[i]===n?"on":""}" data-a="examOralScore" data-v="${n}">${n}</button>`).join("")}</div>
          <div class="muted small">${esc(REF.exam.F.note.split("Score each")[1]?("Score each"+REF.exam.F.note.split("Score each")[1]):"")}</div></div>
      </div>
      <div class="rfoot">${i>0?`<button class="btn ghost" data-a="examOralBack">Back</button>`:""}
        <button class="btn" style="flex:2" data-a="examOralNext">${i+1>=18?"Conduct points":"Next question"}</button></div></div>`;
  }
  if(X.phase === "conduct"){
    return `<div class="reader">${head("Section F · Conduct", "4 points")}
      <div class="stack">${card(`<div class="eyebrow" style="margin-bottom:10px">Tick what was true across the whole interview</div>
        ${REF.conduct.map((c,i)=>`<button class="check-row ${X.conduct[i]?"on":""}" data-a="toggleConduct" data-i="${i}"><span class="box">${X.conduct[i]?"✓":""}</span><span>${esc(c)}</span></button>`).join("")}
        <div class="muted small" style="margin-top:10px">${esc(REF.exam.F.shuffleRule)}</div>`)}</div>
      <div class="rfoot"><button class="btn block" data-a="examFinish">See the result</button></div></div>`;
  }
  return "";
}
function examResultView(rec){
  const sec = (k,v,max) => `<div class="row"><div class="name">${k}</div><div class="barline"><i style="width:${v/max*100}%;background:${v/max>=0.8?"var(--emerald)":v/max>=0.6?"var(--gold)":"var(--rose)"}"></i></div><b class="num">${v}/${max}</b></div>`;
  return `<div class="reader"><div class="rbar"><button class="icon-btn" data-a="closeRun">✕</button><div><b>Exam result</b><small>${rec.date}</small></div><div></div></div>
    <div class="stack">
      <div class="hero" style="text-align:center">${ring(rec.total/100, 140, 13, rec.total>=90?"var(--emerald)":rec.total>=70?"var(--gold)":"var(--rose)", rec.total)}
        <h3 class="serif" style="margin:12px 0 4px">${esc(rec.band)}</h3>
        <div class="muted small">${esc(rec.advice)}</div></div>
      ${card(`<div class="eyebrow" style="margin-bottom:8px">Where the points came from</div>
        ${sec("Written sections A–D", rec.parts.written, 48)}
        ${sec("Despre mine", rec.parts.story, 12)}
        ${sec("Oral interview", rec.parts.oral, 36)}
        ${sec("Conduct", rec.parts.conduct, 4)}`)}
      ${rec.feedback.length ? card(`<div class="eyebrow" style="margin-bottom:8px">Feedback sheet · your revision plan</div>
        <div class="fsheet"><div class="fhead"><span>Where</span><span>What to re-drill</span><span>Day</span></div>
        ${rec.feedback.map(f=>`<div class="frow"><span>${esc(f.sec)} · ${esc(f.item)}</span><span>${esc(f.fix)}</span><span>${esc(f.day)}</span></div>`).join("")}</div>`)
        : card(`<div class="muted">Nothing flagged. Run the interview again in a day to check it holds.</div>`)}
      <button class="btn block" data-a="closeRun">Done</button>
    </div></div>`;
}

/* =====================================================================
   render
   ===================================================================== */
function applyTheme(){ document.documentElement.setAttribute("data-theme", S.settings.theme === "light" ? "light" : "royal"); }
function render(keep){
  const y = window.scrollY;
  applyTheme();
  const app = document.getElementById("app"), bar = document.getElementById("tabbar");
  if(UI.view === "session"){ app.innerHTML = sessionView(); bar.style.display = "none"; }
  else if(UI.view === "run"){ app.innerHTML = runView(); bar.style.display = "none"; }
  else if(UI.view === "story"){ app.innerHTML = storyView(); bar.style.display = "none"; }
  else if(UI.view === "exam"){ app.innerHTML = examView(); bar.style.display = "none"; }
  else if(UI.view === "rec"){ app.innerHTML = recorderView(); bar.style.display = "none"; }
  else {
    bar.style.display = "flex";
    const t = TABS.find(x=>x.id===UI.tab);
    app.innerHTML = `<header class="topbar"><div><div class="sub">ES-Interviu</div><h1 class="serif">${t.title}</h1></div>
      ${daysToInterview()!=null?`<div class="badge gold">${daysToInterview()}d</div>`:""}</header><main>${VIEWS[UI.tab]()}</main>`;
    bar.innerHTML = TABS.map(x=>`<button class="${x.id===UI.tab?"on":""}" data-a="tab" data-tab="${x.id}">${ic(x.icon,24)}<span>${x.label}</span></button>`).join("");
  }
  window.scrollTo(0, keep ? y : 0);
}
let toastT; function toast(m){ const el = document.getElementById("toast"); el.textContent = m; el.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(()=>el.classList.remove("show"), 2400); }

/* =====================================================================
   actions
   ===================================================================== */
const ACTIONS = {
 tab(b){ UI.tab = b.dataset.tab; UI.view = null; render(); },
 setPractice(b){ UI.practice = b.dataset.p; render(); },
 setGender(b){ S.settings.gender = b.dataset.g; save(); render(true); },
 toggleMic(){ S.settings.mic = !S.settings.mic; save(); render(true); },
 say(b){ speak(b.dataset.t); },
 recheckVoice(){ loadVoices(); render(true); toast(hasRo() ? "Found it: " + ((pickVoice()||{}).name||"Romanian voice") : "Still no Romanian voice. Finish the download, then tap again."); },
 recPhrase(b){ UI.recPhrase = b.dataset.t; UI.recSaved = false; UI.recOn = false; UI.view = "rec"; render(); },
 closeRec(){ if(REC.on) recStop(); UI.view = null; UI.recPhrase = null; render(); },
 async recGo(){ const ok = await recStart(); if(!ok){ toast("No microphone permission"); return; } UI.recOn = true; UI.recSaved = false; render(true); },
 async recStop(){
   const url = await recStop();
   UI.recOn = false;
   try {
     const blob = await fetch(url).then(r => r.blob());
     const k = fnv(String(UI.recPhrase).trim());
     const ok = await idbPut(k, blob);
     UI.recSaved = ok;
     toast(ok ? "Saved in your own voice" : "Couldn't save on this device");
   } catch(e){ toast("Couldn't save the recording"); }
   render(true);
 },
 recPlay(b){ playHuman(b.dataset.k); },
 async recDelete(b){ if(!confirm("Delete this recording?")) return; await idbDel(b.dataset.k); UI.recSaved = false; toast("Deleted"); render(true); },
 testVoice(){ loadVoices(); const t = "Bună ziua! Mă numesc Esther.";
   speak(t, null);
   toast(S.settings.audio === "voice" ? voiceLabel() : (clipFor(t) ? "Playing the recorded clip" : "No clip found — using the phone voice"));
   render(true); },
 setAudio(b){ S.settings.audio = b.dataset.v; save(); stopSpeak(); render(true);
   speak("Bună ziua!", null); },
 sayText(b){ speak(b.dataset.t); },
 openSession(b){ UI.session = b.dataset.id; UI.view = "session"; render(); },
 closeSession(){ UI.view = null; UI.tab = UI.tab === "home" ? "home" : "course"; render(); },
 markRead(b){ S.read[b.dataset.id] = !S.read[b.dataset.id]; save(); render(true); toast(S.read[b.dataset.id]?"Session marked done":"Marked not done"); },
 openStory(){ UI.view = "story"; render(); },
 checkStory(){ const t = (document.getElementById("storyField")||{}).value || ""; S.story = Object.assign({}, S.story, {text:t}); save(); render(true); },
 sayStory(){ const t = (document.getElementById("storyField")||{}).value || S.story.text || ""; speak(t); },
 closeRun(){ stopTimer(); stopSpeak(); if(REC.on) recStop(); UI.run = null; UI.exam = null; UI.view = null; render(); },

 startDrill(b){
   const d = DRILLS[b.dataset.k];
   startRun({mode:"drill", title:d.name, items:d.build(), logKind:d.kind});
 },
 startHw(b){
   const s = COURSE.find(x=>x.id===b.dataset.id), bb = s.hw.b, items = [];
   if(bb.type === "choice") bb.items.forEach(i => items.push({type:"choice", text:i.text, a:i.a, opts:bb.opts}));
   if(bb.type === "translate") bb.items.forEach(i => items.push({type:"type", text:i.en, a:i.a}));
   if(bb.type === "type") bb.items.forEach(i => items.push({type:"type", text:"Write in Romanian: " + i.q, a:i.a, hint:i.note}));
   if(bb.type === "match") bb.items.forEach(i => items.push({type:"choice", text:`“${i.ro}” means…`, a:i.en, opts:shuffle(bb.items.map(x=>x.en)).slice(0,4).includes(i.en)?shuffle(bb.items.map(x=>x.en)).slice(0,4):shuffle(bb.items.map(x=>x.en).filter(x=>x!==i.en)).slice(0,3).concat([i.en])}));
   startRun({mode:"drill", title:`Homework ${s.hw.n}`, items:shuffle(items), logKind:"hw", hwId:s.id});
 },
 startListen(b){
   const k = b.dataset.k, d = LISTEN[k];
   const bankAll = [];
   COURSE.forEach(s => (s.bank||[]).forEach(g => g.items.forEach(p => { if(p.ro.length < 60) bankAll.push(p); })));
   let items = [];
   if(k === "match"){
     const pick = shuffle(bankAll).slice(0, d.n);
     items = pick.map(p => ({type:"pick", speak:p.ro, ro:p.ro, pr:p.pr, prompt:"What does this mean?", showPr:true,
       opts:shuffle([p.en].concat(shuffle(bankAll.filter(x=>x.en!==p.en)).slice(0,3).map(x=>x.en))).map(x=>x),
       a:null}));
     items.forEach((it,i) => { it.a = it.opts.indexOf(pick[i].en); });
   } else if(k === "dict"){
     items = shuffle(bankAll.filter(p=>p.ro.split(" ").length >= 3 && p.ro.split(" ").length <= 9)).slice(0,d.n)
       .map(p => ({type:"dict", speak:p.ro, ro:p.ro, pr:p.pr, prompt:"Type what you hear, in Romanian", showPr:true}));
   } else if(k === "numbers"){
     items = shuffle([7,12,19,21,28,34,48,56,68,73,90,100]).slice(0,d.n).map(n => ({type:"type", speak:roNumber(n), ro:roNumber(n), a:[String(n)], prompt:"Type the number in digits", showPr:false}));
   } else {
     const pick = shuffle(REF.interview).slice(0,d.n);
     items = pick.map(q => ({type:"pick", speak:q.ro, ro:q.ro, pr:q.pr, prompt:"What is the officer asking?", showPr:true,
       opts:shuffle([q.en].concat(shuffle(REF.interview.filter(x=>x.en!==q.en)).slice(0,3).map(x=>x.en))), a:null}));
     items.forEach((it,i) => { it.a = it.opts.indexOf(pick[i].en); });
   }
   startRun({mode:"listen", title:d.name, items, logKind:d.kind, auto:true});
   setTimeout(autoPlay, 300);
 },
 startShadow(b){
   const id = b.dataset.id;
   let items = [];
   if(id === "survival") items = REF.survival.slice();
   else { const s = COURSE.find(x=>x.id===id); (s.bank||[]).forEach(g => items = items.concat(g.items)); }
   startRun({mode:"shadow", title:"Shadowing", items, auto:true});
   setTimeout(autoPlay, 300);
 },
 shadowGroup(b){
   const s = COURSE.find(x=>x.id===b.dataset.id);
   const g = (s.bank||[]).find(x => x.group === b.dataset.g);
   startRun({mode:"shadow", title:g.group, items:g.items.slice(), auto:true});
   setTimeout(autoPlay, 300);
 },
 startCards(){ startRun({mode:"cards", title:"Answer cards", items:shuffle(REF.interview), phase:"ask"}); },
 startSim(){ startRun({mode:"sim", title:"Interview simulator", items:REF.interview.slice(), phase:"ask", sim:true, scores:[]}); },
 beginAnswer(){
   const r = UI.run; r.phase = "answer"; render();
   if(S.settings.mic) recStart();
   startTimer(45, l => { const el = document.getElementById("tbar"); if(el) el.style.width = clamp01(l/45)*100 + "%"; }, ()=>ACTIONS.doneAnswer());
 },
 async doneAnswer(){
   const r = UI.run; stopTimer();
   if(REC.on) r.audioUrl = await recStop();
   r.phase = "score"; render();
 },
 reveal(){ UI.run.revealed = true; render(true); },
 scoreSim(b){
   const r = UI.run, v = +b.dataset.v;
   r.results.push({ok: v === 2, part: v/2});
   if(r.scores) r.scores.push(v);
   if(r.i + 1 >= r.items.length){
     if(r.sim){ const score = sum(r.scores) + 4; S.sims.push({id:uid(), date:todayISO(), score:Math.min(score,40), detail:r.scores}); save(); }
     runFinish(); return;
   }
   r.i++; r.phase = "ask"; r.revealed = false; r.audioUrl = null; render();
   setTimeout(autoPlay, 250);
 },
 replay(){ const r = UI.run, it = r.items[r.i]; speak(it.speak || it.ro); },
 async startRec(){ const ok = await recStart(); if(!ok){ toast("No microphone permission"); return; }
   if(UI.exam) UI.exam.recording = true; else UI.run.recording = true; render(true); },
 async stopRec(){ const url = await recStop();
   if(UI.exam){ UI.exam.recording = false; UI.exam.audioUrl = url; } else { UI.run.recording = false; UI.run.audioUrl = url; }
   render(true); },
 pickOpt(b){ UI.run.answer = b.dataset.o; render(true); },
 pickIdx(b){ UI.run.answer = +b.dataset.i; render(true); },
 markNow(){ markCurrent(); },
 runNext(){ runNext(); },

 startExam(){ if(!confirm("The written part runs for 60 minutes with no feedback until the end, then the oral section. Start now?")) return; startExam(); },
 quitExam(){ if(!confirm("Leave the exam? Nothing will be saved.")) return; stopTimer(); UI.exam = null; UI.view = null; render(); },
 examPick(b){ UI.exam.pick = b.dataset.o; render(true); },
 examNext(){ examMark(); },
 examStoryDone(){ UI.exam.story = (document.getElementById("storyExam")||{}).value || ""; examGoto("oral"); },
 examOralScore(b){ UI.exam.oral[UI.exam.i] = +b.dataset.v; render(true); },
 revealOral(){ UI.exam.reveal = !UI.exam.reveal; render(true); },
 examOralBack(){ if(UI.exam.i>0){ UI.exam.i--; UI.exam.reveal = false; UI.exam.audioUrl = null; render(); } },
 examOralNext(){
   const X = UI.exam;
   if(X.oral[X.i] === null){ toast("Score this answer first"); return; }
   if(X.i + 1 >= 18){ examGoto("conduct"); return; }
   X.i++; X.reveal = false; X.audioUrl = null; render();
 },
 toggleConduct(b){ const i = +b.dataset.i; UI.exam.conduct[i] = !UI.exam.conduct[i]; render(true); },
 examFinish(){ finishExam(); },
 openExamResult(b){ const rec = S.exams.find(e=>e.id===b.dataset.id); if(rec){ UI.exam = {phase:"result", record:rec}; UI.view = "exam"; render(); } },

 export(){ exportJSON(); },
 import(){ document.getElementById("importFile").click(); },
 reset(){ const t = prompt("This clears every answer, score and exam on this device. Type RESET to confirm."); if(t && t.trim().toUpperCase()==="RESET"){ S = blank(); save(); render(); toast("Cleared"); } }
};
document.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if(!b || b.disabled) return; const f = ACTIONS[b.dataset.a]; if(f){ e.preventDefault(); f(b); } });
document.addEventListener("input", e => {
  const el = e.target, k = el.dataset && el.dataset.k; if(!k) return;
  if(k === "search"){ UI.search = el.value; clearTimeout(window._st); window._st = setTimeout(()=>render(true), 250); return; }
  if(k === "hwA"){ const id = el.dataset.id; S.hw[id] = Object.assign({}, S.hw[id], {a:el.value}); save(); return; }
  if(k === "storyText"){ S.story = Object.assign({}, S.story, {text:el.value}); save(); return; }
  if(k === "rate"){ S.settings.rate = Math.max(0.5, Math.min(1.4, parseFloat(el.value)||0.9)); save(); return; }
  S.settings[k] = el.value; save();
});
document.addEventListener("change", e => {
  const el = e.target, k = el.dataset && el.dataset.k; if(!k) return;
  if(k === "theme"){ S.settings.theme = el.value; save(); applyTheme(); return; }
  if(k === "audio"){ S.settings.audio = el.value; save(); render(true); return; }
  if(k === "voice"){ S.settings.voice = el.value; save(); return; }
});

/* backup */
async function exportJSON(){
  const blob = new Blob([JSON.stringify(S, null, 2)], {type:"application/json"});
  const name = `es-interviu-${todayISO()}.json`;
  try { const f = new File([blob], name, {type:"application/json"});
    if(navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f]}); toast("Backup ready"); return; } } catch(e){ if(e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 800);
  toast("Backup downloaded");
}
document.getElementById("importFile").addEventListener("change", e => {
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result);
    if(!d || d.app !== "es-interviu") throw new Error("Not an ES-Interviu backup.");
    if(!confirm("Replace everything on this device?")) return;
    S = normalize(d); save(); render(); toast("Imported");
  } catch(err){ alert("Couldn't import: " + (err.message||"invalid file")); } e.target.value = ""; };
  r.readAsText(f);
});

/* boot */
document.body.insertAdjacentHTML("afterbegin", DEFS);
render();
setTimeout(()=>{ loadVoices(); if(!UI.view) render(true); }, 800);
setTimeout(()=>{ loadVoices(); if(!UI.view) render(true); }, 2500);
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});
