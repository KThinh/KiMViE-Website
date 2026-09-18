/* track-order.html?order=N — timeline Pending -> Processing -> Shipped -> Delivered,
   cộng khối xác nhận thanh toán còn dang dở (nếu có) và trạng thái từng sản phẩm
   khi đơn có nhiều seller (mỗi seller giao hàng độc lập). */

const orderId = new URLSearchParams(location.search).get('order');
const STAGES = ['pending', 'processing', 'shipped', 'delivered'];
const STAGE_LABEL = {pending:'Chờ thanh toán', processing:'Đang xử lý', shipped:'Đang giao', delivered:'Đã giao'};

function timelineHTML(status){
  if(status === 'cancelled'){
    return '<div class="acct-card" style="text-align:center;color:var(--vermilion)"><b>Đơn hàng đã bị huỷ</b><p style="color:var(--muted);font-size:13px;margin-top:6px">Giao dịch thanh toán không thành công — không có khoản nào bị trừ.</p></div>';
  }
  const idx = STAGES.indexOf(status);
  return '<div class="timeline">' + STAGES.map((s,i) =>
    '<div class="tl-step ' + (i < idx ? 'done' : i === idx ? 'now' : '') + '"><div class="tl-dot">' + (i < idx ? '✓' : (i+1)) + '</div><span>' + STAGE_LABEL[s] + '</span></div>'
  ).join('') + '</div>';
}

async function load(){
  const u = await window.kvRequireLogin();
  if(!u){ return; }
  let order;
  try{ order = await kvApi('/api/orders/' + orderId); }
  catch(e){ document.getElementById('trackRoot').innerHTML = '<p>Không tìm thấy đơn hàng này.</p>'; return; }

  document.getElementById('orderTitle').textContent = 'Đơn hàng #' + order.id;
  let html = timelineHTML(order.status);

  html += '<div class="acct-card"><h6>Thông tin giao hàng</h6>' +
    '<p style="font-size:13px;color:var(--muted);margin-top:6px">' + esc(order.recipient_name) + ' · ' + esc(order.recipient_phone||'') + '<br>' + esc(order.shipping_address) + '</p>' +
    '<p style="font-size:12.5px;color:var(--muted-2);margin-top:6px">Đặt lúc ' + new Date(order.created_at).toLocaleString('vi-VN') + ' · Tổng tiền ' + fmtVnd(order.total_price) + '</p></div>';

  const pendingPayments = order.payments.filter(p => p.status === 'pending');
  if(pendingPayments.length){
    html += '<div class="acct-card"><h6 style="margin-bottom:10px">Thanh toán còn thiếu xác nhận</h6>' +
      pendingPayments.map(p =>
        '<div class="pay-seller-block" data-seller="' + p.seller_id + '">' +
          '<div style="display:flex;justify-content:space-between"><b>' + esc(p.shop_name) + '</b><span class="pay-status ' + p.status + '">' + (p.buyer_confirmed_at ? 'Chờ người bán xác nhận' : 'Chờ thanh toán') + '</span></div>' +
          '<p style="font-size:13px;color:var(--muted);margin-top:6px">Số tiền: <b>' + fmtVnd(p.amount) + '</b></p>' +
          (p.qr_image_url ? '<img class="qr" src="' + p.qr_image_url + '">' : '') +
          '<button class="btn btn-amber" data-confirm="' + p.seller_id + '" type="button" style="width:100%;justify-content:center" ' + (p.buyer_confirmed_at?'disabled':'') + '>' + (p.buyer_confirmed_at ? '✓ Bạn đã xác nhận' : 'Tôi đã chuyển khoản') + '</button>' +
        '</div>'
      ).join('') + '</div>';
  }

  html += '<div class="acct-card"><h6 style="margin-bottom:10px">Sản phẩm trong đơn</h6>' +
    order.items.map(i =>
      '<div class="order-row"><div class="top"><span>' + esc(i.product_name) + ' × ' + i.quantity + (i.color||i.size ? ' (' + [i.color,i.size].filter(Boolean).join(', ') + ')' : '') + '</span><span class="status-pill status-' + i.item_status + '">' + STAGE_LABEL[i.item_status] + '</span></div><span style="font-size:13px;color:var(--muted)">' + fmtVnd(i.price_at_purchase) + '</span></div>'
    ).join('') + '</div>';

  document.getElementById('trackRoot').innerHTML = html;

  document.querySelectorAll('[data-confirm]').forEach(b => b.addEventListener('click', async () => {
    b.disabled = true;
    try{
      await kvApi('/api/orders/' + orderId + '/payments/' + b.dataset.confirm + '/buyer-confirm', {method:'POST'});
      showToast('✦ Đã ghi nhận xác nhận của bạn');
      load();
    }catch(e){ showToast(e.message); b.disabled = false; }
  }));
}

load();
