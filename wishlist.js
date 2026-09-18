/* wishlist.html — danh sách sản phẩm đã lưu: xem, xoá, thêm thẳng vào giỏ hàng. */

async function load(){
  const u = await window.kvRequireLogin();
  if(!u) return;
  let items;
  try{ items = await kvApi('/api/wishlist'); }
  catch(e){ document.getElementById('wishGrid').innerHTML = '<p>Không tải được danh sách yêu thích.</p>'; return; }

  document.getElementById('wishEmpty').hidden = items.length > 0;
  const productById = Object.fromEntries(items.map(w => [w.product.id, w.product]));
  document.getElementById('wishGrid').innerHTML = items.map(w => {
    const p = w.product;
    return '<article class="p-card" data-id="' + p.id + '">' +
      '<div class="p-art' + (p.image_url?' has-img':'') + '" style="cursor:pointer" onclick="window.location.href=\'product.html?id=' + p.id + '\'">' +
        (p.image_url ? '<img src="' + p.image_url + '" alt="' + esc(p.name) + '" loading="lazy">' : '') +
      '</div>' +
      '<h4>' + esc(p.name) + '</h4><div class="pl">' + esc(p.village_name) + '</div>' +
      '<div class="p-foot"><span class="price">' + fmtVnd(p.price) + '</span></div>' +
      '<div style="display:flex;gap:8px;margin-top:10px">' +
        '<button class="btn btn-amber" data-move="' + p.id + '" type="button" style="flex:1;justify-content:center;padding:9px" ' + (p.stock===0?'disabled':'') + '>Thêm vào giỏ</button>' +
        '<button class="btn btn-line" data-rm="' + p.id + '" type="button" style="padding:9px 14px">Xoá</button>' +
      '</div>' +
    '</article>';
  }).join('');

  // Giỏ hàng của site là localStorage (kvCart), không phải bảng cart_items phía server —
  // nên "thêm vào giỏ" ở đây phải ghi vào kvCart để khớp với cart.html/checkout.html,
  // rồi mới xoá khỏi wishlist phía server.
  document.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', async () => {
    const p = productById[b.dataset.move]; if(!p) return;
    try{
      kvCartAdd({id: String(p.id), name: p.name, price: p.price, image: p.image_url});
      await kvApi('/api/wishlist/' + b.dataset.move, {method:'DELETE'});
      showToast('✦ Đã thêm vào giỏ hàng');
      load();
    }catch(e){ showToast(e.message); }
  }));
  document.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', async () => {
    try{ await kvApi('/api/wishlist/' + b.dataset.rm, {method:'DELETE'}); load(); kvSyncWishBadge(); }
    catch(e){ showToast(e.message); }
  }));
}

load();
