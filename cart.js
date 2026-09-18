/* cart.html — giỏ hàng riêng: chỉnh số lượng, xoá, lưu vào yêu thích, áp voucher,
   rồi chuyển sang checkout.html (yêu cầu đăng nhập). */

const VOUCHERS = {
  GIULUA10: {type:'pct', val:10, label:'Người Giữ Lửa — giảm 10%'},
  TINHHOA15: {type:'pct', val:15, label:'Tinh hoa — giảm 15%'},
  FREESHIP: {type:'amt', val:30000, label:'Miễn 30.000đ phí vận chuyển'},
};
let voucher = localStorage.getItem('kvVoucher') || null;

function cartTotal(items){ return items.reduce((s,i) => s + i.price * i.qty, 0); }
function discountOf(total){
  if(!voucher || !VOUCHERS[voucher]) return 0;
  const v = VOUCHERS[voucher];
  return Math.min(total, v.type === 'pct' ? Math.round(total * v.val / 100) : v.val);
}

function renderCart(){
  const items = kvCartGet();
  const box = document.getElementById('cartLines');
  if(!items.length){
    box.innerHTML = '<div class="ck-empty"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1.2 10.3a2 2 0 0 1-2 1.7H8.2a2 2 0 0 1-2-1.7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><p>Giỏ hàng đang trống.<br>Ghé <a href="shop.html">Shop</a> để chọn một món quà làng nghề nhé.</p></div>';
  } else {
    box.innerHTML = items.map((i, idx) =>
      '<div class="cart-line" data-i="' + idx + '">' +
        (i.image ? '<img src="' + i.image + '">' : '<div style="width:80px;height:80px;background:var(--panel-2);border-radius:8px"></div>') +
        '<div class="ci-info">' +
          '<h5><a href="product.html?id=' + i.id + '" style="color:inherit">' + esc(i.name) + '</a></h5>' +
          (i.color || i.size ? '<div class="variant">' + [i.color, i.size].filter(Boolean).join(' · ') + '</div>' : '') +
          '<div class="ci-actions"><a data-rm="' + idx + '">Xoá</a><a data-save="' + idx + '">Lưu vào yêu thích</a></div>' +
        '</div>' +
        '<div class="ck-qty"><button type="button" data-q="-1" data-i="' + idx + '">−</button><b>' + i.qty + '</b><button type="button" data-q="1" data-i="' + idx + '">+</button></div>' +
        '<div class="ck-line">' + fmtVnd(i.price * i.qty) + '</div>' +
      '</div>'
    ).join('');
  }

  const total = cartTotal(items), disc = discountOf(total), finalTotal = total - disc;
  document.getElementById('summaryRows').innerHTML =
    '<div class="srow"><span>Tạm tính (' + items.reduce((s,i)=>s+i.qty,0) + ' sản phẩm)</span><span>' + fmtVnd(total) + '</span></div>' +
    (voucher && VOUCHERS[voucher] ? '<div class="srow"><span>Voucher ' + voucher + ' <a id="vcRemove" style="color:var(--vermilion);cursor:pointer">✕</a></span><span>−' + fmtVnd(disc) + '</span></div>' : '') +
    '<div class="srow"><span>Phí vận chuyển</span><span>Tính ở bước thanh toán</span></div>' +
    '<div class="srow total"><span>Thành tiền</span><b>' + fmtVnd(finalTotal) + '</b></div>';

  const rm = document.getElementById('vcRemove');
  if(rm) rm.addEventListener('click', () => { voucher = null; localStorage.removeItem('kvVoucher'); document.getElementById('vcMsg').textContent=''; renderCart(); });

  document.getElementById('btnCheckout').disabled = !items.length;
}

document.getElementById('cartLines').addEventListener('click', e => {
  const items = kvCartGet();
  const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]'), save = e.target.closest('[data-save]');
  if(q){
    const it = items[+q.dataset.i]; if(!it) return;
    it.qty += +q.dataset.q;
    if(it.qty < 1) items.splice(+q.dataset.i, 1);
    kvCartSave(items); renderCart();
  } else if(rm){
    items.splice(+rm.dataset.rm, 1);
    kvCartSave(items); renderCart();
  } else if(save){
    (async () => {
      const u = await window.kvRequireLogin(); if(!u) return;
      const it = items[+save.dataset.save]; if(!it) return;
      try{
        await kvApi('/api/wishlist', {method:'POST', body: JSON.stringify({product_id: +it.id})});
        items.splice(+save.dataset.save, 1);
        kvCartSave(items); renderCart(); kvSyncWishBadge();
        showToast('✦ Đã chuyển sang danh sách yêu thích');
      }catch(ex){ showToast(ex.message); }
    })();
  }
});

document.getElementById('vcApply').addEventListener('click', () => {
  const code = document.getElementById('vcInput').value.trim().toUpperCase();
  const msg = document.getElementById('vcMsg');
  if(!code){ msg.textContent = 'Vui lòng nhập mã giảm giá.'; msg.style.color = 'var(--vermilion)'; return; }
  if(!VOUCHERS[code]){ msg.textContent = 'Mã "' + code + '" không hợp lệ.'; msg.style.color = 'var(--vermilion)'; return; }
  voucher = code; localStorage.setItem('kvVoucher', code);
  document.getElementById('vcInput').value = '';
  msg.textContent = '✓ Đã áp dụng: ' + VOUCHERS[code].label; msg.style.color = 'var(--jade)';
  renderCart();
});

document.getElementById('btnCheckout').addEventListener('click', async () => {
  const u = await window.kvRequireLogin(); if(!u) return;
  if(!kvCartGet().length) return;
  window.location.href = 'checkout.html';
});

renderCart();
