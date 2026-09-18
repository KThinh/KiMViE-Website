/* shop.html — danh mục sản phẩm đầy đủ: lọc màu/giá/sale/mới, sắp xếp, tìm kiếm,
   phân trang thật (đọc trực tiếp từ API thay vì lọc client-side như trang cũ). */

const CART_BTN_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1.2 10.3a2 2 0 0 1-2 1.7H8.2a2 2 0 0 1-2-1.7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>';
const PER_PAGE = 12;

const params = new URLSearchParams(location.search);
const state = {
  village: params.get('village') || '',
  color: '',
  maxPrice: 4_000_000,
  sale: params.get('sale') === '1',
  isNew: params.get('new') === '1',
  sort: params.get('sort') || 'featured',
  q: params.get('q') || '',
  page: 1,
};

function productCardHTML(p){
  const badges = (p.is_new ? '<span class="badge-pill badge-new">Mới</span>' : '') +
                 (p.is_sale ? '<span class="badge-pill badge-sale">Sale</span>' : '');
  const priceHTML = p.is_sale
    ? '<span class="price-old">' + fmtVnd(p.original_price) + '</span><span class="price">' + fmtVnd(p.price) + '</span>'
    : '<span class="price">' + fmtVnd(p.price) + '</span>';
  return (
    '<div class="p-art' + (p.image_url ? ' has-img' : '') + '">' +
      (p.image_url ? '<img src="' + p.image_url + '" alt="' + esc(p.name) + '" loading="lazy">' : '') +
    '</div>' +
    '<div>' + badges + '</div>' +
    '<h4>' + esc(p.name) + '</h4><div class="pl">' + esc(p.village_name) + ' · ' + esc(p.shop_name) + '</div>' +
    '<span class="sold">★ ' + p.rating.toFixed(1) + ' (' + p.review_count + ') · Đã bán ' + p.sold_count + (p.stock === 0 ? ' · Hết hàng' : '') + '</span>' +
    '<div class="p-foot">' + priceHTML + '<button class="cart-btn" aria-label="Thêm vào giỏ hàng" type="button" ' + (p.stock === 0 ? 'disabled' : '') + '>' + CART_BTN_SVG + '</button></div>'
  );
}

async function loadShop(){
  const q = new URLSearchParams();
  if(state.village) q.set('village', state.village);
  if(state.color) q.set('color', state.color);
  if(state.maxPrice < 4_000_000) q.set('max_price', state.maxPrice);
  if(state.sale) q.set('sale_only', 'true');
  if(state.isNew) q.set('new_only', 'true');
  if(state.q) q.set('q', state.q);
  q.set('sort', state.sort);
  q.set('page', state.page);
  q.set('per_page', PER_PAGE);

  const grid = document.getElementById('shopGrid');
  grid.innerHTML = '<p style="color:var(--muted)">Đang tải…</p>';
  let data;
  try{ data = await kvApi('/api/products?' + q.toString()); }
  catch(e){ grid.innerHTML = '<p style="color:var(--muted)">Không tải được sản phẩm: ' + esc(e.message) + '</p>'; return; }

  document.getElementById('shopEmpty').hidden = data.items.length > 0;
  document.getElementById('resultCount').textContent = data.total + ' sản phẩm';
  grid.innerHTML = '';
  data.items.forEach(p => {
    const card = document.createElement('article');
    card.className = 'p-card'; card.dataset.p = p.id;
    card.innerHTML = productCardHTML(p);
    card.addEventListener('click', e => { if(!e.target.closest('.cart-btn')) window.location.href = 'product.html?id=' + p.id; });
    const btn = card.querySelector('.cart-btn');
    if(!p.stock) { btn.disabled = true; }
    else btn.addEventListener('click', e => {
      e.stopPropagation();
      kvCartAdd({id: String(p.id), name: p.name, price: p.price, image: p.image_url});
      showToast('Đã thêm <b>' + esc(p.name) + '</b> vào giỏ hàng ✦');
    });
    grid.appendChild(card);
  });

  renderPager(data.total);
}

function renderPager(total){
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pager = document.getElementById('shopPager');
  pager.innerHTML = '';
  for(let i = 1; i <= pages; i++){
    const b = document.createElement('button');
    b.className = 'chip' + (i === state.page ? ' on' : ''); b.type = 'button'; b.textContent = i;
    b.addEventListener('click', () => { state.page = i; loadShop(); window.scrollTo({top:0, behavior:'smooth'}); });
    pager.appendChild(b);
  }
}

document.querySelectorAll('#villageChips .chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('#villageChips .chip').forEach(x => x.classList.remove('on'));
  c.classList.add('on');
  state.village = c.dataset.v; state.page = 1; loadShop();
}));
document.querySelectorAll('#colorSwatches .swatch').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('#colorSwatches .swatch').forEach(x => x.classList.remove('on'));
  c.classList.add('on');
  state.color = c.dataset.c; state.page = 1; loadShop();
}));
const maxPriceInput = document.getElementById('maxPrice');
maxPriceInput.addEventListener('input', () => {
  document.getElementById('maxPriceVal').textContent = fmtVnd(+maxPriceInput.value);
});
maxPriceInput.addEventListener('change', () => {
  state.maxPrice = +maxPriceInput.value; state.page = 1; loadShop();
});
document.getElementById('filterSale').addEventListener('change', e => { state.sale = e.target.checked; state.page = 1; loadShop(); });
document.getElementById('filterNew').addEventListener('change', e => { state.isNew = e.target.checked; state.page = 1; loadShop(); });
document.getElementById('sortSelect').addEventListener('change', e => { state.sort = e.target.value; state.page = 1; loadShop(); });
document.getElementById('clearFilters').addEventListener('click', () => {
  state.village = ''; state.color = ''; state.maxPrice = 4_000_000; state.sale = false; state.isNew = false; state.q = '';
  document.querySelectorAll('#villageChips .chip').forEach((x,i) => x.classList.toggle('on', i === 0));
  document.querySelectorAll('#colorSwatches .swatch').forEach((x,i) => x.classList.toggle('on', i === 0));
  maxPriceInput.value = 4_000_000; document.getElementById('maxPriceVal').textContent = '4.000.000đ';
  document.getElementById('filterSale').checked = false;
  document.getElementById('filterNew').checked = false;
  state.page = 1; loadShop();
});

/* khởi tạo theo query string ban đầu (vd. từ footer/nav: shop.html?village=bt) */
if(state.village){ document.querySelectorAll('#villageChips .chip').forEach(c => c.classList.toggle('on', c.dataset.v === state.village)); }
if(state.sale) document.getElementById('filterSale').checked = true;
if(state.isNew) document.getElementById('filterNew').checked = true;
document.getElementById('sortSelect').value = state.sort;

loadShop();
