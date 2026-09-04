
const $ = id => document.getElementById(id);

const STORAGE_KEY = "maria_contacts_v3";
const CONFIG_KEY = "maria_config_v3";

function normalizeContact(c) {
  return {
    id: c.id || String(Date.now()),
    name: c.name || "Sem nome",
    avatar: c.avatar || `https://i.pravatar.cc/100?u=${c.id}`,
    messages: Array.isArray(c.messages) ? c.messages : [],
    last: c.last || "",
    time: c.time || ""
  };
}

let contacts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [
  { id: "5521999990001", name: "Teca, a eleitora de Teste", avatar: "https://i.pravatar.cc/100?img=32", messages: [
    { from: "them", body: "Oi! Eu sou a Teca, vamos testar o robô? ", time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), type: "text" }
  ]},
  { id: "5521988880002", name: "Alline Oliveira", avatar: "https://i.pravatar.cc/100?img=15", messages: [] },
  { id: '5511999990003', name: 'Suporte da Maíra', avatar: 'https://i.pravatar.cc/100?img=8', messages: [], last: 'Como posso ajudar?', time: 'Seg' },
];

contacts = contacts.map(normalizeContact);

let activeId = contacts[0]?.id;
if (!contacts.find(c => c.id === activeId)) {
  activeId = contacts[0]?.id;
}

let config = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null") || {
  webhookUrl: "/webhook",
  method: "POST",
  payloadFormat: "custom",
  autoResponder: true
};

const contactListEl = $("contactList");
const messagesEl = $("messages");
const messageInputEl = $("messageInput");
const msgTypeEl = $("msgType");
const typingEl = $("typingIndicator");
const webhookUrlEl = $("webhookUrl");
const webhookMethodEl = $("webhookMethod");
const payloadFormatEl = $("payloadFormat");
const autoResponderEl = $("autoResponder");

if(webhookUrlEl) webhookUrlEl.value = config.webhookUrl;
if(webhookMethodEl) webhookMethodEl.value = config.method;
if(payloadFormatEl) payloadFormatEl.value = config.payloadFormat;
if(autoResponderEl) autoResponderEl.checked = config.autoResponder;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
function getActive() { return contacts.find(c=>c.id===activeId); }
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function addLog(type, data){
  const log = $("requestLog");
  if(!log) return;
  const t = new Date().toLocaleTimeString();
  const div = document.createElement("div");
  div.className = "log-entry";
  let textData = "";
  try {
    if(typeof data === 'string') textData = data;
    else textData = JSON.stringify(data, null, 2);
  } catch(e) {
    textData = String(data);
  }
  div.innerHTML = `<b>[${t}] ${type}</b><pre>${escapeHtml(textData)}</pre>`;
  log.prepend(div);
}

function renderContacts(filter=""){
  if(!contactListEl) return;
  contactListEl.innerHTML = "";
  const filtered = contacts.filter(c => 
    (c.name||"").toLowerCase().includes(filter.toLowerCase()) || 
    (c.id||"").includes(filter)
  );

  filtered.forEach(c=>{
    const lastMsg = c.messages?.[c.messages.length-1]?.body || c.last || "Toque para testar";
    const div = document.createElement("div");
    div.className = `contact ${c.id===activeId?"active":""}`;
    div.innerHTML = `<img src="${c.avatar}" class="avatar"><div class="contact-info"><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml(lastMsg).slice(0,35)}</span></div>`;
    div.onclick = ()=>{
      activeId=c.id; 
      renderContacts($("contactSearch")?.value || ""); 
      renderMessages();
      // MODO CELULAR: abre o chat
      document.body.classList.add('mobile-chat-active');
    };
    contactListEl.appendChild(div);
  });
}

function renderMessages(){
  const c = getActive(); if(!c) return;
  const nameEl = $("currentName");
  const avatarEl = $("currentAvatar");
  if(nameEl) nameEl.textContent = c.name;
  if(avatarEl) avatarEl.src = c.avatar;
  if(!messagesEl) return;
  messagesEl.innerHTML = "";
  (c.messages || []).forEach(m=>{
    const row = document.createElement("div");
    row.className = `msg-row ${m.from==="me"?"me":"them"}`;
    let inner = "";
    if(m.type==="image") inner = `<img src="${m.body}" style="max-width:240px;border-radius:8px"><p>${escapeHtml(m.caption||"")}</p>`;
    else if(m.type==="button") inner = `<p>${escapeHtml(m.body)}</p><div class="btns">${(m.buttons||[]).map(b=>`<button>${escapeHtml(b)}</button>`).join('')}</div>`;
    else inner = `<p>${escapeHtml(m.body||"")}</p>`;
    row.innerHTML = `<div class="bubble">${inner}<span class="time">${m.time||""}</span></div>`;
    messagesEl.appendChild(row);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
  save();
}

function buildPayload(contact, text, type){
  const base = { from: contact.id, pushName: contact.name, body: text, type, timestamp: Date.now() };
  if(config.payloadFormat==="baileys") return { key:{remoteJid:`${contact.id}@s.whatsapp.net`,fromMe:false}, message:{conversation:text}, pushName:contact.name };
  if(config.payloadFormat==="cloud") return { object:"whatsapp_business_account", entry:[{ changes:[{ value:{ messages:[{from:contact.id,text:{body:text},type}], contacts:[{profile:{name:contact.name}}] } }]}] };
  return base;
}

function parseReply(data){
  if(!data) return null;
  if(typeof data==="string") return { body:data, type:"text" };
  if(data.ok === true && !data.reply && !data.text && !data.message) {
    return { body: "⚠ Backend respondeu só {ok:true}. Verifique o botserver.js", type:"text" };
  }
  if(data.reply){
    if(typeof data.reply==="string") return { body:data.reply, type:"text" };
    if(data.reply.text || data.reply.imageUrl || data.reply.audioUrl){
      return { body: data.reply.text || data.reply.imageUrl || data.reply.audioUrl || " ", type: data.reply.type || (data.reply.imageUrl?"image": data.reply.audioUrl?"audio":"text"), buttons: data.reply.buttons, caption: data.reply.caption };
    }
  }
  if(data.text) return { body:data.text, type:"text" };
  if(data.message) return { body:data.message, type:"text" };
  return { body: JSON.stringify(data), type:"text" };
}

async function sendToBot(){
  const text = messageInputEl.value.trim(); if(!text) return;
  const type = msgTypeEl.value;
  const contact = getActive();
  if(!contact.messages) contact.messages = [];

  contact.messages.push({ from:"me", body:text, type, time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) });
  renderMessages();
  messageInputEl.value="";

  if(!config.autoResponder){ addLog("INFO","Auto-responder OFF"); return; }

  let url = config.webhookUrl;
  if(url.startsWith("/")) url = window.location.origin + url;

  const payload = buildPayload(contact, text, type);
  addLog(`OUT → ${url}`, payload);
  if(typingEl) typingEl.classList.remove("hidden");

  try{
    let res;
    if(config.method==="GET"){
      const qs = new URLSearchParams({ from:contact.id, body:text, pushName:contact.name }).toString();
      res = await fetch(`${url}?${qs}`);
    }else{
      res = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    }
    if(!res) throw new Error('Sem resposta - botserver offline?');
    if(!res.ok){
      const errorText = await res.text().catch(()=> res.statusText);
      throw new Error(`HTTP ${res.status} - ${errorText}`);
    }
    const textResp = await res.text();
    let data;
    try { data = JSON.parse(textResp); } catch { data = { reply: textResp }; }

    addLog("IN ← BOT", data);
    const parsed = parseReply(data);
    if(!parsed) throw new Error('Resposta vazia do bot');
    contact.messages.push({ from:"them", body:parsed.body, type:parsed.type, buttons:parsed.buttons, caption:parsed.caption, time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) });
    const statusEl = $("connectionStatus");
    if(statusEl) statusEl.innerHTML = `<span style="color:green">● Conectado ${res.status}</span>`;
  }catch(err){
    addLog("ERRO", err.message);
    contact.messages.push({ from:"them", body:`❌ Erro: ${err.message}. Rodou "node botserver.js"?`, type:"text", time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) });
    const statusEl = $("connectionStatus");
    if(statusEl) statusEl.innerHTML = `<span style="color:red">● ${err.message}</span>`;
  }finally{
    if(typingEl) typingEl.classList.add("hidden");
    renderMessages();
  }
}

const sendBtn = $("sendBtn");
if(sendBtn) sendBtn.onclick = sendToBot;
if(messageInputEl) messageInputEl.addEventListener("keydown", e=>{ if(e.key==="Enter") sendToBot(); });
const searchEl = $("contactSearch");
if(searchEl) searchEl.addEventListener("input", e=>renderContacts(e.target.value));
const addContactBtn = $("addContactBtn");
if(addContactBtn) addContactBtn.onclick = ()=>{
  const id = prompt("Número com DDD (ex: 5521999990001):"); if(!id) return;
  const name = prompt("Nome:", "Novo Contato") || "Novo Contato";
  contacts.unshift({ id, name, avatar:`https://i.pravatar.cc/100?u=${id}`, messages:[] });
  activeId=id; renderContacts(); renderMessages();
  document.body.classList.add('mobile-chat-active');
};
const clearChatBtn = $("clearChatBtn");
if(clearChatBtn) clearChatBtn.onclick = ()=>{ if(confirm("Limpar conversa?")){ getActive().messages=[]; renderMessages(); } };
document.querySelectorAll(".templates button").forEach(b=>b.onclick=()=>{ messageInputEl.value=b.dataset.msg; messageInputEl.focus(); });

const drawer=$("configDrawer"), overlay=$("overlay");
const openConfigBtn = $("openConfigBtn");
if(openConfigBtn) openConfigBtn.onclick=()=>{ drawer.classList.add("open"); overlay.classList.remove("hidden"); };
function closeDrawer(){ drawer.classList.remove("open"); overlay.classList.add("hidden"); }
const closeConfigBtn = $("closeConfigBtn");
if(closeConfigBtn) closeConfigBtn.onclick=closeDrawer; 
if(overlay) overlay.onclick=closeDrawer;

function updateConfig(){
  config.webhookUrl=webhookUrlEl.value.trim(); config.method=webhookMethodEl.value; config.payloadFormat=payloadFormatEl.value; config.autoResponder=autoResponderEl.checked; save();
}
if(webhookUrlEl) webhookUrlEl.onchange=updateConfig;
if(webhookMethodEl) webhookMethodEl.onchange=updateConfig;
if(payloadFormatEl) payloadFormatEl.onchange=updateConfig;
if(autoResponderEl) autoResponderEl.onchange=updateConfig;

const testBtn = $("testConnectionBtn");
if(testBtn) testBtn.onclick = async ()=>{
  updateConfig(); 
  const statusEl = $("connectionStatus");
  if(statusEl) statusEl.textContent="Testando...";
  try{
    let url = config.webhookUrl;
    if(url.startsWith("/")) url = window.location.origin + url;
    const healthUrl = url.replace("/webhook","/health");
    let res = await fetch(healthUrl).catch(()=>null);
    if(res && res.ok){ const d=await res.json(); if(statusEl) statusEl.innerHTML=`<span style="color:green">● OK ${JSON.stringify(d)}</span>`; addLog("TESTE HEALTH", d); return; }
    res = await fetch(url, { method: "POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({from:"teste",pushName:"Teste",body:"ping",type:"text"}) });
    const txt = await res.text(); if(statusEl) statusEl.innerHTML=`<span style="color:green">● Webhook ${res.status}</span>`; addLog("TESTE WEBHOOK", txt);
  }catch(e){ const statusEl = $("connectionStatus"); if(statusEl) statusEl.innerHTML=`<span style="color:red">● Falha ${e.message}</span>`; addLog("TESTE FALHA", e.message); }
};

const clearLogBtn = $("clearLogBtn");
if(clearLogBtn) clearLogBtn.onclick=()=>{ const l=$("requestLog"); if(l) l.innerHTML=""; };
const exportBtn = $("exportBtn");
if(exportBtn) exportBtn.onclick=()=>{
  const blob = new Blob([JSON.stringify(getActive(),null,2)], {type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`conversa-${activeId}.json`; a.click();
};

// BOTÃO VOLTAR CELULAR
const backBtn = $("backBtn");
if(backBtn) backBtn.onclick = () => document.body.classList.remove('mobile-chat-active');

// BOTÃO LIMPAR CACHE
const resetCacheBtn = $("resetCacheBtn");
if(resetCacheBtn) resetCacheBtn.onclick = () => {
  if(confirm("Apagar TODAS as conversas e resetar?")){
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONFIG_KEY);
    location.reload();
  }
};

function limparCacheFrontend() {
  if(confirm("Limpar todo cache e resetar contatos?")){
    localStorage.clear();
    sessionStorage.clear();
    location.reload(true);
  }
}

renderContacts(); renderMessages();