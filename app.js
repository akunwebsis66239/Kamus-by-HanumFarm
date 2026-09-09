let dict=[], mode="en-id", current=null;
const $=s=>document.querySelector(s);
const search=$('#search'), result=$('#result'), suggestions=$('#suggestions');
const favKey='hanum_favorites', histKey='hanum_history';
const getFav=()=>JSON.parse(localStorage.getItem(favKey)||'[]');
const getHist=()=>JSON.parse(localStorage.getItem(histKey)||'[]');
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

fetch('data/dictionary.json').then(r=>r.json()).then(d=>{dict=d; renderQuick();});
function norm(s){return s.toLowerCase().trim();}
function lookup(q){
  q=norm(q); if(!q)return null;
  if(mode==='en-id') return dict.find(x=>norm(x.word)===q) || dict.find(x=>norm(x.word).startsWith(q));
  return dict.find(x=>norm(x.meaning).split('/').some(v=>v.trim()===q)) ||
         dict.find(x=>norm(x.meaning).includes(q));
}
function renderQuick(){
  const words=['beautiful','family','school','friend','happy','book','water','learn'];
  $('#quickWords').innerHTML=words.map(w=>`<button class="chip" data-word="${w}">${w}</button>`).join('');
  document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{search.value=b.dataset.word; show(lookup(b.dataset.word));});
}
function speak(word){
  if(!('speechSynthesis' in window)) return alert('Fitur suara belum tersedia di browser ini.');
  speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(word); u.lang='en-US'; u.rate=.8; speechSynthesis.speak(u);
}
function show(item){
  current=item;
  if(!item){result.className='result empty';result.innerHTML='<div class="big-emoji">🤔</div><h2>Kata belum ditemukan</h2><p>Coba kata lain atau periksa ejaannya.</p>';return;}
  result.className='result';
  const fav=getFav().includes(norm(item.word));
  result.innerHTML=`<div class="wordline"><div><h2 class="word">${escapeHtml(item.word)}</h2><span class="tag">${mode==='en-id'?'English':'Indonesia'}</span></div><button class="speak" id="speak">🔊</button></div>
  <div class="meaning">${escapeHtml(item.meaning)}</div>
  ${item.example_en?`<div class="example"><b>💬 Contoh Kalimat</b><div>${escapeHtml(item.example_en)}</div><em>${escapeHtml(item.example_id)}</em></div>`:''}
  <div class="actions"><button class="fav ${fav?'on':''}" id="fav">${fav?'⭐ Tersimpan':'☆ Tambah Favorit'}</button><button id="again">🔎 Cari Lagi</button></div>`;
  $('#speak').onclick=()=>speak(item.word);
  $('#again').onclick=()=>{search.focus();search.select()};
  $('#fav').onclick=()=>toggleFav(item.word);
  let h=getHist().filter(x=>x!==item.word); h.unshift(item.word); save(histKey,h.slice(0,30)); updateCounts();
}
function toggleFav(word){
  let f=getFav(); const n=norm(word); f=f.includes(n)?f.filter(x=>x!==n):[...f,n]; save(favKey,f); updateCounts(); if(current)show(current);
}
function updateCounts(){$('#favCount').textContent=getFav().length}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function doSearch(){
  const q=search.value.trim(); suggestions.innerHTML='';
  if(!q){result.className='result empty';result.innerHTML='<div class="big-emoji">📚</div><h2>Ayo belajar!</h2><p>Ketik sebuah kata untuk melihat terjemahannya.</p>';return}
  let matches;
  if(mode==='en-id') matches=dict.filter(x=>norm(x.word).startsWith(norm(q))).slice(0,6);
  else matches=dict.filter(x=>norm(x.meaning).includes(norm(q))).slice(0,6);
  suggestions.innerHTML=matches.map(x=>`<button class="suggestion" data-word="${escapeHtml(x.word)}">${escapeHtml(x.word)} → ${escapeHtml(x.meaning)}</button>`).join('');
  suggestions.querySelectorAll('button').forEach(b=>b.onclick=()=>{search.value= mode==='en-id'?b.dataset.word:b.dataset.word;show(lookup(b.dataset.word));suggestions.innerHTML='';});
  show(lookup(q));
}
search.addEventListener('input',doSearch); $('#clear').onclick=()=>{search.value='';suggestions.innerHTML='';doSearch();search.focus()};
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;search.placeholder=mode==='en-id'?'Ketik kata Inggris, misalnya: beautiful':'Ketik kata Indonesia, misalnya: rumah';search.value='';doSearch();});
function openList(type){
  $('#listPanel').classList.remove('hidden');
  const arr=type==='fav'?getFav():getHist(); $('#panelTitle').textContent=type==='fav'?'⭐ Favorit':'🕘 Riwayat';
  $('#listContent').innerHTML=arr.length?arr.map(w=>`<div class="list-item"><span>${escapeHtml(w)}</span><button data-w="${escapeHtml(w)}">Buka ›</button></div>`).join(''):'<p>Belum ada data.</p>';
  $('#listContent').querySelectorAll('button').forEach(b=>b.onclick=()=>{search.value=b.dataset.w;show(lookup(b.dataset.w));$('#listPanel').classList.add('hidden');});
}
$('#favoritesBtn').onclick=()=>openList('fav'); $('#historyBtn').onclick=()=>openList('hist'); $('#closePanel').onclick=()=>$('#listPanel').classList.add('hidden');
updateCounts();

let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#installBtn').classList.remove('hidden')});
$('#installBtn').onclick=async()=>{if(deferredInstall){deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('#installBtn').classList.add('hidden')}};
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
