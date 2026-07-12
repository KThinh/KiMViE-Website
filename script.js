/* =========================================================================
   KIMVIE — interaction layer
   (sound, chatbot and CSKH widgets intentionally removed in this redesign)
   ========================================================================= */

/* ===== SPA router ===== */
const pages = document.querySelectorAll('main[data-page]');
const navLinks = document.querySelectorAll('[data-go]');
function go(p){
  if(![...pages].some(m => m.dataset.page === p)) p = 'home';   // trang cũ (vd: lang) -> về trang chủ
  pages.forEach(m => m.classList.toggle('active', m.dataset.page === p));
  const nk = (p === 'article' || p.startsWith('art-')) ? 'story' : p;
  document.querySelectorAll('.menu a').forEach(a => a.classList.toggle('on', a.dataset.go === nk));
  document.body.classList.remove('nav-open');            // close mobile menu
  if(window.stamp){ if(p === 'expo') stamp('expo'); if(p === 'article' || p.startsWith('art-')) stamp('read'); }
  window.scrollTo({top:0, behavior:'instant'});
  history.replaceState(null, '', '#' + p);
  if(window.kvMotion) kvMotion.pageEnter(p); else retagReveal();
}
navLinks.forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.go); }));

/* ===== mobile menu ===== */
const navToggle = document.getElementById('navToggle');
if(navToggle){
  navToggle.addEventListener('click', () => document.body.classList.toggle('nav-open'));
}

/* ===== cart + checkout (mô phỏng) ===== */
const CART_KEY = 'kvCart';
let cartItems = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const badge = document.getElementById('cartBadge');
const toast = document.getElementById('toast');
let toastT;
function showToast(html){
  toast.innerHTML = html; toast.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2400);
}
function fmtVnd(n){ return n.toLocaleString('vi-VN') + 'đ'; }
function cartCount(){ return cartItems.reduce((s, i) => s + i.qty, 0); }
function cartTotal(){ return cartItems.reduce((s, i) => s + i.price * i.qty, 0); }
function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  const n = cartCount();
  badge.textContent = n; badge.classList.toggle('show', n > 0);
}
function addToCart(name, price){
  const it = cartItems.find(i => i.name === name);
  if(it) it.qty++; else cartItems.push({name, price, qty:1});
  saveCart();
  showToast('Đã thêm <b>' + name + '</b> vào giỏ hàng ✦');
  if(window.stamp) stamp('cart');
}
document.querySelectorAll('.cart-btn').forEach(b => b.addEventListener('click', (e) => {
  e.stopPropagation();
  const priceEl = b.closest('.p-foot') ? b.closest('.p-foot').querySelector('.price') : null;
  const price = priceEl ? parseInt(priceEl.textContent.replace(/\D/g, ''), 10) || 0 : 0;
  addToCart(b.dataset.name || 'Sản phẩm', price);
}));
saveCart();

/* checkout modal — 4 steps: cart -> info -> QR -> done */
const cartModal = document.getElementById('cartModal');
/* ===== voucher (1 mã / hóa đơn, dùng xong hoặc quá hạn sẽ mất) ===== */
const VOUCHERS = {
  GIULUA10:{type:'pct', val:10,    label:'Người Giữ Lửa — giảm 10%'},
  TINHHOA15:{type:'pct', val:15,   label:'Tinh hoa — giảm 15%'},
  FREESHIP:{type:'amt', val:30000, label:'Miễn 30.000đ phí vận chuyển'}
};
let usedVouchers = JSON.parse(localStorage.getItem('kvUsedVouchers') || '[]');
let voucher = null;                                    // mã đang áp cho hóa đơn hiện tại
function discountOf(total){
  if(!voucher) return 0;
  const v = VOUCHERS[voucher];
  return Math.min(total, v.type === 'pct' ? Math.round(total * v.val / 100) : v.val);
}
(function(){
  if(!cartModal) return;
  const list = document.getElementById('cartList');
  const titles = {1:'Giỏ hàng của bạn', 2:'Thông tin nhận hàng', 3:'Quét QR để thanh toán', 4:'Hoàn tất đơn hàng'};
  let step = 1, orderCode = '';

  function setStep(s){
    step = s;
    document.getElementById('ckTitle').textContent = titles[s];
    for(let i = 1; i <= 4; i++) document.getElementById('ckStep' + i).classList.toggle('on', i === s);
    document.querySelectorAll('#ckSteps span').forEach(el => el.classList.toggle('on', +el.dataset.s <= Math.min(s, 3)));
  }
  function renderCart(){
    if(!cartItems.length){
      list.innerHTML = '<div class="ck-empty"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1.2 10.3a2 2 0 0 1-2 1.7H8.2a2 2 0 0 1-2-1.7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><p>Giỏ hàng đang trống.<br>Ghé <b>Sàn thương mại</b> để chọn một món quà làng nghề nhé.</p></div>';
    } else {
      list.innerHTML = cartItems.map((i, idx) =>
        '<div class="ck-row">' +
          '<div class="ck-info"><h5>' + i.name + '</h5><span>' + fmtVnd(i.price) + '</span></div>' +
          '<div class="ck-qty">' +
            '<button type="button" data-q="-1" data-i="' + idx + '" aria-label="Giảm số lượng">−</button>' +
            '<b>' + i.qty + '</b>' +
            '<button type="button" data-q="1" data-i="' + idx + '" aria-label="Tăng số lượng">+</button>' +
          '</div>' +
          '<div class="ck-line">' + fmtVnd(i.price * i.qty) + '</div>' +
          '<button class="ck-rm" type="button" data-rm="' + idx + '" aria-label="Xóa sản phẩm">✕</button>' +
        '</div>').join('');
    }
    const total = cartTotal(), disc = discountOf(total), final = total - disc;
    document.getElementById('ckSum1').innerHTML =
      '<div class="srow"><span>Tạm tính (' + cartCount() + ' sản phẩm)</span><span>' + fmtVnd(total) + '</span></div>' +
      (voucher ? '<div class="srow disc"><span>Voucher ' + voucher +
        ' <button class="x-vc" type="button" id="vcRemove">✕ bỏ mã</button></span><span>−' + fmtVnd(disc) + '</span></div>' : '') +
      '<div class="srow total"><span>Thành tiền</span><b>' + fmtVnd(final) + '</b></div>';
    document.getElementById('ckTotal2').innerHTML =
      '<span>Thành tiền (' + cartCount() + ' sản phẩm' + (voucher ? ' · đã áp ' + voucher : '') + ')</span><b>' + fmtVnd(final) + '</b>';
    document.getElementById('ckToInfo').disabled = !cartItems.length;
    const rm = document.getElementById('vcRemove');
    if(rm) rm.addEventListener('click', () => {
      voucher = null;
      setVcMsg('Đã bỏ voucher khỏi hóa đơn.', false);
      renderCart();
    });
  }
  function setVcMsg(t, err){
    const m = document.getElementById('vcMsg');
    m.textContent = t; m.className = 'vc-msg ' + (err ? 'err' : 'ok');
  }
  document.getElementById('vcApply').addEventListener('click', () => {
    const code = document.getElementById('vcInput').value.trim().toUpperCase();
    if(!code){ setVcMsg('Vui lòng nhập mã giảm giá.', true); return; }
    if(voucher){ setVcMsg('Chỉ được áp dụng 1 voucher cho mỗi hóa đơn — hãy bỏ mã hiện tại trước.', true); return; }
    if(!VOUCHERS[code]){ setVcMsg('Mã "' + code + '" không hợp lệ.', true); return; }
    if(usedVouchers.includes(code)){ setVcMsg('Mã "' + code + '" đã được sử dụng hoặc hết hạn.', true); return; }
    voucher = code;
    document.getElementById('vcInput').value = '';
    setVcMsg('✓ Đã áp dụng: ' + VOUCHERS[code].label, false);
    renderCart();
  });
  window.openCart = function(){ renderCart(); setStep(1); cartModal.classList.add('open'); };
  function closeCart(){ cartModal.classList.remove('open'); }

  document.getElementById('cartBtn').addEventListener('click', openCart);
  cartModal.querySelectorAll('[data-cx]').forEach(el => el.addEventListener('click', closeCart));
  cartModal.querySelectorAll('[data-ckback]').forEach(b => b.addEventListener('click', () => setStep(+b.dataset.ckback)));

  list.addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
    if(q){
      const it = cartItems[+q.dataset.i]; if(!it) return;
      it.qty += +q.dataset.q;
      if(it.qty < 1) cartItems.splice(+q.dataset.i, 1);
    } else if(rm){
      cartItems.splice(+rm.dataset.rm, 1);
    } else return;
    saveCart(); renderCart();
  });

  document.getElementById('ckToInfo').addEventListener('click', () => { if(cartItems.length) setStep(2); });

  document.getElementById('ckForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('ckEmail').value.trim();
    const addr = document.getElementById('ckAddr').value.trim();
    const err = document.getElementById('ckErr');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ err.textContent = 'Vui lòng nhập địa chỉ email hợp lệ.'; return; }
    if(!addr){ err.textContent = 'Vui lòng nhập địa chỉ nhận hàng.'; return; }
    err.textContent = '';
    orderCode = 'KIMVIE KV' + String(Date.now()).slice(-6);
    document.getElementById('ckAmount').textContent = fmtVnd(cartTotal() - discountOf(cartTotal()));
    document.getElementById('ckMemo').textContent = orderCode;
    setStep(3);
  });

  document.getElementById('ckPaid').addEventListener('click', () => {
    const email = document.getElementById('ckEmail').value.trim();
    const paid = cartTotal() - discountOf(cartTotal());
    document.getElementById('ckDoneMsg').innerHTML =
      'Đơn hàng <b>' + orderCode.replace('KIMVIE ', '') + '</b> (' + fmtVnd(paid) + ') đã được ghi nhận.<br>Xác nhận demo sẽ được gửi tới <b>' + email + '</b>.';
    if(voucher){                                       // voucher dùng xong sẽ mất
      usedVouchers.push(voucher);
      localStorage.setItem('kvUsedVouchers', JSON.stringify(usedVouchers));
      voucher = null;
      document.getElementById('vcMsg').textContent = '';
    }
    cartItems = []; saveCart();
    setStep(4);
  });

  /* "Xem thử sản phẩm" -> mô phỏng sử dụng sản phẩm */
  document.getElementById('ckTry').addEventListener('click', e => {
    e.preventDefault();
    closeCart();
    go('market');
    if(window.simPreload && cartItems.length) simPreload(cartItems[0].name);
    setTimeout(() => { const s = document.getElementById('simulator'); if(s) s.scrollIntoView({behavior:'smooth'}); }, 80);
  });

  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeCart(); });
})();

/* ===== sold counts on product cards ===== */
const SOLD = {'Bộ ấm trà men hỏa biến':'980','Hũ đựng trà Mã Đáo Thành Công':'1,1k','Đĩa trưng bày hoa sen ánh trăng':'640','Cà vạt lụa tơ tằm':'2,3k','Khăn lụa vân sen hồng':'1,7k','Hộp đựng đồ mây tre đan':'860','Túi đeo chéo mây tre đan':'1,4k','Bình hút lộc Mã Đáo Thành Công':'420','Bình sen vàng kim men xanh đồng':'260','Đĩa sứ bầu dục men lam':'730','Khăn tơ ngũ sắc xanh cam':'1,2k','Áo dài lụa tơ tằm Hà Đông':'180','Túi đan ruột mây hình chữ nhật':'540'};
document.querySelectorAll('.p-card').forEach(c => {
  const h = c.querySelector('h4'), pl = c.querySelector('.pl');
  if(h && pl && SOLD[h.textContent.trim()]){
    const d = document.createElement('div'); d.className = 'sold';
    d.textContent = '★ 4.9 · Đã bán ' + SOLD[h.textContent.trim()]; pl.after(d);
  }
});

/* ===== footer quick links -> filtered market ===== */
document.querySelectorAll('[data-mf]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); go('market');
  const c = document.querySelector('.filters .chip[data-f="' + a.dataset.mf + '"]'); if(c) c.click();
}));

/* ===== demo article links ===== */
document.querySelectorAll('.soon').forEach(el => el.addEventListener('click', e => {
  e.preventDefault(); showToast('✦ Bài viết demo — nội dung sẽ được cập nhật ✦');
}));

/* ===== village profile tabs ===== */
document.querySelectorAll('.vtab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.vtab').forEach(x => x.classList.remove('on')); t.classList.add('on');
  document.querySelectorAll('.vpanel').forEach(p => p.classList.toggle('on', p.id === 'vp-' + t.dataset.v));
  if(window.stamp) stamp(t.dataset.v);
  if(window.kvMotion) kvMotion.refresh(); else retagReveal();
}));

/* ===== heritage passport ===== */
const STAMPS = [
 {id:'bt',name:'Men Lam',icon:'s-vase',vb:'0 0 100 150',how:'Mở hồ sơ Gốm Bát Tràng trên trang Bản đồ làng nghề'},
 {id:'vp',name:'Tơ Vàng',icon:'s-loom',vb:'0 0 160 130',how:'Mở hồ sơ Lụa Vạn Phúc trên trang Bản đồ làng nghề'},
 {id:'pv',name:'Tre Xanh',icon:'s-basket',vb:'0 0 120 110',how:'Mở hồ sơ Mây tre Phú Vinh trên trang Bản đồ làng nghề'},
 {id:'expo',name:'Lữ Khách',icon:'s-arch-mini',vb:'0 0 80 100',how:'Ghé thăm trang Bản đồ làng nghề'},
 {id:'relic',name:'Hiện Vật',icon:'s-lantern',vb:'0 0 110 140',how:'Mở xem chi tiết một sản phẩm bất kỳ'},
 {id:'read',name:'Thư Làng',icon:'s-lac',vb:'0 0 160 100',how:'Đọc bài viết Câu chuyện thương hiệu'},
 {id:'cart',name:'Giữ Lửa',icon:'s-fire',vb:'0 0 60 60',how:'Thêm một sản phẩm vào giỏ hàng'}
];
let earned = JSON.parse(localStorage.getItem('kvStamps') || '{}');
let ppSeen = parseInt(localStorage.getItem('kvPPSeen') || '0', 10);   // số dấu đã xem — chấm đỏ chỉ báo dấu MỚI
const ppModal = document.getElementById('ppModal'), ppGrid = document.getElementById('ppGrid');

/* hiệu ứng chúc mừng (confetti) */
function celebrate(n){
  const box = document.createElement('div'); box.className = 'confetti-box';
  const colors = ['#D9943F','#A8352C','#2E5233','#E2C57E','#161E45'];
  for(let i = 0; i < (n || 36); i++){
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
    c.style.animationDelay = (Math.random() * .5) + 's';
    box.appendChild(c);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4200);
}

function renderPassport(){
  const n = Object.keys(earned).length;
  ppGrid.innerHTML = STAMPS.map(s => '<div class="stamp' + (earned[s.id] ? ' got' : '') + '" data-stamp="' + s.id + '" title="Bấm để xem cách đạt được">'
    + '<svg class="art" width="30" height="30" viewBox="' + s.vb + '"><use href="#' + s.icon + '"/></svg>'
    + '<small>' + s.name + '</small></div>').join('');
  document.getElementById('ppCount').textContent = n + '/7 con dấu';
  document.getElementById('ppTitle').textContent = n >= 7 ? '✦ Người Giữ Lửa ✦' : (n >= 4 ? 'Lữ khách thân quen' : 'Lữ khách mới');
  document.getElementById('ppFill').style.width = (n / 7 * 100) + '%';
  const unseen = Math.max(0, n - ppSeen);              // đã mở hộ chiếu xem rồi thì chấm đỏ biến mất
  const bd = document.getElementById('ppBadge'); bd.textContent = unseen; bd.classList.toggle('show', unseen > 0);
  document.getElementById('ppBtn').classList.toggle('has-new', unseen > 0);
  document.getElementById('ppReward').innerHTML = n >= 7
    ? '<b style="color:var(--vermilion)">Đủ 7 con dấu — bạn chính thức là NGƯỜI GIỮ LỬA!</b><br>Mã ưu đãi 10% cho đơn tiếp theo — nhập ở bước Giỏ hàng:<br><span class="code">GIULUA10</span>'
    : 'Sưu tập đủ <b>7 con dấu</b> để nhận danh hiệu <b>Người Giữ Lửa</b> + mã ưu đãi 10%.<br><span style="font-size:11px">Bấm vào từng ô dấu để biết cách nhận.</span>';
}

/* bấm vào ô con dấu: hiện nổi bật cách đạt / hướng dẫn nhận thưởng */
ppGrid.addEventListener('click', e => {
  const el = e.target.closest('.stamp'); if(!el) return;
  const s = STAMPS.find(x => x.id === el.dataset.stamp); if(!s) return;
  const box = document.getElementById('ppDetail');
  if(earned[s.id]){
    box.innerHTML = '<h6>🎉 Đã đạt — con dấu "' + s.name + '"</h6>'
      + 'Chúc mừng bạn! Con dấu này đã nằm trong hộ chiếu. '
      + (Object.keys(earned).length >= 7
        ? 'Bạn đã đủ 7/7 dấu — dùng mã dưới đây khi thanh toán (ô "Mã giảm giá / Voucher" trong Giỏ hàng):<br><span class="code">GIULUA10</span>'
        : 'Còn ' + (7 - Object.keys(earned).length) + ' dấu nữa để nhận danh hiệu <b>Người Giữ Lửa</b> và mã ưu đãi 10%.');
    celebrate(20);
  } else {
    box.innerHTML = '<h6>❖ Cách đạt con dấu "' + s.name + '"</h6>' + s.how + '.';
  }
  box.classList.add('on');
});

window.stamp = function(id){
  if(earned[id]) return;
  const s = STAMPS.find(x => x.id === id); if(!s) return;
  earned[id] = Date.now(); localStorage.setItem('kvStamps', JSON.stringify(earned));
  renderPassport();
  const n = Object.keys(earned).length;
  celebrate(n >= 7 ? 80 : 28);
  showToast(n >= 7 ? '🎉 Đủ 7 dấu — bạn là <b>Người Giữ Lửa</b>! Mở hộ chiếu nhận ưu đãi'
                   : '❖ Nhận dấu <b>' + s.name + '</b> (' + n + '/7) — xem trong Hộ chiếu di sản');
};
function openPP(){
  ppSeen = Object.keys(earned).length;                 // đánh dấu đã xem — tắt chấm đỏ thông báo
  localStorage.setItem('kvPPSeen', String(ppSeen));
  renderPassport(); ppModal.classList.add('open');
}
document.getElementById('ppBtn').addEventListener('click', openPP);
ppModal.querySelectorAll('[data-ppx]').forEach(el => el.addEventListener('click', () => ppModal.classList.remove('open')));
document.getElementById('ppReset').addEventListener('click', e => {
  e.preventDefault(); earned = {}; localStorage.removeItem('kvStamps');
  ppSeen = 0; localStorage.removeItem('kvPPSeen');
  renderPassport();
  showToast('Hộ chiếu đã làm mới — bắt đầu hành trình nào ✦');
});
document.querySelectorAll('.ev-book').forEach(b => b.addEventListener('click', e => {
  e.preventDefault();
  if(!earned.ws){ stamp('ws'); } else { showToast('Đã ghi nhận đặt chỗ (demo) ✦'); }
}));
renderPassport();

/* ===== product "digital ID" + QR ===== */
const ARTISAN = {bt:'NNND Trần Độ', vp:'Nghệ nhân Nguyễn Thị Tâm', pv:'NNND Nguyễn Văn Tĩnh'};
function khash(s){ let h = 7; for(const c of s) h = (h * 31 + c.charCodeAt(0)) % 99991; return h; }
function qrSvg(code){
  const h = khash(code), N = 15, c = 5; let r = '';
  const inF = (i,j) => (i < 5 && j < 5) || (i < 5 && j >= N - 5) || (i >= N - 5 && j < 5);
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++){
    if(inF(i,j)){
      const ii = i < 5 ? i : i - (N - 5), jj = j < 5 ? j : j - (N - 5);
      if(ii === 0 || ii === 4 || jj === 0 || jj === 4 || (ii === 2 && jj === 2)) r += '<rect x="' + (j*c) + '" y="' + (i*c) + '" width="' + c + '" height="' + c + '"/>';
    } else if(((h + (i*N + j)*73) % 7) < 3){
      r += '<rect x="' + (j*c) + '" y="' + (i*c) + '" width="' + c + '" height="' + c + '"/>';
    }
  }
  return '<svg width="87" height="87" viewBox="0 0 ' + (N*c) + ' ' + (N*c) + '" xmlns="http://www.w3.org/2000/svg"><g fill="#15110D">' + r + '</g></svg>';
}
window.fillIdCard = function(p){
  const h = khash(p.name);
  const code = 'KV-' + p.f.toUpperCase() + '-' + (100 + h % 900);
  document.getElementById('idCode').textContent = code;
  document.getElementById('idArt').textContent = ARTISAN[p.f] || 'Nghệ nhân làng nghề';
  document.getElementById('idBatch').textContent = 'Mẻ tháng 6 · ra lò 0' + (1 + h % 9) + '.06.2026';
  document.getElementById('idSerial').textContent = 'Số ' + (1 + h % 28) + '/30';
  document.getElementById('mQr').innerHTML = qrSvg(code);
};
window.setMTab = function(t){
  document.getElementById('mtIntro').classList.toggle('on', t === 'intro');
  document.getElementById('mtCard').classList.toggle('on', t === 'card');
  document.getElementById('mCard').classList.toggle('on', t === 'card');
};
document.getElementById('mtIntro').addEventListener('click', () => setMTab('intro'));
document.getElementById('mtCard').addEventListener('click', () => setMTab('card'));

/* ===== "Điểm khác biệt" CTA buttons ===== */
document.getElementById('newPass').addEventListener('click', openPP);
document.getElementById('newId').addEventListener('click', () => { openProduct('am-tra'); setMTab('card'); });
document.getElementById('newSnd').addEventListener('click', () => go('expo'));

/* ===== product catalogue + modal ===== */
const PROD_DIR = 'assets/product_img/';
const PRODUCTS = {
 'am-tra':{name:'Bộ ấm trà men hỏa biến',tag:'Gốm Bát Tràng',f:'bt',price:'1.450.000đ',img:'Bộ Ấm Trà Đĩa Men Hỏa Biến Xanh Khay Hoa Xanh.png',
  desc:'Bộ ấm trà phủ men hỏa biến xanh ngọc — sắc men biến ảo theo nhiệt độ lò nung, kèm đĩa và khay hoa xanh. Mỗi mẻ ra lò cho một dải màu độc nhất, không chiếc nào giống chiếc nào.'},
 'hu-tra':{name:'Hũ đựng trà Mã Đáo Thành Công',tag:'Gốm Bát Tràng',f:'bt',price:'1.180.000đ',img:'Hũ Đựng Trà Men Xanh Mã Đáo Thành Công Vẽ Vàng.png',
  desc:'Hũ sứ men xanh vẽ vàng họa tiết "Mã Đáo Thành Công" — biểu tượng cát tường, may mắn. Nắp khít giữ hương trà thơm lâu; từng nét vàng kim được vẽ tay thủ công.'},
 'dia-sen':{name:'Đĩa trưng bày hoa sen ánh trăng',tag:'Gốm Bát Tràng',f:'bt',price:'1.350.000đ',img:'Đĩa Trưng Bày Đắp Nổi Vẽ Màu Hoa Sen Ánh Trăng.png',
  desc:'Đĩa trưng bày đắp nổi, vẽ màu hoa sen dưới ánh trăng — tinh xảo trong từng cánh sen, từng gợn nước. Một tác phẩm trang trí mang hồn Việt cho không gian sống.'},
 'cavat-lua':{name:'Cà vạt lụa tơ tằm',tag:'Lụa Vạn Phúc',f:'vp',price:'680.000đ',img:'CARAVAT LỤA TƠ TẰM NGHỆ NHÂN đỏ đô.png',
  desc:'Cà vạt dệt 100% lụa tơ tằm Vạn Phúc, sắc đỏ đô sang trọng với hoa văn chìm tinh tế. Kèm hộp gỗ khắc hoa văn — món quà lịch lãm cho phái mạnh.'},
 'khan-sen':{name:'Khăn lụa vân sen hồng',tag:'Lụa Vạn Phúc',f:'vp',price:'920.000đ',img:'Khăn lụa vân Sen hồng phối màu.png',
  desc:'Khăn lụa vân sen phối sắc hồng — hoa văn sen ẩn hiện khi soi nắng, mềm mại và thoáng nhẹ như hơi thở. Dệt thủ công trên khung cửi nghìn năm tuổi nghề.'},
 'hop-may':{name:'Hộp đựng đồ mây tre đan',tag:'Mây tre Phú Vinh',f:'pv',price:'540.000đ',img:'Hộp đựng đồ Mây Tre Đan.png',
  desc:'Hộp đựng đồ đan tay từ mây tre Phú Vinh theo kỹ thuật nong đôi bền chắc, đã xử lý chống mối mọt. Mộc mạc mà tinh tế cho không gian sống hiện đại.'},
 'tui-may':{name:'Túi đeo chéo mây tre đan',tag:'Mây tre Phú Vinh',f:'pv',price:'750.000đ',img:'Túi Đeo Chéo Mây Tre Đan.png',
  desc:'Túi đeo chéo đan tay phối quai mây tròn, hoa văn xương cá đặc trưng Phú Vinh. Nhẹ, bền và thời trang — đưa mây tre Việt vào nhịp sống đương đại.'},
 'binh-loc':{name:'Bình hút lộc Mã Đáo Thành Công',tag:'Gốm Bát Tràng',f:'bt',price:'2.200.000đ',img:'Bình hút lộc Bát Tràng vẽ mã đáo thành công.png',
  desc:'Bình hút lộc dáng tròn đầy, vẽ tay họa tiết "Mã Đáo Thành Công" trên nền men cao cấp — biểu tượng tài lộc, hanh thông. Đặt phòng khách hay bàn làm việc để chiêu tài, giữ vượng khí.'},
 'binh-sen':{name:'Bình sen vàng kim men xanh đồng',tag:'Gốm Bát Tràng',f:'bt',price:'2.850.000đ',img:'Bình sen vàng kim cao cấp men xanh đồng.png',
  desc:'Bình cắm hoa men xanh đồng phủ vàng kim, đắp nổi hoa sen — quốc hoa của Việt Nam. Nước men trầm sang trọng, đường nét vàng vẽ tay tỉ mỉ, tôn dáng cho mọi không gian.'},
 'dia-bau':{name:'Đĩa sứ bầu dục men lam',tag:'Gốm Bát Tràng',f:'bt',price:'890.000đ',img:'Đĩa sứ bầu dục.png',
  desc:'Đĩa sứ dáng bầu dục vẽ men lam cổ điển — vừa để bày biện món ăn, vừa làm vật trang trí. Cốt sứ mỏng, thấu quang, an toàn cho thực phẩm.'},
 'khan-nguson':{name:'Khăn tơ ngũ sắc xanh cam',tag:'Lụa Vạn Phúc',f:'vp',price:'780.000đ',img:'Khăn tơ ngũ sắc xanh cam.png',
  desc:'Khăn tơ tằm phối ngũ sắc xanh — cam rực rỡ, dệt thủ công tại Vạn Phúc. Chất tơ mềm rủ, lên màu tươi mà vẫn tinh tế — điểm nhấn cho trang phục ngày thường lẫn dự tiệc.'},
 'aodai-lua':{name:'Áo dài lụa tơ tằm Hà Đông',tag:'Lụa Vạn Phúc',f:'vp',price:'3.600.000đ',img:'Áo dài lụa tơ tằm Hà Đông cẩm giao.png',
  desc:'Áo dài may từ lụa tơ tằm Hà Đông nguyên tấm, hoa văn cẩm giao trang nhã. Chất lụa óng nhẹ, thoáng mát, ôm dáng mềm mại — tôn vẻ đẹp Á Đông trong từng đường tà.'},
 'tui-ruot-may':{name:'Túi đan ruột mây hình chữ nhật',tag:'Mây tre Phú Vinh',f:'pv',price:'690.000đ',img:'Túi Đan ruột mây hình chữ nhật.png',
  desc:'Túi dáng hộp chữ nhật đan từ ruột mây Phú Vinh, nan mảnh đều tăm tắp. Cứng dáng, bền chắc và thời trang — phụ kiện thủ công đưa mây tre Việt vào phong cách hiện đại.'}
};
const pModal = document.getElementById('pModal');
let curP = null;
/* thông số bổ sung theo làng nghề (mô tả chi tiết hơn) */
const SPECS = {
  bt:{mat:'Gốm sứ cao cấp, men vẽ tay thủ công', size:'Theo dòng sản phẩm (kèm hộp chống sốc)', care:'Lau khăn mềm ẩm; tránh va đập mạnh, sốc nhiệt đột ngột'},
  vp:{mat:'100% lụa tơ tằm tự nhiên Vạn Phúc', size:'Khăn ~60×180cm · cà vạt bản 7cm (kèm hộp quà)', care:'Giặt tay nước lạnh, phơi bóng râm, là mặt trái nhiệt thấp'},
  pv:{mat:'Mây, tre, giang tự nhiên đã xử lý chống mối mọt', size:'Theo dòng sản phẩm (đo tay từng chiếc)', care:'Để nơi khô thoáng, thỉnh thoảng lau khăn ẩm rồi hong gió'}
};
/* các "góc nhìn" mô phỏng cho ảnh sản phẩm (demo trên 1 ảnh gốc) */
const GAL_VIEWS = [
  {label:'Chính diện',        css:''},
  {label:'Cận cảnh chi tiết', css:'transform:scale(1.9);transform-origin:50% 38%'},
  {label:'Góc nghiêng',       css:'transform:scaleX(-1) rotate(-4deg) scale(1.08)'},
  {label:'Trên bàn trưng bày',css:'transform:rotate(3deg) scale(.94)'}
];
let galView = 0;
function renderGallery(p){
  const box = document.querySelector('.m-art'); if(!box) return;
  const v = GAL_VIEWS[galView];
  box.innerHTML =
    '<div class="m-frame">' +
      '<img class="m-photo" src="' + PROD_DIR + p.img + '" alt="' + p.name + ' — ' + v.label + '" style="' + v.css + '">' +
      '<span class="m-frame-tag">✦ Ảnh thực tế</span>' +
    '</div>' +
    '<div class="m-gal-bar">' +
      '<button type="button" id="galPrev" aria-label="Góc trước">‹</button>' +
      '<div class="m-gal-info"><b>' + v.label + '</b><span>' + (galView + 1) + ' / ' + GAL_VIEWS.length + '</span></div>' +
      '<button type="button" id="galNext" aria-label="Góc sau">›</button>' +
    '</div>' +
    '<div class="m-gal-dots">' +
      GAL_VIEWS.map((g, i) => '<button type="button" data-gv="' + i + '" class="' + (i === galView ? 'on' : '') + '" aria-label="' + g.label + '"></button>').join('') +
    '</div>';
  document.getElementById('galPrev').addEventListener('click', () => { galView = (galView + GAL_VIEWS.length - 1) % GAL_VIEWS.length; renderGallery(p); });
  document.getElementById('galNext').addEventListener('click', () => { galView = (galView + 1) % GAL_VIEWS.length; renderGallery(p); });
  box.querySelectorAll('[data-gv]').forEach(d => d.addEventListener('click', () => { galView = +d.dataset.gv; renderGallery(p); }));
}
function openProduct(id){
  const p = PRODUCTS[id]; if(!p) return; curP = p;
  document.getElementById('mName').textContent = p.name;
  document.getElementById('mTag').textContent = p.tag;
  document.getElementById('mPrice').textContent = p.price;
  document.getElementById('mSold').textContent = '★ 4.9 · Đã bán ' + (SOLD[p.name] || '500+') + ' · Còn hàng';
  document.getElementById('mDesc').textContent = p.desc + ' Sản phẩm được đóng gói kèm thẻ căn cước số xác thực nguồn gốc, làm hoàn toàn thủ công bởi nghệ nhân ' + p.tag + ' — mỗi chiếc là một bản thể duy nhất.';
  const sp = SPECS[p.f] || {};
  document.getElementById('mSpecs').innerHTML =
    '<div class="idrow"><span>Chất liệu</span><b>' + (sp.mat || '—') + '</b></div>' +
    '<div class="idrow"><span>Kích thước / đóng gói</span><b>' + (sp.size || '—') + '</b></div>' +
    '<div class="idrow"><span>Bảo quản</span><b>' + (sp.care || '—') + '</b></div>';
  galView = 0;
  renderGallery(p);
  if(window.fillIdCard) fillIdCard(p);
  if(window.setMTab) setMTab('intro');
  if(window.stamp) stamp('relic');
  pModal.classList.add('open');
  /* chặn "click ma": double-click trên thẻ sản phẩm làm cú click thứ 2 rơi trúng
     nút gallery/nền vừa hiện ra dưới con trỏ → khoá tương tác 400ms đầu */
  pModal.style.pointerEvents = 'none';
  clearTimeout(openProduct._pe);
  openProduct._pe = setTimeout(() => pModal.style.removeProperty('pointer-events'), 400);
}
function closeModal(){ pModal.classList.remove('open'); }
pModal.querySelectorAll('[data-x]').forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){ closeModal(); ppModal.classList.remove('open'); }
});
document.querySelectorAll('[data-p]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); openProduct(el.dataset.p); }));
document.getElementById('mBuy').addEventListener('click', e => {
  e.preventDefault(); closeModal();
  if(curP){
    addToCart(curP.name, parseInt(curP.price.replace(/\D/g, ''), 10) || 0);
    if(window.openCart) openCart();
  } else {
    go('market');
  }
});

/* ===== market filters + pagination — 12 sản phẩm/trang, lấp đầy lưới (4·3·2·1 cột) rồi mới sang trang ===== */
(function(){
  const PER_PAGE = 12;
  let curFilter = 'all', curPage = 1;
  const cards = [...document.querySelectorAll('#allProducts .p-card')];
  const pager = document.getElementById('marketPager');
  if(!cards.length || !pager) return;
  function renderMarket(){
    const vis = cards.filter(p => curFilter === 'all' || p.dataset.v === curFilter);
    const pages = Math.max(1, Math.ceil(vis.length / PER_PAGE));
    if(curPage > pages) curPage = pages;
    cards.forEach(p => { p.style.display = 'none'; });
    vis.forEach((p, i) => {
      if(Math.floor(i / PER_PAGE) + 1 === curPage) p.style.display = 'flex';
    });
    pager.innerHTML = pages < 2 ? '' : Array.from({length: pages}, (_, i) =>
      '<button class="chip' + (i + 1 === curPage ? ' on' : '') + '" type="button" data-pg="' + (i + 1) + '">' + (i + 1) + '</button>').join(' ');
  }
  document.querySelectorAll('.filters .chip').forEach(c => c.addEventListener('click', () => {
    c.parentElement.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
    c.classList.add('on');
    curFilter = c.dataset.f; curPage = 1;
    renderMarket();
  }));
  pager.addEventListener('click', e => {
    const b = e.target.closest('[data-pg]'); if(!b) return;
    curPage = +b.dataset.pg;
    renderMarket();
    document.getElementById('allProducts').scrollIntoView({behavior:'smooth', block:'start'});
  });
  renderMarket();
})();

/* ===== whisper-quiet scroll reveal (criterion 06) ===== */
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const REVEAL_SEL = '.sec-head,.v-card,.mis,.gian,.p-card,.b-card,.e-card,.j-step,.ev-row,.split,.featured,.pat,.art-card,.tl-item,.feat';
let io = null;
if(!REDUCE){
  io = new IntersectionObserver(ents => {
    ents.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, {threshold:0.12, rootMargin:'0px 0px -6% 0px'});
}
function retagReveal(){
  if(REDUCE || !io) return;
  setTimeout(() => {
    document.querySelectorAll(REVEAL_SEL).forEach(el => {
      if(el.classList.contains('rise')) return;
      el.classList.add('rise'); io.observe(el);
    });
  }, 40);
}

/* ===== reduced-motion: settle the video ===== */
const bgVideo = document.querySelector('.bg-video');
if(REDUCE && bgVideo){ bgVideo.removeAttribute('autoplay'); bgVideo.pause(); }

/* ===== hero slider — auto-advance every 7s ===== */
(function(){
  const slider = document.getElementById('heroSlider');
  if(!slider) return;
  const imgs = [...slider.querySelectorAll('.hs-img')];
  if(imgs.length < 2) return;
  let i = 0;
  setInterval(() => {
    imgs[i].classList.remove('on');
    i = (i + 1) % imgs.length;
    imgs[i].classList.add('on');
  }, 7000);
})();

/* ===== real product photography in cards (by product id) ===== */
(function(){
  document.querySelectorAll('.p-card').forEach(card => {
    const art = card.querySelector('.p-art'); if(!art) return;
    const p = PRODUCTS[card.dataset.p];
    if(!p || !p.img) return;
    art.classList.add('has-img');
    art.innerHTML = '<img src="' + PROD_DIR + p.img + '" alt="' + p.name + '" loading="lazy">';
  });
})();

/* ===== ambient audio: wind + flute, fade in/out, flute trails wind by 5s ===== */
(function(){
  const wind = document.getElementById('aWind'), flute = document.getElementById('aFlute');
  /* 2 nút cùng điều khiển: icon trên header (desktop/tablet) + nút nổi (điện thoại ≤480px) */
  const btns = [document.getElementById('audioBtn'), document.getElementById('audioFab')].filter(Boolean);
  if(!wind || !flute || !btns.length) return;
  const WIND_VOL = 0.26, FLUTE_VOL = 0.5, FADE = 2.5;    // wind kept well under the flute so it reads as ambience
  const ICON_ON  = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6.5a8 8 0 0 1 0 11"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>';
  let enabled = localStorage.getItem('kvAudio'); enabled = enabled === null ? true : enabled === '1';
  let playing = false, fluteTimer = null;

  function paint(){ btns.forEach(btn => { btn.innerHTML = enabled ? ICON_ON : ICON_OFF; btn.classList.toggle('off', !enabled); btn.setAttribute('aria-pressed', enabled ? 'true' : 'false'); }); }

  /* iOS/Android chỉ cho phép audio.play() trong thao tác của người dùng — "mở khóa" tiếng sáo
     ngay trong cử chỉ chạm để 5 giây sau setTimeout phát được mà không bị chặn */
  let fluteReady = false;
  function unlockFlute(){
    if(fluteReady) return; fluteReady = true;
    flute.muted = true;
    const p = flute.play();
    if(p) p.then(() => { flute.pause(); flute.currentTime = 0; flute.muted = false; })
          .catch(() => { flute.muted = false; fluteReady = false; });
  }

  // per-loop fade envelope (fade in at start of each file, fade out before its end), capped at its own target volume
  [wind, flute].forEach(el => el.addEventListener('timeupdate', () => {
    if(!playing || el.paused) return;
    const d = el.duration; if(!d || isNaN(d)) return;
    const vol = el === wind ? WIND_VOL : FLUTE_VOL;
    const rem = d - el.currentTime; let t = vol;
    if(el.currentTime < FADE) t = vol * (el.currentTime / FADE);
    else if(rem < FADE) t = vol * (rem / FADE);
    el.volume = Math.max(0, Math.min(vol, t));
  }));

  function start(){
    if(playing) return; playing = true;
    wind.volume = 0;
    const p = wind.play(); if(p) p.catch(() => { playing = false; });
    clearTimeout(fluteTimer);
    fluteTimer = setTimeout(() => { if(playing && enabled){ flute.volume = 0; flute.play().catch(() => {}); } }, 5000);
  }
  function stop(){
    playing = false; clearTimeout(fluteTimer);
    [wind, flute].forEach(el => {
      const from = el.volume, t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / 800); el.volume = from * (1 - k); if(k < 1) requestAnimationFrame(step); else el.pause(); };
      requestAnimationFrame(step);
    });
  }
  function setEnabled(on){ enabled = on; localStorage.setItem('kvAudio', on ? '1' : '0'); paint(); if(on){ unlockFlute(); start(); } else stop(); }

  btns.forEach(btn => btn.addEventListener('click', () => setEnabled(!enabled)));
  paint();

  if(enabled){
    start();
    // autoplay is blocked until a user gesture — kick it off on the first one.
    // NOTE: on touch devices pointerdown does NOT count as user activation (pointerup/touchend/click do),
    // so listen on pointerup — otherwise mobile browsers keep rejecting play()
    const kick = () => {
      if(enabled && wind.paused){ playing = false; unlockFlute(); start(); }
      window.removeEventListener('pointerup', kick); window.removeEventListener('keydown', kick);
    };
    window.addEventListener('pointerup', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
  }
})();

/* =========================================================================
   BẢN ĐỒ LÀNG NGHỀ + HỒ SƠ DI SẢN (gộp từ trang Làng nghề cũ)
   Nội dung theo "content cho câu chuyện làng nghề.docx"
   ========================================================================= */
const VILLAGES = {
  bt:{ name:'Gốm Bát Tràng', region:'Gia Lâm · Hà Nội', img:'GỐM BÁT TRÀNG.webp',
    blurb:'Hơn 700 năm bên sông Hồng — cái nôi của gốm sứ Việt.',
    title:'Hồ sơ di sản: Gốm sứ Bát Tràng',
    open:'Rực cháy qua bao thế kỷ, ngọn lửa từ những lò bầu Bát Tràng không chỉ nung chín đất sét thành gốm quý, mà còn hun đúc nên một pho sử sống động về nền thủ công mỹ nghệ Việt Nam. Trải qua ngàn năm lịch sử với bao thăng trầm, gốm Bát Tràng đã vượt qua ranh giới của những vật dụng sinh hoạt thông thường để trở thành những tác phẩm nghệ thuật mang đậm hồn cốt, cốt cách và tinh thần của dân tộc Việt.',
    tongquan:[
      ['Tên làng nghề','Làng gốm sứ Bát Tràng (thuở xưa còn gọi là Bạch Thổ phường).'],
      ['Vị trí địa lý','Nằm bên tả ngạn sông Hồng, nay thuộc xã Bát Tràng, huyện Gia Lâm, Hà Nội. Vị trí ven sông cận kề kinh thành xưa tạo thuận lợi cho giao thương đường thủy.'],
      ['Lịch sử hình thành','Khởi nguồn từ năm 1010 khi vua Lý Công Uẩn dời đô về Thăng Long. Năm dòng họ làm gốm lớn từ làng Bồ Bát (Ninh Bình) di cư theo kinh đô, tìm đến vùng đất Bạch Thổ (đất sét trắng) ven sông Hồng để lập lò, dựng nghiệp.'],
      ['Quy mô','Một trong những làng nghề quy mô lớn nhất cả nước: hơn 1.000 hộ gia đình cùng hàng trăm doanh nghiệp trực tiếp sản xuất, giữ lửa nghề truyền thống.']
    ],
    vanhoa:[
      ['Sự gắn kết văn hóa','Gốm Bát Tràng gắn liền với dòng chảy văn hóa Thăng Long – Hà Nội. Sản phẩm xưa kia không chỉ phục vụ đời sống bình dân mà còn là vật phẩm tiến vua, hiện diện trong cung điện hoàng gia và các nghi lễ ngoại giao thời phong kiến.'],
      ['Tín ngưỡng làng nghề','Người thợ gốm thờ Thần Lửa và Thần Đất rất sâu sắc. Trước mỗi lần nổi lửa cho mẻ lò mới, nghệ nhân đều thắp hương kính cáo Tổ nghề, cầu ngọn lửa cháy đều để gốm chín hoàn hảo, không nứt vỡ.'],
      ['Vai trò cộng đồng','Làng nghề là cái nôi giữ gìn giá trị gia tộc qua nhiều thế hệ — minh chứng cho tinh thần tự lực, tự cường và khả năng bảo tồn văn hóa của làng xã Việt Nam trước làn sóng hiện đại hóa.']
    ],
    quytrinh:{
      intro:'Quy trình làm gốm Bát Tràng là một nghệ thuật đòi hỏi sự kiên nhẫn và chính xác tuyệt đối qua 5 công đoạn chính:',
      steps:[
        ['Chọn và xử lý đất','Đất sét trắng được xử lý qua hệ thống 4 bể chứa (lắng, lọc, phơi, ủ) để loại bỏ tạp chất và oxit sắt.'],
        ['Tạo hình sản phẩm','Vuốt tay thủ công trên bàn xoay — đòi hỏi cảm giác tay cực nhạy — hoặc dùng khuôn in với sản phẩm dáng phức tạp.'],
        ['Trang trí hoa văn','Sau khi phơi khô gốm mộc, thợ vẽ dùng bút lông họa điển tích, hoa văn bằng màu tự nhiên từ oxit kim loại.'],
        ['Tráng men','Bí quyết gia truyền của mỗi dòng họ: men lam, men ngọc, men nâu và đặc biệt là kỹ thuật men rạn độc đáo.'],
        ['Nung đốt','Nung trong lò bầu, lò hộp hoặc lò ga ở 1.200–1.300°C. Kiểm soát lửa và thời gian nung quyết định thành – bại của cả mẻ gốm.']
      ]},
    sanpham:[
      ['Sản phẩm nổi bật','Đồ thờ tự (lư hương, chân đèn), bình tỳ bà, lộc bình đắp nổi và chén đĩa hoa văn cổ.'],
      ['Điểm khác biệt so với gốm giá rẻ','Gốm Bát Tràng chính gốc có cốt gốm dày dặn, cầm chắc tay; gõ nhẹ phát ra âm trong vắt, ngân như tiếng chuông. Hoa văn hoàn toàn vẽ tay phóng khoáng, có chiều sâu mỹ thuật — không bợt màu hay rập khuôn như gốm in công nghiệp.']
    ],
    ket:'Trải qua ngàn năm dâu bể, gốm Bát Tràng vẫn đứng vững như một tượng đài văn hóa của thủ đô. Từng thớ đất nung, từng nét vẽ chìm nổi trên men gốm chính là lời nhắc nhở thế hệ mai sau về giá trị bền vững của lao động thủ công và lòng tự hào dân tộc ẩn sâu trong mỗi sản phẩm quê hương.',
    artisans:[
      {n:'Nghệ nhân Nhân dân Trần Độ', role:'"Vua men gốm" · Hậu duệ đời thứ 18 dòng họ Trần',
       q:'Đừng chỉ tặng một món quà – hãy trao một giá trị văn hoá!',
       s:'Nổi tiếng với những dòng men cổ được phục chế và tác phẩm gốm tinh xảo, góp phần làm rạng danh Bát Tràng.',
       f:['Sinh ra trong dòng họ có truyền thống làm gốm lâu đời, ông tiếp xúc với nghề từ năm 10 tuổi. Khởi nghiệp là công nhân xí nghiệp gốm Bát Tràng năm 1975, đi bộ đội 1977–1982, rồi năm 1989 mở lò sản xuất theo hướng đi riêng — dành gần 20 năm tìm ra bí quyết của nhiều loại men gốm cổ.',
          'Năm 1999, bộ sưu tập 20 sản phẩm gốm của ông gây ấn tượng mạnh tại triển lãm đền Vua Lê Thái Tổ. Năm 2004, ông chế tác bình rượu giả cổ triều Lê – Mạc tặng đại biểu Hội nghị ASEM-5; năm 2005, 219 sản phẩm phục chế cổ vật được Thủ tướng chọn làm quà tặng chính khách quốc tế.',
          'Được phong Nghệ nhân Ưu tú (2010), Nghệ nhân Nhân dân và Công dân ưu tú Thủ đô (2016). Năm 2020 hiến tặng bộ sưu tập "Ấn triều Nguyễn" cho Trung tâm bảo tồn di tích cung đình Huế; năm 2024 triển lãm "Biểu tượng rồng qua gốm Trần Độ" tại Festival Huế. Các dòng men nổi bật: men hoa lam, men độc sắc, men ngọc, men hoa nâu.']},
      {n:'Nghệ nhân Ưu tú Tô Thanh Sơn', role:'Ấm chén hỏa biến trứ danh · Phục chế men cổ',
       q:'Chúng tôi không chờ già rồi mất. Chúng tôi in tim mình vào lòng người từ đất!',
       s:'Bậc thầy chế tác gốm sứ, sở hữu dòng ấm chén hỏa biến được yêu thích và tài phục chế các dòng men cổ thất truyền.',
       f:['Sinh năm 1962 trong gia đình có truyền thống làm gốm tại Bát Tràng. Đầu những năm 1980, sau khi hoàn thành nghĩa vụ quân sự, ông lập nghiệp bằng chính nghề gốm gia đình — từng trắng tay vì bị đối tác chiếm dụng vốn nhưng vẫn kiên trì bám nghề.',
          'Ông phục dựng chính xác màu men lam xám cổ của bậc tiền bối Đặng Huyền Thông (thế kỷ XVI), khôi phục dòng men cổ thời Hậu Lê với họa tiết đắp nổi đặc trưng khu Thái Miếu – Lam Kinh, và phục chế thành công dòng men rạn cổ thất truyền từ thế kỷ XIX.',
          'Năm 2008 hoàn thành chóe men trà "Dâng Hiến" dâng Đại lễ 1000 năm Thăng Long (xác lập Độc bản Kỷ lục Việt Nam 2018). Được phong Nghệ nhân Ưu tú năm 2015. Sản phẩm nổi bật: bộ ấm chén hỏa biến hoa nở lòng chén, bát đĩa men hỏa biến, bình gốm trang trí, tượng gốm.']},
      {n:'Nghệ nhân Ưu tú Vương Mạnh Tuấn', role:'Ấm Tử Sa đất Việt · Vò Rồng Đại lễ 1000 năm',
       q:'Hình tượng con rồng luôn là nguồn cảm hứng cho các tác phẩm của mình, biểu hiện cho tâm hồn cao thượng và ước mơ vươn lên.',
       s:'Hơn bốn thập kỷ làm gốm, nổi tiếng với tài pha trộn đất sét tạo ấm Tử Sa sánh ngang đất Nghi Hưng (Trung Quốc).',
       f:['Sinh năm 1964 tại Bát Tràng, vào Xí nghiệp Gốm sứ Bát Tràng từ năm 1978 và mở lò riêng năm 1988. Dù chưa từng được đào tạo bài bản, ông kiên trì gìn giữ và phát triển nghề gia truyền.',
          'Trong Đại lễ 1000 năm Thăng Long – Hà Nội, ông tạo tác hai tác phẩm đặc sắc: Bình chạm hoa văn và chiếc Vò Rồng cao 1m50 men rạn truyền thống, đắp nổi rồng uốn lượn — từng chiếc vảy, ngón chân sắc nhọn được chăm chút tỉ mỉ, tượng trưng cho sức mạnh và uy nghi của dân tộc.']},
      {n:'Nghệ nhân Nguyễn Hùng', role:'Men "Hoàng Thổ Liên Hoa" · 40+ năm với nghề',
       q:'Tôi muốn có sự lan tỏa, để những người thợ giỏi càng say mê làm thêm nhiều tác phẩm, để thế giới biết đến gốm Việt nhiều hơn.',
       s:'Tên tuổi lớn của gốm Việt với dòng men độc bản mất 15 năm nghiên cứu, đưa gốm Việt vươn xa trên trường quốc tế.',
       f:['Sinh năm 1971 tại Hải Phòng. Từ nhiệm vụ khảo sát nghề gốm khắp cả nước những năm 1980, năm 1986 ông chọn ở lại Bát Tràng, học nghề từ làm thuê tại các xưởng gốm rồi tự mày mò sáng tạo phương pháp chế tác mới.',
          'Dấu ấn lớn nhất là dòng men "Hoàng Thổ Liên Hoa" — kết hợp thân sen khô (thay tro trấu), đất trầm tích sông Hồng và khoáng thạch tự nhiên, xuất phát từ tình yêu hoa sen. Nhiều tác phẩm của ông đạt kỷ lục Guinness, góp phần nâng tầm gốm sứ Bát Tràng.']},
      {n:'Nghệ nhân Ưu tú Nguyễn Văn Hưng', role:'Nghệ sĩ hội họa trên gốm · Men rạn giả cổ',
       q:'Làm gốm cũng như làm người: đất phải thuần, lửa phải đều, và tâm mình phải tĩnh. Đất không bao giờ biết nói dối.',
       s:'Con trai cố nghệ nhân ưu tú Nguyễn Văn Cổn, từ nhỏ đã "ăn cơm với đất, ngủ với gốm".',
       f:['Điểm mạnh nhất là kỹ thuật vẽ bút lông trực tiếp trên cốt gốm (vẽ lam, vẽ men màu) — đường nét thanh thoát, phóng khoáng mà vẫn chặt chẽ bố cục truyền thống. Kế thừa từ cha, ông đặc biệt thành công trong phục dựng men rạn cổ với vết rạn tự nhiên, đều đặn.',
          'Triết lý sáng tạo "Đất phải có hồn": mỗi sản phẩm phải kể được một câu chuyện — về làng quê, điển tích cổ hay triết lý nhân sinh. Các bộ ấm chén, bình hoa vẽ sen, tùng cúc trúc mai của ông được nhà sưu tầm trong và ngoài nước săn đón; ông cũng tận tâm đào tạo nhiều thế hệ thợ trẻ.']}
    ],
    thuctrang:[
      ['Thách thức hiện tại','Thị trường nội địa chịu cạnh tranh từ gốm công nghiệp giá rẻ nước ngoài; thế hệ trẻ rời làng tìm việc ở đô thị đe dọa việc kế thừa kỹ thuật tinh xảo; chuyển từ lò than sang lò gas giảm ô nhiễm nhưng tăng chi phí sản xuất.'],
      ['Ảnh hưởng của hiện đại hóa','Cuộc cách mạng "Xanh": thay lò than bằng lò gas giúp tỷ lệ sản phẩm đạt chuẩn lên 95%, cải thiện môi trường sống. Chuyển đổi số: quảng bá trên Facebook, TikTok, Instagram; dùng mã QR, thực tế ảo (VR) để khách trải nghiệm lịch sử làng nghề.'],
      ['Đổi mới & phát triển','Bát Tràng trở thành trung tâm văn hóa – du lịch sáng tạo: lớp học làm gốm "một ngày làm nghệ nhân", thiết kế kết hợp men truyền thống với phong cách đương đại, thương mại điện tử đưa sản phẩm đến khách hàng toàn cầu.'],
      ['Dự án bảo tồn','Bảo tàng Gốm sứ Bát Tràng (đầu tư 150 tỷ đồng, hoạt động từ 2021) — trung tâm nghệ thuật đương đại; định hướng Bảo tàng sinh thái (Eco-museum); wifi miễn phí, máy thuyết minh tự động, xe điện phục vụ du lịch bền vững.']
    ],
    patterns:[
      ['gốm sứ bát tràng, hoa sen.jpg','Hoa sen','Thanh cao, thuần khiết — họa tiết hoa sen vẽ tay dưới men lam, gắn liền với văn hóa Phật giáo.'],
      ['gốm sứ bát tràng, tứ linh.jpg','Tứ linh','Long – Lân – Quy – Phụng: bộ tứ linh vật tượng trưng cho quyền lực, thái bình, trường thọ và thịnh vượng.'],
      ['gốm sứ bát tràng, Cá chép vượt vũ môn.png','Cá chép vượt vũ môn','Biểu tượng nỗ lực vượt khó để đỗ đạt, thành tựu — quen thuộc trên bình, đĩa gốm Bát Tràng.']
    ],
    prods:['am-tra','hu-tra','dia-sen'] },

  vp:{ name:'Lụa Vạn Phúc', region:'Hà Đông · Hà Nội', img:'LỤA TƠ TẰM.jpg',
    blurb:'Nghìn năm tiếng thoi đưa — quê hương của "lụa tiến vua".',
    title:'Hồ sơ di sản: Lụa tơ tằm Vạn Phúc',
    open:'Nằm khép mình bên dòng sông Nhuệ hiền hòa, làng lụa Vạn Phúc từ lâu đã được mệnh danh là quê hương của những thước lụa gấm vóc "mịn màng như làn mây, ấm áp như ánh mặt trời". Từng thớ tơ, dải lụa nơi đây không chỉ đơn thuần là trang phục, mà là biểu tượng cho nét đẹp thanh lịch, đài các của người Việt qua nhiều thời kỳ lịch sử.',
    tongquan:[
      ['Tên làng nghề','Làng lụa tơ tằm Vạn Phúc (tên cũ là Vạn Bảo).'],
      ['Vị trí địa lý','Thuộc phường Vạn Phúc, quận Hà Đông, thành phố Hà Nội.'],
      ['Lịch sử hình thành','Hơn 1.100 năm tuổi. Theo gia phả và truyền thuyết, thế kỷ IX (khoảng năm 865), bà La Thị Nga truyền dạy dân làng nghề trồng dâu, nuôi tằm, dệt lụa; sau khi bà qua đời, dân làng lập đền thờ, suy tôn bà làm Thành hoàng làng.'],
      ['Quy mô','Dẫu đô thị hóa mạnh mẽ, khoảng 60% trong hơn 800 hộ dân vẫn bám trụ với tiếng cửi dệt truyền thống.']
    ],
    vanhoa:[
      ['Sự gắn kết văn hóa','Lụa Vạn Phúc là phần di sản không thể tách rời của trang phục truyền thống Việt. Thời nhà Nguyễn, đây chính là loại "lụa tiến vua" thượng hạng — may hoàng bào cho vua chúa và lễ phục cho quan đại thần.'],
      ['Dấu ấn quốc tế','Năm 1931, lụa Vạn Phúc lần đầu bước ra thế giới tại Đấu xảo Marseille (Pháp), được đánh giá là sản phẩm thủ công tinh xảo, quý hiếm bậc nhất Đông Dương.'],
      ['Vai trò cộng đồng','Biểu tượng cho sự khéo léo của người phụ nữ Việt: tiếng thoi lạch cạch từ thuở lập làng trở thành giai điệu quê hương, lưu truyền bí kíp nghề từ mẹ sang con, từ bà sang cháu.']
    ],
    quytrinh:{
      intro:'Để có một tấm lụa óng ả mượt mà, người thợ Vạn Phúc thực hiện quy trình vô cùng nghiêm ngặt:',
      steps:[
        ['Ươm tơ và guồng tơ','Chọn kén tằm chín vàng đều, thả vào nồi nước sôi kéo lấy sợi tơ mảnh (tơ sống), sau đó guồng vào các ống tre.'],
        ['Hồ sợi và mắc cửi','Sợi tơ được hồ bằng cháo gạo loãng để tăng độ dai bền, rồi đưa lên giàn mắc cửi sắp xếp sợi dọc.'],
        ['Dệt lụa trên khung cửi','Tay giật thoi, chân đạp bàn dập nhịp nhàng. Đỉnh cao là Kỹ thuật dệt lụa Vân với cơ cấu dệt rắc trắc uẩn, tạo hoa văn chìm nổi tinh vi mà không cần thêu.'],
        ['Nhuộm màu','Lụa mộc được nấu thục tẩy sạch hồ gạo, rồi nhuộm bằng màu tự nhiên: củ nâu, lá bàng, vỏ cây rừng — giữ độ bóng tự nhiên, an toàn cho da.']
      ]},
    sanpham:[
      ['Sản phẩm nổi bật','Lụa Vân, gấm, satin, lụa tơ tằm tự nhiên dạng trơn hoặc dệt hoa văn hoa cúc, chim phượng, chữ Thọ.'],
      ['Điểm khác biệt so với lụa giá rẻ','Lụa Vạn Phúc dệt từ 100% tơ tằm tự nhiên: đông ấm, hè mát, nhẹ tựa lông hồng, không tích điện mùa hanh khô. Độ bóng nhẹ dịu tự nhiên, càng giặt càng mềm mại óng ả — trái ngược lụa pha nilon bóng gắt, dễ sờn rách.']
    ],
    ket:'Vượt qua sự sàng lọc khắc nghiệt của thời gian và các loại vải công nghiệp hiện đại, dải lụa Vạn Phúc vẫn dịu dàng tỏa sáng. Giữ gìn ngọn lửa nghề dệt nơi đây không chỉ là giữ một sinh kế, mà chính là đang bảo tồn một nét duyên dáng, thanh lịch rất riêng của tâm hồn người Hà Nội.',
    artisans:[
      {n:'Nghệ nhân Nguyễn Thị Tâm', role:'"Báu vật sống" của Vạn Phúc · Phục dựng Lụa Vân',
       q:'Đời tằm ngắn ngủi, nhưng sợi tơ của nó nhả ra, qua bàn tay người thợ, để lại cho đời những sản phẩm vô giá.',
       s:'Người phục dựng thành công dòng Lụa Vân — lụa tiến vua thượng hạng từng bị thất truyền.',
       f:['Sinh ra trong gia đình truyền thống dệt lụa, là con dâu cố Nghệ nhân ưu tú Triệu Văn Mão. Những năm 90 khi vải công nghiệp tràn ngập, bà cùng gia đình kiên trì bám trụ, tìm hướng đi bằng cách phục dựng các mẫu hoa văn cổ.',
          'Cột mốc lớn nhất: nhiều năm tìm tư liệu cổ, nghiên cứu những mảnh lụa cũ để khôi phục kỹ thuật dệt hoa văn nổi trên mặt lụa (Lụa Vân) đã thất truyền hàng chục năm. Lụa Vân của bà thường xuyên hiện diện trong phẩm vật quốc gia tặng nguyên thủ các nước.',
          'Bảng vàng thành tích: "Ngôi sao Việt Nam 2006", "Bông hồng vàng Thủ đô" 2008 & 2010, "Thương hiệu nghề truyền thống – Báu vật quốc gia Việt Nam" 2011 & 2013, "Công dân ưu tú Thủ đô 2015". Hiện bà đứng đầu các dự án bảo tồn, trực tiếp hướng dẫn thợ trẻ và đón khách quốc tế.']},
      {n:'Nghệ nhân Triệu Văn Mão', role:'Cố nghệ nhân · Người khôi phục Lụa Vân',
       q:'Giữ nghề là giữ lấy tổ tiên, sợi tơ có bền thì danh tiếng làng mới mãi trường tồn.',
       s:'Cả đời dành cho việc khôi phục dòng lụa Vân — di sản hàng trăm năm gần như biến mất.',
       f:['Sinh trong gia đình nhiều đời dệt lụa, 7–8 tuổi đã biết quay tơ, mắc cửi. Từng đi bộ đội, làm cơ khí, nhưng luôn đau đáu với nghề; trở về quê, ông dành toàn bộ tâm huyết khôi phục nghề dệt, đặc biệt là lụa Vân.',
          'Khác vải in hoa văn sau dệt, lụa Vân tạo hoa văn ngay trong quá trình dệt bằng điều khiển hệ thống go và sợi dọc – ngang chính xác tuyệt đối; có hoa văn ông mất hàng năm mới phục chế thành công. Ông đã phục dựng hơn 20 mẫu lụa cổ quý: Vân Triện Thọ, Vân Song Hạc, Vân Tứ Quý, Vân Quế Hồng Diệp…',
          'Được phong Nghệ nhân Dân gian Việt Nam năm 2005. Sau khi ông qua đời, con dâu Nguyễn Thị Tâm kế thừa toàn bộ kỹ thuật, phát triển thương hiệu Mão Silk — sản phẩm được Hà Nội công nhận OCOP 3 sao.']},
      {n:'Nghệ nhân – CEO Lê Thị Kim Thư', role:'Chủ tịch HĐQT CTCP Phát triển Lụa Vạn Phúc',
       q:'Tằm ăn rỗi, nhả tơ dệt nên tình đất, tình người; mỗi tấm lụa là hơi thở của ngàn năm văn hiến kết tinh từ những bàn tay cần mẫn.',
       s:'Kết hợp bảo tồn truyền thống với quản trị doanh nghiệp, đưa lụa Vạn Phúc "tung bay trong nắng gió trời Tây".',
       f:['Bà chọn hướng đi kết hợp giữa bảo tồn giá trị truyền thống và quản trị doanh nghiệp: làng nghề chỉ bền vững khi sản phẩm vừa giữ bản sắc văn hóa, vừa đáp ứng thị trường trong nước và quốc tế.',
          'Trên cương vị Chủ tịch HĐQT, bà định hướng phát triển làng nghề theo mô hình sản xuất + thương mại + du lịch văn hóa; kiên trì xây dựng thương hiệu dựa trên bản sắc thay vì cạnh tranh giá rẻ. Năm 2024, bà đồng hành cùng Vạn Phúc gia nhập Mạng lưới các Thành phố Thủ công Sáng tạo Thế giới.']},
      {n:'Nghệ nhân Nguyễn Hữu Chỉnh', role:'"Nghệ nhân Bàn tay vàng" · Chủ tịch Hiệp hội Làng nghề Vạn Phúc',
       q:'Uy tín của làng nghề không xây từ một cá nhân, mà từ chất lượng đồng đều của tất cả các cơ sở sản xuất.',
       s:'Người góp công phục hồi nghề dệt sau thời kỳ khó khăn và xây nền cho thương hiệu làng nghề thời hội nhập.',
       f:['Từ 1969 đến 1989, ông tham gia xây dựng và quản lý Xí nghiệp Dệt Sơn La, đào tạo đội ngũ công nhân kỹ thuật và chuyển giao kinh nghiệm sản xuất lụa. Trở về Vạn Phúc đúng lúc làng nghề khó khăn, ông cùng các nghệ nhân vận động người dân giữ nghề.',
          'Là Chủ tịch Hiệp hội Làng nghề Vạn Phúc, ông kết nối nghệ nhân – doanh nghiệp – cơ quan quản lý, tổ chức quảng bá, hội chợ, xây dựng hình ảnh chung; vận động các hộ dùng nguyên liệu tốt, giữ đúng quy trình dệt truyền thống. Được trao danh hiệu "Nghệ nhân Bàn tay vàng" và vinh danh Doanh nhân tiêu biểu Thăng Long – Hà Nội.']}
    ],
    thuctrang:[
      ['Khó khăn hiện tại','Số hộ giữ trọn quy trình dệt thủ công giảm đáng kể; kỹ thuật phức tạp như dệt lụa Vân đứng trước nguy cơ thất truyền; cạnh tranh gay gắt với lụa công nghiệp giá rẻ; đội ngũ nghệ nhân ngày càng lớn tuổi trong khi lực lượng kế cận mỏng.'],
      ['Ảnh hưởng của hiện đại hóa','Công nghệ giúp tăng năng suất, mở rộng kinh doanh; internet và thương mại điện tử giúp quảng bá rộng khắp. Nhưng máy dệt công nghiệp có thể làm giảm tính thủ công — yếu tố làm nên giá trị và bản sắc của lụa Vạn Phúc.'],
      ['Đổi mới & phát triển','Phát triển du lịch làng nghề: tham quan xưởng dệt, trải nghiệm dệt thủ công, mua sắm tại làng. Đa dạng sản phẩm: khăn quàng, cà vạt, túi xách, phụ kiện thời trang, trang phục công sở, đồ trang trí nội thất. Đẩy mạnh bán hàng trực tuyến.'],
      ['Dự án bảo tồn','Đầu 2026, Hà Nội phê duyệt Quy hoạch chi tiết 1/500 bảo tồn làng nghề kết hợp du lịch; Vạn Phúc vào Đề án phát triển làng nghề gắn du lịch đến 2030 tầm nhìn 2050. Nghề dệt lụa Vạn Phúc được ghi danh Di sản văn hóa phi vật thể quốc gia năm 2023.']
    ],
    patterns:[
      ['lụa vạn phúc, Vân mây.webp','Vân mây','Hoa văn chìm chỉ hiện khi nghiêng lụa dưới nắng — kỹ thuật dệt vân làm nên tên tuổi Vạn Phúc.'],
      ['lụa vạn phúc, song thọ.webp','Song thọ','Chữ Thọ tròn dệt nổi trên nền lụa vàng — lời chúc trường thọ, phúc lành trên những tấm lụa quý.'],
      ['lụa vạn phúc, hoa.webp','Hoa dệt chìm','Những đóa hoa nhỏ dệt chìm phủ đều mặt lụa — nét duyên kín đáo thường thấy trên lụa may áo dài.']
    ],
    prods:['cavat-lua','khan-sen','khan-nguson'] },

  pv:{ name:'Mây tre đan Phú Vinh', region:'Chương Mỹ · Hà Nội', img:'MÂY ĐAN TRE.png',
    blurb:'400 năm "đan nắng gió vào nan tre".',
    title:'Hồ sơ di sản: Mây tre đan Phú Vinh',
    open:'Từ những bụi tre bộc mạc, những sợi mây thô rạp nơi bờ ao góc vườn, người dân Phú Vinh đã viết nên một hành trình kỳ diệu của nghệ thuật đan lát. Bằng sự sáng tạo bền bỉ và đôi bàn tay khéo léo tựa như "có phép màu", những người thợ nơi đây đã biến những vật liệu dung dị của đồng quê Bắc Bộ thành những tác phẩm mỹ nghệ tinh xảo, chinh phục cả những thị trường quốc tế khó tính nhất.',
    tongquan:[
      ['Tên làng nghề','Làng nghề mây tre đan Phú Vinh (tên cũ xưa kia là Phú Hoa Trang).'],
      ['Vị trí địa lý','Xã Phú Nghĩa, huyện Chương Mỹ, thành phố Hà Nội.'],
      ['Lịch sử hình thành','Khoảng 400 năm, bắt nguồn từ thế kỷ XVII. Theo truyền thuyết "Bãi Cò Đậu", dân làng nhặt lông cò rụng trắng bãi về đan mũ, đan túi; từ những bước sơ khai bằng cỏ lau và lông cò, dần chuyển sang mây, giang, tre bền chắc để thành nghề chuyên nghiệp.'],
      ['Quy mô','Trung tâm của vùng mây tre đan Chương Mỹ, lan tỏa nghề sang hàng chục làng lân cận, tạo việc làm ổn định cho hàng ngàn hộ dân.']
    ],
    vanhoa:[
      ['Ý nghĩa tên gọi cổ','"Phú Hoa Trang" mang hàm ý rất đẹp: vùng đất được trời phú cho những con người có đôi bàn tay khéo léo dệt nên những bông hoa trên nan tre.'],
      ['Giá trị cộng đồng','Sản phẩm gắn liền nếp sống thôn quê — từ chiếc rổ, chiếc thúng trong căn bếp Việt đến vật dụng nội thất sang trọng. Làng nghề là sợi dây kết nối các thế hệ, gìn giữ nét văn hóa lao động cần cù của người nông dân đồng bằng sông Hồng.']
    ],
    quytrinh:{
      intro:'Kỹ thuật đan mây Phú Vinh đạt độ tinh diệu đỉnh cao nhờ quy trình chuẩn bị và chế tác kỳ công:',
      steps:[
        ['Chọn và xử lý nguyên liệu','Mây chọn cây bánh tẻ, giang chọn cây dẻo thẳng. Tre nứa luộc qua nước vôi loãng, phơi sấy kỹ để chống mối mọt mà không mất độ dẻo tự nhiên.'],
        ['Kỹ thuật chẻ nan (khó nhất)','Người thợ Phú Vinh có biệt tài chẻ nan mỏng đều như sợi chỉ, sợi lạt dẹt phẳng phiu; nan chẻ xong được tuốt lại bằng tay loại bỏ xơ xước.'],
        ['Nhuộm màu tự nhiên','Sợi mây hun khói rơm hoặc nấu với lá cây, tạo bảng màu mộc mạc: vàng óng của rơm rạ, nâu trầm của đất.'],
        ['Kỹ thuật đan độc bản','Bên cạnh đan cài, đan đôi, thợ Phú Vinh nổi tiếng thế giới với kỹ thuật đan xâu xiên và hạ màu lạt — đan thành tranh chân dung, phong cảnh có chiều sâu không thua tranh thêu, tranh vẽ.']
      ]},
    sanpham:[
      ['Sản phẩm nổi bật','Tranh chân dung nghệ thuật đan bằng mây, hoành phi, câu đối, đèn lồng trang trí và đồ nội thất cao cấp (bàn ghế, rương hòm bằng mây).'],
      ['Điểm khác biệt so với hàng giá rẻ','Độ khít tuyệt đối giữa các mối đan, nan mây mượt không tì vết xơ xước; giữ màu tự nhiên bền hàng chục năm, không mục gãy trước thời tiết nóng ẩm nhờ kỹ thuật xử lý cốt tre và nước sơn bảo vệ gia truyền.']
    ],
    ket:'Giữa dòng chảy của kỷ nguyên công nghệ và các vật liệu nhựa công nghiệp, mây tre đan Phú Vinh vẫn giữ nguyên vẹn giá trị nguyên bản, xanh và thân thiện. Mỗi sản phẩm Phú Vinh không chỉ là một món đồ dùng, mà là cả một tấm lòng, một lời khẳng định về sức sáng tạo không giới hạn của những người nông dân chân lấm tay bùn.',
    artisans:[
      {n:'Nghệ nhân Nhân dân Nguyễn Văn Tĩnh', role:'Hơn 50 năm giữ nghề · Công dân Thủ đô ưu tú 2025',
       q:'Mây tre là chất liệu của làng, nhưng cũng là chất liệu của tâm hồn. Không có tình yêu và sự kiên nhẫn, sẽ chẳng bao giờ tạo nên được một tác phẩm sống động.',
       s:'Con trai nghệ nhân Nguyễn Văn Khiếu, người đưa mây tre đan Phú Vinh thành mỹ nghệ cao cấp xuất khẩu.',
       f:['Sinh năm 1964 trong gia đình ba đời làm nghề; học nghề từ 10 tuổi, 17 tuổi đã thành thạo chẻ mây, vót nan, tạo hình, xử lý nguyên liệu. Ông nghiên cứu phương pháp xử lý nguyên liệu tăng độ bền, chống mối mọt, nâng giá trị thẩm mỹ.',
          'Năm 2008 thành lập Công ty TNHH Mây tre đan Việt Quang — vừa sản xuất, vừa thiết kế mẫu mới và đào tạo lao động địa phương; sản phẩm xuất sang Nhật Bản, Hàn Quốc, châu Âu, Hoa Kỳ.',
          'Thành tích: Huy chương Vàng thủ công mỹ nghệ 1986; Giải Nhất "Golden-V" 2006 với tác phẩm "Đèn treo"; danh hiệu Nghệ nhân Nhân dân; Công dân Thủ đô ưu tú 2025. Sản phẩm "Lồng bàn đan mây" đạt Sản phẩm công nghiệp nông thôn tiêu biểu quốc gia 2025.']},
      {n:'Nghệ nhân Nhân dân Nguyễn Văn Trung', role:'Tranh chân dung bằng mây · Người thầy của làng',
       q:'Với tôi, đan là một hoạt động hấp dẫn. Sáng tạo kiểu mẫu để đan là một thú vui. Tôi có thể làm thành bất cứ thứ gì, chỉ từ những sợi đan.',
       s:'Vượt nghịch cảnh bệnh tật từ năm 15 tuổi để trở thành nghệ nhân tiêu biểu nhất Phú Vinh, mở trung tâm dạy nghề miễn phí cho người khuyết tật.',
       f:['Sinh năm 1953. Năm 1972 vào HTX Nông nghiệp Phú Vinh, được bầu làm Đội trưởng Đội kỹ thuật và giành giải Nhất thi tay nghề giỏi của làng. Năm 1980 đạt giải "Tuổi trẻ sáng tạo" tại Liên Xô, sau đó học Đại học Mỹ thuật Công nghiệp Hà Nội; năm 1983 được cử sang Cuba giảng dạy kỹ thuật thủ công mỹ nghệ.',
          'Tháng 10/2005 thành lập Công ty TNHH Mỹ nghệ Hoa Sơn; năm 2007 mở Trung tâm Dạy nghề tư thục Mây tre đan Phú Vinh — đào tạo miễn phí cho người khuyết tật, trung bình 400–500 học viên mỗi năm, nhiều người nay đã thành nghệ nhân độc lập.',
          'Nổi tiếng với tranh chân dung, bình phong, đèn trang trí và nội thất bằng mây tre; các tác phẩm về Chủ tịch Hồ Chí Minh được đánh giá rất cao. Được phong Nghệ nhân Nhân dân cùng nhiều giải thưởng trong nước và quốc tế.']},
      {n:'Cố nghệ nhân Nguyễn Văn Khiếu', role:'Người đặt nền móng nghệ thuật tạo hình mây tre',
       q:'Người nghệ nhân phải luôn sáng tạo và không ngừng đổi mới nếu muốn nghề truyền thống tồn tại cùng thời đại.',
       s:'Người đầu tiên ở Việt Nam đan thành công chân dung Chủ tịch Hồ Chí Minh bằng mây tre.',
       f:['Ông là người tiên phong đưa nghệ thuật tạo hình vào sản phẩm mây tre đan — thử nghiệm đan chân dung, tranh nghệ thuật ngay trong giai đoạn nghề chỉ quen làm rổ, rá, nia, giỏ. Bức chân dung Chủ tịch Hồ Chí Minh bằng mây tre của ông gây tiếng vang lớn, mở ra hướng phát triển hoàn toàn mới cho nghề.',
          'Ông truyền nghề cho nhiều thế hệ thợ, trong đó người học trò thành công nhất là con trai — Nghệ nhân Nhân dân Nguyễn Văn Tĩnh. Trong giới thủ công mỹ nghệ, ông luôn được nhắc đến như một người thầy lớn của làng nghề Phú Vinh.']}
    ],
    thuctrang:null,
    patterns:[
      ['mây tre đan Phú Vinh, lục giác.jpeg','Đan lục giác','Sáu nan giao nhau tạo hình cân bằng — kỹ thuật dùng cho các khay, giỏ mây tre xuất khẩu cao cấp.'],
      ['Mây tre đan Phú Vinh, vảy rồng.jpeg','Đan vảy rồng','Các sợi mây xếp lớp mô phỏng vảy rồng — mang ý nghĩa quyền uy và bảo hộ.'],
      ['mây tre đan Phú Vinh, tranh.jpg','Tranh đan từ mây','Nghệ nhân dùng sợi mây nhuộm màu để "vẽ" nên những bức tranh sinh động, tinh xảo trên nan đan.']
    ],
    prods:['hop-may','tui-may','tui-ruot-may'] }
};

/* các mục nội dung — mặc định hiện: tổng quan, sản phẩm đặc trưng; ẩn: còn lại */
const DZ_SECTIONS = [
  {id:'tongquan', label:'Tổng quan',                      def:true},
  {id:'sanpham',  label:'Sản phẩm đặc trưng',             def:true},
  {id:'vanhoa',   label:'Giá trị văn hoá – lịch sử',      def:false},
  {id:'quytrinh', label:'Quy trình sản xuất / kỹ thuật',  def:false},
  {id:'nghenhan', label:'Nghệ nhân',                      def:false},
  {id:'hoavan',   label:'Ảnh họa tiết',                   def:false},
  {id:'thuctrang',label:'Thực trạng & phát triển',        def:false}
];

(function(){
  const overview = document.getElementById('mapOverview');
  const zoom = document.getElementById('mapZoom');
  const panel = document.getElementById('mapPanel');
  const dossier = document.getElementById('villageDossier');
  const side = document.getElementById('dossierSide');
  const body = document.getElementById('dossierBody');
  if(!overview || !zoom || !panel) return;
  const VDIR = 'assets/lang_nghe_img/';
  const PAT_DIR = 'assets/họa tiết làng nghề/';          // ảnh họa tiết thật thay icon vẽ
  let curV = null;

  function setZoomed(z){ overview.hidden = z; zoom.hidden = !z; }
  function setPins(k){ zoom.querySelectorAll('.vpin').forEach(p => p.classList.toggle('on', p.dataset.v === k)); }

  function renderIntro(){
    setZoomed(false); setPins(null);
    dossier.hidden = true; curV = null;
    panel.innerHTML =
      '<div class="map-intro">' +
        '<span class="kicker">Bản đồ làng nghề</span>' +
        '<h3>Khám phá tinh hoa thủ công theo từng vùng miền</h3>' +
        '<p>Mỗi vùng đất Việt Nam ôm trong mình những làng nghề trăm năm tuổi. Hành trình của KIMVIE bắt đầu từ <b>Miền Bắc</b> — chiếc nôi của gốm, lụa và mây tre. <b>Miền Trung</b> và <b>Miền Nam</b> sẽ sớm ra mắt (Coming soon).</p>' +
        '<p>Di chuột lên từng miền để làm nổi vùng, rồi <b>nhấn Miền Bắc</b> để phóng to và xem danh sách làng nghề.</p>' +
      '</div>';
  }
  /* người dùng chọn làng trực tiếp trên bản đồ (ghim .vpin) — không render ô danh sách */
  function renderList(){
    setZoomed(true);
    panel.innerHTML =
      '<div class="mapv-listhead">Làng nghề Miền Bắc</div>' +
      '<div class="mapv-listsub">Chạm vào từng điểm ghim trên bản đồ để mở hồ sơ di sản của làng nghề.</div>';
  }

  function dzRows(rows){ return rows.map(r => '<p><b>' + r[0] + ':</b> ' + r[1] + '</p>').join(''); }
  function dzSection(id, kicker, title, inner, open){
    return '<div class="dz-sec' + (open ? ' open' : '') + '" data-dz="' + id + '">' +
      '<button class="dz-head" type="button"><span><span class="dz-k">' + kicker + '</span><br>' + title + '</span><span class="chev">▼</span></button>' +
      '<div class="dz-body">' + inner + '</div></div>';
  }

  function renderDossier(k){
    const v = VILLAGES[k]; if(!v) return;
    curV = k;
    setZoomed(true); setPins(k);
    renderList();                                        // giữ 3 làng dưới bản đồ, tô làng đang chọn

    /* thanh bên trái: ẩn / hiện nội dung */
    side.innerHTML = '<h6>Nội dung hồ sơ</h6>' + DZ_SECTIONS
      .filter(s => s.id !== 'thuctrang' || v.thuctrang)
      .map(s => '<button class="side-toggle' + (s.def ? ' on' : '') + '" type="button" data-sec="' + s.id + '">' +
        '<span class="tick">✓</span>' + s.label + '</button>').join('');

    const prods = v.prods.map(id => { const p = PRODUCTS[id]; return p ?
      '<button class="vprod" type="button" data-p="' + id + '">' +
        '<img src="' + PROD_DIR + p.img + '" alt="' + p.name + '" loading="lazy">' +
        '<div class="vpb"><h5>' + p.name + '</h5><div class="vpprice">' + p.price + '</div></div>' +
      '</button>' : ''; }).join('');

    body.innerHTML =
      '<div class="dossier-head"><img src="' + VDIR + v.img + '" alt="' + v.name + '">' +
        '<div class="cap"><div class="vk">' + v.region + '</div><h3>' + v.title + '</h3></div></div>' +
      '<p class="dz-open">' + v.open + '</p>' +
      dzSection('tongquan', 'Hồ sơ di sản', 'Thông tin tổng quan', dzRows(v.tongquan), true) +
      dzSection('sanpham', 'Tinh hoa', 'Sản phẩm đặc trưng',
        dzRows(v.sanpham) +
        '<div class="vsub">3 sản phẩm đặc trưng — bấm vào để mua</div>' +
        '<div class="dz-prods">' + prods + '</div>' +
        '<p class="dz-close">' + v.ket + '</p>', true) +
      dzSection('vanhoa', 'Chiều sâu', 'Giá trị văn hoá – lịch sử', dzRows(v.vanhoa), false) +
      dzSection('quytrinh', 'Bàn tay nghệ nhân', 'Quy trình sản xuất / kỹ thuật',
        '<p>' + v.quytrinh.intro + '</p><ul>' +
        v.quytrinh.steps.map(s => '<li><b>' + s[0] + ':</b> ' + s[1] + '</li>').join('') + '</ul>', false) +
      dzSection('nghenhan', 'Người giữ lửa', 'Hồ sơ nghệ nhân',
        v.artisans.map((a, i) =>
          '<div class="dz-artisan" data-a="' + i + '">' +
            '<h5>' + a.n + '</h5><div class="role">' + a.role + '</div>' +
            '<p>' + a.s + '</p>' +
            '<div class="dz-full">' + a.f.map(p => '<p>' + p + '</p>').join('') + '</div>' +
            '<q>"' + a.q + '"</q><br>' +
            '<button class="dz-more" type="button">Đọc tiểu sử đầy đủ ▾</button>' +
          '</div>').join(''), false) +
      dzSection('hoavan', 'Hoa văn', 'Hoa văn / họa tiết đặc trưng',
        '<div class="pattern-grid">' + v.patterns.map(p =>
          '<div class="pat"><div class="pbox"><img src="' + PAT_DIR + p[0] + '" alt="Họa tiết ' + p[1] + ' — ' + v.name + '" loading="lazy"></div>' +
          '<h5>' + p[1] + '</h5><p>' + p[2] + '</p></div>').join('') + '</div>', false) +
      (v.thuctrang ? dzSection('thuctrang', 'Hôm nay & ngày mai', 'Thực trạng & phát triển', dzRows(v.thuctrang), false) : '');

    /* áp trạng thái ẩn/hiện mặc định */
    DZ_SECTIONS.forEach(s => {
      const sec = body.querySelector('[data-dz="' + s.id + '"]');
      if(sec) sec.hidden = !s.def;
    });

    dossier.hidden = false;
    if(window.stamp) stamp(k);
    setTimeout(() => dossier.scrollIntoView({behavior:'smooth', block:'start'}), 60);
  }
  window.openVillage = function(k){ renderList(); renderDossier(k); };

  /* 3 miền: Bắc mở được, Trung + Nam coming soon */
  document.getElementById('regionBac').addEventListener('click', renderList);
  ['regionTrung', 'regionNam'].forEach((id, i) => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('click', () =>
      showToast('✦ Làng nghề <b>Miền ' + (i === 0 ? 'Trung' : 'Nam') + '</b> — Coming soon ✦'));
  });
  const back = document.getElementById('mapBack');
  if(back) back.addEventListener('click', renderIntro);

  document.querySelector('.vnmap').addEventListener('click', e => {
    const pin = e.target.closest('.vpin'); if(pin){ renderDossier(pin.dataset.v); return; }
    const card = e.target.closest('.mapv-card'); if(card){ renderDossier(card.dataset.v); return; }
    const vp = e.target.closest('.vprod'); if(vp && vp.dataset.p){ openProduct(vp.dataset.p); return; }
    const tg = e.target.closest('.side-toggle');
    if(tg){
      tg.classList.toggle('on');
      const sec = body.querySelector('[data-dz="' + tg.dataset.sec + '"]');
      if(sec){
        sec.hidden = !tg.classList.contains('on');
        if(!sec.hidden){ sec.classList.add('open'); sec.scrollIntoView({behavior:'smooth', block:'nearest'}); }
      }
      return;
    }
    const head = e.target.closest('.dz-head');
    if(head){ head.parentElement.classList.toggle('open'); return; }
    const more = e.target.closest('.dz-more');
    if(more){
      const box = more.closest('.dz-artisan');
      box.classList.toggle('open');
      more.textContent = box.classList.contains('open') ? 'Thu gọn tiểu sử ▴' : 'Đọc tiểu sử đầy đủ ▾';
      return;
    }
  });
  renderIntro();
})();

/* thẻ "Khám phá" 3 làng ở trang chủ -> mở thẳng hồ sơ làng trên trang bản đồ */
document.querySelectorAll('[data-village]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  go('expo');
  if(window.openVillage) openVillage(a.dataset.village);
}));

/* =========================================================================
   LIÊN HỆ VỚI CHÚNG TÔI — 2 lựa chọn: gọi điện / gửi mail
   ========================================================================= */
(function(){
  const modal = document.getElementById('contactModal');
  if(!modal) return;
  const open = () => modal.classList.add('open');
  const close = () => modal.classList.remove('open');
  document.getElementById('contactBtn').addEventListener('click', open);
  document.querySelectorAll('[data-cs]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(); }));
  modal.querySelectorAll('[data-ctx]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });

  /* bấm = sao chép (không gọi điện / mở app mail) */
  function copyLegacy(t){
    return new Promise((res, rej) => {                   // fallback: textarea + execCommand
      const ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try{ ok = document.execCommand('copy'); } catch(err){}
      ta.remove();
      ok ? res() : rej(new Error('copy failed'));
    });
  }
  function copyText(t){
    if(navigator.clipboard && navigator.clipboard.writeText)
      return navigator.clipboard.writeText(t).catch(() => copyLegacy(t));
    return copyLegacy(t);
  }
  modal.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
    copyText(btn.dataset.copy)
      .then(() => showToast('✦ Đã sao chép ' + btn.dataset.copyLabel + ': <b>' + btn.dataset.copy + '</b>'))
      .catch(() => showToast('Không sao chép được — vui lòng chép tay: <b>' + btn.dataset.copy + '</b>'));
  }));
})();

/* =========================================================================
   ĐĂNG NHẬP (demo) — nhập gì cũng chấp nhận, hiện tên khi bấm icon tài khoản
   ========================================================================= */
(function(){
  const modal = document.getElementById('loginModal');
  if(!modal) return;
  const form = document.getElementById('loginForm');
  const profile = document.getElementById('profileBox');
  const loginBtn = document.getElementById('loginBtn');
  const loginMenuLink = document.getElementById('loginMenuLink');
  let user = JSON.parse(localStorage.getItem('kvUser') || 'null');

  function paint(){
    if(user){
      loginBtn.textContent = user.name;
      loginBtn.title = 'Xem tài khoản của bạn';
      loginMenuLink.textContent = 'Tài khoản · ' + user.name;
    } else {
      loginBtn.textContent = 'Đăng nhập';
      loginBtn.removeAttribute('title');
      loginMenuLink.textContent = 'Đăng nhập';
    }
  }
  function openModal(){
    const logged = !!user;
    form.hidden = logged; profile.hidden = !logged;
    document.getElementById('loginTitle').textContent = logged ? 'Tài khoản của bạn' : 'Đăng nhập KIMVIE';
    if(logged){
      document.getElementById('pfName').textContent = user.name;
      document.getElementById('pfAva').textContent = (user.name.trim()[0] || 'K').toUpperCase();
      document.getElementById('pfMeta').textContent = 'Thành viên từ ' + user.since;
      document.getElementById('pfEmail').textContent = user.email || '—';
      document.getElementById('pfPhone').textContent = user.phone || '—';
    }
    modal.classList.add('open');
  }
  const close = () => modal.classList.remove('open');

  form.addEventListener('submit', e => {
    e.preventDefault();                                  // demo: chấp nhận mọi thông tin
    user = {
      name: document.getElementById('lgName').value.trim() || 'Khách KIMVIE',
      email: document.getElementById('lgEmail').value.trim(),
      phone: document.getElementById('lgPhone').value.trim(),
      since: new Date().toLocaleDateString('vi-VN')
    };
    localStorage.setItem('kvUser', JSON.stringify(user));
    paint(); close();
    showToast('✦ Xin chào <b>' + user.name + '</b> — đăng nhập thành công!');
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    user = null; localStorage.removeItem('kvUser');
    paint(); close();
    showToast('Bạn đã đăng xuất. Hẹn gặp lại ✦');
  });
  loginBtn.addEventListener('click', e => { e.preventDefault(); openModal(); });
  loginMenuLink.addEventListener('click', e => {
    e.preventDefault();
    document.body.classList.remove('nav-open');
    openModal();
  });
  modal.querySelectorAll('[data-lx]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
  paint();
})();

/* =========================================================================
   MÔ PHỎNG SỬ DỤNG SẢN PHẨM — upload ảnh phòng, kéo thả / xoay / phóng icon
   ========================================================================= */
(function(){
  const stage = document.getElementById('simStage');
  if(!stage) return;
  const fileIn = document.getElementById('simFile');
  const empty = document.getElementById('simEmpty');
  const room = document.getElementById('simRoom');
  const itemsBox = document.getElementById('simItems');
  const controls = document.getElementById('simControls');
  const tray = document.getElementById('simTray');
  const actions = document.getElementById('simActions');
  const rot = document.getElementById('simRotate'), rotVal = document.getElementById('simRotateVal');
  const scl = document.getElementById('simScale'), sclVal = document.getElementById('simScaleVal');
  const removeBtn = document.getElementById('simRemove');
  let hasRoom = false;
  let active = null;                                     // phần tử .sim-item đang chọn

  /* dải sản phẩm (icon từ product_img) */
  tray.innerHTML = Object.entries(PRODUCTS).map(([id, p]) =>
    '<button class="sim-thumb" type="button" data-sim="' + id + '" title="Bấm để thêm ' + p.name + ' vào ảnh">' +
      '<img src="' + PROD_DIR + p.img + '" alt="' + p.name + '" loading="lazy"><small>' + p.name + '</small>' +
    '</button>').join('');

  function items(){ return [...itemsBox.querySelectorAll('.sim-item')]; }
  function stateOf(el){ return el._sim; }
  function applyTransform(el){
    const s = stateOf(el);
    el.style.left = s.x + '%';
    el.style.top = s.y + '%';
    el.style.transform = 'translate(-50%,-50%) rotate(' + s.rot + 'deg) scale(' + (s.scale / 100) + ')';
  }
  function syncSliders(){
    if(!active){ removeBtn.hidden = true; return; }
    const s = stateOf(active);
    rot.value = s.rot; scl.value = s.scale;
    rotVal.textContent = s.rot + '°';
    sclVal.textContent = s.scale + '%';
    removeBtn.hidden = false;
  }
  function markTray(){
    const placed = new Set(items().map(el => stateOf(el).id));
    tray.querySelectorAll('.sim-thumb').forEach(t => t.classList.toggle('on', placed.has(t.dataset.sim)));
  }
  function select(el){
    active = el;
    items().forEach(it => it.classList.toggle('selected', it === el));
    syncSliders();
    actions.hidden = !(hasRoom && items().length);
  }
  function removeItem(el){
    const wasActive = el === active;
    el.remove();
    if(wasActive){ const rest = items(); select(rest[rest.length - 1] || null); }
    markTray();
    actions.hidden = !(hasRoom && items().length);
  }
  function addItem(id){
    const p = PRODUCTS[id]; if(!p) return;
    const n = items().length;
    const el = document.createElement('div');
    el.className = 'sim-item';
    /* món mới xếp lệch dần để không chồng khít lên nhau */
    el._sim = {id, x:Math.min(86, 42 + (n % 5) * 9), y:Math.min(86, 52 + (n % 4) * 8), rot:0, scale:100};
    el.innerHTML = '<img src="' + PROD_DIR + p.img + '" alt="' + p.name + '" draggable="false">' +
      '<button class="sim-del" type="button" aria-label="Xóa ' + p.name + ' khỏi ảnh">✕</button>';
    itemsBox.appendChild(el);
    applyTransform(el);
    select(el);
    markTray();
    if(!hasRoom) showToast('Hãy tải lên ảnh góc phòng của bạn trước nhé ✦');
  }
  window.simPreload = function(name){
    const hit = Object.entries(PRODUCTS).find(([, p]) => p.name === name);
    if(hit) addItem(hit[0]);
  };

  function setRoom(src){
    room.src = src; room.hidden = false;
    empty.hidden = true; hasRoom = true;
    stage.classList.add('has-room');
    controls.hidden = false;
    actions.hidden = !items().length;
    showToast('✦ Đã tải ảnh phòng — giờ chọn sản phẩm bên dưới để đặt vào ✦');
  }

  /* upload: chọn file hoặc kéo thả */
  fileIn.addEventListener('change', () => {
    const f = fileIn.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = () => setRoom(r.result);
    r.readAsDataURL(f);
  });
  ['dragover', 'dragenter'].forEach(ev => stage.addEventListener(ev, e => { e.preventDefault(); stage.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev => stage.addEventListener(ev, e => { e.preventDefault(); stage.classList.remove('dragover'); }));
  stage.addEventListener('drop', e => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if(f && f.type.startsWith('image/')){
      const r = new FileReader();
      r.onload = () => setRoom(r.result);
      r.readAsDataURL(f);
    }
  });
  document.getElementById('simReplace').addEventListener('click', () => fileIn.click());

  /* chọn / xóa / kéo thả từng sản phẩm trong khung (pointer events: chuột + cảm ứng) */
  let dragging = null;
  itemsBox.addEventListener('click', e => {
    const del = e.target.closest('.sim-del');
    if(del){ removeItem(del.closest('.sim-item')); return; }
  });
  itemsBox.addEventListener('pointerdown', e => {
    if(e.target.closest('.sim-del')) return;
    const el = e.target.closest('.sim-item'); if(!el) return;
    select(el);
    dragging = el; el.setPointerCapture(e.pointerId);
  });
  itemsBox.addEventListener('pointermove', e => {
    if(!dragging) return;
    const r = stage.getBoundingClientRect();
    const s = stateOf(dragging);
    s.x = Math.min(98, Math.max(2, (e.clientX - r.left) / r.width * 100));
    s.y = Math.min(98, Math.max(2, (e.clientY - r.top) / r.height * 100));
    applyTransform(dragging);
  });
  ['pointerup', 'pointercancel'].forEach(ev => itemsBox.addEventListener(ev, () => { dragging = null; }));

  /* bấm ra ngoài (nền ảnh hoặc bất kỳ đâu trên trang): bỏ chọn sản phẩm
     để khung viền + nút ✕ biến mất, người dùng ngắm trọn bức ảnh */
  document.addEventListener('pointerdown', e => {
    if(!active) return;
    if(e.target.closest('.sim-item, .sim-controls, .sim-tray, .sim-actions')) return;
    select(null);
  });

  rot.addEventListener('input', () => {
    if(!active) return;
    stateOf(active).rot = +rot.value;
    rotVal.textContent = rot.value + '°';
    applyTransform(active);
  });
  scl.addEventListener('input', () => {
    if(!active) return;
    stateOf(active).scale = +scl.value;
    sclVal.textContent = scl.value + '%';
    applyTransform(active);
  });
  removeBtn.addEventListener('click', () => { if(active) removeItem(active); });

  tray.addEventListener('click', e => {
    const t = e.target.closest('[data-sim]'); if(!t) return;
    addItem(t.dataset.sim);
  });

  /* dán xong: 2 lựa chọn */
  document.getElementById('simBuy').addEventListener('click', () => {
    items().forEach(el => {
      const p = PRODUCTS[stateOf(el).id]; if(!p) return;
      addToCart(p.name, parseInt(p.price.replace(/\D/g, ''), 10) || 0);
    });
    if(window.openCart) openCart();                      // nhảy đến giỏ hàng / thanh toán
  });
  document.getElementById('simLater').addEventListener('click', () => {
    itemsBox.innerHTML = ''; select(null); markTray();
    showToast('Không sao — sản phẩm vẫn chờ bạn ở gian hàng ✦');
    document.getElementById('allProducts').scrollIntoView({behavior:'smooth'});
  });
})();

/* =========================================================================
   CÂU CHUYỆN NGHỆ NHÂN — 12 chân dung từ "content cho câu chuyện làng nghề.docx"
   ========================================================================= */
const NN_VILLAGE = {
  bt:{tag:'Gốm Bát Tràng',  img:'assets/lang_nghe_img/GỐM BÁT TRÀNG.webp', mf:'bt'},
  vp:{tag:'Lụa Vạn Phúc',   img:'assets/lang_nghe_img/LỤA TƠ TẰM.jpg',     mf:'vp'},
  pv:{tag:'Mây tre Phú Vinh',img:'assets/lang_nghe_img/MÂY ĐAN TRE.png',   mf:'pv'}
};
const NN_STORIES = [
 {v:'bt', name:'Nghệ nhân Nhân dân Trần Độ', role:'Hậu duệ đời thứ 18 dòng họ Trần · "Vua men gốm" Bát Tràng',
  date:'18.06.2026', mins:6, img:'assets/bai_viet/Trần Độ.png',
  sapo:'Nghệ nhân Nhân dân Trần Độ nổi tiếng với những dòng men cổ được phục chế và tác phẩm gốm sứ tinh xảo. Nhờ tài năng và sự sáng tạo của mình, ông đã tạo ra nhiều tác phẩm mang giá trị nghệ thuật cao, góp phần làm rạng danh làng nghề Bát Tràng.',
  quote:'Đừng chỉ tặng một món quà – hãy trao một giá trị văn hoá!',
  secs:[
   ['Tiểu sử',[
    'Trần Độ là hậu duệ đời thứ 18 của dòng họ Trần — một dòng họ có truyền thống làm gốm lâu đời và nổi tiếng tại Bát Tràng. Sinh ra và lớn lên trong cái nôi của gốm sứ, ông sớm được tiếp xúc và hun đúc tình yêu với nghề gốm từ khi 10 tuổi.',
    'Ông là một trong số ít nghệ nhân Bát Tràng bỏ nhiều công sức và thời gian để đi tìm lại những kiểu dáng, dòng men gốm cổ từ những thế hệ trước.']],
   ['Hành trình sự nghiệp',[
    'Năm 1975, Trần Độ bắt đầu sự nghiệp bằng công việc công nhân tại một xí nghiệp gốm sứ Bát Tràng. Từ 1977 đến 1982, ông thực hiện nghĩa vụ quân sự; sau khi xuất ngũ tiếp tục công tác tại Xí nghiệp sứ Bát Tràng, rồi làm thiết kế tạo mẫu gốm của hợp tác xã Ánh Hồng và được cử đi nghiên cứu về gốm sứ ở 6 tỉnh phía Nam.',
    'Năm 1989, ông quyết định mở lò sản xuất gốm sứ theo hướng đi riêng: giai đoạn đầu tập trung vào đồ gốm sinh hoạt, giai đoạn sau dành trọn tâm huyết nghiên cứu và phục dựng men gốm cổ. Phải mất gần 20 năm, ông mới tìm ra bí quyết của nhiều loại men gốm cổ.',
    'Năm 1999, bộ sưu tập 20 sản phẩm gốm của ông được trưng bày tại triển lãm ở đền Vua Lê Thái Tổ (Hà Nội) và gây ấn tượng mạnh với giới nghiên cứu văn hóa. Năm 2004, ông được giao trọng trách chế tác bình rượu giả cổ triều Lê – Mạc làm quà tặng các đại biểu quốc tế dự Hội nghị cấp cao ASEM-5; năm 2005, Thủ tướng Phan Văn Khải chọn lô 219 sản phẩm gốm phục chế cổ vật của ông làm quà tặng chính khách quốc tế trong chuyến thăm Mỹ và Canada.']],
   ['Thành tựu & di sản',[
    'Ông được phong tặng Nghệ nhân Ưu tú năm 2010, Nghệ nhân Nhân dân và Công dân ưu tú Thủ đô năm 2016, được vinh danh Công dân Thủ đô năm 2019. Năm 2020, ông trưng bày bộ sưu tập gốm tại Hội nghị Cấp cao ASEAN 36 và hiến tặng bộ sưu tập "Ấn triều Nguyễn" cho Trung tâm bảo tồn di tích cung đình Huế; tháng 6/2024 tổ chức triển lãm "Biểu tượng rồng qua gốm Trần Độ" tại Tuần lễ Festival nghệ thuật Quốc tế Huế.',
    'Nghệ nhân Trần Độ nổi tiếng với việc phục dựng thành công nhiều dòng men gốm cổ, góp phần gìn giữ di sản gốm sứ Việt Nam — nổi bật là men hoa lam, men độc sắc, men ngọc, men hoa nâu… Hiện nay ông vẫn miệt mài sáng tạo và truyền dạy nghề gốm cho thế hệ sau.']]]},

 {v:'bt', name:'Nghệ nhân Ưu tú Tô Thanh Sơn', role:'Bậc thầy ấm chén hỏa biến · Người phục chế men cổ thất truyền',
  date:'16.06.2026', mins:5, img:'assets/bai_viet/Tô Thanh Sơn.png',
  sapo:'Nghệ nhân Ưu tú Tô Thanh Sơn là một bậc thầy chế tác gốm sứ tại Bát Tràng, sở hữu dòng ấm chén hỏa biến trứ danh được nhiều người yêu thích, đồng thời nổi tiếng với tài năng phục chế các dòng men cổ đã thất truyền.',
  quote:'Chúng tôi không chờ già rồi mất. Chúng tôi in tim mình vào lòng người từ đất!',
  secs:[
   ['Tiểu sử',[
    'Ông sinh năm 1962 trong một gia đình có truyền thống làm gốm lâu đời tại làng Bát Tràng, huyện Gia Lâm, Hà Nội. Kế thừa nghề của gia đình, trải qua nhiều khó khăn thử thách, ông đã gặt hái nhiều thành công trong lĩnh vực phục chế men cổ.']],
   ['Sự nghiệp',[
    'Đầu những năm 1980, sau khi hoàn thành nghĩa vụ quân sự, ông quyết định lập nghiệp bằng chính nghề gốm của gia đình. Những năm đầu khởi nghiệp đầy trắc trở — ông từng trắng tay khi bị đối tác chiếm dụng vốn qua một hợp đồng làm ăn.',
    'Không nản lòng, ông tập trung vào dòng gốm gia dụng với họa tiết, men cổ truyền thống, chú trọng chất lượng từ khâu chọn đất, chế tác men đến kỹ thuật nung. Gốm Tô Thanh Sơn dần khẳng định tên tuổi với dòng ấm chén men hỏa biến hoa nở lòng chén mang đậm dấu ấn cá nhân.']],
   ['Thành tựu nổi bật',[
    'Ông chế tác đôi bình gốm phục dựng chính xác màu men lam xám cổ xưa của bậc tiền bối Đặng Huyền Thông từ thế kỷ XVI; khôi phục thành công dòng men gốm cổ thời Hậu Lê với họa tiết đắp nổi tinh xảo đặc trưng khu Thái Miếu – Lam Kinh (Thanh Hóa); và phục chế, phát triển dòng men rạn cổ đã thất truyền từ thế kỷ XIX.',
    'Năm 2008, ông hoàn thành tác phẩm chóe gốm men trà "Dâng Hiến" dâng tặng Đại lễ 1000 năm Thăng Long – Hà Nội; năm 2018 tác phẩm được trao bằng xác lập Độc bản Kỷ lục Việt Nam. Năm 2015, ông được Nhà nước phong tặng danh hiệu Nghệ nhân Ưu tú.',
    'Các dòng sản phẩm nổi bật: bộ ấm chén trà hỏa biến với màu sắc biến ảo độc đáo; bát đĩa men hỏa biến dày dặn bền chắc; bình gốm trang trí giá trị thẩm mỹ cao; và các tác phẩm tượng gốm — tượng Phật, tượng rồng, tượng thần linh.']]]},

 {v:'bt', name:'Nghệ nhân Ưu tú Vương Mạnh Tuấn', role:'Ấm Tử Sa đất Việt · Vò Rồng Đại lễ 1000 năm Thăng Long',
  date:'14.06.2026', mins:4, img:'assets/bai_viet/Vương Mạnh Tuấn.png',
  sapo:'Hơn bốn thập kỷ dành cho nghệ thuật làm gốm, nghệ nhân Vương Mạnh Tuấn nổi tiếng với khả năng pha trộn đất sét tạo ra ấm trà Tử Sa tương đương chất lượng đất sét Nghi Hưng (Giang Tô, Trung Quốc).',
  quote:'Hình tượng con rồng luôn là nguồn cảm hứng cho các tác phẩm của mình, biểu hiện cho tâm hồn cao thượng và ước mơ vươn lên.',
  secs:[
   ['Tiểu sử',[
    'Ông sinh năm 1964 tại làng nghề truyền thống Bát Tràng, Hà Nội. Ông tham gia làm việc tại xưởng sản xuất của Xí nghiệp Gốm sứ Bát Tràng từ năm 1978 và mở lò gốm riêng vào năm 1988. Bất chấp việc chưa từng được đào tạo bài bản về gốm sứ, ông vẫn kiên trì gìn giữ và phát triển nghề gia truyền.']],
   ['Thành tựu',[
    'Trong khuôn khổ Đại lễ 1000 năm Thăng Long – Hà Nội, ông tạo ra hai tác phẩm đặc sắc là Bình chạm hoa văn và chiếc Vò Rồng. Chiếc Vò Rồng cao 1m50, làm từ chất liệu men rạn truyền thống và đắp nổi rồng uốn lượn — mỗi chiếc vảy, mỗi ngón chân sắc nhọn được tạo tác tỉ mỉ, tượng trưng cho sức mạnh và uy nghi của dân tộc Việt Nam.',
    'Ông chia sẻ rằng hình tượng con rồng luôn là nguồn cảm hứng cho các tác phẩm của mình — biểu hiện cho tâm hồn cao thượng và ước mơ vươn lên.']]]},

 {v:'bt', name:'Nghệ nhân Nguyễn Hùng', role:'Cha đẻ dòng men "Hoàng Thổ Liên Hoa" · 40+ năm với nghề',
  date:'12.06.2026', mins:5, img:'assets/bai_viet/Nguyễn Hùng.png',
  sapo:'Sinh năm 1971 tại Hải Phòng, nghệ nhân Nguyễn Hùng là một tên tuổi lớn trong làng gốm sứ Việt Nam — hơn 40 năm miệt mài cống hiến, để lại dấu ấn với những tác phẩm độc đáo và góp phần đưa gốm Việt vươn xa trên trường quốc tế.',
  quote:'Tôi muốn có sự lan tỏa, để những người thợ giỏi càng say mê làm thêm nhiều tác phẩm, để thế giới biết đến gốm Việt nhiều hơn.',
  secs:[
   ['Sự nghiệp',[
    'Bắt đầu từ một thanh niên trẻ được giao nhiệm vụ khảo sát nghề gốm trên khắp cả nước vào những năm 1980, đến năm 1986 ông quyết định ở lại làng gốm Bát Tràng — nơi gắn bó và xây dựng nghiệp gốm của riêng mình.',
    'Tại đây, ông học nghề từ việc làm thuê tại các xưởng gốm; khi tay nghề cứng cáp hơn, ông đến làm thợ tại các lò gốm lớn để học hỏi kinh nghiệm, đồng thời tự mày mò, sáng tạo thêm nhiều phương pháp chế tác mới.']],
   ['Thành tựu',[
    'Dấu ấn lớn nhất trong sự nghiệp của ông là dòng men "Hoàng Thổ Liên Hoa". Xuất phát từ tình yêu dành cho hoa sen — quốc hoa của Việt Nam — ông đã mất 15 năm nghiên cứu để tạo ra dòng men độc đáo kết hợp thân sen khô (thay thế tro trấu), đất trầm tích sông Hồng và các khoáng thạch tự nhiên.',
    'Từ dòng men "Hoàng Thổ Liên Hoa" đến những tác phẩm đạt kỷ lục Guinness, ông đã và đang góp phần nâng tầm gốm sứ Bát Tràng. Ông luôn trăn trở về việc định vị gốm Việt trên trường quốc tế, đồng thời khuyến khích thế hệ trẻ kiên trì theo đuổi đam mê và gìn giữ nghề truyền thống.']]]},

 {v:'bt', name:'Nghệ nhân Ưu tú Nguyễn Văn Hưng', role:'Nghệ sĩ hội họa trên gốm · Truyền nhân men rạn giả cổ',
  date:'10.06.2026', mins:5, img:'assets/bai_viet/Nguyễn Văn Hưng .png',
  sapo:'Sinh ra và lớn lên tại làng gốm Bát Tràng, con trai của cố nghệ nhân ưu tú Nguyễn Văn Cổn — người nổi tiếng với những tác phẩm gốm men rạn giả cổ xuất sắc — nghệ nhân Nguyễn Văn Hưng từ nhỏ đã "ăn cơm với đất, ngủ với gốm".',
  quote:'Làm gốm cũng như làm người, muốn có sản phẩm đẹp, trước hết đất phải thuần, lửa phải đều, và tâm mình phải tĩnh. Đất không bao giờ biết nói dối, mình đối xử với đất thế nào, gốm sẽ trả lại mình như thế ấy.',
  secs:[
   ['Tiểu sử',[
    'Những bài học đầu tiên về nhào đất, chọn men và kỹ thuật vẽ trên gốm được cha ông truyền dạy trực tiếp. Chính nền tảng gia đình này đã hình thành nên tư duy thẩm mỹ và sự kiên trì đặc biệt trong con người ông.']],
   ['Sự nghiệp & dấu ấn nghệ thuật',[
    'Ông không chỉ là người làm nghề mà được xem là một nghệ sĩ hội họa trên gốm. Điểm mạnh nhất là kỹ thuật vẽ bút lông trực tiếp trên cốt gốm (vẽ lam, vẽ men màu) — đường nét thanh thoát, phóng khoáng nhưng vẫn tuân thủ chặt chẽ bố cục truyền thống.',
    'Kế thừa từ cha, ông đặc biệt thành công trong việc nghiên cứu và khôi phục các dòng men rạn cổ — loại men khó chế tác, đòi hỏi am hiểu sâu sắc về độ co của xương gốm và nhiệt độ nung để tạo ra những vết rạn tự nhiên, đều đặn.',
    'Triết lý sáng tạo của ông là "Đất phải có hồn": gốm không phải vật vô tri, mỗi sản phẩm ra đời phải kể được một câu chuyện — về làng quê Việt Nam, về điển tích cổ, hoặc về triết lý nhân sinh.']],
   ['Thành tựu nổi bật',[
    'Ông được Nhà nước phong tặng danh hiệu Nghệ nhân Ưu tú vì những cống hiến bền bỉ cho làng nghề. Các bộ ấm chén, bình hoa vẽ họa tiết hoa sen, tùng cúc trúc mai với kỹ thuật vẽ lam tinh xảo và các sản phẩm giả cổ men rạn của ông thường xuyên được nhà sưu tầm trong và ngoài nước săn đón, trưng bày trong các triển lãm mỹ nghệ quốc gia.',
    'Không giữ bí quyết cho riêng mình, ông tận tâm đào tạo nhiều thế hệ thợ trẻ tại Bát Tràng — nhiều người học việc từ xưởng của ông nay đã trở thành nghệ nhân độc lập, góp phần duy trì mạch sống cho làng nghề.']]]},

 {v:'vp', name:'Nghệ nhân Nguyễn Thị Tâm', role:'"Báu vật sống" của làng lụa Vạn Phúc · Người phục dựng Lụa Vân',
  date:'08.06.2026', mins:6, img:'assets/bai_viet/Nguyễn Thị Tâm.png',
  sapo:'Nghệ nhân Nguyễn Thị Tâm là một trong những tên tuổi lớn đại diện cho tinh hoa dệt lụa Việt Nam — người được ví như "báu vật sống" của làng lụa Vạn Phúc, nổi tiếng nhờ kỳ tích phục dựng thành công dòng Lụa Vân, loại lụa tiến vua thượng hạng từng bị thất truyền.',
  quote:'Đời tằm ngắn ngủi, nhưng sợi tơ của nó nhả ra, qua bàn tay người thợ, để lại cho đời những sản phẩm vô giá.',
  secs:[
   ['Tiểu sử',[
    'Bà sinh ra và lớn lên trong một gia đình có truyền thống làm nghề dệt tại Vạn Phúc, là con dâu của cố Nghệ nhân ưu tú Triệu Văn Mão — bậc thầy lỗi lạc đã dành cả cuộc đời cho lụa Vạn Phúc. Môi trường gia đình giàu truyền thống và sự dẫn dắt của bố chồng đã hun đúc trong bà tình yêu sâu sắc với tiếng thoi đưa và những sợi tơ tằm mềm mại từ khi còn rất trẻ.']],
   ['Quá trình sự nghiệp',[
    'Giai đoạn đầu, bà tiếp nối nghề truyền thống từ gia đình — học từ khâu chọn tơ, nhuộm màu tự nhiên đến kỹ thuật dệt trên khung cửi thủ công. Những năm 90, khi thị trường tràn ngập vải công nghiệp giá rẻ và nghề dệt Vạn Phúc đứng trước nguy cơ mai một, bà cùng gia đình kiên trì bám trụ, tìm hướng đi mới bằng cách phục dựng các mẫu hoa văn cổ.',
    'Cột mốc quan trọng nhất là hành trình phục dựng "Lụa Vân": bà dành nhiều năm tìm kiếm tư liệu cổ, nghiên cứu những mảnh lụa cũ để khôi phục kỹ thuật dệt hoa văn nổi trên mặt lụa — kỹ thuật đã thất truyền suốt hàng chục năm.',
    'Hiện nay, bà không chỉ là nghệ nhân sản xuất mà còn đứng đầu các dự án bảo tồn, trực tiếp hướng dẫn kỹ thuật cho các thế hệ thợ trẻ và đón tiếp khách du lịch quốc tế, góp phần đưa lụa Vạn Phúc trở thành thương hiệu quốc gia.']],
   ['Thành tựu',[
    'Lụa Vân Vạn Phúc của bà thường xuyên hiện diện trong những phẩm vật quốc gia làm quà lưu niệm cho các nguyên thủ và khách quý quốc tế đến Việt Nam.',
    'Bảng vàng thành tích của bà gồm: "Ngôi sao Việt Nam 2006", "Bông hồng vàng Thủ đô" 2008 & 2010, "Sản phẩm công nghiệp nông thôn tiêu biểu" 2011 & 2013, "Thương hiệu nghề truyền thống – Báu vật quốc gia Việt Nam" 2011 & 2013, cùng danh hiệu "Công dân ưu tú Thủ đô 2015" — vinh dự cho gia tộc có hai thế hệ nghệ nhân và cả làng lụa Vạn Phúc. Có thể nói, ngọn lửa nghề lụa không bao giờ tắt trong lòng nghệ nhân Nguyễn Thị Tâm.']]]},

 {v:'vp', name:'Nghệ nhân Triệu Văn Mão', role:'Nghệ nhân Dân gian Việt Nam · Người khôi phục lụa Vân',
  date:'06.06.2026', mins:6, img:'assets/bai_viet/Triệu Văn Mão.png',
  sapo:'Không chấp nhận để một di sản hàng trăm năm biến mất, cố nghệ nhân Triệu Văn Mão đã dành cả cuộc đời cho hành trình phục dựng dòng lụa Vân — một trong những loại lụa cao cấp nhất của Vạn Phúc từng gần như thất truyền.',
  quote:'Giữ nghề là giữ lấy tổ tiên, sợi tơ có bền thì danh tiếng làng mới mãi trường tồn.',
  secs:[
   ['Tiểu sử',[
    'Ông sinh ra và lớn lên tại làng lụa Vạn Phúc trong một gia đình nhiều đời làm nghề dệt. Từ khi 7–8 tuổi, ông đã được cha mẹ hướng dẫn cách quay tơ, mắc cửi và dệt những tấm lụa đầu tiên.',
    'Thời đất nước khó khăn, ông từng tham gia quân đội và làm việc trong ngành cơ khí, nhưng luôn đau đáu với nghề truyền thống. Trở về quê hương, ông quyết định dành toàn bộ tâm huyết khôi phục nghề dệt lụa, đặc biệt là dòng lụa Vân. Với ông, nghề dệt không chỉ là kế sinh nhai mà còn là một phần bản sắc văn hóa dân tộc — giữ nghề chính là gìn giữ lịch sử và giá trị truyền thống của quê hương.']],
   ['Sự nghiệp',[
    'Sau thời kỳ bao cấp, thị trường xuất khẩu thu hẹp, nhiều gia đình bỏ nghề; kỹ thuật dệt lụa Vân — vốn phức tạp và đòi hỏi tay nghề cao — gần như không còn người thực hiện. Ông bắt đầu hành trình phục dựng: nhiều năm tìm kiếm mảnh lụa cũ, nghiên cứu tài liệu lịch sử, gặp gỡ các bậc cao niên và kiên trì thử nghiệm trên khung dệt. Có những hoa văn ông mất hàng tháng, thậm chí hàng năm mới phục chế thành công.',
    'Khác với vải in hoa văn sau khi dệt, lụa Vân được tạo hoa văn ngay trong quá trình dệt bằng cách điều khiển hệ thống go và sợi dọc – sợi ngang chính xác tuyệt đối; hoa văn chìm nổi hiện lên sống động khi thay đổi góc nhìn hoặc ánh sáng.',
    'Sau nhiều năm nghiên cứu, ông đã phục dựng thành công hơn 20 mẫu lụa cổ quý như Vân Triện Thọ, Vân Song Hạc, Vân Tứ Quý, Vân Quế Hồng Diệp. Ông còn xây dựng cơ sở dệt lụa gia đình, trực tiếp hướng dẫn nhiều thế hệ thợ trẻ và mở cửa xưởng đón khách tham quan trong nước, quốc tế.']],
   ['Thành tựu & đóng góp',[
    'Ông được phong tặng danh hiệu Nghệ nhân Dân gian Việt Nam năm 2005, ghi nhận những cống hiến trong việc bảo tồn nghề truyền thống.',
    'Sau khi ông qua đời, gia đình tiếp tục phát triển cơ sở dệt mang tên Triệu Văn Mão. Con dâu ông — nghệ nhân Nguyễn Thị Tâm — kế thừa toàn bộ kỹ thuật dệt lụa Vân và phát triển thương hiệu Mão Silk; các dòng sản phẩm đã được thành phố Hà Nội công nhận OCOP 3 sao. Giới nghiên cứu luôn xem ông là một trong những người có công lớn nhất trong việc bảo tồn và phục hưng dòng lụa Vân.']]]},

 {v:'vp', name:'Nghệ nhân – CEO Lê Thị Kim Thư', role:'Chủ tịch HĐQT Công ty CP Phát triển Lụa Vạn Phúc',
  date:'04.06.2026', mins:5, img:'assets/bai_viet/Lê Thị Kim Thư .png',
  sapo:'Khác với nhiều nghệ nhân chỉ tập trung vào sản xuất, Lê Thị Kim Thư chọn hướng đi kết hợp giữa bảo tồn giá trị truyền thống và quản trị doanh nghiệp — với khát vọng đưa lụa Hà Đông "tung bay trong nắng gió trời Tây".',
  quote:'Tằm ăn rỗi, nhả tơ dệt nên tình đất, tình người; mỗi tấm lụa không chỉ là sản phẩm, mà là hơi thở của ngàn năm văn hiến được kết tinh từ những bàn tay cần mẫn.',
  secs:[
   ['Tiểu sử',[
    'Lê Thị Kim Thư là doanh nhân, nghệ nhân và nhà quản lý gắn bó nhiều năm với làng lụa Vạn Phúc (Hà Đông, Hà Nội), được biết đến với vai trò Chủ tịch Hội đồng quản trị Công ty Cổ phần Phát triển Lụa Vạn Phúc. Bà cho rằng làng nghề chỉ có thể tồn tại bền vững khi sản phẩm vừa giữ được bản sắc văn hóa, vừa đáp ứng nhu cầu của thị trường trong nước và quốc tế.']],
   ['Sự nghiệp',[
    'Trên cương vị Chủ tịch HĐQT, bà định hướng chiến lược phát triển làng nghề theo hướng kết hợp sản xuất, thương mại và du lịch văn hóa — không chỉ nâng cao giá trị kinh tế của sản phẩm lụa mà còn xây dựng Vạn Phúc thành một điểm đến văn hóa của Hà Nội.',
    'Theo bà, muốn nghề dệt tồn tại lâu dài thì phải bắt đầu từ chất lượng sản phẩm: chú trọng nguyên liệu, kiểm soát quy trình và giữ gìn các kỹ thuật dệt truyền thống, song song với đổi mới mẫu mã phù hợp thị hiếu hiện đại. Trong một cuộc phỏng vấn năm 2019, bà bày tỏ mong muốn lụa Hà Đông "tung bay trong nắng gió trời Tây" — vừa là mục tiêu kinh doanh, vừa là cách quảng bá văn hóa Việt Nam ra thế giới.']],
   ['Thành tựu & đóng góp',[
    'Đóng góp lớn nhất của bà là xây dựng mô hình phát triển kết hợp giữa bảo tồn nghề truyền thống và phát triển kinh tế. Bà kiên trì chiến lược xây dựng thương hiệu dựa trên bản sắc văn hóa thay vì cạnh tranh bằng giá rẻ.',
    'Năm 2024, khi làng nghề dệt lụa Vạn Phúc tham gia đánh giá gia nhập Mạng lưới các Thành phố Thủ công Sáng tạo Thế giới, bà chia sẻ rằng trách nhiệm của người làm nghề là luôn đặt tâm huyết vào từng công đoạn sản xuất. Ngày nay, bà được xem là gương mặt tiêu biểu của thế hệ doanh nhân làng nghề mới — đưa lụa Vạn Phúc thành thương hiệu có sức cạnh tranh toàn cầu mà vẫn giữ trọn kỹ thuật và giá trị truyền thống.']]]},

 {v:'vp', name:'Nghệ nhân Nguyễn Hữu Chỉnh', role:'"Nghệ nhân Bàn tay vàng" · Chủ tịch Hiệp hội Làng nghề Vạn Phúc',
  date:'02.06.2026', mins:5, img:'assets/bai_viet/Nguyễn Hữu Chỉnh.png',
  sapo:'Từ hơn 20 năm xây dựng ngành dệt Sơn La đến vai trò Chủ tịch Hiệp hội Làng nghề Vạn Phúc, nghệ nhân Nguyễn Hữu Chỉnh là người góp công lớn phục hồi nghề dệt lụa sau thời kỳ khó khăn và xây nền cho thương hiệu làng nghề thời hội nhập.',
  quote:'Uy tín của làng nghề không được xây dựng từ một cá nhân mà từ chất lượng đồng đều của tất cả các cơ sở sản xuất.',
  secs:[
   ['Tiểu sử',[
    'Ông sinh ra trong một gia đình có truyền thống làm nghề dệt lụa tại Vạn Phúc, lớn lên khi nghề dệt thủ công là nguồn sinh kế chủ yếu của người dân địa phương. Từ năm 1969 đến 1989, ông tham gia xây dựng và quản lý Xí nghiệp Dệt Sơn La — đào tạo đội ngũ công nhân kỹ thuật và chuyển giao kinh nghiệm sản xuất lụa cho địa phương.',
    'Sau khi nghỉ công tác, ông trở về quê hương đúng thời điểm làng nghề gặp nhiều khó khăn do thay đổi cơ chế kinh tế và sự cạnh tranh của vải công nghiệp. Thay vì nghỉ ngơi, ông tiếp tục cống hiến bằng việc tham gia phục hồi sản xuất và xây dựng thương hiệu cho làng nghề.']],
   ['Sự nghiệp',[
    'Chứng kiến nhiều hộ dân bỏ nghề vì thị trường thu hẹp, ông cùng nhiều nghệ nhân tích cực vận động người dân duy trì nghề truyền thống, đồng thời tìm hướng phát triển mới.',
    'Dấu mốc quan trọng là việc tham gia thành lập và giữ cương vị Chủ tịch Hiệp hội Làng nghề Vạn Phúc — kết nối nghệ nhân, doanh nghiệp và cơ quan quản lý; tổ chức quảng bá sản phẩm, tham gia hội chợ thủ công mỹ nghệ, xây dựng hình ảnh chung cho thương hiệu lụa Vạn Phúc. Ông thường xuyên vận động các hộ kinh doanh dùng nguyên liệu tốt, giữ đúng quy trình dệt truyền thống, không đánh đổi chất lượng lấy lợi nhuận ngắn hạn.',
    'Ông còn tích cực thúc đẩy du lịch làng nghề: theo ông, để nghề dệt tồn tại lâu dài, không chỉ cần bán sản phẩm mà còn phải giới thiệu với du khách về lịch sử, văn hóa và quy trình tạo nên một tấm lụa.']],
   ['Thành tựu & đóng góp',[
    'Ông được trao danh hiệu "Nghệ nhân Bàn tay vàng" — ghi nhận nghệ nhân có tay nghề xuất sắc và nhiều đóng góp bảo tồn nghề thủ công truyền thống — và được vinh danh Doanh nhân tiêu biểu Thăng Long – Hà Nội.',
    'Di sản ông để lại không chỉ là những sản phẩm lụa chất lượng cao mà còn là tinh thần đoàn kết, ý thức giữ gìn uy tín nghề truyền thống và tầm nhìn phát triển làng nghề bền vững — giúp lụa Vạn Phúc trở thành một biểu tượng văn hóa của Hà Nội và Việt Nam.']]]},

 {v:'pv', name:'Nghệ nhân Nhân dân Nguyễn Văn Tĩnh', role:'Hơn 50 năm giữ nghề · Công dân Thủ đô ưu tú 2025',
  date:'30.05.2026', mins:6, img:'assets/bai_viet/Nguyễn Văn Tĩnh.png',
  sapo:'Sinh ra trong gia đình ba đời làm nghề mây tre đan tại Phú Vinh, Nghệ nhân Nhân dân Nguyễn Văn Tĩnh được xem là một trong những người có đóng góp lớn nhất trong việc đưa mây tre đan Phú Vinh từ nghề thủ công truyền thống trở thành sản phẩm mỹ nghệ giá trị cao trên thị trường quốc tế.',
  quote:'Mây tre là chất liệu của làng, nhưng cũng là chất liệu của tâm hồn. Nếu người làm nghề không có tình yêu và sự kiên nhẫn, sẽ chẳng bao giờ tạo nên được một tác phẩm sống động.',
  secs:[
   ['Tiểu sử',[
    'Ông sinh năm 1964 tại thôn Phú Vinh, xã Phú Nghĩa, huyện Chương Mỹ (nay thuộc Hà Nội). Cha ông là nghệ nhân Nguyễn Văn Khiếu — người đầu tiên tại Việt Nam đan thành công chân dung Chủ tịch Hồ Chí Minh bằng mây tre và là người tiên phong đưa họa tiết mỹ thuật vào sản phẩm đan lát.',
    'Ông bắt đầu học nghề từ khoảng 10 tuổi; đến 17 tuổi đã thành thạo các kỹ thuật chẻ mây, vót nan, tạo hình, xử lý nguyên liệu. Không dừng ở việc kế thừa, ông còn nghiên cứu các phương pháp xử lý nguyên liệu nhằm tăng độ bền, chống mối mọt và nâng cao giá trị thẩm mỹ của sản phẩm.']],
   ['Sự nghiệp',[
    'Những năm đầu, ông chủ yếu sản xuất các mặt hàng truyền thống như rổ, rá, giỏ, khay. Nhận ra làng nghề sẽ khó cạnh tranh nếu chỉ duy trì sản phẩm cũ, ông nghiên cứu xu hướng thiết kế trong và ngoài nước để sáng tạo các sản phẩm ứng dụng và nghệ thuật cao hơn: đèn trang trí, bình hoa, đồ nội thất, hộp quà, khung tranh.',
    'Năm 2008, ông thành lập Công ty TNHH Mây tre đan Việt Quang — vừa sản xuất, vừa nghiên cứu thiết kế mẫu mã mới và đào tạo lao động địa phương; sản phẩm xuất khẩu sang Nhật Bản, Hàn Quốc, châu Âu và Hoa Kỳ. Ông theo đuổi triết lý kết hợp truyền thống và hiện đại: giữ nguyên kỹ thuật đan thủ công đặc trưng của Phú Vinh nhưng liên tục đổi mới kiểu dáng, công năng và phong cách thiết kế.']],
   ['Thành tựu & đóng góp',[
    'Ông đạt Huy chương Vàng sản phẩm thủ công mỹ nghệ năm 1986; Giải Nhất Giải thưởng sáng tạo kiểu dáng "Golden-V" năm 2006 với tác phẩm "Đèn treo" (VCCI trao tặng); được phong tặng danh hiệu Nghệ nhân Nhân dân; và năm 2025 được vinh danh Công dân Thủ đô ưu tú.',
    'Sản phẩm "Lồng bàn đan mây" của Công ty Việt Quang do ông sáng lập được công nhận Sản phẩm công nghiệp nông thôn tiêu biểu cấp quốc gia năm 2025. Xưởng của ông thường xuyên tiếp nhận học viên, truyền dạy kỹ thuật và chia sẻ kinh nghiệm sáng tạo, góp phần gìn giữ nghề trước nguy cơ thiếu hụt lao động kế cận.']]]},

 {v:'pv', name:'Nghệ nhân Nhân dân Nguyễn Văn Trung', role:'Tranh chân dung bằng mây · Người thầy của làng Phú Vinh',
  date:'28.05.2026', mins:6, img:'assets/bai_viet/Nguyễn Văn Trung.png',
  sapo:'Vượt qua nghịch cảnh bệnh tật từ năm 15 tuổi, nghệ nhân Nguyễn Văn Trung trở thành một trong những nghệ nhân tiêu biểu nhất của Phú Vinh — người mở trung tâm dạy nghề miễn phí cho người khuyết tật và đưa mây tre đan thành tác phẩm nghệ thuật được thế giới biết đến.',
  quote:'Với tôi, đan là một hoạt động hấp dẫn. Sáng tạo kiểu mẫu để đan là một thú vui. Tôi có thể làm thành bất cứ thứ gì, chỉ từ những sợi đan.',
  secs:[
   ['Tiểu sử',[
    'Ông sinh năm 1953 tại làng nghề mây tre đan Phú Vinh. Sinh ra trong gia đình nhiều đời làm nghề, từ nhỏ ông đã được cha và các nghệ nhân trong làng hướng dẫn cách chọn mây, xử lý nguyên liệu và những kỹ thuật đan truyền thống.',
    'Năm 15 tuổi, ông mắc một căn bệnh về cơ khiến việc đi lại khó khăn, phải nằm điều trị thời gian dài. Nhiều người nghĩ ông sẽ không thể theo nghề, nhưng chính trong hoàn cảnh đó, ông càng quyết tâm gắn bó với mây tre đan — coi nghề là động lực vượt qua nghịch cảnh và khẳng định giá trị bản thân.']],
   ['Sự nghiệp',[
    'Năm 1972, ông tham gia Hợp tác xã Nông nghiệp Phú Vinh, được bầu làm Đội trưởng Đội kỹ thuật; đội sản xuất do ông phụ trách giành giải Nhất cuộc thi tay nghề giỏi của làng. Năm 1980, ông đạt giải thưởng "Tuổi trẻ sáng tạo" tại Liên Xô — thành tích mở ra cơ hội theo học tại Trường Đại học Mỹ thuật Công nghiệp Hà Nội.',
    'Năm 1983, ông được Ủy ban Khoa học Nhà nước và Bộ Đại học cử sang Cuba với vai trò chuyên gia, trực tiếp giảng dạy kỹ thuật làm hàng thủ công mỹ nghệ. Tháng 10/2005, ông thành lập Công ty TNHH Mỹ nghệ Hoa Sơn; năm 2007 tiếp tục mở Trung tâm Dạy nghề tư thục Mây tre đan Phú Vinh — đào tạo nghề miễn phí cho người khuyết tật, trung bình mỗi năm 400–500 học viên.']],
   ['Thành tựu & đóng góp',[
    'Thành tựu lớn nhất của ông là nâng tầm mây tre đan Phú Vinh từ sản phẩm thủ công thành tác phẩm mỹ thuật có giá trị văn hóa và thương mại cao. Bức chân dung Chủ tịch Hồ Chí Minh bằng mây tre — thực hiện hoàn toàn từ sợi mây tự nhiên với kỹ thuật xử lý màu sắc và tạo hình tinh xảo — được xem là một trong những tác phẩm tiêu biểu của nghệ thuật mây tre đan Việt Nam.',
    'Ông được phong tặng danh hiệu Nghệ nhân Nhân dân sau danh hiệu Nghệ nhân Ưu tú cùng nhiều giải thưởng trong nước và quốc tế. Việc mở trung tâm đào tạo miễn phí cho người khuyết tật không chỉ bảo tồn nghề truyền thống mà còn mang ý nghĩa nhân văn sâu sắc, tạo sinh kế cho nhiều người có hoàn cảnh khó khăn.']]]},

 {v:'pv', name:'Cố nghệ nhân Nguyễn Văn Khiếu', role:'Người đặt nền móng nghệ thuật tạo hình mây tre Việt Nam',
  date:'26.05.2026', mins:5, img:'assets/bai_viet/Nguyễn Văn Khiếu.jpg',
  sapo:'Cố nghệ nhân Nguyễn Văn Khiếu được xem là một trong những nghệ nhân có ảnh hưởng lớn nhất trong lịch sử làng nghề Phú Vinh — người đầu tiên ở Việt Nam đan thành công chân dung Chủ tịch Hồ Chí Minh bằng mây tre.',
  quote:'Người nghệ nhân phải luôn sáng tạo và không ngừng đổi mới nếu muốn nghề truyền thống tồn tại cùng thời đại.',
  secs:[
   ['Tiểu sử',[
    'Ông sinh ra tại làng nghề Phú Vinh — nơi có truyền thống hơn 400 năm làm nghề mây tre đan. Khác với nhiều người chỉ xem nghề là kế sinh nhai, ông luôn coi mây tre đan là một loại hình nghệ thuật: dành nhiều thời gian nghiên cứu bố cục, mỹ thuật và cách tạo hình để đưa giá trị thẩm mỹ vào sản phẩm truyền thống.',
    'Trong gia đình, ông trực tiếp truyền nghề cho con trai Nguyễn Văn Tĩnh từ khi còn nhỏ — không chỉ dạy kỹ thuật mà còn truyền lại quan điểm rằng người nghệ nhân phải luôn sáng tạo, không ngừng đổi mới.']],
   ['Sự nghiệp',[
    'Trong giai đoạn nghề mây tre đan chủ yếu sản xuất rổ, rá, nia, giỏ và đồ gia dụng, ông mạnh dạn thử nghiệm tạo hình chân dung, tranh nghệ thuật và các tác phẩm trang trí bằng chất liệu mây tre — hướng đi hoàn toàn mới đòi hỏi độ chính xác rất cao và sự phối hợp tinh tế giữa màu sắc tự nhiên của mây với cách sắp xếp từng nan đan.',
    'Dấu mốc quan trọng nhất: ông trở thành người đầu tiên ở Việt Nam đan thành công chân dung Chủ tịch Hồ Chí Minh bằng mây tre. Tác phẩm gây tiếng vang lớn, chứng minh sản phẩm thủ công không chỉ có giá trị sử dụng mà còn có giá trị nghệ thuật và văn hóa, mở ra hướng phát triển mới cho cả làng nghề.']],
   ['Di sản để lại',[
    'Di sản lớn nhất của ông không chỉ là những tác phẩm mây tre đan mang giá trị nghệ thuật mà còn là tư duy đổi mới trong nghề thủ công truyền thống. Ông là người tiên phong đưa các yếu tố hội họa và mỹ thuật vào sản phẩm mây tre đan, nâng cao cả giá trị nghệ thuật lẫn thương mại của sản phẩm Phú Vinh.',
    'Thông qua người con trai — Nghệ nhân Nhân dân Nguyễn Văn Tĩnh — những giá trị ông gây dựng vẫn tiếp tục được gìn giữ và phát huy: các sản phẩm mây tre đan Phú Vinh ngày nay đã có mặt tại Nhật Bản, Hàn Quốc, châu Âu và Hoa Kỳ. Trong giới thủ công mỹ nghệ, ông luôn được nhắc đến như một người thầy lớn của làng nghề Phú Vinh.']]]}
];

(function(){
  const grid = document.getElementById('artisanGrid');
  const page = document.querySelector('main[data-page="art-nn"]');
  if(!grid || !page) return;

  grid.innerHTML = NN_STORIES.map((a, i) => {
    const vv = NN_VILLAGE[a.v];
    return '<a class="b-card" data-nn="' + i + '" href="#art-nn">' +
      '<div class="b-art"><img src="' + (a.img || vv.img) + '" alt="' + a.name + ' — ' + vv.tag + '" loading="lazy"></div>' +
      '<div class="b-body">' +
        '<span class="b-tag">Nghệ nhân · ' + vv.tag + '</span>' +
        '<h4>' + a.name + '</h4>' +
        '<p>' + a.role + '</p>' +
        '<div class="meta-line"><i>✦</i> ' + a.date + ' · ' + a.mins + ' phút đọc</div>' +
      '</div></a>';
  }).join('');

  function openArtisan(i){
    const a = NN_STORIES[i]; if(!a) return;
    const vv = NN_VILLAGE[a.v];
    document.getElementById('nnTitle').textContent = a.name;
    document.getElementById('nnMeta').textContent = '✦ ' + a.date + ' · ' + a.mins + ' phút đọc · ' + vv.tag;
    document.getElementById('nnBody').innerHTML =
      '<figure class="art-figure nn">' +
        '<img src="' + (a.img || vv.img) + '" alt="' + a.name + ' — ' + vv.tag + '" loading="lazy">' +
        '<span class="corner c-tl"></span><span class="corner c-br"></span>' +
        '<figcaption>✦ ' + a.role + ' ✦</figcaption>' +
      '</figure>' +
      '<p class="art-sapo">' + a.sapo + '</p>' +
      a.secs.map(sec =>
        '<h3 class="art-h">' + sec[0] + '</h3>' +
        sec[1].map((p, j) => '<p class="art-p' + (j === 0 && sec === a.secs[0] ? ' dropcap' : '') + '">' + p + '</p>').join('')
      ).join('') +
      '<blockquote class="art-quote">"' + a.quote + '"<br><span class="art-quote-by">— ' + a.name + ' —</span></blockquote>';
    const next = NN_STORIES[(i + 1) % NN_STORIES.length];
    document.getElementById('nnNext').innerHTML =
      '<a class="btn btn-navy" data-mf="' + vv.mf + '" href="#market">Khám phá sản phẩm ' + vv.tag + ' →</a>' +
      '<a class="arrow-link" data-nn="' + ((i + 1) % NN_STORIES.length) + '" href="#art-nn">Đọc tiếp: ' + next.name + '</a>';
    go('art-nn');
  }

  /* điều hướng: thẻ trong danh sách + liên kết "đọc tiếp" + nút lọc gian hàng */
  document.addEventListener('click', e => {
    const nn = e.target.closest('[data-nn]');
    if(nn){ e.preventDefault(); openArtisan(+nn.dataset.nn); return; }
    const mf = e.target.closest('#nnNext [data-mf]');
    if(mf){
      e.preventDefault(); go('market');
      const c = document.querySelector('.filters .chip[data-f="' + mf.dataset.mf + '"]'); if(c) c.click();
    }
  });
})();

/* footer "Sản phẩm mới" -> trang chủ, phần BST Di sản tinh hoa */
(function(){
  const a = document.getElementById('flNew');
  if(!a) return;
  a.addEventListener('click', e => {
    e.preventDefault();
    go('home');
    setTimeout(() => { const s = document.getElementById('tinhhoa'); if(s) s.scrollIntoView({behavior:'smooth'}); }, 80);
  });
})();

/* ===== boot ===== */
const bootPage = (location.hash || '#home').slice(1) || 'home';
/* bài nghệ nhân được đổ nội dung động — tải lại trang thì quay về danh sách bài viết */
go(bootPage === 'art-nn' ? 'story' : bootPage);
