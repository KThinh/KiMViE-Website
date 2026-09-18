/* product.html — trang chi tiết sản phẩm: ảnh, giá, màu/size, tồn kho, mô tả,
   chất liệu, hướng dẫn size, chính sách, đánh giá (kèm ảnh), sản phẩm liên quan. */

const productId = new URLSearchParams(location.search).get('id');
let product = null;
let selectedColor = null, selectedSize = null;
let galleryImages = [];   // ảnh sản phẩm (của gian hàng) + ảnh khách hàng gửi kèm đánh giá
let galleryOwnCount = 0;  // số ảnh đầu tiên là ảnh sản phẩm — phần còn lại là ảnh đánh giá
let galleryIndex = 0;
let reviewsData = null;

function starsHTML(n){
  const full = Math.round(n);
  return '★★★★★☆☆☆☆☆'.slice(5 - full, 10 - full);
}

async function loadProduct(){
  const root = document.getElementById('pdRoot');
  if(!productId){ root.innerHTML = '<p>Không tìm thấy sản phẩm.</p>'; return; }
  try{ product = await kvApi('/api/products/' + productId); }
  catch(e){ root.innerHTML = '<p>Không tìm thấy sản phẩm này — có thể đã bị gỡ khỏi Sàn thương mại.</p>'; return; }

  document.title = product.name + ' — KIMVIE';
  document.getElementById('crumbName').textContent = product.name;
  selectedColor = product.colors[0] || null;
  selectedSize = product.sizes[0] || null;

  const ownImages = [product.image_url, ...product.images].filter(Boolean);
  try{ reviewsData = await kvApi('/api/products/' + productId + '/reviews'); }catch(e){ reviewsData = null; }
  const reviewImages = reviewsData ? reviewsData.items.flatMap(r => r.images) : [];
  galleryImages = [...ownImages, ...reviewImages];
  galleryOwnCount = ownImages.length;
  galleryIndex = 0;

  root.innerHTML =
    '<div>' +
      '<div class="pd-gallery-main" id="pdGalleryMain">' +
        (galleryImages.length ? '<img id="pdMainImg" src="' + galleryImages[0] + '" alt="' + esc(product.name) + '">' : 'Chưa có ảnh') +
        '<span class="pd-gallery-tag" id="pdGalleryTag" hidden>Ảnh từ khách hàng</span>' +
        (galleryImages.length > 1 ? '<button class="pd-gallery-nav prev" id="pdGalleryPrev" type="button" aria-label="Ảnh trước">‹</button><button class="pd-gallery-nav next" id="pdGalleryNext" type="button" aria-label="Ảnh sau">›</button>' : '') +
      '</div>' +
      (galleryImages.length > 1 ? '<div class="pd-thumbs">' + galleryImages.map((im,i) => '<img src="' + im + '" data-i="' + i + '" class="' + (i===0?'on':'') + (i>=galleryOwnCount?' review-thumb':'') + '">').join('') + '</div>' : '') +
    '</div>' +
    '<div class="pd-info">' +
      '<h1>' + esc(product.name) + '</h1>' +
      '<div class="pd-rating">' + starsHTML(product.rating) + ' <b>' + product.rating.toFixed(1) + '</b> (' + product.review_count + ' đánh giá) · Đã bán ' + product.sold_count + '</div>' +
      '<div class="pd-price">' +
        (product.is_sale ? '<span class="price-old">' + fmtVnd(product.original_price) + '</span>' : '') +
        '<span class="price">' + fmtVnd(product.price) + '</span>' +
        (product.is_new ? '<span class="badge-pill badge-new">Mới</span>' : '') +
        (product.is_sale ? '<span class="badge-pill badge-sale">Sale</span>' : '') +
      '</div>' +
      '<p style="color:var(--muted);font-size:13.5px;line-height:1.6">' + esc((product.description||'').slice(0,180)) + (product.description && product.description.length > 180 ? '…' : '') + '</p>' +
      (product.colors.length ? '<div class="pd-option"><h6>Màu sắc</h6><div class="swatch-row" id="colorPick">' +
        product.colors.map(c => '<button type="button" class="swatch' + (c===selectedColor?' on':'') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div></div>' : '') +
      (product.sizes.length ? '<div class="pd-option"><h6>Size</h6><div class="swatch-row" id="sizePick">' +
        product.sizes.map(s => '<button type="button" class="swatch' + (s===selectedSize?' on':'') + '" data-s="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div></div>' : '') +
      '<div class="pd-meta-row">Tình trạng: <b style="color:' + (product.stock>0?'var(--jade)':'var(--vermilion)') + '">' + (product.stock>0 ? 'Còn ' + product.stock + ' sản phẩm' : 'Hết hàng') + '</b></div>' +
      '<div class="pd-meta-row">Gian hàng: <b>' + esc(product.shop_name) + '</b> · ' + esc(product.village_name) + '</div>' +
      '<div class="pd-actions">' +
        '<button class="btn btn-line" id="btnWish" type="button">♡ Yêu thích</button>' +
        '<button class="btn btn-navy" id="btnAddCart" type="button" ' + (product.stock===0?'disabled':'') + '>Thêm vào giỏ</button>' +
        '<button class="btn btn-amber" id="btnBuyNow" type="button" ' + (product.stock===0?'disabled':'') + '>Mua ngay</button>' +
      '</div>' +
    '</div>';

  document.getElementById('pdTabs').hidden = false;
  document.getElementById('tab-desc').innerHTML = '<p style="white-space:pre-line;color:var(--muted);line-height:1.8">' + esc(product.description || 'Chưa có mô tả.') + '</p>';
  document.getElementById('tab-specs').innerHTML =
    '<div class="acct-card">' +
      (product.material ? '<p><b>Chất liệu:</b> ' + esc(product.material) + '</p>' : '') +
      (product.size_guide ? '<p style="margin-top:8px"><b>Hướng dẫn chọn size:</b> ' + esc(product.size_guide) + '</p>' : '') +
      '<p style="margin-top:14px"><b>Chính sách giao hàng:</b> Giao hàng tiêu chuẩn 3–5 ngày hoặc hỏa tốc 1–2 ngày (chọn ở bước thanh toán).</p>' +
      '<p style="margin-top:8px"><b>Chính sách đổi trả:</b> Đổi trả trong 7 ngày nếu sản phẩm lỗi do vận chuyển hoặc sản xuất, còn nguyên tem/nhãn.</p>' +
    '</div>';

  wireGallery();
  wireOptions();
  wireActions();
  renderReviews();
  loadRelated();
}

function showGalleryImage(i){
  if(!galleryImages.length) return;
  galleryIndex = (i + galleryImages.length) % galleryImages.length;
  document.getElementById('pdMainImg').src = galleryImages[galleryIndex];
  document.querySelectorAll('.pd-thumbs img').forEach((x,idx) => x.classList.toggle('on', idx === galleryIndex));
  const isReview = galleryIndex >= galleryOwnCount;
  const tag = document.getElementById('pdGalleryTag');
  if(tag) tag.hidden = !isReview;
  const main = document.getElementById('pdGalleryMain');
  if(main) main.classList.toggle('showing-review', isReview);
  const thumb = document.querySelector('.pd-thumbs img.on');
  if(thumb) thumb.scrollIntoView({inline: 'center', block: 'nearest', behavior: 'smooth'});
}

/* Cho phép vuốt trái/phải trên khung ảnh chính để chuyển ảnh — gồm cả ảnh sản phẩm
   lẫn ảnh khách hàng gửi kèm đánh giá, không chỉ bấm vào ảnh nhỏ bên dưới. */
function wireGallery(){
  document.querySelectorAll('.pd-thumbs img').forEach(t => t.addEventListener('click', () => showGalleryImage(+t.dataset.i)));
  const prev = document.getElementById('pdGalleryPrev'), next = document.getElementById('pdGalleryNext');
  if(prev) prev.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
  if(next) next.addEventListener('click', () => showGalleryImage(galleryIndex + 1));

  const main = document.getElementById('pdGalleryMain');
  if(!main || galleryImages.length < 2) return;
  let startX = null;
  main.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive: true});
  main.addEventListener('touchend', e => {
    if(startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if(Math.abs(dx) > 40) showGalleryImage(galleryIndex + (dx < 0 ? 1 : -1));
    startX = null;
  });
  // vuốt bằng chuột (desktop) — kéo trái/phải trên ảnh cũng chuyển được
  let downX = null;
  main.addEventListener('mousedown', e => { downX = e.clientX; });
  main.addEventListener('mouseup', e => {
    if(downX == null) return;
    const dx = e.clientX - downX;
    if(Math.abs(dx) > 40) showGalleryImage(galleryIndex + (dx < 0 ? 1 : -1));
    downX = null;
  });
}
function wireOptions(){
  const cp = document.getElementById('colorPick');
  if(cp) cp.querySelectorAll('.swatch').forEach(b => b.addEventListener('click', () => {
    cp.querySelectorAll('.swatch').forEach(x => x.classList.remove('on')); b.classList.add('on'); selectedColor = b.dataset.c;
  }));
  const sp = document.getElementById('sizePick');
  if(sp) sp.querySelectorAll('.swatch').forEach(b => b.addEventListener('click', () => {
    sp.querySelectorAll('.swatch').forEach(x => x.classList.remove('on')); b.classList.add('on'); selectedSize = b.dataset.s;
  }));
}
function wireActions(){
  document.getElementById('btnAddCart').addEventListener('click', () => {
    kvCartAdd({id: String(product.id), name: product.name, price: product.price, color: selectedColor, size: selectedSize, image: product.image_url});
    showToast('Đã thêm <b>' + esc(product.name) + '</b> vào giỏ hàng ✦');
  });
  document.getElementById('btnBuyNow').addEventListener('click', () => {
    kvCartAdd({id: String(product.id), name: product.name, price: product.price, color: selectedColor, size: selectedSize, image: product.image_url});
    window.location.href = 'cart.html';
  });
  document.getElementById('btnWish').addEventListener('click', async () => {
    const u = await window.kvRequireLogin(); if(!u) return;
    try{
      await kvApi('/api/wishlist', {method:'POST', body: JSON.stringify({product_id: product.id})});
      showToast('✦ Đã lưu vào danh sách yêu thích');
      kvSyncWishBadge();
    }catch(e){ showToast(e.message); }
  });
}

async function refreshReviews(){
  try{ reviewsData = await kvApi('/api/products/' + productId + '/reviews'); }catch(e){ return; }
  renderReviews();
  rebuildGallery();
}

/* dựng lại danh sách ảnh gallery (ảnh sản phẩm + ảnh đánh giá mới) sau khi có đánh
   giá mới kèm ảnh, giữ nguyên ảnh sản phẩm đứng đầu */
function rebuildGallery(){
  const ownImages = galleryImages.slice(0, galleryOwnCount);
  const reviewImages = reviewsData ? reviewsData.items.flatMap(r => r.images) : [];
  galleryImages = [...ownImages, ...reviewImages];
  const thumbsBox = document.querySelector('.pd-thumbs');
  const mainBox = document.getElementById('pdGalleryMain');
  if(!mainBox) return;
  if(galleryImages.length > 1 && !mainBox.querySelector('.pd-gallery-nav')){
    mainBox.insertAdjacentHTML('beforeend', '<button class="pd-gallery-nav prev" id="pdGalleryPrev" type="button" aria-label="Ảnh trước">‹</button><button class="pd-gallery-nav next" id="pdGalleryNext" type="button" aria-label="Ảnh sau">›</button>');
    document.getElementById('pdGalleryPrev').addEventListener('click', () => showGalleryImage(galleryIndex - 1));
    document.getElementById('pdGalleryNext').addEventListener('click', () => showGalleryImage(galleryIndex + 1));
  }
  const thumbsHTML = galleryImages.map((im,i) => '<img src="' + im + '" data-i="' + i + '" class="' + (i===galleryIndex?'on':'') + (i>=galleryOwnCount?' review-thumb':'') + '">').join('');
  if(thumbsBox){ thumbsBox.innerHTML = thumbsHTML; }
  else if(galleryImages.length > 1){
    mainBox.insertAdjacentHTML('afterend', '<div class="pd-thumbs">' + thumbsHTML + '</div>');
  }
  document.querySelectorAll('.pd-thumbs img').forEach(t => t.addEventListener('click', () => showGalleryImage(+t.dataset.i)));
}

async function renderReviews(){
  const box = document.getElementById('tab-reviews');
  const data = reviewsData;
  if(!data){ box.innerHTML = '<p>Không tải được đánh giá.</p>'; return; }

  const user = await window.kvReady;
  let html = '<div class="rating-summary"><span class="big">' + data.average_rating.toFixed(1) + '</span><div><div style="color:var(--gold)">' + starsHTML(data.average_rating) + '</div><span style="font-size:12.5px;color:var(--muted)">' + data.review_count + ' đánh giá</span></div></div>';

  html += '<div id="reviewFormBox">' + reviewFormHTML(data.my_review) + '</div>';

  if(!data.items.length){
    html += '<p style="color:var(--muted);margin-top:20px">Chưa có đánh giá nào cho sản phẩm này.</p>';
  } else {
    let imgCursor = galleryOwnCount;
    html += '<div style="margin-top:24px">' + data.items.map(r => {
      const row = '<div class="review-row"><div class="stars">' + starsHTML(r.rating) + '</div><b>' + esc(r.buyer_name) + '</b> <span style="color:var(--muted-2);font-size:12px">' + new Date(r.created_at).toLocaleDateString('vi-VN') + '</span>' +
        (r.comment ? '<p style="margin-top:6px;color:var(--muted)">' + esc(r.comment) + '</p>' : '') +
        (r.images.length ? '<div class="rv-imgs">' + r.images.map(im => '<img src="' + im + '" data-gallery-i="' + (imgCursor++) + '">').join('') + '</div>' : '') +
        '</div>';
      return row;
    }).join('') + '</div>';
  }
  box.innerHTML = html;
  box.querySelectorAll('.rv-imgs img[data-gallery-i]').forEach(img => img.addEventListener('click', () => {
    showGalleryImage(+img.dataset.galleryI);
    document.getElementById('pdGalleryMain').scrollIntoView({behavior: 'smooth', block: 'center'});
  }));
  wireReviewForm();
}

function reviewFormHTML(mine){
  return (
    '<div class="acct-card">' +
      '<h6 style="margin-bottom:10px">' + (mine ? 'Cập nhật đánh giá của bạn' : 'Viết đánh giá') + '</h6>' +
      '<div class="star-input" id="rvStars">' + [1,2,3,4,5].map(n => '<span data-n="' + n + '" class="' + (mine && n<=mine.rating ? 'on' : '') + '">★</span>').join('') + '</div>' +
      '<textarea id="rvComment" rows="3" placeholder="Chia sẻ cảm nhận của bạn…" style="width:100%;margin-top:10px;padding:10px;border:1px solid var(--line);border-radius:6px;font-family:var(--sans)">' + esc(mine ? mine.comment || '' : '') + '</textarea>' +
      '<input type="file" id="rvImgInput" accept="image/*" multiple style="margin-top:10px">' +
      '<div id="rvImgPreview" style="display:flex;gap:8px;margin-top:8px"></div>' +
      '<p class="ck-err" id="rvErr" role="alert"></p>' +
      '<button class="btn btn-amber" id="rvSubmit" type="button" style="margin-top:10px">Gửi đánh giá →</button>' +
      '<p style="font-size:11.5px;color:var(--muted-2);margin-top:8px">* Chỉ có thể đánh giá sản phẩm bạn đã mua và nhận hàng thành công.</p>' +
    '</div>'
  );
}
function wireReviewForm(){
  let rating = document.querySelectorAll('#rvStars span.on').length;
  let images = [];
  document.querySelectorAll('#rvStars span').forEach(s => s.addEventListener('click', () => {
    rating = +s.dataset.n;
    document.querySelectorAll('#rvStars span').forEach(x => x.classList.toggle('on', +x.dataset.n <= rating));
  }));
  const imgInput = document.getElementById('rvImgInput');
  imgInput.addEventListener('change', async () => {
    for(const file of imgInput.files){
      const dataUrl = await kvResizeImageFile(file, 480);
      images.push(dataUrl);
    }
    document.getElementById('rvImgPreview').innerHTML = images.map(im => '<img src="' + im + '" style="width:56px;height:56px;object-fit:cover;border-radius:6px">').join('');
  });
  document.getElementById('rvSubmit').addEventListener('click', async () => {
    const err = document.getElementById('rvErr'); err.textContent = '';
    const u = await window.kvRequireLogin(); if(!u) return;
    if(!rating){ err.textContent = 'Vui lòng chọn số sao đánh giá.'; return; }
    try{
      await kvApi('/api/products/' + productId + '/reviews', {method:'POST', body: JSON.stringify({
        rating, comment: document.getElementById('rvComment').value.trim() || null, images
      })});
      showToast('✦ Cảm ơn bạn đã đánh giá!');
      refreshReviews();
    }catch(e){ err.textContent = e.message; }
  });
}

async function loadRelated(){
  let items;
  try{ items = await kvApi('/api/products/' + productId + '/related?limit=4'); }
  catch(e){ return; }
  if(!items.length) return;
  document.getElementById('relatedBlock').hidden = false;
  document.getElementById('relatedGrid').innerHTML = items.map(p =>
    '<article class="p-card" onclick="window.location.href=\'product.html?id=' + p.id + '\'" style="cursor:pointer">' +
      '<div class="p-art' + (p.image_url?' has-img':'') + '">' + (p.image_url ? '<img src="' + p.image_url + '" alt="' + esc(p.name) + '" loading="lazy">' : '') + '</div>' +
      '<h4>' + esc(p.name) + '</h4><div class="pl">' + esc(p.village_name) + '</div>' +
      '<div class="p-foot"><span class="price">' + fmtVnd(p.price) + '</span></div>' +
    '</article>'
  ).join('');
}

document.querySelectorAll('.pd-tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.pd-tabs button').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.pd-tabpanel').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  document.getElementById('tab-' + b.dataset.tab).classList.add('on');
}));

loadProduct();
