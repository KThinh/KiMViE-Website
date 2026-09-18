/* search.html?q=... — kết quả tìm kiếm thật từ server (tên + mô tả sản phẩm). */

const CART_BTN_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1.2 10.3a2 2 0 0 1-2 1.7H8.2a2 2 0 0 1-2-1.7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>';
const q = new URLSearchParams(location.search).get('q') || '';
document.getElementById('searchTitle').textContent = q ? 'Kết quả cho "' + q + '"' : 'Kết quả tìm kiếm';
document.getElementById('navSearchInput').value = q;

async function load(){
  if(!q){ document.getElementById('searchEmpty').hidden = false; return; }
  let data;
  try{ data = await kvApi('/api/products?q=' + encodeURIComponent(q) + '&per_page=48'); }
  catch(e){ document.getElementById('searchGrid').innerHTML = '<p>Không tải được kết quả.</p>'; return; }

  document.getElementById('searchEmpty').hidden = data.items.length > 0;
  document.getElementById('searchGrid').innerHTML = data.items.map(p =>
    '<article class="p-card" data-id="' + p.id + '">' +
      '<div class="p-art' + (p.image_url?' has-img':'') + '">' + (p.image_url ? '<img src="' + p.image_url + '" alt="' + esc(p.name) + '" loading="lazy">' : '') + '</div>' +
      '<h4>' + esc(p.name) + '</h4><div class="pl">' + esc(p.village_name) + '</div>' +
      '<div class="p-foot"><span class="price">' + fmtVnd(p.price) + '</span><button class="cart-btn" type="button" ' + (p.stock===0?'disabled':'') + '>' + CART_BTN_SVG + '</button></div>' +
    '</article>'
  ).join('');

  document.querySelectorAll('#searchGrid .p-card').forEach(card => {
    const p = data.items.find(x => String(x.id) === card.dataset.id);
    card.addEventListener('click', e => { if(!e.target.closest('.cart-btn')) window.location.href = 'product.html?id=' + p.id; });
    const btn = card.querySelector('.cart-btn');
    if(!p.stock) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      kvCartAdd({id: String(p.id), name: p.name, price: p.price, image: p.image_url});
      showToast('Đã thêm <b>' + esc(p.name) + '</b> vào giỏ hàng ✦');
    });
  });
}
load();
