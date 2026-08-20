const STORAGE_KEY = "bazaryab_frontend_v1";

const seed = {
  users: [
    {id: 1, name: "کاربر نمونه", email: "user@example.com", password: "123456", role: "customer"},
  ],
  stores: [
    {id: 1, name: "فروشگاه مرکزی شیراز", owner: "علی رضایی", phone: "071-12345678", address: "شیراز، بلوار چمران", lat: 29.6203, lng: 52.5311, status: "فعال", description: "فروشگاه عمومی با تنوع بالای کالا"},
    {id: 2, name: "سوپرمارکت بهار", owner: "مریم احمدی", phone: "071-22334455", address: "شیراز، معالی‌آباد", lat: 29.6126, lng: 52.4944, status: "فعال", description: "مواد غذایی و کالاهای مصرف روزانه"},
    {id: 3, name: "خانه دیجیتال", owner: "رضا کریمی", phone: "071-33445566", address: "شیراز، خیابان عفیف‌آباد", lat: 29.6232, lng: 52.5108, status: "فعال", description: "لوازم جانبی و تجهیزات دیجیتال"},
  ],
  products: [
    {id: 1, storeId: 1, name: "روغن مایع 1.5 لیتری", category: "مواد غذایی", price: 185000, inventory: 24, unit: "عدد", updated: "امروز"},
    {id: 2, storeId: 1, name: "برنج ایرانی 10 کیلویی", category: "مواد غذایی", price: 1280000, inventory: 7, unit: "کیسه", updated: "امروز"},
    {id: 3, storeId: 2, name: "شیر کم‌چرب", category: "لبنیات", price: 42000, inventory: 41, unit: "عدد", updated: "امروز"},
    {id: 4, storeId: 2, name: "ماکارونی 700 گرم", category: "مواد غذایی", price: 62000, inventory: 18, unit: "بسته", updated: "دیروز"},
    {id: 5, storeId: 3, name: "کابل USB-C", category: "دیجیتال", price: 290000, inventory: 12, unit: "عدد", updated: "امروز"},
    {id: 6, storeId: 3, name: "پاوربانک 10000mAh", category: "دیجیتال", price: 980000, inventory: 3, unit: "عدد", updated: "دیروز"},
  ],
  currentUserId: null
};

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return structuredClone(seed);
  }
  try { return JSON.parse(raw); } catch { localStorage.removeItem(STORAGE_KEY); return structuredClone(seed); }
}
let state = loadState();

const app = document.getElementById("app");
const authBtn = document.getElementById("authBtn");
const logoutBtn = document.getElementById("logoutBtn");
const sessionLabel = document.getElementById("sessionLabel");

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function currentUser(){ return state.users.find(u => u.id === state.currentUserId) || null; }
function currentStore(){ const u=currentUser(); return u?.storeId ? state.stores.find(s=>s.id===u.storeId) : null; }
function money(v){ return Number(v||0).toLocaleString("fa-IR") + " تومان"; }
function escapeHtml(s){ return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function toast(msg){
  const el=document.getElementById("toast");
  el.textContent=msg; el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2400);
}
function nav(path){ location.hash = path; }
function route(){ return location.hash.replace(/^#\/?/, "") || "home"; }

function updateHeader(){
  const u=currentUser();
  if(u){
    sessionLabel.textContent = u.role === "store" ? `فروشگاه: ${u.storeName}` : `سلام ${u.name}`;
    logoutBtn.hidden=false; authBtn.hidden=true;
  }else{
    sessionLabel.textContent="";
    logoutBtn.hidden=true; authBtn.hidden=false;
  }
}
logoutBtn.addEventListener("click",()=>{state.currentUserId=null;saveState();toast("از حساب خارج شدید.");nav("home");updateHeader();render();});

function layout(content){ app.innerHTML=content; }

function home(){
  const totalProducts=state.products.length;
  const totalStores=state.stores.length;
  layout(`
  <section class="hero">
    <div>
      <span class="badge" style="background:rgba(255,255,255,.12);color:#fff">سامانه اشتراک اطلاعات مکانی و موجودی فروشگاه‌ها و کالاها</span>
      <h1>کالای موردنظرت را پیدا کن، نزدیک‌ترین فروشگاه را ببین.</h1>
      <p>نام کالا یا فروشگاه را جست‌وجو کن و اطلاعات موجودی، قیمت، مشخصات فروشگاه و مسیر دسترسی را یکجا ببین.</p>
      <div class="hero-search">
        <div class="search-row">
          <input id="homeSearch" class="input" placeholder="مثلاً برنج، کابل USB-C یا نام فروشگاه">
          <button class="btn btn-primary" id="homeSearchBtn">جستجو</button>
        </div>
      </div>
    </div>
    <div class="hero-card">
      <h3>وضعیت سامانه</h3>
      <div class="stat-list">
        <div class="stat"><span>فروشگاه‌های ثبت‌شده</span><strong>${totalStores}</strong></div>
        <div class="stat"><span>اقلام قابل جست‌وجو</span><strong>${totalProducts}</strong></div>
        <div class="stat"><span>وضعیت سرویس</span><strong>فعال</strong></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><div><h2>جستجوی سریع</h2><p>دو مسیر اصلی برای مشتری</p></div></div>
    <div class="grid grid-2">
      <div class="card">
        <span class="tag">برای مشتری</span><h3>جستجوی کالا</h3><p class="muted">کالا را پیدا کن و ببین در کدام فروشگاه موجود است.</p>
        <a class="btn btn-secondary" href="#/products">مشاهده کالاها</a>
      </div>
      <div class="card">
        <span class="tag">برای مشتری</span><h3>جستجوی فروشگاه</h3><p class="muted">اطلاعات تماس، آدرس و گزینه مسیریابی فروشگاه را ببین.</p>
        <a class="btn btn-secondary" href="#/stores">مشاهده فروشگاه‌ها</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><div><h2>آخرین کالاهای ثبت‌شده</h2><p>نمونه داده‌های Frontend</p></div><a href="#/products" class="btn btn-ghost">همه کالاها</a></div>
    <div class="grid grid-3">${state.products.slice(0,3).map(productCard).join("")}</div>
  </section>
  `);
  document.getElementById("homeSearchBtn").onclick=()=>{
    const q=document.getElementById("homeSearch").value.trim();
    if(!q){toast("عبارت جست‌وجو را وارد کنید.");return;}
    localStorage.setItem("lastSearch",q);nav("products");
  };
}

function productCard(p){
  const store=state.stores.find(s=>s.id===p.storeId);
  return `<div class="card product-card">
    <div class="split"><div class="product-icon">🛒</div><span class="${p.inventory>5?'badge badge-success':'badge badge-warning'}">${p.inventory>0?`موجودی ${p.inventory}`:"ناموجود"}</span></div>
    <div><h3>${escapeHtml(p.name)}</h3><div class="muted small">${escapeHtml(p.category)} · ${escapeHtml(store?.name||"")}</div></div>
    <div class="card-row"><span class="price">${money(p.price)}</span><a href="#/product/${p.id}" class="btn btn-secondary">جزئیات</a></div>
  </div>`;
}

function productsPage(){
  const q=localStorage.getItem("lastSearch")||"";
  layout(`
  <div class="page-title"><h1>جستجوی کالا</h1><p>کالا را نام، دسته‌بندی یا فروشگاه جست‌وجو کنید.</p></div>
  <div class="toolbar">
    <input id="productQuery" class="input" placeholder="نام کالا..." value="${escapeHtml(q)}">
    <select id="categoryFilter" class="select"><option value="">همه دسته‌بندی‌ها</option>${[...new Set(state.products.map(p=>p.category))].map(c=>`<option>${escapeHtml(c)}</option>`).join("")}</select>
    <button id="clearProduct" class="btn btn-ghost">پاک‌کردن</button>
  </div>
  <div id="productResults" class="grid grid-3"></div>
  `);
  const renderResults=()=>{
    const qv=document.getElementById("productQuery").value.trim().toLowerCase();
    const cat=document.getElementById("categoryFilter").value;
    localStorage.setItem("lastSearch",document.getElementById("productQuery").value);
    const arr=state.products.filter(p=>{
      const store=state.stores.find(s=>s.id===p.storeId);
      const hay=`${p.name} ${p.category} ${store?.name||""}`.toLowerCase();
      return (!qv||hay.includes(qv))&&(!cat||p.category===cat);
    });
    document.getElementById("productResults").innerHTML = arr.length ? arr.map(productCard).join("") : `<div class="empty" style="grid-column:1/-1">کالایی با این مشخصات پیدا نشد.</div>`;
  };
  document.getElementById("productQuery").oninput=renderResults;
  document.getElementById("categoryFilter").onchange=renderResults;
  document.getElementById("clearProduct").onclick=()=>{document.getElementById("productQuery").value="";document.getElementById("categoryFilter").value="";renderResults();}
  renderResults();
}

function storesPage(){
  layout(`
  <div class="page-title"><h1>جستجوی فروشگاه</h1><p>فروشگاه موردنظر را پیدا و گزینه مسیریابی را انتخاب کنید.</p></div>
  <div class="toolbar">
    <input id="storeQuery" class="input" placeholder="نام فروشگاه، آدرس یا تلفن">
    <select id="storeStatus" class="select"><option value="">همه وضعیت‌ها</option><option value="فعال">فعال</option></select>
    <button id="clearStore" class="btn btn-ghost">پاک‌کردن</button>
  </div>
  <div id="storeResults" class="grid grid-2"></div>
  `);
  const draw=()=>{
    const q=document.getElementById("storeQuery").value.trim().toLowerCase(), status=document.getElementById("storeStatus").value;
    const arr=state.stores.filter(s=>`${s.name} ${s.address} ${s.phone}`.toLowerCase().includes(q)&&(!status||s.status===status));
    document.getElementById("storeResults").innerHTML=arr.length?arr.map(storeCard).join(""):`<div class="empty" style="grid-column:1/-1">فروشگاهی پیدا نشد.</div>`;
  };
  document.getElementById("storeQuery").oninput=draw;document.getElementById("storeStatus").onchange=draw;
  document.getElementById("clearStore").onclick=()=>{document.getElementById("storeQuery").value="";document.getElementById("storeStatus").value="";draw();}
  draw();
}
function storeCard(s){
  const count=state.products.filter(p=>p.storeId===s.id).length;
  return `<div class="card">
    <div class="split"><span class="tag">📍 فروشگاه</span><span class="badge badge-success">${escapeHtml(s.status)}</span></div>
    <h3 style="margin-top:12px">${escapeHtml(s.name)}</h3>
    <p class="muted">${escapeHtml(s.description||"")}</p>
    <div class="info-list">
      <div class="info-item"><span>آدرس</span><strong>${escapeHtml(s.address)}</strong></div>
      <div class="info-item"><span>تلفن</span><strong>${escapeHtml(s.phone)}</strong></div>
      <div class="info-item"><span>تعداد اقلام</span><strong>${count}</strong></div>
    </div>
    <div class="card-row"><a class="btn btn-secondary" href="#/store/${s.id}">اطلاعات فروشگاه</a><a class="btn btn-primary" target="_blank" rel="noopener" href="${wazeUrl(s)}">ویز</a><a class="btn btn-secondary" target="_blank" rel="noopener" href="${neshanUrl(s)}">نشان</a></div>
  </div>`;
}
function wazeUrl(s){return `https://www.waze.com/ul?ll=${encodeURIComponent(s.lat)},${encodeURIComponent(s.lng)}&navigate=yes`}
function neshanUrl(s){return `https://nshn.ir/maps?destination=${encodeURIComponent(s.lat)},${encodeURIComponent(s.lng)}&type=drive`}

function productDetail(id){
  const p=state.products.find(x=>x.id===Number(id)); if(!p){layout(`<div class="empty">کالا پیدا نشد.</div>`);return;}
  const store=state.stores.find(s=>s.id===p.storeId);
  layout(`
  <div class="page-title"><h1>جزئیات کالا</h1><p>اطلاعات ثبت‌شده کالا در سامانه</p></div>
  <div class="detail">
    <div class="detail-panel">
      <div class="split"><span class="tag">${escapeHtml(p.category)}</span><span class="${p.inventory>5?'badge badge-success':p.inventory>0?'badge badge-warning':'badge badge-danger'}">${p.inventory>0?`${p.inventory} ${p.unit} موجود`:"ناموجود"}</span></div>
      <h2 style="margin-bottom:4px">${escapeHtml(p.name)}</h2>
      <div class="price">${money(p.price)}</div>
      <div class="info-list">
        <div class="info-item"><span>فروشگاه</span><strong><a href="#/store/${store?.id}">${escapeHtml(store?.name||"")}</a></strong></div>
        <div class="info-item"><span>به‌روزرسانی موجودی</span><strong>${escapeHtml(p.updated)}</strong></div>
        <div class="info-item"><span>واحد</span><strong>${escapeHtml(p.unit)}</strong></div>
      </div>
      <div class="notice">این صفحه فقط اطلاعات موجودی و مکان فروشگاه را نمایش می‌دهد و خرید آنلاین در دامنه پروژه نیست.</div>
    </div>
    <div class="detail-panel">
      <h3>موقعیت فروشگاه</h3>
      <div class="map-placeholder"><div><div class="map-pin">📍</div><strong>${escapeHtml(store?.name||"")}</strong><div>${escapeHtml(store?.address||"")}</div><div class="small">نقشه داخل سامانه پیاده‌سازی نشده است.</div></div></div>
      <div class="card-row" style="margin-top:12px"><a href="#/store/${store?.id}" class="btn btn-ghost">صفحه فروشگاه</a><a target="_blank" rel="noopener" href="${wazeUrl(store)}" class="btn btn-primary">مسیریابی با ویز</a><a target="_blank" rel="noopener" href="${neshanUrl(store)}" class="btn btn-secondary">مسیریابی با نشان</a></div>
    </div>
  </div>
  `);
}

function storeDetail(id){
  const s=state.stores.find(x=>x.id===Number(id)); if(!s){layout(`<div class="empty">فروشگاه پیدا نشد.</div>`);return;}
  const products=state.products.filter(p=>p.storeId===s.id);
  layout(`
  <div class="page-title"><h1>${escapeHtml(s.name)}</h1><p>${escapeHtml(s.description||"")}</p></div>
  <div class="detail">
    <div class="detail-panel">
      <div class="split"><span class="tag">فروشگاه</span><span class="badge badge-success">${escapeHtml(s.status)}</span></div>
      <div class="info-list">
        <div class="info-item"><span>مدیر</span><strong>${escapeHtml(s.owner)}</strong></div>
        <div class="info-item"><span>تلفن</span><strong>${escapeHtml(s.phone)}</strong></div>
        <div class="info-item"><span>آدرس</span><strong>${escapeHtml(s.address)}</strong></div>
      </div>
      <div class="card-row"><a class="btn btn-primary" target="_blank" rel="noopener" href="${wazeUrl(s)}">مسیریابی با ویز</a><a class="btn btn-secondary" target="_blank" rel="noopener" href="${neshanUrl(s)}">مسیریابی با نشان</a></div>
    </div>
    <div class="detail-panel">
      <div class="section-head"><div><h3>کالاهای این فروشگاه</h3><p>${products.length} قلم</p></div></div>
      <div class="stack">${products.length?products.map(p=>`<div class="card-row" style="padding:9px 0;border-bottom:1px solid var(--border)"><div><strong>${escapeHtml(p.name)}</strong><div class="small muted">${escapeHtml(p.category)}</div></div><div><span class="price">${money(p.price)}</span> <span class="badge ${p.inventory>5?'badge-success':p.inventory?'badge-warning':'badge-danger'}">${p.inventory} موجود</span></div></div>`).join(""):`<div class="empty">کالایی ثبت نشده است.</div>`}</div>
    </div>
  </div>
  `);
}

function loginPage(){
  layout(`<div class="auth-wrap">
    <div class="auth-card">
      <div class="page-title"><h1>ورود</h1><p>به عنوان مشتری یا فروشگاه وارد شوید.</p></div>
      <form id="loginForm" class="stack">
        <div class="form-group"><label>ایمیل</label><input class="input" id="loginEmail" type="email" required placeholder="example@mail.com"></div>
        <div class="form-group"><label>رمز عبور</label><input class="input" id="loginPassword" type="password" required></div>
        <button class="btn btn-primary">ورود</button>
      </form>
      <p class="small muted" style="margin-bottom:0">حساب نمونه مشتری: user@example.com / 123456</p>
      <div style="margin-top:16px"><a class="btn btn-ghost" href="#/register">ثبت‌نام مشتری</a> <a class="btn btn-secondary" href="#/register-store">ثبت فروشگاه</a></div>
    </div>
  </div>`);
  document.getElementById("loginForm").onsubmit=e=>{
    e.preventDefault();
    const email=document.getElementById("loginEmail").value.trim().toLowerCase(), pw=document.getElementById("loginPassword").value;
    const u=state.users.find(x=>x.email.toLowerCase()===email&&x.password===pw);
    if(!u){toast("ایمیل یا رمز عبور صحیح نیست.");return;}
    state.currentUserId=u.id;saveState();updateHeader();toast("ورود با موفقیت انجام شد.");nav(u.role==="store"?"store-dashboard":"home");
  };
}
function registerPage(){
  layout(`<div class="auth-wrap">
    <div class="auth-card">
      <div class="page-title"><h1>ثبت‌نام مشتری</h1><p>حساب مشتری برای جست‌وجو و مشاهده اطلاعات فروشگاه‌ها</p></div>
      <form id="registerForm" class="stack">
        <div class="form-group"><label>نام و نام خانوادگی</label><input class="input" id="rName" required></div>
        <div class="form-group"><label>ایمیل</label><input class="input" id="rEmail" type="email" required></div>
        <div class="form-group"><label>رمز عبور</label><input class="input" id="rPw" type="password" minlength="6" required></div>
        <button class="btn btn-primary">ایجاد حساب</button>
      </form>
    </div>
  </div>`);
  document.getElementById("registerForm").onsubmit=e=>{
    e.preventDefault();
    const email=document.getElementById("rEmail").value.trim().toLowerCase();
    if(state.users.some(u=>u.email.toLowerCase()===email)){toast("این ایمیل قبلاً ثبت شده است.");return;}
    const u={id:Date.now(),name:document.getElementById("rName").value.trim(),email,password:document.getElementById("rPw").value,role:"customer"};
    state.users.push(u);state.currentUserId=u.id;saveState();updateHeader();toast("حساب شما ساخته شد.");nav("home");
  };
}
function registerStorePage(){
  layout(`<div class="auth-wrap" style="max-width:720px">
    <div class="auth-card">
      <div class="page-title"><h1>ثبت فروشگاه</h1><p>بعد از ثبت، از پنل فروشگاه می‌توانید اطلاعات کالا و موجودی را مدیریت کنید.</p></div>
      <form id="storeRegisterForm" class="form-grid">
        <div class="form-group"><label>نام فروشگاه</label><input class="input" id="sName" required></div>
        <div class="form-group"><label>نام مدیر</label><input class="input" id="sOwner" required></div>
        <div class="form-group"><label>ایمیل مدیر</label><input class="input" id="sEmail" type="email" required></div>
        <div class="form-group"><label>رمز عبور</label><input class="input" id="sPw" type="password" minlength="6" required></div>
        <div class="form-group"><label>تلفن</label><input class="input" id="sPhone" required></div>
        <div class="form-group"><label>آدرس</label><input class="input" id="sAddress" required></div>
        <div class="form-group"><label>Latitude</label><input class="input" id="sLat" type="number" step="any" value="29.6203" required></div>
        <div class="form-group"><label>Longitude</label><input class="input" id="sLng" type="number" step="any" value="52.5311" required></div>
        <div class="form-group full"><label>توضیحات</label><textarea class="textarea" id="sDesc" rows="3"></textarea></div>
        <div class="form-group full"><button class="btn btn-primary">ثبت فروشگاه و ورود به پنل</button></div>
      </form>
    </div>
  </div>`);
  document.getElementById("storeRegisterForm").onsubmit=e=>{
    e.preventDefault();
    const email=document.getElementById("sEmail").value.trim().toLowerCase();
    if(state.users.some(u=>u.email.toLowerCase()===email)){toast("این ایمیل قبلاً ثبت شده است.");return;}
    const storeId=Date.now(), userId=Date.now()+1;
    const store={id:storeId,name:document.getElementById("sName").value.trim(),owner:document.getElementById("sOwner").value.trim(),phone:document.getElementById("sPhone").value.trim(),address:document.getElementById("sAddress").value.trim(),lat:Number(document.getElementById("sLat").value),lng:Number(document.getElementById("sLng").value),status:"فعال",description:document.getElementById("sDesc").value.trim()};
    const u={id:userId,name:store.owner,email,password:document.getElementById("sPw").value,role:"store",storeId,storeName:store.name};
    state.stores.push(store);state.users.push(u);state.currentUserId=userId;saveState();updateHeader();toast("فروشگاه ثبت شد.");nav("store-dashboard");
  };
}

function requireStore(){
  const u=currentUser();
  if(!u || u.role!=="store"){toast("برای ورود به پنل فروشگاه باید با حساب فروشگاه وارد شوید.");nav("login");return false;}
  return true;
}
function storeDashboard(tab="overview"){
  if(!requireStore())return;
  const s=currentStore(); const products=state.products.filter(p=>p.storeId===s.id);
  layout(`
  <div class="dashboard">
    <aside class="sidebar">
      <h3 style="padding:0 10px">پنل ${escapeHtml(s.name)}</h3>
      <a class="${tab==='overview'?'active':''}" href="#/store-dashboard">نمای کلی</a>
      <a class="${tab==='products'?'active':''}" href="#/store-dashboard/products">افزودن کالا</a>
      <a class="${tab==='inventory'?'active':''}" href="#/store-dashboard/inventory">مدیریت موجودی</a>
      <a class="${tab==='store-info'?'active':''}" href="#/store-dashboard/store-info">اطلاعات فروشگاه</a>
      <a class="${tab==='import'?'active':''}" href="#/store-dashboard/import">ورود فایل / API</a>
    </aside>
    <section class="dashboard-main" id="dashboardMain"></section>
  </div>`);
  const main=document.getElementById("dashboardMain");
  if(tab==="overview") main.innerHTML=dashboardOverview(s,products);
  if(tab==="products") main.innerHTML=productAddForm();
  if(tab==="inventory") main.innerHTML=inventoryView(products);
  if(tab==="store-info") main.innerHTML=storeInfoForm(s);
  if(tab==="import") main.innerHTML=importView();
  bindDashboard(tab,s);
}
function dashboardOverview(s,products){
  const total=products.length, inStock=products.filter(p=>p.inventory>0).length, low=products.filter(p=>p.inventory>0&&p.inventory<=5).length;
  return `<div class="page-title"><h1>نمای کلی پنل</h1><p>مدیریت اطلاعات فروشگاه و موجودی کالا</p></div>
  <div class="kpis"><div class="kpi"><span>کل کالاها</span><strong>${total}</strong></div><div class="kpi"><span>دارای موجودی</span><strong>${inStock}</strong></div><div class="kpi"><span>موجودی کم</span><strong>${low}</strong></div><div class="kpi"><span>وضعیت فروشگاه</span><strong>${escapeHtml(s.status)}</strong></div></div>
  <div class="section"><div class="section-head"><div><h2>اطلاعات فروشگاه</h2><p>${escapeHtml(s.address)}</p></div><a href="#/store-dashboard/store-info" class="btn btn-ghost">ویرایش</a></div>
    <div class="card"><div class="grid grid-2"><div><strong>مدیر:</strong> ${escapeHtml(s.owner)}</div><div><strong>تلفن:</strong> ${escapeHtml(s.phone)}</div><div><strong>Latitude:</strong> ${s.lat}</div><div><strong>Longitude:</strong> ${s.lng}</div></div></div>
  </div>`;
}
function productAddForm(){
  return `<div class="page-title"><h1>افزودن کالا</h1><p>ورود دستی اطلاعات یک قلم کالا</p></div>
  <div class="card"><form id="addProductForm" class="form-grid">
    <div class="form-group"><label>نام کالا</label><input id="pName" class="input" required></div>
    <div class="form-group"><label>دسته‌بندی</label><input id="pCat" class="input" required></div>
    <div class="form-group"><label>قیمت</label><input id="pPrice" class="input" type="number" min="0" required></div>
    <div class="form-group"><label>موجودی</label><input id="pInventory" class="input" type="number" min="0" required></div>
    <div class="form-group"><label>واحد</label><select id="pUnit" class="select"><option>عدد</option><option>بسته</option><option>کیلو</option><option>لیتر</option><option>کیسه</option></select></div>
    <div class="form-group full"><button class="btn btn-primary">ثبت کالا</button></div>
  </form></div>`;
}
function inventoryView(products){
  return `<div class="page-title"><h1>مدیریت موجودی</h1><p>ویرایش سریع تعداد موجودی کالاها</p></div>
  <div class="table-wrap"><table><thead><tr><th>کالا</th><th>دسته‌بندی</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>
  ${products.map(p=>`<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category)}</td><td>${money(p.price)}</td><td><input class="input inventory-input" data-id="${p.id}" value="${p.inventory}" type="number" min="0" style="width:100px"></td><td><span class="badge ${p.inventory>5?'badge-success':p.inventory?'badge-warning':'badge-danger'}">${p.inventory>5?'عادی':p.inventory?'کم':'ناموجود'}</span></td><td><button class="btn btn-secondary save-inventory" data-id="${p.id}">ذخیره</button></td></tr>`).join("")}
  </tbody></table></div>`;
}
function storeInfoForm(s){
  return `<div class="page-title"><h1>اطلاعات فروشگاه</h1><p>ویرایش اطلاعات پایه و موقعیت فروشگاه</p></div>
  <div class="card"><form id="storeInfoForm" class="form-grid">
    <div class="form-group"><label>نام فروشگاه</label><input id="iName" class="input" value="${escapeHtml(s.name)}" required></div>
    <div class="form-group"><label>مدیر</label><input id="iOwner" class="input" value="${escapeHtml(s.owner)}" required></div>
    <div class="form-group"><label>تلفن</label><input id="iPhone" class="input" value="${escapeHtml(s.phone)}" required></div>
    <div class="form-group"><label>آدرس</label><input id="iAddress" class="input" value="${escapeHtml(s.address)}" required></div>
    <div class="form-group"><label>Latitude</label><input id="iLat" class="input" type="number" step="any" value="${s.lat}" required></div>
    <div class="form-group"><label>Longitude</label><input id="iLng" class="input" type="number" step="any" value="${s.lng}" required></div>
    <div class="form-group full"><label>توضیحات</label><textarea id="iDesc" class="textarea" rows="4">${escapeHtml(s.description||"")}</textarea></div>
    <div class="form-group full"><button class="btn btn-primary">ذخیره اطلاعات</button></div>
  </form></div>`;
}
function importView(){
  return `<div class="page-title"><h1>ورود اطلاعات موجودی</h1><p>سه روش ورودی موردنیاز پروژه در رابط کاربری</p></div>
  <div class="grid grid-3">
    <div class="card"><h3>ورود دستی</h3><p class="muted">برای یک یا چند کالا، از فرم افزودن کالا استفاده کنید.</p><a class="btn btn-secondary" href="#/store-dashboard/products">فرم افزودن کالا</a></div>
    <div class="card"><h3>TXT / Excel</h3><p class="muted">فایل داده را انتخاب کنید و ساختار ورودی را بررسی کنید.</p>
      <div class="file-box"><input id="inventoryFile" type="file" accept=".txt,.csv,.xlsx,.xls"><label for="inventoryFile" class="btn btn-primary">انتخاب فایل</label><div id="fileName" class="small muted" style="margin-top:8px">فایلی انتخاب نشده است.</div></div>
      <div id="filePreview" class="import-preview"></div>
    </div>
    <div class="card"><h3>API</h3><p class="muted">این پروژه Frontend-only است؛ این بخش رابط تنظیم اتصال API را نمایش می‌دهد.</p>
      <div class="form-group"><label>API Endpoint</label><input id="apiEndpoint" class="input" placeholder="https://example.com/api/inventory"></div>
      <div class="form-group" style="margin-top:10px"><label>API Key</label><input id="apiKey" class="input" type="password" placeholder="اختیاری"></div>
      <button id="saveApi" class="btn btn-secondary" style="margin-top:10px">ذخیره تنظیمات</button>
    </div>
  </div>`;
}
function bindDashboard(tab,s){
  if(tab==="products"){
    document.getElementById("addProductForm").onsubmit=e=>{
      e.preventDefault();
      const p={id:Date.now(),storeId:s.id,name:document.getElementById("pName").value.trim(),category:document.getElementById("pCat").value.trim(),price:Number(document.getElementById("pPrice").value),inventory:Number(document.getElementById("pInventory").value),unit:document.getElementById("pUnit").value,updated:"همین الان"};
      state.products.push(p);saveState();toast("کالا اضافه شد.");nav("store-dashboard/inventory");
    };
  }
  if(tab==="inventory"){
    document.querySelectorAll(".save-inventory").forEach(btn=>btn.onclick=()=>{
      const id=Number(btn.dataset.id), inp=document.querySelector(`.inventory-input[data-id="${id}"]`), p=state.products.find(x=>x.id===id);
      p.inventory=Math.max(0,Number(inp.value)||0);p.updated="همین الان";saveState();toast("موجودی ذخیره شد.");storeDashboard("inventory");
    });
  }
  if(tab==="store-info"){
    document.getElementById("storeInfoForm").onsubmit=e=>{
      e.preventDefault();
      s.name=document.getElementById("iName").value.trim();s.owner=document.getElementById("iOwner").value.trim();s.phone=document.getElementById("iPhone").value.trim();s.address=document.getElementById("iAddress").value.trim();s.lat=Number(document.getElementById("iLat").value);s.lng=Number(document.getElementById("iLng").value);s.description=document.getElementById("iDesc").value.trim();
      const u=currentUser();u.name=s.owner;u.storeName=s.name;saveState();updateHeader();toast("اطلاعات فروشگاه ذخیره شد.");storeDashboard("store-info");
    };
  }
  if(tab==="import"){
    document.getElementById("inventoryFile").onchange=e=>{
      const file=e.target.files[0];if(!file)return;
      document.getElementById("fileName").textContent=`${file.name} — ${(file.size/1024).toFixed(1)} KB`;
      const preview=document.getElementById("filePreview");
      if(file.name.toLowerCase().endsWith(".txt")||file.name.toLowerCase().endsWith(".csv")){
        const reader=new FileReader();
        reader.onload=()=>preview.innerHTML=`<div class="notice">فایل متنی خوانده شد. برای ثبت واقعی داده‌ها، در نسخه متصل به Backend باید parser و API اضافه شود.</div><pre style="white-space:pre-wrap;font-size:12px;background:#fafbfe;padding:12px;border-radius:12px;border:1px solid var(--border);max-height:200px;overflow:auto">${escapeHtml(String(reader.result||"").slice(0,3000))}</pre>`;
        reader.readAsText(file);
      }else{
        preview.innerHTML=`<div class="notice">فایل Excel انتخاب شد. رابط کاربری پذیرش فایل آماده است؛ پردازش واقعی XLSX باید از طریق کتابخانه یا Backend انجام شود.</div>`;
      }
    };
    document.getElementById("saveApi").onclick=()=>{toast("تنظیمات API در LocalStorage ذخیره شد.");localStorage.setItem("bazaryab_api",JSON.stringify({endpoint:document.getElementById("apiEndpoint").value,key:document.getElementById("apiKey").value}));}
  }
}

function render(){
  updateHeader();
  const r=route().split("/");
  if(r[0]==="home")home();
  else if(r[0]==="products")productsPage();
  else if(r[0]==="stores")storesPage();
  else if(r[0]==="product")productDetail(r[1]);
  else if(r[0]==="store" && r[1])storeDetail(r[1]);
  else if(r[0]==="login")loginPage();
  else if(r[0]==="register")registerPage();
  else if(r[0]==="register-store")registerStorePage();
  else if(r[0]==="store-dashboard"){
    const tab=r[1]||"overview"; storeDashboard(tab);
  } else home();
}
window.addEventListener("hashchange",render);
render();
