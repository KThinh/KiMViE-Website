/* =========================================================================
   KIMVIE — interaction layer
   (sound, chatbot and CSKH widgets intentionally removed in this redesign)
   ========================================================================= */

/* ===== SPA router ===== */
const pages = document.querySelectorAll('main[data-page]');
const navLinks = document.querySelectorAll('[data-go]');
function go(p){
  pages.forEach(m => m.classList.toggle('active', m.dataset.page === p));
  const nk = (p === 'article') ? 'story' : p;
  document.querySelectorAll('.menu a').forEach(a => a.classList.toggle('on', a.dataset.go === nk));
  document.body.classList.remove('nav-open');            // close mobile menu
  if(window.stamp){ if(p === 'expo') stamp('expo'); if(p === 'article') stamp('read'); }
  window.scrollTo({top:0, behavior:'instant'});
  history.replaceState(null, '', '#' + p);
  retagReveal();
}
navLinks.forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.go); }));

/* ===== mobile menu ===== */
const navToggle = document.getElementById('navToggle');
if(navToggle){
  navToggle.addEventListener('click', () => document.body.classList.toggle('nav-open'));
}

/* ===== cart (demo) ===== */
let cart = 0;
const badge = document.getElementById('cartBadge');
const toast = document.getElementById('toast');
let toastT;
function showToast(html){
  toast.innerHTML = html; toast.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2400);
}
document.querySelectorAll('.cart-btn').forEach(b => b.addEventListener('click', () => {
  cart++; badge.textContent = cart; badge.classList.add('show');
  showToast('Đã thêm <b>' + (b.dataset.name || 'sản phẩm') + '</b> vào giỏ hàng ✦');
  if(window.stamp) stamp('cart');
}));

/* ===== sold counts on product cards ===== */
const SOLD = {'Bình gốm men rạn':'1,2k','Khăn lụa tơ tằm':'2,3k','Đèn mây tre đan':'860','Bộ ấm chén men lam':'1,5k','Khăn lụa thêu tay':'640','Giỏ mây đan thủ công':'3,1k','Lọ hoa men ngọc':'420','Đèn lồng tre treo trần':'510'};
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
  retagReveal();
}));

/* ===== heritage passport ===== */
const STAMPS = [
 {id:'bt',name:'Men Lam',icon:'s-vase',vb:'0 0 100 150',how:'Mở hồ sơ Gốm Bát Tràng (trang Làng nghề)'},
 {id:'vp',name:'Tơ Vàng',icon:'s-loom',vb:'0 0 160 130',how:'Mở hồ sơ Lụa Vạn Phúc (trang Làng nghề)'},
 {id:'pv',name:'Tre Xanh',icon:'s-basket',vb:'0 0 120 110',how:'Mở hồ sơ Mây tre Phú Vinh (trang Làng nghề)'},
 {id:'expo',name:'Lữ Khách',icon:'s-arch-mini',vb:'0 0 80 100',how:'Ghé thăm Triển lãm 3D'},
 {id:'relic',name:'Hiện Vật',icon:'s-lantern',vb:'0 0 110 140',how:'Mở xem một hiện vật trong triển lãm'},
 {id:'read',name:'Thư Làng',icon:'s-lac',vb:'0 0 160 100',how:'Đọc bài viết Câu chuyện thương hiệu'},
 {id:'cart',name:'Giữ Lửa',icon:'s-fire',vb:'0 0 60 60',how:'Thêm một sản phẩm vào giỏ hàng'},
 {id:'ws',name:'Đồng Hành',icon:'s-hands',vb:'0 0 60 60',how:'Đặt chỗ một workshop (trang Sự kiện)'}
];
let earned = JSON.parse(localStorage.getItem('kvStamps') || '{}');
const ppModal = document.getElementById('ppModal'), ppGrid = document.getElementById('ppGrid');
function renderPassport(){
  const n = Object.keys(earned).length;
  ppGrid.innerHTML = STAMPS.map(s => '<div class="stamp' + (earned[s.id] ? ' got' : '') + '" title="' + s.how + '">'
    + '<svg class="art" width="30" height="30" viewBox="' + s.vb + '"><use href="#' + s.icon + '"/></svg>'
    + '<small>' + s.name + '</small></div>').join('');
  document.getElementById('ppCount').textContent = n + '/8 con dấu';
  document.getElementById('ppTitle').textContent = n >= 8 ? '✦ Người Giữ Lửa ✦' : (n >= 4 ? 'Lữ khách thân quen' : 'Lữ khách mới');
  document.getElementById('ppFill').style.width = (n / 8 * 100) + '%';
  const bd = document.getElementById('ppBadge'); bd.textContent = n; bd.classList.toggle('show', n > 0);
  document.getElementById('ppReward').innerHTML = n >= 8
    ? '<b style="color:var(--vermilion)">Đủ 8 con dấu — bạn chính thức là NGƯỜI GIỮ LỬA!</b><br>Mã ưu đãi 10% cho đơn tiếp theo:<br><span class="code">GIULUA10</span>'
    : 'Sưu tập đủ <b>8 con dấu</b> để nhận danh hiệu <b>Người Giữ Lửa</b> + mã ưu đãi 10%.<br><span style="font-size:11px">Di chuột vào từng ô dấu để biết cách nhận.</span>';
}
window.stamp = function(id){
  if(earned[id]) return;
  const s = STAMPS.find(x => x.id === id); if(!s) return;
  earned[id] = Date.now(); localStorage.setItem('kvStamps', JSON.stringify(earned));
  renderPassport();
  const n = Object.keys(earned).length;
  showToast(n >= 8 ? '🎉 Đủ 8 dấu — bạn là <b>Người Giữ Lửa</b>! Mở hộ chiếu nhận ưu đãi'
                   : '❖ Nhận dấu <b>' + s.name + '</b> (' + n + '/8) — xem trong Hộ chiếu di sản');
};
function openPP(){ renderPassport(); ppModal.classList.add('open'); }
document.getElementById('ppBtn').addEventListener('click', openPP);
document.getElementById('tbPass').addEventListener('click', openPP);
ppModal.querySelectorAll('[data-ppx]').forEach(el => el.addEventListener('click', () => ppModal.classList.remove('open')));
document.getElementById('ppReset').addEventListener('click', e => {
  e.preventDefault(); earned = {}; localStorage.removeItem('kvStamps'); renderPassport();
  showToast('Hộ chiếu đã làm mới — bắt đầu hành trình nào ✦');
});
document.querySelectorAll('.ev-book').forEach(b => b.addEventListener('click', e => {
  e.preventDefault();
  if(!earned.ws){ stamp('ws'); } else { showToast('Đã ghi nhận đặt chỗ (demo) ✦'); }
}));
renderPassport();

/* ===== product "digital ID" + QR ===== */
const ARTISAN = {bt:'NNƯT Trần Văn Khang', vp:'NNƯT Đỗ Thị Lụa', pv:'NNƯT Nguyễn Văn Tre'};
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
document.getElementById('newId').addEventListener('click', () => { openProduct('binh-men-ran'); setMTab('card'); });
document.getElementById('newSnd').addEventListener('click', () => go('expo'));

/* ===== product catalogue + modal ===== */
const PRODUCTS = {
 'binh-men-ran':{name:'Bình gốm men rạn',tag:'Gốm Bát Tràng',f:'bt',price:'1.250.000đ',sym:'s-vase',vb:'0 0 100 150',w:175,h:255,
  desc:'Men rạn cổ truyền với những vết rạn tự nhiên như mạng thời gian. Mỗi chiếc bình được vuốt tay trên bàn xoay và nung suốt 24 giờ trong lò truyền thống Bát Tràng.'},
 'am-chen':{name:'Bộ ấm chén men lam',tag:'Gốm Bát Tràng',f:'bt',price:'990.000đ',sym:'s-teaset',vb:'0 0 140 100',w:250,h:178,
  desc:'Hoạ tiết men lam vẽ tay dưới men — sắc xanh đặc trưng Bát Tràng đã chinh phục người yêu trà suốt nhiều thế kỷ. Bộ gồm 1 ấm, 6 chén và khay gỗ.'},
 'khan-lua':{name:'Khăn lụa tơ tằm',tag:'Lụa Vạn Phúc',f:'vp',price:'850.000đ',sym:'s-scarf',vb:'0 0 120 130',w:195,h:212,
  desc:'Dệt thủ công 100% tơ tằm trên khung cửi gỗ nghìn năm tuổi nghề. Hoa văn vân mây cổ, nhuộm màu tự nhiên — nhẹ và thoáng như hơi thở.'},
 'lua-theu':{name:'Khăn lụa thêu tay',tag:'Lụa Vạn Phúc',f:'vp',price:'1.100.000đ',sym:'s-scarf',vb:'0 0 120 130',w:195,h:212,
  desc:'Từng đường kim mũi chỉ được nghệ nhân thêu tay trong nhiều ngày. Phiên bản giới hạn theo mùa, mỗi chiếc khăn là một bức tranh độc bản.'},
 'den-may':{name:'Đèn mây tre đan',tag:'Mây tre Phú Vinh',f:'pv',price:'650.000đ',sym:'s-lantern',vb:'0 0 110 140',w:185,h:235,
  desc:'Nan tre vót mỏng, đan tay theo kỹ thuật Phú Vinh 400 năm. Khi thắp sáng, bóng nan tre đổ lên tường như một bức tranh khắc sống động.'},
 'gio-may':{name:'Giỏ mây đan thủ công',tag:'Mây tre Phú Vinh',f:'pv',price:'420.000đ',sym:'s-basket',vb:'0 0 120 110',w:205,h:188,
  desc:'Mây tự nhiên xử lý chống mối mọt, đan nong đôi bền chắc. Món đồ bình dị mang hồn quê Bắc Bộ vào không gian sống hiện đại.'}
};
const pModal = document.getElementById('pModal');
let curP = null;
function openProduct(id){
  const p = PRODUCTS[id]; if(!p) return; curP = p;
  document.getElementById('mName').textContent = p.name;
  document.getElementById('mTag').textContent = p.tag;
  document.getElementById('mPrice').textContent = p.price;
  document.getElementById('mSold').textContent = '★ 4.9 · Đã bán ' + (SOLD[p.name] || '500+') + ' · Còn hàng';
  document.getElementById('mDesc').textContent = p.desc;
  const art = document.getElementById('mArt');
  art.setAttribute('viewBox', p.vb); art.setAttribute('width', p.w); art.setAttribute('height', p.h);
  document.getElementById('mUse').setAttribute('href', '#' + p.sym);
  if(window.fillIdCard) fillIdCard(p);
  if(window.setMTab) setMTab('intro');
  if(window.stamp) stamp('relic');
  pModal.classList.add('open');
}
function closeModal(){ pModal.classList.remove('open'); }
pModal.querySelectorAll('[data-x]').forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){ closeModal(); ppModal.classList.remove('open'); }
});
document.querySelectorAll('[data-p]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); openProduct(el.dataset.p); }));
document.getElementById('mBuy').addEventListener('click', e => {
  e.preventDefault(); closeModal(); go('market');
  const chip = document.querySelector('.filters .chip[data-f="' + (curP ? curP.f : 'all') + '"]');
  if(chip) chip.click();
});

/* ===== market filters ===== */
document.querySelectorAll('.filters .chip').forEach(c => c.addEventListener('click', () => {
  c.parentElement.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
  c.classList.add('on');
  const f = c.dataset.f;
  document.querySelectorAll('#allProducts .p-card').forEach(p => {
    p.style.display = (f === 'all' || p.dataset.v === f) ? 'flex' : 'none';
  });
}));

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

/* ===== boot ===== */
go((location.hash || '#home').slice(1) || 'home');
