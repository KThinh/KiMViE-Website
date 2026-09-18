/* checkout.html — địa chỉ -> vận chuyển -> xác nhận đơn -> thanh toán theo từng
   gian hàng (mỗi seller có QR riêng, cần cả buyer & seller cùng xác nhận). */

const VOUCHERS = {GIULUA10:10, TINHHOA15:15, FREESHIP:'FREESHIP'}; // chỉ để hiện tạm, số thật lấy từ server
const SHIP_FEES = {standard: 20000, express: 45000};
let addresses = [];
let selectedAddress = null;
let shippingMethod = 'standard';
let currentOrder = null;

function setStep(n){
  document.querySelectorAll('.ck-step-page').forEach((el,i) => el.hidden = (i+1) !== n);
  document.querySelectorAll('#ckSteps span').forEach(s => s.classList.toggle('on', +s.dataset.s <= n));
}

async function init(){
  const u = await window.kvRequireLogin();
  if(!u){ window.location.href = 'cart.html'; return; }
  if(!kvCartGet().length){ window.location.href = 'cart.html'; return; }
  document.getElementById('ckEmail').value = u.email || '';
  try{ addresses = await kvApi('/api/addresses'); }catch(e){ addresses = []; }
  renderAddresses();
}

function renderAddresses(){
  const box = document.getElementById('addrList');
  if(!addresses.length){ box.innerHTML = '<p style="color:var(--muted);font-size:13px">Bạn chưa có địa chỉ đã lưu.</p>'; return; }
  box.innerHTML = addresses.map(a =>
    '<div class="addr-card' + (selectedAddress && selectedAddress.id === a.id ? ' on' : '') + '" data-id="' + a.id + '">' +
      '<b>' + esc(a.label) + '</b>' + (a.is_default ? ' <span style="color:var(--gold-soft);font-size:11px">(Mặc định)</span>' : '') +
      '<div style="font-size:13px;color:var(--muted);margin-top:4px">' + esc(a.recipient_name) + ' · ' + esc(a.phone) + '<br>' + esc(a.address_line) + '</div>' +
    '</div>'
  ).join('');
  if(!selectedAddress){ selectedAddress = addresses.find(a => a.is_default) || addresses[0]; renderAddresses(); return; }
  box.querySelectorAll('.addr-card').forEach(c => c.addEventListener('click', () => {
    selectedAddress = addresses.find(a => a.id === +c.dataset.id);
    renderAddresses();
  }));
}

document.getElementById('btnNewAddr').addEventListener('click', () => {
  document.getElementById('addrForm').hidden = false;
});
document.getElementById('afSave').addEventListener('click', async () => {
  const label = document.getElementById('afLabel').value.trim() || 'Địa chỉ mới';
  const recipient_name = document.getElementById('afName').value.trim();
  const phone = document.getElementById('afPhone').value.trim();
  const address_line = document.getElementById('afAddr').value.trim();
  const is_default = document.getElementById('afDefault').checked;
  if(!recipient_name || !phone || !address_line){ document.getElementById('addrErr').textContent = 'Vui lòng điền đầy đủ thông tin địa chỉ.'; return; }
  try{
    const a = await kvApi('/api/addresses', {method:'POST', body: JSON.stringify({label, recipient_name, phone, address_line, is_default})});
    addresses.push(a); selectedAddress = a;
    document.getElementById('addrForm').hidden = true;
    ['afLabel','afName','afPhone','afAddr'].forEach(id => document.getElementById(id).value = '');
    renderAddresses();
  }catch(e){ document.getElementById('addrErr').textContent = e.message; }
});

document.getElementById('toStep2').addEventListener('click', () => {
  const err = document.getElementById('addrErr'); err.textContent = '';
  if(!selectedAddress){ err.textContent = 'Vui lòng chọn hoặc thêm một địa chỉ giao hàng.'; return; }
  const email = document.getElementById('ckEmail').value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ err.textContent = 'Vui lòng nhập địa chỉ email hợp lệ.'; return; }
  setStep(2);
});
document.getElementById('backStep1').addEventListener('click', () => setStep(1));

document.querySelectorAll('.ship-option').forEach(o => o.addEventListener('click', () => {
  document.querySelectorAll('.ship-option').forEach(x => x.classList.remove('on'));
  o.classList.add('on'); shippingMethod = o.dataset.m;
}));
document.getElementById('toStep3').addEventListener('click', () => { renderReview(); setStep(3); });
document.getElementById('backStep2').addEventListener('click', () => setStep(2));

function renderReview(){
  const items = kvCartGet();
  document.getElementById('reviewLines').innerHTML = items.map(i =>
    '<div class="cart-line">' + (i.image ? '<img src="' + i.image + '">' : '') +
    '<div class="ci-info"><h5>' + esc(i.name) + ' × ' + i.qty + '</h5>' + (i.color||i.size ? '<div class="variant">' + [i.color,i.size].filter(Boolean).join(' · ') + '</div>' : '') + '</div>' +
    '<b>' + fmtVnd(i.price * i.qty) + '</b></div>'
  ).join('');
  const subtotal = items.reduce((s,i) => s + i.price*i.qty, 0);
  const shipFee = SHIP_FEES[shippingMethod];
  document.getElementById('reviewVoucher').value = localStorage.getItem('kvVoucher') || '';
  document.getElementById('reviewSummary').innerHTML =
    '<div class="srow"><span>Tạm tính</span><span>' + fmtVnd(subtotal) + '</span></div>' +
    '<div class="srow"><span>Phí vận chuyển (' + (shippingMethod==='express'?'Hoả tốc':'Tiêu chuẩn') + ')</span><span>' + fmtVnd(shipFee) + '</span></div>' +
    '<div class="srow total"><span>Tổng cộng (tạm tính)</span><b>' + fmtVnd(subtotal + shipFee) + '</b></div>' +
    '<p style="font-size:11.5px;color:var(--muted-2);margin-top:6px">Số tiền cuối cùng (đã áp voucher nếu có) do hệ thống tính khi đặt hàng.</p>';
}

document.getElementById('placeOrderBtn').addEventListener('click', async () => {
  const err = document.getElementById('reviewErr'); err.textContent = '';
  const items = kvCartGet();
  if(!items.length){ err.textContent = 'Giỏ hàng trống.'; return; }
  const btn = document.getElementById('placeOrderBtn'); btn.disabled = true;
  try{
    currentOrder = await kvApi('/api/orders', {method:'POST', body: JSON.stringify({
      recipient_name: selectedAddress.recipient_name,
      recipient_email: document.getElementById('ckEmail').value.trim(),
      recipient_phone: selectedAddress.phone,
      shipping_address: selectedAddress.address_line,
      shipping_method: shippingMethod,
      voucher_code: document.getElementById('reviewVoucher').value.trim().toUpperCase() || null,
      items: items.map(i => ({product_id: +i.id, quantity: i.qty, color: i.color || null, size: i.size || null})),
    })});
    kvCartSave([]);
    localStorage.removeItem('kvVoucher');
    renderPayStep();
    setStep(4);
  }catch(e){ err.textContent = e.message; }
  finally{ btn.disabled = false; }
});

function paymentBlockHTML(p){
  return (
    '<div class="pay-seller-block" data-seller="' + p.seller_id + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center"><b>' + esc(p.shop_name) + '</b><span class="pay-status ' + p.status + '">' + payStatusLabel(p) + '</span></div>' +
      '<p style="font-size:13px;color:var(--muted);margin-top:6px">Số tiền cần chuyển: <b style="color:var(--gold-soft)">' + fmtVnd(p.amount) + '</b></p>' +
      (p.qr_image_url ? '<img class="qr" src="' + p.qr_image_url + '">' : '<p style="color:var(--muted);text-align:center">Gian hàng chưa cập nhật mã QR — vui lòng liên hệ trực tiếp để thanh toán.</p>') +
      '<button class="btn btn-amber" data-confirm="' + p.seller_id + '" type="button" style="width:100%;justify-content:center" ' + (p.status!=='pending'||p.buyer_confirmed_at ? 'disabled':'') + '>' +
        (p.buyer_confirmed_at ? '✓ Bạn đã xác nhận chuyển khoản' : 'Tôi đã chuyển khoản') + '</button>' +
    '</div>'
  );
}
function payStatusLabel(p){
  if(p.status === 'completed') return 'Đã hoàn tất';
  if(p.status === 'failed') return 'Thất bại';
  return p.buyer_confirmed_at ? 'Chờ người bán xác nhận' : 'Chờ thanh toán';
}
function renderPayStep(){
  document.getElementById('payBlocks').innerHTML = currentOrder.payments.map(paymentBlockHTML).join('');
  document.getElementById('toTrackOrder').href = 'track-order.html?order=' + currentOrder.id;
  document.querySelectorAll('[data-confirm]').forEach(b => b.addEventListener('click', async () => {
    b.disabled = true;
    try{
      currentOrder = await kvApi('/api/orders/' + currentOrder.id + '/payments/' + b.dataset.confirm + '/buyer-confirm', {method:'POST'});
      renderPayStep();
      showToast('✦ Đã ghi nhận xác nhận chuyển khoản của bạn');
    }catch(e){ showToast(e.message); b.disabled = false; }
  }));
}

init();
