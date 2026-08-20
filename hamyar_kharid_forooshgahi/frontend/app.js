const API_BASE = (window.HAMYAR_API_BASE || localStorage.getItem("hamyar_api_base") || "http://127.0.0.1:8000/api").replace(/\/$/, "");
const TOKEN_KEY = "hamyar_auth_token";
const API_SETTINGS_KEY = "hamyar_api_settings";

const app = document.getElementById("app");
const authBtn = document.getElementById("authBtn");
const logoutBtn = document.getElementById("logoutBtn");
const sessionLabel = document.getElementById("sessionLabel");

let session = { user: null, store: null };

function getToken(){ return localStorage.getItem(TOKEN_KEY) || ""; }
function setToken(token){ if(token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); }
function money(v){ return Number(v || 0).toLocaleString("fa-IR") + " تومان"; }
function escapeHtml(s){ return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function toast(msg){
  const el=document.getElementById("toast");
  el.textContent=msg; el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2400);
}
function nav(path){ location.hash = path; }
function route(){ return location.hash.replace(/^#\/?/, "") || "home"; }
function saveApiSettings(value){ localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(value)); }
function loadApiSettings(){
  try { return JSON.parse(localStorage.getItem(API_SETTINGS_KEY) || "{}"); } catch { return {}; }
}

async function api(path, options = {}){
  const headers = new Headers(options.headers || {});
  if(options.json !== undefined){ headers.set("Content-Type", "application/json"); options.body = JSON.stringify(options.json); }
  const token = getToken();
  if(token) headers.set("Authorization", `Token ${token}`);
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {...options, headers});
  } catch (err) {
    throw new Error("ارتباط با سرور برقرار نشد. مطمئن شوید Backend Django در حال اجراست.");
  }
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {detail: text}; }
  if(!response.ok){
    const message = extractApiError(data) || `خطای سرور (${response.status})`;
    if(response.status === 401 && path !== "/auth/login/"){ clearSession(false); }
    throw new Error(message);
  }
  return data;
}

function extractApiError(data){
  if(!data) return "";
  if(typeof data === "string") return data;
  if(data.detail) return String(data.detail);
  const parts=[];
  for(const [key,value] of Object.entries(data)){
    const vals=Array.isArray(value)?value:[value];
    parts.push(`${key}: ${vals.map(v=>typeof v === "object" ? JSON.stringify(v) : String(v)).join(" ")}`);
  }
  return parts.join(" | ");
}

async function refreshSession(){
  if(!getToken()){ session={user:null,store:null}; updateHeader(); return; }
  try {
    const data=await api("/auth/me/");
    session={user:data.user || null, store:data.store || null};
  } catch {
    clearSession(false);
    session={user:null,store:null};
  }
  updateHeader();
}
function clearSession(showToast=true){
  setToken(""); session={user:null,store:null}; updateHeader();
  if(showToast) toast("از حساب خارج شدید.");
}
async function doLogout(){
  try { if(getToken()) await api("/auth/logout/", {method:"POST"}); } catch {}
  clearSession(true); nav("home");
}
logoutBtn.addEventListener("click", doLogout);

function updateHeader(){
  const u=session.user;
  if(u){
    sessionLabel.textContent = u.role === "store" ? `فروشگاه: ${session.store?.name || ""}` : `سلام ${u.full_name || u.email || ""}`;
    logoutBtn.hidden=false; authBtn.hidden=true;
  }else{
    sessionLabel.textContent=""; logoutBtn.hidden=true; authBtn.hidden=false;
  }
}
function layout(content){ app.innerHTML=content; }

function formatDateTime(value){
  if(!value) return "";
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return String(value);
  const now=new Date();
  const sameDay=d.toDateString()===now.toDateString();
  if(sameDay) return "امروز";
  const diff=Math.floor((now-d)/86400000);
  if(diff===1) return "دیروز";
  return d.toLocaleDateString("fa-IR");
}

function normalizeProduct(p){
  return {
    id:p.id, storeId:p.store_id, storeName:p.store_name, name:p.name, category:p.category,
    price:Number(p.price||0), inventory:Number(p.inventory||0), unit:p.unit || "عدد", updated:formatDateTime(p.updated)
  };
}
function normalizeStore(s){
  return {
    id:s.id, name:s.name, owner:s.owner || "", phone:s.phone || s.phone_number || "", address:s.address,
    lat:Number(s.lat ?? s.latitude), lng:Number(s.lng ?? s.longitude), status:s.status || "فعال",
    description:s.description || "", workingHours:s.working_hours || "", productCount:Number(s.product_count||0)
  };
}

async function fetchProducts(params={}){
  const q=new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{ if(v!==undefined && v!==null && v!=="") q.set(k,v); });
  const data=await api(`/products/${q.toString()?`?${q.toString()}`:""}`);
  return Array.isArray(data) ? data.map(normalizeProduct) : (data.results || []).map(normalizeProduct);
}
async function fetchStores(params={}){
  const q=new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{ if(v!==undefined && v!==null && v!=="") q.set(k,v); });
  const data=await api(`/stores/${q.toString()?`?${q.toString()}`:""}`);
  return Array.isArray(data) ? data.map(normalizeStore) : (data.results || []).map(normalizeStore);
}
async function fetchProduct(id){ return normalizeProduct(await api(`/products/${id}/`)); }
async function fetchProductStores(id){ return api(`/products/${id}/stores/`); }
async function fetchStore(id){ return normalizeStore(await api(`/stores/${id}/`)); }
async function fetchStoreProducts(storeId){ return fetchProducts({store:storeId}); }
async function fetchStats(){ return api("/stats/"); }

function productCard(p){
  return `<div class="card product-card">
    <div class="split"><div class="product-icon">🛒</div><span class="${p.inventory>5?'badge badge-success':'badge badge-warning'}">${p.inventory>0?`موجودی ${p.inventory}`:"ناموجود"}</span></div>
    <div><h3>${escapeHtml(p.name)}</h3><div class="muted small">${escapeHtml(p.category)} · ${escapeHtml(p.storeName||"")}</div></div>
    <div class="card-row"><span class="price">${money(p.price)}</span><a href="#/product/${p.id}" class="btn btn-secondary">جزئیات</a></div>
  </div>`;
}

function wazeUrl(s){ return `https://www.waze.com/ul?ll=${encodeURIComponent(s.lat)},${encodeURIComponent(s.lng)}&navigate=yes`; }
function neshanUrl(s){ return `https://nshn.ir/maps?destination=${encodeURIComponent(s.lat)},${encodeURIComponent(s.lng)}&type=drive`; }
async function navigation(storeId, provider){
  const win=window.open("about:blank", "_blank", "noopener");
  try {
    const data=await api(`/stores/${storeId}/navigation/?provider=${encodeURIComponent(provider)}`);
    if(win) win.location.href=data.url; else window.location.href=data.url;
  } catch(err){ if(win) win.close(); toast(err.message); }
}

async function home(){
  layout(`<div class="loading">در حال بارگذاری اطلاعات سامانه...</div>`);
  try{
    const [stats, products]=await Promise.all([fetchStats(), fetchProducts({ordering:"-updated_at"})]);
    layout(`
    <section class="hero">
      <div>
        <span class="badge" style="background:rgba(255,255,255,.12);color:#fff">سامانه اشتراک اطلاعات مکانی و موجودی فروشگاه‌ها و کالاها</span>
        <h1>کالای موردنظرت را پیدا کن، نزدیک‌ترین فروشگاه را ببین.</h1>
        <p>نام کالا یا فروشگاه را جست‌وجو کن و اطلاعات موجودی، قیمت، مشخصات فروشگاه و مسیر دسترسی را یکجا ببین.</p>
        <div class="hero-search"><div class="search-row"><input id="homeSearch" class="input" placeholder="مثلاً برنج، کابل USB-C یا نام فروشگاه"><button class="btn btn-primary" id="homeSearchBtn">جستجو</button></div></div>
      </div>
      <div class="hero-card"><h3>وضعیت سامانه</h3><div class="stat-list">
        <div class="stat"><span>فروشگاه‌های ثبت‌شده</span><strong>${stats.stores ?? 0}</strong></div>
        <div class="stat"><span>اقلام قابل جست‌وجو</span><strong>${stats.products ?? 0}</strong></div>
        <div class="stat"><span>وضعیت سرویس</span><strong>${escapeHtml(stats.status || "فعال")}</strong></div>
      </div></div>
    </section>
    <section class="section"><div class="section-head"><div><h2>جستجوی سریع</h2><p>دو مسیر اصلی برای مشتری</p></div></div><div class="grid grid-2">
      <div class="card"><span class="tag">برای مشتری</span><h3>جستجوی کالا</h3><p class="muted">کالا را پیدا کن و ببین در کدام فروشگاه موجود است.</p><a class="btn btn-secondary" href="#/products">مشاهده کالاها</a></div>
      <div class="card"><span class="tag">برای مشتری</span><h3>جستجوی فروشگاه</h3><p class="muted">اطلاعات تماس، آدرس و گزینه مسیریابی فروشگاه را ببین.</p><a class="btn btn-secondary" href="#/stores">مشاهده فروشگاه‌ها</a></div>
    </div></section>
    <section class="section"><div class="section-head"><div><h2>آخرین کالاهای ثبت‌شده</h2><p>اطلاعات واقعی از Backend</p></div><a href="#/products" class="btn btn-ghost">همه کالاها</a></div><div class="grid grid-3">${products.slice(0,3).map(productCard).join("") || `<div class="empty" style="grid-column:1/-1">هنوز کالایی ثبت نشده است.</div>`}</div></section>`);
    document.getElementById("homeSearchBtn").onclick=()=>{ const q=document.getElementById("homeSearch").value.trim(); if(!q){toast("عبارت جست‌وجو را وارد کنید.");return;} localStorage.setItem("lastSearch",q); nav("products"); };
  }catch(err){ layout(`<div class="empty"><h3>اتصال به سامانه برقرار نشد.</h3><p>${escapeHtml(err.message)}</p><button class="btn btn-primary" id="retryHome">تلاش مجدد</button></div>`); document.getElementById("retryHome").onclick=home; }
}

async function productsPage(){
  const q0=localStorage.getItem("lastSearch")||"";
  layout(`<div class="page-title"><h1>جستجوی کالا</h1><p>کالا را نام، دسته‌بندی یا فروشگاه جست‌وجو کنید.</p></div><div class="toolbar"><input id="productQuery" class="input" placeholder="نام کالا..." value="${escapeHtml(q0)}"><select id="categoryFilter" class="select"><option value="">همه دسته‌بندی‌ها</option></select><button id="clearProduct" class="btn btn-ghost">پاک‌کردن</button></div><div id="productResults" class="grid grid-3"><div class="loading">در حال جست‌وجو...</div></div>`);
  let timer=null;
  try {
    const categorySource=await fetchProducts({});
    const cats=[...new Set(categorySource.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fa"));
    document.getElementById("categoryFilter").insertAdjacentHTML("beforeend",cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join(""));
  } catch {}
  const renderResults=async()=>{
    const q=document.getElementById("productQuery").value.trim(); const category=document.getElementById("categoryFilter").value.trim();
    localStorage.setItem("lastSearch",q);
    try{
      const params={search:q}; if(category) params.category=category;
      const arr=await fetchProducts(params);
      document.getElementById("productResults").innerHTML=arr.length?arr.map(productCard).join(""):`<div class="empty" style="grid-column:1/-1">کالایی با این مشخصات پیدا نشد.</div>`;
    }catch(err){ document.getElementById("productResults").innerHTML=`<div class="empty" style="grid-column:1/-1">${escapeHtml(err.message)}</div>`; }
  };
  document.getElementById("productQuery").oninput=()=>{clearTimeout(timer);timer=setTimeout(renderResults,300);};
  document.getElementById("categoryFilter").oninput=()=>{clearTimeout(timer);timer=setTimeout(renderResults,300);};
  document.getElementById("clearProduct").onclick=()=>{document.getElementById("productQuery").value="";document.getElementById("categoryFilter").value="";renderResults();};
  renderResults();
}

function storeCard(s){
  return `<div class="card"><div class="split"><span class="tag">📍 فروشگاه</span><span class="badge badge-success">${escapeHtml(s.status)}</span></div><h3 style="margin-top:12px">${escapeHtml(s.name)}</h3><p class="muted">${escapeHtml(s.description||"")}</p><div class="info-list">
    <div class="info-item"><span>آدرس</span><strong>${escapeHtml(s.address)}</strong></div><div class="info-item"><span>تلفن</span><strong>${escapeHtml(s.phone)}</strong></div><div class="info-item"><span>تعداد اقلام</span><strong>${s.productCount}</strong></div></div>
    <div class="card-row"><a class="btn btn-secondary" href="#/store/${s.id}">اطلاعات فروشگاه</a><button class="btn btn-primary nav-btn" data-id="${s.id}" data-provider="waze">ویز</button><button class="btn btn-secondary nav-btn" data-id="${s.id}" data-provider="neshan">نشان</button></div></div>`;
}

async function storesPage(){
  layout(`<div class="page-title"><h1>جستجوی فروشگاه</h1><p>فروشگاه موردنظر را پیدا و گزینه مسیریابی را انتخاب کنید.</p></div><div class="toolbar"><input id="storeQuery" class="input" placeholder="نام فروشگاه، آدرس یا تلفن"><select id="storeStatus" class="select"><option value="">همه وضعیت‌ها</option><option value="true">فعال</option></select><button id="clearStore" class="btn btn-ghost">پاک‌کردن</button></div><div id="storeResults" class="grid grid-2"><div class="loading">در حال بارگذاری...</div></div>`);
  const draw=async()=>{
    const q=document.getElementById("storeQuery").value.trim(); const status=document.getElementById("storeStatus").value;
    try{
      const params={search:q}; if(status) params.is_active=status;
      const arr=await fetchStores(params);
      document.getElementById("storeResults").innerHTML=arr.length?arr.map(storeCard).join(""):`<div class="empty" style="grid-column:1/-1">فروشگاهی پیدا نشد.</div>`;
      document.querySelectorAll(".nav-btn").forEach(btn=>btn.onclick=()=>navigation(btn.dataset.id,btn.dataset.provider));
    }catch(err){document.getElementById("storeResults").innerHTML=`<div class="empty" style="grid-column:1/-1">${escapeHtml(err.message)}</div>`;}
  };
  document.getElementById("storeQuery").oninput=draw; document.getElementById("storeStatus").onchange=draw; document.getElementById("clearStore").onclick=()=>{document.getElementById("storeQuery").value="";document.getElementById("storeStatus").value="";draw();};
  draw();
}

async function productDetail(id){
  layout(`<div class="loading">در حال بارگذاری اطلاعات کالا...</div>`);
  try{
    const p=await fetchProduct(id); const stores=await fetchProductStores(id); const storeInfo=stores[0] || null;
    const s=storeInfo ? {id:storeInfo.store_id,name:storeInfo.store_name,address:storeInfo.address,lat:Number(storeInfo.latitude),lng:Number(storeInfo.longitude),phone:""} : null;
    layout(`<div class="page-title"><h1>جزئیات کالا</h1><p>اطلاعات ثبت‌شده کالا در سامانه</p></div><div class="detail"><div class="detail-panel"><div class="split"><span class="tag">${escapeHtml(p.category)}</span><span class="${p.inventory>5?'badge badge-success':p.inventory>0?'badge badge-warning':'badge badge-danger'}">${p.inventory>0?`${p.inventory} ${escapeHtml(p.unit)} موجود`:"ناموجود"}</span></div><h2 style="margin-bottom:4px">${escapeHtml(p.name)}</h2><div class="price">${money(p.price)}</div><div class="info-list"><div class="info-item"><span>فروشگاه</span><strong>${s?`<a href="#/store/${s.id}">${escapeHtml(s.name)}</a>`:"-"}</strong></div><div class="info-item"><span>به‌روزرسانی موجودی</span><strong>${escapeHtml(p.updated)}</strong></div><div class="info-item"><span>واحد</span><strong>${escapeHtml(p.unit)}</strong></div></div><div class="notice">این صفحه فقط اطلاعات موجودی و مکان فروشگاه را نمایش می‌دهد و خرید آنلاین در دامنه پروژه نیست.</div></div><div class="detail-panel"><h3>موقعیت فروشگاه</h3><div class="map-placeholder"><div><div class="map-pin">📍</div><strong>${escapeHtml(s?.name||"فروشگاه")}</strong><div>${escapeHtml(s?.address||"")}</div><div class="small">نقشه داخل سامانه پیاده‌سازی نشده است.</div></div></div><div class="card-row" style="margin-top:12px">${s?`<a href="#/store/${s.id}" class="btn btn-ghost">صفحه فروشگاه</a><button data-id="${s.id}" data-provider="waze" class="btn btn-primary nav-btn">مسیریابی با ویز</button><button data-id="${s.id}" data-provider="neshan" class="btn btn-secondary nav-btn">مسیریابی با نشان</button>`:""}</div></div></div>`);
    document.querySelectorAll(".nav-btn").forEach(btn=>btn.onclick=()=>navigation(btn.dataset.id,btn.dataset.provider));
  }catch(err){layout(`<div class="empty">${escapeHtml(err.message)}</div>`);}
}

async function storeDetail(id){
  layout(`<div class="loading">در حال بارگذاری اطلاعات فروشگاه...</div>`);
  try{
    const [s,products]=await Promise.all([fetchStore(id),fetchStoreProducts(id)]);
    layout(`<div class="page-title"><h1>${escapeHtml(s.name)}</h1><p>${escapeHtml(s.description||"")}</p></div><div class="detail"><div class="detail-panel"><div class="split"><span class="tag">فروشگاه</span><span class="badge badge-success">${escapeHtml(s.status)}</span></div><div class="info-list"><div class="info-item"><span>مدیر</span><strong>${escapeHtml(s.owner)}</strong></div><div class="info-item"><span>تلفن</span><strong>${escapeHtml(s.phone)}</strong></div><div class="info-item"><span>آدرس</span><strong>${escapeHtml(s.address)}</strong></div></div><div class="card-row"><button data-id="${s.id}" data-provider="waze" class="btn btn-primary nav-btn">مسیریابی با ویز</button><button data-id="${s.id}" data-provider="neshan" class="btn btn-secondary nav-btn">مسیریابی با نشان</button></div></div><div class="detail-panel"><div class="section-head"><div><h3>کالاهای این فروشگاه</h3><p>${products.length} قلم</p></div></div><div class="stack">${products.length?products.map(p=>`<div class="card-row" style="padding:9px 0;border-bottom:1px solid var(--border)"><div><strong>${escapeHtml(p.name)}</strong><div class="small muted">${escapeHtml(p.category)}</div></div><div><span class="price">${money(p.price)}</span> <span class="badge ${p.inventory>5?'badge-success':p.inventory?'badge-warning':'badge-danger'}">${p.inventory} موجود</span></div></div>`).join(""):`<div class="empty">کالایی ثبت نشده است.</div>`}</div></div></div>`);
    document.querySelectorAll(".nav-btn").forEach(btn=>btn.onclick=()=>navigation(btn.dataset.id,btn.dataset.provider));
  }catch(err){layout(`<div class="empty">${escapeHtml(err.message)}</div>`);}
}

function loginPage(){
  layout(`<div class="auth-wrap"><div class="auth-card"><div class="page-title"><h1>ورود</h1><p>به عنوان مشتری یا فروشگاه وارد شوید.</p></div><form id="loginForm" class="stack"><div class="form-group"><label>ایمیل</label><input class="input" id="loginEmail" type="email" required placeholder="example@mail.com"></div><div class="form-group"><label>رمز عبور</label><input class="input" id="loginPassword" type="password" required></div><button class="btn btn-primary">ورود</button></form><div style="margin-top:16px"><a class="btn btn-ghost" href="#/register">ثبت‌نام مشتری</a> <a class="btn btn-secondary" href="#/register-store">ثبت فروشگاه</a></div></div></div>`);
  document.getElementById("loginForm").onsubmit=async e=>{
    e.preventDefault();
    try{
      const data=await api("/auth/login/",{method:"POST",json:{email:document.getElementById("loginEmail").value.trim(),password:document.getElementById("loginPassword").value}});
      setToken(data.token); session={user:data.user,store:data.store||null}; updateHeader(); toast("ورود با موفقیت انجام شد."); nav(session.user.role==="store"?"store-dashboard":"home");
    }catch(err){toast(err.message);}
  };
}

function registerPage(){
  layout(`<div class="auth-wrap"><div class="auth-card"><div class="page-title"><h1>ثبت‌نام مشتری</h1><p>حساب مشتری برای جست‌وجو و مشاهده اطلاعات فروشگاه‌ها</p></div><form id="registerForm" class="stack"><div class="form-group"><label>نام و نام خانوادگی</label><input class="input" id="rName" required></div><div class="form-group"><label>ایمیل</label><input class="input" id="rEmail" type="email" required></div><div class="form-group"><label>رمز عبور</label><input class="input" id="rPw" type="password" minlength="6" required></div><button class="btn btn-primary">ایجاد حساب</button></form></div></div>`);
  document.getElementById("registerForm").onsubmit=async e=>{
    e.preventDefault();
    try{
      const data=await api("/auth/register/",{method:"POST",json:{full_name:document.getElementById("rName").value.trim(),email:document.getElementById("rEmail").value.trim(),password:document.getElementById("rPw").value}});
      setToken(data.token); session={user:data.user,store:null}; updateHeader(); toast("حساب شما ساخته شد."); nav("home");
    }catch(err){toast(err.message);}
  };
}

function registerStorePage(){
  layout(`<div class="auth-wrap" style="max-width:720px"><div class="auth-card"><div class="page-title"><h1>ثبت فروشگاه</h1><p>بعد از ثبت، از پنل فروشگاه می‌توانید اطلاعات کالا و موجودی را مدیریت کنید.</p></div><form id="storeRegisterForm" class="form-grid"><div class="form-group"><label>نام فروشگاه</label><input class="input" id="sName" required></div><div class="form-group"><label>نام مدیر</label><input class="input" id="sOwner" required></div><div class="form-group"><label>ایمیل مدیر</label><input class="input" id="sEmail" type="email" required></div><div class="form-group"><label>رمز عبور</label><input class="input" id="sPw" type="password" minlength="6" required></div><div class="form-group"><label>تلفن</label><input class="input" id="sPhone" required></div><div class="form-group"><label>آدرس</label><input class="input" id="sAddress" required></div><div class="form-group"><label>Latitude</label><input class="input" id="sLat" type="number" step="any" value="29.6203" required></div><div class="form-group"><label>Longitude</label><input class="input" id="sLng" type="number" step="any" value="52.5311" required></div><div class="form-group full"><label>توضیحات</label><textarea class="textarea" id="sDesc" rows="3"></textarea></div><div class="form-group full"><button class="btn btn-primary">ثبت فروشگاه و ورود به پنل</button></div></form></div></div>`);
  document.getElementById("storeRegisterForm").onsubmit=async e=>{
    e.preventDefault();
    try{
      const data=await api("/store/register/",{method:"POST",json:{store_name:document.getElementById("sName").value.trim(),owner_name:document.getElementById("sOwner").value.trim(),email:document.getElementById("sEmail").value.trim(),password:document.getElementById("sPw").value,phone:document.getElementById("sPhone").value.trim(),address:document.getElementById("sAddress").value.trim(),lat:document.getElementById("sLat").value,lng:document.getElementById("sLng").value,description:document.getElementById("sDesc").value.trim(),working_hours:""}});
      setToken(data.token); session={user:data.user,store:data.store||null}; updateHeader(); toast("فروشگاه ثبت شد."); nav("store-dashboard");
    }catch(err){toast(err.message);}
  };
}

function requireStore(){
  if(!session.user || session.user.role!=="store"){ toast("برای ورود به پنل فروشگاه باید با حساب فروشگاه وارد شوید."); nav("login"); return false; }
  return true;
}

async function storeDashboard(tab="overview"){
  if(!requireStore()) return;
  layout(`<div class="dashboard"><aside class="sidebar"><h3 style="padding:0 10px">پنل ${escapeHtml(session.store?.name||"")}</h3><a class="${tab==='overview'?'active':''}" href="#/store-dashboard">نمای کلی</a><a class="${tab==='products'?'active':''}" href="#/store-dashboard/products">افزودن کالا</a><a class="${tab==='inventory'?'active':''}" href="#/store-dashboard/inventory">مدیریت موجودی</a><a class="${tab==='store-info'?'active':''}" href="#/store-dashboard/store-info">اطلاعات فروشگاه</a><a class="${tab==='import'?'active':''}" href="#/store-dashboard/import">ورود فایل / API</a></aside><section class="dashboard-main" id="dashboardMain"><div class="loading">در حال بارگذاری...</div></section></div>`);
  try{
    const s=session.store || normalizeStore(await api("/my-store/")); session.store=s;
    const myProductsData=await api("/my-products/");
    const products=Array.isArray(myProductsData) ? myProductsData : (myProductsData.results || []);
    const normalizedProducts=products.map(p=>({id:p.id,storeId:s.id,storeName:s.name,name:p.name,category:p.category,price:Number(p.price||0),inventory:Number(p.inventory||0),unit:p.unit||"عدد",updated:""}));
    const main=document.getElementById("dashboardMain");
    if(tab==="overview") main.innerHTML=dashboardOverview(s,normalizedProducts);
    if(tab==="products") main.innerHTML=productAddForm();
    if(tab==="inventory") { const invData=await api("/my-inventory/"); const invArr=(invData.results||invData).map(x=>({id:x.id,product_id:x.product_id,product_name:x.product_name,category:x.category,price:Number(x.price||0),unit:x.unit,quantity:Number(x.quantity||0),last_update:x.last_update})); main.innerHTML=inventoryView(invArr); }
    if(tab==="store-info") main.innerHTML=storeInfoForm(s);
    if(tab==="import") main.innerHTML=await importView();
    bindDashboard(tab,s);
  }catch(err){ document.getElementById("dashboardMain").innerHTML=`<div class="empty">${escapeHtml(err.message)}</div>`; }
}

function dashboardOverview(s,products){
  const total=products.length, inStock=products.filter(p=>p.inventory>0).length, low=products.filter(p=>p.inventory>0&&p.inventory<=5).length;
  return `<div class="page-title"><h1>نمای کلی پنل</h1><p>مدیریت اطلاعات فروشگاه و موجودی کالا</p></div><div class="kpis"><div class="kpi"><span>کل کالاها</span><strong>${total}</strong></div><div class="kpi"><span>دارای موجودی</span><strong>${inStock}</strong></div><div class="kpi"><span>موجودی کم</span><strong>${low}</strong></div><div class="kpi"><span>وضعیت فروشگاه</span><strong>${escapeHtml(s.status)}</strong></div></div><div class="section"><div class="section-head"><div><h2>اطلاعات فروشگاه</h2><p>${escapeHtml(s.address)}</p></div><a href="#/store-dashboard/store-info" class="btn btn-ghost">ویرایش</a></div><div class="card"><div class="grid grid-2"><div><strong>مدیر:</strong> ${escapeHtml(s.owner)}</div><div><strong>تلفن:</strong> ${escapeHtml(s.phone)}</div><div><strong>Latitude:</strong> ${s.lat}</div><div><strong>Longitude:</strong> ${s.lng}</div></div></div></div>`;
}
function productAddForm(){
  return `<div class="page-title"><h1>افزودن کالا</h1><p>ورود دستی اطلاعات یک قلم کالا</p></div><div class="card"><form id="addProductForm" class="form-grid"><div class="form-group"><label>نام کالا</label><input id="pName" class="input" required></div><div class="form-group"><label>دسته‌بندی</label><input id="pCat" class="input" required></div><div class="form-group"><label>قیمت</label><input id="pPrice" class="input" type="number" min="0" required></div><div class="form-group"><label>موجودی</label><input id="pInventory" class="input" type="number" min="0" required></div><div class="form-group"><label>واحد</label><select id="pUnit" class="select"><option>عدد</option><option>بسته</option><option>کیلو</option><option>لیتر</option><option>کیسه</option></select></div><div class="form-group full"><button class="btn btn-primary">ثبت کالا</button></div></form></div>`;
}
function inventoryView(products){
  return `<div class="page-title"><h1>مدیریت موجودی</h1><p>ویرایش سریع تعداد موجودی کالاها</p></div><div class="table-wrap"><table><thead><tr><th>کالا</th><th>دسته‌بندی</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>${products.map(p=>`<tr><td>${escapeHtml(p.product_name)}</td><td>${escapeHtml(p.category)}</td><td>${money(p.price)}</td><td><input class="input inventory-input" data-id="${p.id}" value="${p.quantity}" type="number" min="0" style="width:100px"></td><td><span class="badge ${p.quantity>5?'badge-success':p.quantity?'badge-warning':'badge-danger'}">${p.quantity>5?'عادی':p.quantity?'کم':'ناموجود'}</span></td><td><button class="btn btn-secondary save-inventory" data-id="${p.id}">ذخیره</button></td></tr>`).join("")}</tbody></table></div>`;
}
function storeInfoForm(s){
  return `<div class="page-title"><h1>اطلاعات فروشگاه</h1><p>ویرایش اطلاعات پایه و موقعیت فروشگاه</p></div><div class="card"><form id="storeInfoForm" class="form-grid"><div class="form-group"><label>نام فروشگاه</label><input id="iName" class="input" value="${escapeHtml(s.name)}" required></div><div class="form-group"><label>مدیر</label><input id="iOwner" class="input" value="${escapeHtml(s.owner)}" required></div><div class="form-group"><label>تلفن</label><input id="iPhone" class="input" value="${escapeHtml(s.phone)}" required></div><div class="form-group"><label>آدرس</label><input id="iAddress" class="input" value="${escapeHtml(s.address)}" required></div><div class="form-group"><label>Latitude</label><input id="iLat" class="input" type="number" step="any" value="${s.lat}" required></div><div class="form-group"><label>Longitude</label><input id="iLng" class="input" type="number" step="any" value="${s.lng}" required></div><div class="form-group full"><label>توضیحات</label><textarea id="iDesc" class="textarea" rows="4">${escapeHtml(s.description||"")}</textarea></div><div class="form-group full"><button class="btn btn-primary">ذخیره اطلاعات</button></div></form></div>`;
}
async function importView(){
  const settings=loadApiSettings(); let keyData=null;
  try{ keyData=await api("/inventory/api-key/"); }catch{}
  return `<div class="page-title"><h1>ورود اطلاعات موجودی</h1><p>سه روش ورودی موردنیاز پروژه در رابط کاربری</p></div><div class="grid grid-3"><div class="card"><h3>ورود دستی</h3><p class="muted">برای یک یا چند کالا، از فرم افزودن کالا استفاده کنید.</p><a class="btn btn-secondary" href="#/store-dashboard/products">فرم افزودن کالا</a></div><div class="card"><h3>TXT / Excel</h3><p class="muted">فایل داده را انتخاب کنید و اطلاعات را مستقیماً به Backend ارسال کنید.</p><div class="file-box"><input id="inventoryFile" type="file" accept=".txt,.csv,.xlsx,.xls,.xlsm"><label for="inventoryFile" class="btn btn-primary">انتخاب فایل</label><div id="fileName" class="small muted" style="margin-top:8px">فایلی انتخاب نشده است.</div></div><div id="filePreview" class="import-preview"></div></div><div class="card"><h3>API</h3><p class="muted">اتصال واقعی به Inventory API فروشگاه</p><div class="form-group"><label>API Endpoint</label><input id="apiEndpoint" class="input" value="${escapeHtml(settings.endpoint || `${API_BASE}/inventory/api-ingest/`)}"></div><div class="form-group" style="margin-top:10px"><label>API Key</label><input id="apiKey" class="input" value="${escapeHtml(keyData?.key || settings.key || "")}"></div><div class="card-row" style="margin-top:10px"><button id="saveApi" class="btn btn-secondary">ذخیره تنظیمات</button><button id="rotateApi" class="btn btn-ghost">صدور کلید جدید</button></div><div id="apiStatus" class="small muted" style="margin-top:8px"></div></div></div>`;
}

function bindDashboard(tab,s){
  if(tab==="products"){
    document.getElementById("addProductForm").onsubmit=async e=>{
      e.preventDefault();
      try{
        await api("/my-products/",{method:"POST",json:{name:document.getElementById("pName").value.trim(),category:document.getElementById("pCat").value.trim(),price:document.getElementById("pPrice").value,inventory:document.getElementById("pInventory").value,unit:document.getElementById("pUnit").value}});
        toast("کالا اضافه شد."); nav("store-dashboard/inventory");
      }catch(err){toast(err.message);}
    };
  }
  if(tab==="inventory"){
    document.querySelectorAll(".save-inventory").forEach(btn=>btn.onclick=async()=>{
      const id=btn.dataset.id, inp=document.querySelector(`.inventory-input[data-id="${id}"]`);
      try{ await api(`/my-inventory/${id}/`,{method:"PATCH",json:{quantity:Math.max(0,Number(inp.value)||0)}}); toast("موجودی ذخیره شد."); storeDashboard("inventory"); }catch(err){toast(err.message);}
    });
  }
  if(tab==="store-info"){
    document.getElementById("storeInfoForm").onsubmit=async e=>{
      e.preventDefault();
      try{
        const data=await api("/my-store/",{method:"PATCH",json:{name:document.getElementById("iName").value.trim(),owner_name:document.getElementById("iOwner").value.trim(),phone_number:document.getElementById("iPhone").value.trim(),address:document.getElementById("iAddress").value.trim(),latitude:document.getElementById("iLat").value,longitude:document.getElementById("iLng").value,working_hours:"",description:document.getElementById("iDesc").value.trim()}});
        session.store=normalizeStore(data); session.user.full_name=session.store.owner; updateHeader(); toast("اطلاعات فروشگاه ذخیره شد."); storeDashboard("store-info");
      }catch(err){toast(err.message);}
    };
  }
  if(tab==="import"){
    const fileInput=document.getElementById("inventoryFile");
    fileInput.onchange=async e=>{
      const file=e.target.files[0]; if(!file) return;
      document.getElementById("fileName").textContent=`${file.name} — ${(file.size/1024).toFixed(1)} KB`;
      const preview=document.getElementById("filePreview"); preview.innerHTML=`<div class="notice">در حال ارسال فایل به Backend...</div>`;
      const fd=new FormData(); fd.append("file",file);
      try{
        const data=await api("/inventory/import/",{method:"POST",body:fd});
        preview.innerHTML=`<div class="notice">پردازش شد: ${data.log?.processed_rows ?? 0} ردیف موفق، ${data.log?.failed_rows ?? 0} ردیف ناموفق.</div>${data.errors?.length?`<pre style="white-space:pre-wrap;font-size:12px;background:#fafbfe;padding:12px;border-radius:12px;border:1px solid var(--border);max-height:200px;overflow:auto">${escapeHtml(JSON.stringify(data.errors,null,2))}</pre>`:""}`;
      }catch(err){ preview.innerHTML=`<div class="notice">خطا: ${escapeHtml(err.message)}</div>`; }
    };
    document.getElementById("saveApi").onclick=()=>{ saveApiSettings({endpoint:document.getElementById("apiEndpoint").value.trim(),key:document.getElementById("apiKey").value.trim()}); toast("تنظیمات API ذخیره شد."); };
    document.getElementById("rotateApi").onclick=async()=>{
      try{ const data=await api("/inventory/api-key/",{method:"POST"}); document.getElementById("apiKey").value=data.key; saveApiSettings({endpoint:document.getElementById("apiEndpoint").value.trim(),key:data.key}); document.getElementById("apiStatus").textContent="کلید جدید صادر شد."; toast("API Key جدید صادر شد."); }
      catch(err){toast(err.message);}
    };
  }
}

async function render(){
  updateHeader();
  const r=route().split("/");
  try{
    if(r[0]==="home") await home();
    else if(r[0]==="products") await productsPage();
    else if(r[0]==="stores") await storesPage();
    else if(r[0]==="product" && r[1]) await productDetail(r[1]);
    else if(r[0]==="store" && r[1]) await storeDetail(r[1]);
    else if(r[0]==="login") loginPage();
    else if(r[0]==="register") registerPage();
    else if(r[0]==="register-store") registerStorePage();
    else if(r[0]==="store-dashboard") await storeDashboard(r[1]||"overview");
    else await home();
  }catch(err){ layout(`<div class="empty">${escapeHtml(err.message)}</div>`); }
}

window.addEventListener("hashchange", render);
(async()=>{ await refreshSession(); await render(); })();
