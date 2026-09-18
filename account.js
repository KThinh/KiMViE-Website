/* account.html — Dashboard tài khoản: tổng quan, hồ sơ, đơn hàng, sổ địa chỉ,
   thanh toán của tôi, đánh giá của tôi, thông báo, đổi mật khẩu. */

const STAGE_LABEL = {pending:'Chờ thanh toán', processing:'Đang xử lý', shipped:'Đang giao', delivered:'Đã giao', cancelled:'Đã huỷ'};
let myOrders = [];
let myAddresses = [];

function showSection(name){
  document.querySelectorAll('.acct-section').forEach(s => s.classList.toggle('on', s.id === 'sec-' + name));
  document.querySelectorAll('#acctNav a[data-acct]').forEach(a => a.classList.toggle('on', a.dataset.acct === name));
  if(name === 'dashboard') loadDashboard();
  if(name === 'profile') loadProfile();
  if(name === 'orders') loadOrders();
  if(name === 'addresses') loadAddresses();
  if(name === 'payments') loadPayments();
  if(name === 'reviews') loadReviews();
  if(name === 'notifications') loadNotifications();
}
function currentSection(){ return (location.hash || '#dashboard').slice(1); }
window.addEventListener('hashchange', () => showSection(currentSection()));

async function boot(){
  const u = await window.kvRequireLogin();
  if(!u) return;
  showSection(currentSection());
}

async function loadDashboard(){
  let orders = [], wish = [];
  try{ orders = await kvApi('/api/orders'); }catch(e){}
  try{ wish = await kvApi('/api/wishlist'); }catch(e){}
  myOrders = orders;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const activeCount = orders.filter(o => ['processing','shipped'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  document.getElementById('dashStats').innerHTML =
    '<div class="stat-tile"><b>' + orders.length + '</b><span>Tổng đơn hàng</span></div>' +
    '<div class="stat-tile"><b>' + pendingCount + '</b><span>Chờ thanh toán</span></div>' +
    '<div class="stat-tile"><b>' + activeCount + '</b><span>Đang xử lý/giao</span></div>' +
    '<div class="stat-tile"><b>' + wish.length + '</b><span>Yêu thích</span></div>';
  document.getElementById('dashRecentOrders').innerHTML = orders.slice(0,5).map(orderRowHTML).join('') || '<p style="color:var(--muted)">Bạn chưa có đơn hàng nào.</p>';
}

async function loadProfile(){
  const u = await window.kvReady;
  document.getElementById('pfEditName').value = u.name || '';
  document.getElementById('pfEditUsername').value = u.username || '';
  document.getElementById('pfEditEmail').value = u.email || '';
  document.getElementById('pfEditPhone').value = u.phone || '';
}
document.getElementById('pfEditSave').addEventListener('click', async () => {
  const err = document.getElementById('pfEditErr'); err.textContent = '';
  try{
    const updated = await kvApi('/api/auth/me', {method:'PATCH', body: JSON.stringify({
      name: document.getElementById('pfEditName').value.trim(),
      email: document.getElementById('pfEditEmail').value.trim(),
      phone: document.getElementById('pfEditPhone').value.trim() || null,
    })});
    kvSetUser(updated);
    showToast('✦ Đã lưu thông tin tài khoản');
  }catch(e){ err.textContent = e.message; }
});

function orderRowHTML(o){
  return '<div class="order-row"><div class="top"><b>Đơn #' + o.id + '</b><span class="status-pill status-' + o.status + '">' + STAGE_LABEL[o.status] + '</span></div>' +
    '<div style="font-size:12.5px;color:var(--muted)">' + new Date(o.created_at).toLocaleDateString('vi-VN') + ' · ' + o.items.length + ' sản phẩm · ' + fmtVnd(o.total_price) + '</div>' +
    '<div style="margin-top:8px"><a href="track-order.html?order=' + o.id + '" class="btn btn-line" style="padding:7px 14px;font-size:12px">Theo dõi đơn hàng →</a></div></div>';
}
async function loadOrders(){
  const box = document.getElementById('ordersList');
  box.innerHTML = '<p style="color:var(--muted)">Đang tải…</p>';
  try{ myOrders = await kvApi('/api/orders'); }catch(e){ box.innerHTML = '<p>Không tải được đơn hàng.</p>'; return; }
  box.innerHTML = myOrders.length ? myOrders.map(orderRowHTML).join('') : '<p style="color:var(--muted)">Bạn chưa có đơn hàng nào. <a href="shop.html">Mua sắm ngay</a></p>';
}

function addrCardHTML(a){
  return '<div class="addr-card' + (a.is_default?' on':'') + '"><b>' + esc(a.label) + '</b>' + (a.is_default ? ' <span style="color:var(--gold-soft);font-size:11px">(Mặc định)</span>' : '') +
    '<div style="font-size:13px;color:var(--muted);margin-top:4px">' + esc(a.recipient_name) + ' · ' + esc(a.phone) + '<br>' + esc(a.address_line) + '</div>' +
    '<div style="margin-top:8px;display:flex;gap:10px;font-size:12px">' +
      (!a.is_default ? '<a data-def="' + a.id + '" style="color:var(--gold-soft);cursor:pointer">Đặt làm mặc định</a>' : '') +
      '<a data-deladdr="' + a.id + '" style="color:var(--vermilion);cursor:pointer">Xoá</a>' +
    '</div></div>';
}
async function loadAddresses(){
  const box = document.getElementById('addrAcctList');
  try{ myAddresses = await kvApi('/api/addresses'); }catch(e){ box.innerHTML = '<p>Không tải được địa chỉ.</p>'; return; }
  box.innerHTML = myAddresses.length ? myAddresses.map(addrCardHTML).join('') : '<p style="color:var(--muted)">Bạn chưa lưu địa chỉ nào.</p>';
  box.querySelectorAll('[data-def]').forEach(a => a.addEventListener('click', async () => { await kvApi('/api/addresses/' + a.dataset.def + '/default', {method:'PATCH'}); loadAddresses(); }));
  box.querySelectorAll('[data-deladdr]').forEach(a => a.addEventListener('click', async () => { await kvApi('/api/addresses/' + a.dataset.deladdr, {method:'DELETE'}); loadAddresses(); }));
}
document.getElementById('addrAcctNew').addEventListener('click', () => { document.getElementById('addrAcctForm').hidden = false; });
document.getElementById('aaSave').addEventListener('click', async () => {
  const err = document.getElementById('aaErr'); err.textContent = '';
  const label = document.getElementById('aaLabel').value.trim() || 'Địa chỉ mới';
  const recipient_name = document.getElementById('aaName').value.trim();
  const phone = document.getElementById('aaPhone').value.trim();
  const address_line = document.getElementById('aaAddr').value.trim();
  const is_default = document.getElementById('aaDefault').checked;
  if(!recipient_name || !phone || !address_line){ err.textContent = 'Vui lòng điền đầy đủ thông tin.'; return; }
  try{
    await kvApi('/api/addresses', {method:'POST', body: JSON.stringify({label, recipient_name, phone, address_line, is_default})});
    document.getElementById('addrAcctForm').hidden = true;
    ['aaLabel','aaName','aaPhone','aaAddr'].forEach(id => document.getElementById(id).value = '');
    loadAddresses();
  }catch(e){ err.textContent = e.message; }
});

async function loadPayments(){
  const box = document.getElementById('paymentsList');
  box.innerHTML = '<p style="color:var(--muted)">Đang tải…</p>';
  let orders;
  try{ orders = await kvApi('/api/orders'); }catch(e){ box.innerHTML = '<p>Không tải được dữ liệu.</p>'; return; }
  const rows = [];
  orders.forEach(o => o.payments.forEach(p => rows.push({order_id: o.id, ...p})));
  if(!rows.length){ box.innerHTML = '<p style="color:var(--muted)">Chưa có giao dịch thanh toán nào.</p>'; return; }
  box.innerHTML = rows.map(p =>
    '<div class="pay-seller-block"><div style="display:flex;justify-content:space-between"><b>Đơn #' + p.order_id + ' · ' + esc(p.shop_name) + '</b><span class="pay-status ' + p.status + '">' + (p.status==='completed'?'Đã hoàn tất':p.status==='failed'?'Thất bại':(p.buyer_confirmed_at?'Chờ người bán':'Chờ bạn xác nhận')) + '</span></div>' +
    '<p style="font-size:13px;color:var(--muted);margin-top:6px">Số tiền: <b>' + fmtVnd(p.amount) + '</b></p>' +
    (p.status === 'pending' && !p.buyer_confirmed_at ? '<button class="btn btn-amber" data-pay-order="' + p.order_id + '" data-pay-seller="' + p.seller_id + '" type="button" style="width:100%;justify-content:center">Tôi đã chuyển khoản</button>' : '') +
    '</div>'
  ).join('');
  box.querySelectorAll('[data-pay-order]').forEach(b => b.addEventListener('click', async () => {
    b.disabled = true;
    try{ await kvApi('/api/orders/' + b.dataset.payOrder + '/payments/' + b.dataset.paySeller + '/buyer-confirm', {method:'POST'}); loadPayments(); showToast('✦ Đã xác nhận'); }
    catch(e){ showToast(e.message); b.disabled = false; }
  }));
}

async function loadReviews(){
  const box = document.getElementById('reviewsList');
  let rows;
  try{ rows = await kvApi('/api/reviews/me'); }catch(e){ box.innerHTML = '<p>Không tải được đánh giá.</p>'; return; }
  box.innerHTML = rows.length ? rows.map(r =>
    '<div class="review-row"><div style="display:flex;justify-content:space-between"><b>' + esc(r.product_name) + '</b><span style="color:var(--gold)">' + '★'.repeat(r.rating) + '☆'.repeat(5-r.rating) + '</span></div>' +
    (r.comment ? '<p style="margin-top:6px;color:var(--muted)">' + esc(r.comment) + '</p>' : '') +
    (r.images.length ? '<div class="rv-imgs">' + r.images.map(im => '<img src="' + im + '">').join('') + '</div>' : '') +
    '<a href="product.html?id=' + r.product_id + '" style="font-size:12px;color:var(--gold-soft)">Xem sản phẩm →</a></div>'
  ).join('') : '<p style="color:var(--muted)">Bạn chưa đánh giá sản phẩm nào.</p>';
}

async function loadNotifications(){
  const box = document.getElementById('notifList');
  let rows;
  try{ rows = await kvApi('/api/notifications'); }catch(e){ box.innerHTML = '<p>Không tải được thông báo.</p>'; return; }
  box.innerHTML = rows.length ? rows.map(n =>
    '<div class="notif-row ' + (n.is_read?'':'unread') + '" data-id="' + n.id + '">' + (n.is_read?'':'<div class="n-dot"></div>') +
    '<div class="n-body"><b>' + esc(n.title) + '</b><p>' + esc(n.message) + '</p></div>' +
    '<span class="n-time">' + new Date(n.created_at).toLocaleDateString('vi-VN') + '</span></div>'
  ).join('') : '<p style="color:var(--muted)">Chưa có thông báo nào.</p>';
  box.querySelectorAll('.notif-row.unread').forEach(row => row.addEventListener('click', async () => {
    await kvApi('/api/notifications/' + row.dataset.id + '/read', {method:'PATCH'});
    loadNotifications(); kvSyncNotifBadge();
  }));
}
document.getElementById('markAllReadBtn').addEventListener('click', async () => {
  await kvApi('/api/notifications/read-all', {method:'PATCH'});
  loadNotifications(); kvSyncNotifBadge();
});

document.getElementById('cpSave').addEventListener('click', async () => {
  const err = document.getElementById('cpErr'); err.textContent = '';
  const current_password = document.getElementById('cpCurrent').value;
  const new_password = document.getElementById('cpNew').value;
  if(new_password.length < 6){ err.textContent = 'Mật khẩu mới cần ít nhất 6 ký tự.'; return; }
  try{
    await kvApi('/api/auth/change-password', {method:'POST', body: JSON.stringify({current_password, new_password})});
    document.getElementById('cpCurrent').value = ''; document.getElementById('cpNew').value = '';
    showToast('✦ Đã đổi mật khẩu thành công');
  }catch(e){ err.textContent = e.message; }
});

document.querySelectorAll('#acctNav a[data-acct]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); location.hash = a.dataset.acct; showSection(a.dataset.acct);
}));
document.getElementById('acctLogout').addEventListener('click', e => {
  e.preventDefault();
  localStorage.removeItem('kvToken');
  window.location.href = 'index.html';
});

boot();
