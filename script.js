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
document.querySelectorAll('.cart-btn').forEach(b => b.addEventListener('click', (e) => {
  e.stopPropagation();
  cart++; badge.textContent = cart; badge.classList.add('show');
  showToast('Đã thêm <b>' + (b.dataset.name || 'sản phẩm') + '</b> vào giỏ hàng ✦');
  if(window.stamp) stamp('cart');
}));

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
  retagReveal();
}));

/* ===== heritage passport ===== */
const STAMPS = [
 {id:'bt',name:'Men Lam',icon:'s-vase',vb:'0 0 100 150',how:'Mở hồ sơ Gốm Bát Tràng (trang Làng nghề)'},
 {id:'vp',name:'Tơ Vàng',icon:'s-loom',vb:'0 0 160 130',how:'Mở hồ sơ Lụa Vạn Phúc (trang Làng nghề)'},
 {id:'pv',name:'Tre Xanh',icon:'s-basket',vb:'0 0 120 110',how:'Mở hồ sơ Mây tre Phú Vinh (trang Làng nghề)'},
 {id:'expo',name:'Lữ Khách',icon:'s-arch-mini',vb:'0 0 80 100',how:'Ghé thăm Bản đồ làng nghề'},
 {id:'relic',name:'Hiện Vật',icon:'s-lantern',vb:'0 0 110 140',how:'Mở xem một hiện vật trong triển lãm'},
 {id:'read',name:'Thư Làng',icon:'s-lac',vb:'0 0 160 100',how:'Đọc bài viết Câu chuyện thương hiệu'},
 {id:'cart',name:'Giữ Lửa',icon:'s-fire',vb:'0 0 60 60',how:'Thêm một sản phẩm vào giỏ hàng'}
];
let earned = JSON.parse(localStorage.getItem('kvStamps') || '{}');
const ppModal = document.getElementById('ppModal'), ppGrid = document.getElementById('ppGrid');
function renderPassport(){
  const n = Object.keys(earned).length;
  ppGrid.innerHTML = STAMPS.map(s => '<div class="stamp' + (earned[s.id] ? ' got' : '') + '" title="' + s.how + '">'
    + '<svg class="art" width="30" height="30" viewBox="' + s.vb + '"><use href="#' + s.icon + '"/></svg>'
    + '<small>' + s.name + '</small></div>').join('');
  document.getElementById('ppCount').textContent = n + '/7 con dấu';
  document.getElementById('ppTitle').textContent = n >= 7 ? '✦ Người Giữ Lửa ✦' : (n >= 4 ? 'Lữ khách thân quen' : 'Lữ khách mới');
  document.getElementById('ppFill').style.width = (n / 7 * 100) + '%';
  const bd = document.getElementById('ppBadge'); bd.textContent = n; bd.classList.toggle('show', n > 0);
  document.getElementById('ppReward').innerHTML = n >= 7
    ? '<b style="color:var(--vermilion)">Đủ 7 con dấu — bạn chính thức là NGƯỜI GIỮ LỬA!</b><br>Mã ưu đãi 10% cho đơn tiếp theo:<br><span class="code">GIULUA10</span>'
    : 'Sưu tập đủ <b>7 con dấu</b> để nhận danh hiệu <b>Người Giữ Lửa</b> + mã ưu đãi 10%.<br><span style="font-size:11px">Di chuột vào từng ô dấu để biết cách nhận.</span>';
}
window.stamp = function(id){
  if(earned[id]) return;
  const s = STAMPS.find(x => x.id === id); if(!s) return;
  earned[id] = Date.now(); localStorage.setItem('kvStamps', JSON.stringify(earned));
  renderPassport();
  const n = Object.keys(earned).length;
  showToast(n >= 7 ? '🎉 Đủ 7 dấu — bạn là <b>Người Giữ Lửa</b>! Mở hộ chiếu nhận ưu đãi'
                   : '❖ Nhận dấu <b>' + s.name + '</b> (' + n + '/7) — xem trong Hộ chiếu di sản');
};
function openPP(){ renderPassport(); ppModal.classList.add('open'); }
document.getElementById('ppBtn').addEventListener('click', openPP);
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
function openProduct(id){
  const p = PRODUCTS[id]; if(!p) return; curP = p;
  document.getElementById('mName').textContent = p.name;
  document.getElementById('mTag').textContent = p.tag;
  document.getElementById('mPrice').textContent = p.price;
  document.getElementById('mSold').textContent = '★ 4.9 · Đã bán ' + (SOLD[p.name] || '500+') + ' · Còn hàng';
  document.getElementById('mDesc').textContent = p.desc;
  const box = document.querySelector('.m-art');
  if(box) box.innerHTML = '<img class="m-photo" src="' + PROD_DIR + p.img + '" alt="' + p.name + '">'
    + '<div class="cap">✦ Ảnh sản phẩm thực tế · KIMVIE ✦</div>';
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

/* ===== market filters + pagination (combined) ===== */
(function(){
  let curFilter = 'all', curPage = '1';
  function renderMarket(){
    document.querySelectorAll('#allProducts .p-card').forEach(p => {
      const matchF = curFilter === 'all' || p.dataset.v === curFilter;
      const matchP = p.dataset.page === curPage;
      p.style.display = (matchF && matchP) ? 'flex' : 'none';
    });
  }
  document.querySelectorAll('.filters .chip').forEach(c => c.addEventListener('click', () => {
    c.parentElement.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
    c.classList.add('on');
    curFilter = c.dataset.f;
    renderMarket();
  }));
  document.querySelectorAll('.pagination .chip').forEach(c => c.addEventListener('click', () => {
    c.parentElement.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
    c.classList.add('on');
    curPage = c.dataset.page;
    renderMarket();
    document.getElementById('allProducts').scrollIntoView({behavior:'smooth', block:'start'});
  }));
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
  const wind = document.getElementById('aWind'), flute = document.getElementById('aFlute'), btn = document.getElementById('audioBtn');
  if(!wind || !flute || !btn) return;
  const WIND_VOL = 0.375, FLUTE_VOL = 0.5, FADE = 2.5;   // wind lowered 25% below its previous 0.5 level
  const ICON_ON  = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6.5a8 8 0 0 1 0 11"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>';
  let enabled = localStorage.getItem('kvAudio'); enabled = enabled === null ? true : enabled === '1';
  let playing = false, fluteTimer = null;

  function paint(){ btn.innerHTML = enabled ? ICON_ON : ICON_OFF; btn.classList.toggle('off', !enabled); btn.setAttribute('aria-pressed', enabled ? 'true' : 'false'); }

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
  function setEnabled(on){ enabled = on; localStorage.setItem('kvAudio', on ? '1' : '0'); paint(); if(on) start(); else stop(); }

  btn.addEventListener('click', () => setEnabled(!enabled));
  paint();

  if(enabled){
    start();
    // autoplay is blocked until a user gesture — kick it off on the first one
    const kick = () => { if(enabled && wind.paused){ playing = false; start(); } window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
  }
})();

/* ===== interactive map of craft villages ===== */
const VILLAGES = {
  bt:{ name:'Gốm Bát Tràng', region:'Gia Lâm · Hà Nội', img:'GỐM BÁT TRÀNG.webp',
    blurb:'Hơn 700 năm bên sông Hồng — cái nôi của gốm sứ Việt.',
    lead:'Nằm bên tả ngạn sông Hồng, Bát Tràng là làng gốm cổ và danh tiếng bậc nhất Việt Nam, nơi đất và lửa kết tinh thành những tác phẩm vượt thời gian.',
    body:['Đất sét được luyện kỹ, vuốt tay trên bàn xoay rồi nung trong lò bầu suốt nhiều giờ ở nhiệt độ nghìn độ. Men rạn, men lam, men hỏa biến — mỗi dòng men là một câu chuyện riêng về lửa và thời gian.',
          'Ngày nay, nghệ nhân Bát Tràng vừa giữ lối làm cổ truyền, vừa sáng tạo những dòng men mới, đưa gốm Việt ra thế giới.'],
    facts:[['700+','năm tuổi nghề'],['1.000+','chủ thể sản xuất'],['2019','Di sản văn hóa phi vật thể QG']],
    prods:['am-tra','hu-tra','dia-sen'] },
  vp:{ name:'Lụa Vạn Phúc', region:'Hà Đông · Hà Nội', img:'LỤA TƠ TẰM.jpg',
    blurb:'Nghìn năm tiếng thoi đưa — quê hương của "lụa tiến vua".',
    lead:'Làng lụa Vạn Phúc nức tiếng nghìn năm với nghề dệt tơ tằm, từng dệt nên những tấm "lụa tiến vua" mềm mại như dòng chảy thời gian.',
    body:['Đặc sản là lụa vân: hoa văn chìm trong sợi, chỉ hiện rõ khi soi dưới nắng. Tơ tằm tự nhiên, nhuộm màu thảo mộc cho dải lụa nhẹ, bền và óng ánh.',
          'Mỗi tấm lụa là hàng nghìn lần thoi đưa của bàn tay nghệ nhân — giữ lấy vẻ đẹp Việt trong từng sợi tơ.'],
    facts:[['1.100+','năm tuổi nghề'],['Lụa','tiến vua'],['100%','tơ tằm']],
    prods:['cavat-lua','khan-sen'] },
  pv:{ name:'Mây tre đan Phú Vinh', region:'Chương Mỹ · Hà Nội', img:'MÂY ĐAN TRE.png',
    blurb:'400 năm "đan nắng gió vào nan tre".',
    lead:'Phú Vinh là làng mây tre đan 400 năm tuổi, nơi nghệ nhân khéo léo đến mức đan được cả chân dung bằng những sợi mây mảnh.',
    body:['Nan tre, sợi mây được vót mỏng, xử lý chống mối mọt rồi đan tay theo các kỹ thuật nong mốt, nong đôi, xương cá. Từ vật liệu bình dị, bàn tay nghệ nhân nâng mây tre thành đồ trang trí và thời trang.',
          'Sản phẩm Phú Vinh mộc mạc mà tinh tế, mang hồn quê Bắc Bộ vào nhịp sống đương đại.'],
    facts:[['400+','năm tuổi nghề'],['Đan','chân dung mây'],['Bền','chống mối mọt']],
    prods:['hop-may','tui-may'] }
};
(function(){
  const overview = document.getElementById('mapOverview');
  const zoom = document.getElementById('mapZoom');
  const panel = document.getElementById('mapPanel');
  const north = document.getElementById('northRegion');
  const back = document.getElementById('mapBack');
  if(!overview || !zoom || !panel) return;
  const VDIR = 'assets/lang_nghe_img/';

  function setZoomed(z){ overview.hidden = z; zoom.hidden = !z; }
  function setPins(k){ zoom.querySelectorAll('.vpin').forEach(p => p.classList.toggle('on', p.dataset.v === k)); }

  function renderIntro(){
    setZoomed(false); setPins(null);
    panel.innerHTML =
      '<div class="map-intro">' +
        '<span class="kicker">Bản đồ làng nghề</span>' +
        '<h3>Khám phá tinh hoa thủ công theo từng vùng miền</h3>' +
        '<p>Mỗi vùng đất Việt Nam ôm trong mình những làng nghề trăm năm tuổi. Hành trình của KIMVIE bắt đầu từ <b>Miền Bắc</b> — chiếc nôi của gốm, lụa và mây tre.</p>' +
        '<p>Di chuột lên <b>Miền Bắc</b> trên bản đồ để làm nổi vùng, rồi <b>nhấn để phóng to</b> và xem danh sách làng nghề.</p>' +
      '</div>';
  }
  function renderList(){
    setZoomed(true); setPins(null);
    panel.innerHTML =
      '<div class="mapv-listhead">Làng nghề Miền Bắc</div>' +
      '<div class="mapv-listsub">Chọn một làng nghề để xem câu chuyện và sản phẩm tiêu biểu.</div>' +
      '<div class="mapv-list">' +
      Object.entries(VILLAGES).map(([k,v]) =>
        '<button class="mapv-card" type="button" data-v="' + k + '">' +
          '<img src="' + VDIR + v.img + '" alt="' + v.name + '" loading="lazy">' +
          '<div><div class="vk">' + v.region + '</div><h4>' + v.name + '</h4><p>' + v.blurb + '</p></div>' +
        '</button>').join('') +
      '</div>';
  }
  function renderVillage(k){
    const v = VILLAGES[k]; if(!v) return;
    setZoomed(true); setPins(k);
    const prods = v.prods.map(id => { const p = PRODUCTS[id]; return p ?
      '<button class="vprod" type="button" data-p="' + id + '">' +
        '<img src="' + PROD_DIR + p.img + '" alt="' + p.name + '" loading="lazy">' +
        '<div class="vpb"><h5>' + p.name + '</h5><div class="vpprice">' + p.price + '</div></div>' +
      '</button>' : ''; }).join('');
    panel.innerHTML =
      '<button class="mapv-back2" type="button">← Danh sách làng nghề</button>' +
      '<div class="mapv-detail">' +
        '<div class="vtop"><img class="vhero" src="' + VDIR + v.img + '" alt="' + v.name + '">' +
          '<div class="vcap"><div class="vk">' + v.region + '</div><h3>' + v.name + '</h3></div></div>' +
        '<p class="vlead">' + v.lead + '</p>' +
        v.body.map(b => '<p class="vbody">' + b + '</p>').join('') +
        '<div class="vfacts">' + v.facts.map(f => '<div><b>' + f[0] + '</b><span>' + f[1] + '</span></div>').join('') + '</div>' +
        '<div class="vsub">Sản phẩm tiêu biểu</div>' +
        '<div class="vprod-grid">' + prods + '</div>' +
      '</div>';
    panel.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  north.addEventListener('click', renderList);
  if(back) back.addEventListener('click', renderIntro);
  document.querySelector('.vnmap').addEventListener('click', e => {
    const pin = e.target.closest('.vpin'); if(pin){ renderVillage(pin.dataset.v); return; }
    const card = e.target.closest('.mapv-card'); if(card){ renderVillage(card.dataset.v); return; }
    const b2 = e.target.closest('.mapv-back2'); if(b2){ renderList(); return; }
    const vp = e.target.closest('.vprod'); if(vp && vp.dataset.p){ openProduct(vp.dataset.p); return; }
  });
  renderIntro();
})();

/* ===== boot ===== */
go((location.hash || '#home').slice(1) || 'home');
