/* shared.js — dùng chung cho các trang mới (shop/product/cart/checkout/account/
   track-order/wishlist/search). index.html vẫn dùng script.js riêng (không đổi),
   file này chỉ lặp lại đúng phần lõi (kvApi, phiên đăng nhập, badge giỏ hàng/yêu
   thích, modal đăng nhập) để mỗi trang mới không phải phụ thuộc vào script.js
   vốn có nhiều đoạn chỉ dành riêng cho các section của index.html. */

window.KV_API_BASE = window.KV_API_BASE || '';

/* ===== menu mobile (hamburger) ===== */
(function(){
  const navToggle = document.getElementById('navToggle');
  if(navToggle) navToggle.addEventListener('click', () => document.body.classList.toggle('nav-open'));
})();

function kvToken(){ return localStorage.getItem('kvToken'); }

async function kvApi(path, opts){
  opts = opts || {};
  const headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {});
  const t = kvToken();
  if(t) headers.Authorization = 'Bearer ' + t;
  const res = await fetch(KV_API_BASE + path, Object.assign({}, opts, {headers}));
  let data = null;
  try{ data = await res.json(); }catch(e){ /* vd. 204 No Content */ }
  if(!res.ok){
    const msg = data && data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : ('Lỗi máy chủ (' + res.status + ')');
    throw new Error(msg);
  }
  return data;
}

function fmtVnd(n){ return Math.round(n || 0).toLocaleString('vi-VN') + 'đ'; }

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let toastT;
function showToast(html){
  let toast = document.getElementById('toast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'toast'; toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = html; toast.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ===== phiên đăng nhập + modal đăng nhập/đăng ký dùng chung ===== */
let kvUser = null;
window.kvCurrentUser = () => kvUser;
window.kvIsSeller = () => !!(kvUser && kvUser.is_seller);

const KV_CART_KEY = 'kvCart';
function kvCartGet(){
  try{ return JSON.parse(localStorage.getItem(KV_CART_KEY) || '[]'); }catch(e){ return []; }
}
function kvCartSave(items){
  localStorage.setItem(KV_CART_KEY, JSON.stringify(items));
  kvSyncCartBadge();
}
/* item: {id, name, price, qty, color, size, image} — cộng dồn nếu trùng id+color+size */
function kvCartAdd(item){
  const items = kvCartGet();
  const existing = items.find(i => i.id === item.id && (i.color || null) === (item.color || null) && (i.size || null) === (item.size || null));
  if(existing) existing.qty += (item.qty || 1);
  else items.push(Object.assign({qty: 1}, item));
  kvCartSave(items);
  return items;
}
function kvCartCount(){
  try{ return kvCartGet().reduce((s,i) => s + i.qty, 0); }catch(e){ return 0; }
}
function kvSyncCartBadge(){
  const bd = document.getElementById('cartBadge');
  if(!bd) return;
  const n = kvCartCount();
  bd.textContent = n; bd.classList.toggle('show', n > 0);
}
function kvSyncWishBadge(){
  const bd = document.getElementById('wishBadge');
  if(!bd) return;
  if(!kvUser){ bd.textContent = '0'; bd.classList.remove('show'); return; }
  kvApi('/api/wishlist').then(items => {
    bd.textContent = items.length; bd.classList.toggle('show', items.length > 0);
  }).catch(() => {});
}
function kvSyncNotifBadge(){
  const bd = document.getElementById('notifBadge');
  if(!bd) return;
  if(!kvUser){ bd.textContent = '0'; bd.classList.remove('show'); return; }
  kvApi('/api/notifications').then(items => {
    const unread = items.filter(n => !n.is_read).length;
    bd.textContent = unread; bd.classList.toggle('show', unread > 0);
  }).catch(() => {});
}

function kvPaintHeader(){
  const loginBtn = document.getElementById('loginBtn');
  if(loginBtn){
    if(kvUser){ loginBtn.textContent = kvUser.name; loginBtn.title = 'Xem tài khoản của bạn'; }
    else { loginBtn.textContent = 'Đăng nhập'; loginBtn.removeAttribute('title'); }
  }
  const loginMenuLink = document.getElementById('loginMenuLink');
  if(loginMenuLink) loginMenuLink.textContent = kvUser ? ('Tài khoản · ' + kvUser.name) : 'Đăng nhập';
  kvSyncCartBadge();
  kvSyncWishBadge();
  kvSyncNotifBadge();
}

function kvSetUser(u){ kvUser = u; kvPaintHeader(); }

/* Promise mà mỗi trang có thể await trước khi tự vẽ nội dung cần biết ai đang đăng nhập */
window.kvReady = (async function(){
  kvSyncCartBadge();
  if(!kvToken()) return null;
  try{
    const u = await kvApi('/api/auth/me');
    kvSetUser(u);
    return u;
  }catch(e){
    localStorage.removeItem('kvToken');
    return null;
  }
})();

/* Bắt buộc đăng nhập mới được dùng trang này (cart/checkout/account/wishlist/track-order) */
window.kvRequireLogin = async function(){
  const u = await window.kvReady;
  if(!u){
    showToast('Vui lòng đăng nhập để tiếp tục ✦');
    if(window.kvOpenLogin) kvOpenLogin();
    return null;
  }
  return u;
};

(function initLoginModal(){
  const modal = document.getElementById('loginModal');
  if(!modal) return;
  const form = document.getElementById('loginForm');
  const profile = document.getElementById('profileBox');
  const lgErr = document.getElementById('lgErr');
  const lgNameField = document.getElementById('lgNameField');
  const lgEmailField = document.getElementById('lgEmailField');
  const lgPhoneField = document.getElementById('lgPhoneField');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const forgotForm = document.getElementById('forgotForm');
  const forgotPassRow = document.getElementById('forgotPassRow');
  const fpErr = document.getElementById('fpErr');
  const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
  let authMode = 'login';

  function setAuthMode(mode){
    authMode = mode;
    const isRegister = mode === 'register';
    lgNameField.hidden = !isRegister;
    lgEmailField.hidden = !isRegister;
    lgPhoneField.hidden = !isRegister;
    if(forgotPassRow) forgotPassRow.hidden = isRegister;
    document.getElementById('loginTitle').textContent = isRegister ? 'Tạo tài khoản KIMVIE' : 'Đăng nhập KIMVIE';
    loginSubmitBtn.textContent = isRegister ? 'Đăng ký →' : 'Đăng nhập →';
    document.getElementById('authModeHint').innerHTML = isRegister
      ? 'Đã có tài khoản? <a href="#" id="authModeToggle" style="color:var(--amber2);font-weight:700">Đăng nhập</a>'
      : 'Chưa có tài khoản? <a href="#" id="authModeToggle" style="color:var(--amber2);font-weight:700">Đăng ký ngay</a>';
    bindAuthToggle();
    lgErr.textContent = '';
  }
  function bindAuthToggle(){
    const t = document.getElementById('authModeToggle');
    if(t) t.addEventListener('click', e => { e.preventDefault(); setAuthMode(authMode === 'register' ? 'login' : 'register'); });
  }

  function showForgotView(){
    if(!forgotForm) return;
    const prefill = document.getElementById('lgUsername').value.trim();
    form.hidden = true;
    forgotForm.hidden = false;
    document.getElementById('fpUsername').value = prefill;
    document.getElementById('fpNewPass').value = '';
    document.getElementById('fpConfirmPass').value = '';
    fpErr.textContent = '';
    document.getElementById('loginTitle').textContent = 'Quên mật khẩu';
  }
  function showLoginView(){
    if(forgotForm) forgotForm.hidden = true;
    form.hidden = false;
    setAuthMode('login');
  }
  const forgotPassLink = document.getElementById('forgotPassLink');
  if(forgotPassLink) forgotPassLink.addEventListener('click', e => { e.preventDefault(); showForgotView(); });
  const forgotBackLink = document.getElementById('forgotBackLink');
  if(forgotBackLink) forgotBackLink.addEventListener('click', e => { e.preventDefault(); showLoginView(); });
  if(forgotForm) forgotForm.addEventListener('submit', async e => {
    e.preventDefault();
    fpErr.textContent = '';
    const username = document.getElementById('fpUsername').value.trim();
    const newPass = document.getElementById('fpNewPass').value;
    const confirmPass = document.getElementById('fpConfirmPass').value;
    if(!username){ fpErr.textContent = 'Vui lòng nhập tên đăng nhập.'; return; }
    if(newPass.length < 6){ fpErr.textContent = 'Mật khẩu mới cần ít nhất 6 ký tự.'; return; }
    if(newPass !== confirmPass){ fpErr.textContent = 'Mật khẩu nhập lại không khớp.'; return; }
    forgotSubmitBtn.disabled = true;
    try{
      await kvApi('/api/auth/reset-password', {method:'POST', body: JSON.stringify({username, new_password: newPass, confirm_password: confirmPass})});
      showToast('✦ Đặt lại mật khẩu thành công — mời bạn đăng nhập lại.');
      showLoginView();
      document.getElementById('lgUsername').value = username;
      document.getElementById('lgPass').focus();
    }catch(err){
      fpErr.textContent = err.message;
    }finally{
      forgotSubmitBtn.disabled = false;
    }
  });

  function openModal(){
    const logged = !!kvUser;
    form.hidden = logged;
    if(forgotForm) forgotForm.hidden = true;
    if(logged){
      document.getElementById('pfName').textContent = kvUser.name;
      document.getElementById('pfAva').textContent = (kvUser.name.trim()[0] || 'K').toUpperCase();
      document.getElementById('pfMeta').textContent = 'Thành viên từ ' + new Date(kvUser.created_at).toLocaleDateString('vi-VN');
      document.getElementById('pfUsername').textContent = kvUser.username || '—';
      document.getElementById('pfEmail').textContent = kvUser.email || '—';
      document.getElementById('pfPhone').textContent = kvUser.phone || '—';
      profile.hidden = false;
      document.getElementById('loginTitle').textContent = 'Tài khoản của bạn';
      const sellerCta = document.getElementById('sellerCta'), sellerMini = document.getElementById('sellerMini');
      if(sellerCta) sellerCta.hidden = window.kvIsSeller();
      if(sellerMini){ sellerMini.hidden = !window.kvIsSeller(); if(window.kvIsSeller()) document.getElementById('sellerMiniName').textContent = kvUser.seller.shop_name; }
    } else {
      profile.hidden = true;
      form.reset();
      setAuthMode('login');
    }
    modal.classList.add('open');
  }
  window.kvOpenLogin = openModal;
  const close = () => modal.classList.remove('open');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    lgErr.textContent = '';
    const username = document.getElementById('lgUsername').value.trim();
    const password = document.getElementById('lgPass').value;
    if(!username || !password){ lgErr.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.'; return; }
    loginSubmitBtn.disabled = true;
    try{
      let res;
      if(authMode === 'register'){
        const name = document.getElementById('lgName').value.trim();
        const email = document.getElementById('lgEmail').value.trim();
        const phone = document.getElementById('lgPhone').value.trim();
        if(!name){ lgErr.textContent = 'Vui lòng nhập tên của bạn.'; return; }
        if(!email){ lgErr.textContent = 'Vui lòng nhập email.'; return; }
        if(password.length < 6){ lgErr.textContent = 'Mật khẩu cần ít nhất 6 ký tự.'; return; }
        res = await kvApi('/api/auth/register', {method:'POST', body: JSON.stringify({name, username, email, phone: phone || null, password})});
      } else {
        res = await kvApi('/api/auth/login', {method:'POST', body: JSON.stringify({username, password})});
      }
      localStorage.setItem('kvToken', res.access_token);
      kvSetUser(res.user);
      close();
      showToast('✦ Xin chào <b>' + esc(res.user.name) + '</b> — đăng nhập thành công!');
      if(window.onKvLogin) window.onKvLogin();
    }catch(err){
      lgErr.textContent = err.message;
    }finally{
      loginSubmitBtn.disabled = false;
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('kvToken');
    kvSetUser(null);
    close();
    showToast('Bạn đã đăng xuất. Hẹn gặp lại ✦');
    window.location.href = 'index.html';
  });

  const loginBtn = document.getElementById('loginBtn');
  if(loginBtn) loginBtn.addEventListener('click', e => { e.preventDefault(); openModal(); });
  const loginMenuLink = document.getElementById('loginMenuLink');
  if(loginMenuLink) loginMenuLink.addEventListener('click', e => {
    e.preventDefault();
    document.body.classList.remove('nav-open');
    openModal();
  });
  modal.querySelectorAll('[data-lx]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
  bindAuthToggle();

  window.kvReady.then(() => kvPaintHeader());
})();

/* đọc 1 file ảnh, nén xuống tối đa maxW px, trả về data URI (jpeg) — dùng cho ảnh
   sản phẩm/QR/đánh giá, khỏi cần server lưu file (giữ đúng cách seller upload ảnh sản phẩm) */
function kvResizeImageFile(file, maxW){
  maxW = maxW || 640;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ===== menu "Shop" có dropdown con (Mới về / Giảm giá) =====
   Desktop: hover mở submenu, bấm vào "Shop" đi thẳng tới trang Shop.
   Mobile/không có hover: lần bấm đầu chỉ mở submenu, bấm lần 2 (hoặc bấm mục con) mới điều hướng. */
(function(){
  document.querySelectorAll('.menu li.has-dropdown > a').forEach(a => {
    a.addEventListener('click', e => {
      const li = a.closest('.has-dropdown');
      const hasHover = window.matchMedia('(hover: hover)').matches && window.innerWidth > 768;
      if(hasHover) return;
      if(!li.classList.contains('open')){
        e.preventDefault();
        document.querySelectorAll('.menu li.has-dropdown.open').forEach(x => { if(x !== li) x.classList.remove('open'); });
        li.classList.add('open');
      }
    });
  });
  document.addEventListener('click', e => {
    if(!e.target.closest('.has-dropdown')) document.querySelectorAll('.menu li.has-dropdown.open').forEach(x => x.classList.remove('open'));
  });
})();

/* ===== ô tìm kiếm trên header ===== */
(function(){
  const f = document.getElementById('navSearchForm');
  if(!f) return;
  f.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('navSearchInput').value.trim();
    if(q) window.location.href = 'search.html?q=' + encodeURIComponent(q);
  });
})();
