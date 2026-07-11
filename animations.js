/* =========================================================================
   KIMVIE — GSAP motion layer
   Quiet, lacquer-luxe choreography: hero entrance timelines, staggered
   scroll reveals, drifting cloud parallax, ambient floats.
   Falls back to the CSS/IntersectionObserver reveal in script.js when GSAP
   is missing or the user prefers reduced motion (kvMotion stays undefined).
   ========================================================================= */
(function(){
  if(!window.gsap || !window.ScrollTrigger) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-on');   // tắt heroRise/pgin CSS — GSAP đảm nhận
  gsap.defaults({ ease:'power2.out', duration:.8 });

  const BP = { isDesktop:'(min-width: 769px)', isMobile:'(max-width: 768px)' };
  let mm = null;                       // matchMedia context của lần build hiện tại

  /* phần tử chưa reveal và đang hiển thị (bỏ qua tab/panel đang ẩn) */
  const fresh = el => !el.dataset.kvShown && el.offsetParent !== null;

  /* ---- ẩn / hiện có kiểm soát --------------------------------------------
     hide() đánh dấu kvHide để "lưới an toàn" rescue() có thể tìm lại;
     show() diễn hoạt rồi trả phần tử về CSS gốc (clearProps) để hover
     transition hoạt động bình thường. */
  function hide(els, vars){
    els.forEach(el => el.dataset.kvHide = '1');
    gsap.set(els, Object.assign({ autoAlpha:0, transition:'none' }, vars));
  }
  /* chỉ xoá đúng các thuộc tính GSAP đã đụng — KHÔNG dùng clearProps:'all'
     vì nó quét sạch inline style gốc (vd. --v-img của .v-card, justify-content
     của .kicker, display của .p-card do renderMarket đặt) */
  const CLEAR = 'transform,opacity,visibility,transition';
  function show(els, vars){
    els = els.filter(el => !el.dataset.kvShown);
    if(!els.length) return;
    els.forEach(el => { el.dataset.kvShown = '1'; delete el.dataset.kvHide; });
    gsap.to(els, Object.assign({
      autoAlpha:1, x:0, y:0, scale:1, duration:.95, ease:'power3.out',
      overwrite:'auto', clearProps:CLEAR
    }, vars));
  }

  /* lưới an toàn: sau mỗi lần refresh (resize, đổi layout…), phần tử nào đã
     nằm trong viewport mà vẫn đang ẩn thì hiện ngay — không bao giờ kẹt ẩn */
  function rescue(){
    const els = [...document.querySelectorAll('[data-kv-hide]')].filter(el =>
      el.offsetParent !== null && el.getBoundingClientRect().top < innerHeight * .96);
    if(els.length) show(els, { duration:.7, stagger:.06 });
  }
  ScrollTrigger.addEventListener('refresh', () => requestAnimationFrame(rescue));

  /* ---- reveal 1 lô phần tử: ẩn ngay, trồi lên khi cuộn tới ---------------- */
  function batchRise(items, opts){
    items = items.filter(fresh);
    if(!items.length) return;
    const o = Object.assign({ y:34, scale:0, stagger:.09, start:'top 90%' }, opts);
    const setVars = { y:o.y };
    if(o.scale) setVars.scale = o.scale;
    hide(items, setVars);
    ScrollTrigger.batch(items, {
      start:o.start, once:true,
      onEnter: b => show(b, { stagger:o.stagger })
    });
  }

  /* ---- tiêu đề section: các dòng con nối nhau, sao ✦ xoay vào ------------ */
  function headReveals(main){
    gsap.utils.toArray('.sec-head, .m-head', main).forEach(head => {
      if(!fresh(head)) return;
      head.dataset.kvShown = '1';                 // cờ đặt trên head, con đặt kvHide
      const kids = [...head.children];
      if(!kids.length) return;
      const deco = head.querySelector('.deco');
      hide(kids, { y:22 });
      ScrollTrigger.create({
        trigger:head, start:'top 87%', once:true,
        onEnter(){
          show(kids, { duration:.85, stagger:.12 });
          if(deco) gsap.from(deco, { rotation:120, scale:.4, duration:.85, ease:'back.out(1.6)' });
        }
      });
    });
  }

  /* ---- khối 2 cột (.split/.featured/.expo-band): trượt vào từ hai phía --- */
  function splitReveals(main, isMobile){
    gsap.utils.toArray('.split, .featured', main).forEach(sp => {
      if(!fresh(sp)) return;
      sp.dataset.kvShown = '1';
      const kids = [...sp.children];
      if(!kids.length) return;
      hide(kids, isMobile ? { y:26 } : { x:i => i % 2 ? 44 : -44 });
      ScrollTrigger.create({
        trigger:sp, start:'top 85%', once:true,
        onEnter(){ show(kids, { duration:1, stagger:.14 }); }
      });
    });

    /* dải "Hành trình theo dấu làng nghề": chữ trái, bản đồ phóng nhẹ */
    gsap.utils.toArray('.expo-band', main).forEach(band => {
      if(!fresh(band)) return;
      band.dataset.kvShown = '1';
      const left = band.querySelector('.wrap > div:first-child');
      const stage = band.querySelector('.room-stage');
      if(left) hide([...left.children], isMobile ? { y:22 } : { x:-36 });
      if(stage) hide([stage], { scale:.9 });
      ScrollTrigger.create({
        trigger:band, start:'top 78%', once:true,
        onEnter(){
          if(left) show([...left.children], { duration:.9, stagger:.11 });
          if(stage) show([stage], { duration:1.15 });
        }
      });
    });
  }

  /* ---- hàng sự kiện / mốc thời gian: lướt vào từ trái --------------------- */
  function rowReveals(main){
    const rows = gsap.utils.toArray('.ev-row, .tl-item', main).filter(fresh);
    if(!rows.length) return;
    hide(rows, { x:-30 });
    ScrollTrigger.batch(rows, {
      start:'top 90%', once:true,
      onEnter: b => show(b, { duration:.85, stagger:.1 })
    });
  }

  /* ---- parallax + chuyển động nền (chỉ desktop/tablet) -------------------- */
  function ambient(main, isDesktop){
    if(!isDesktop) return;
    /* mây trôi: y bám scroll (parallax), x bồng bềnh vô hạn */
    gsap.utils.toArray('.deco-cloud', main).forEach((c, i) => {
      const sec = c.closest('section'); if(!sec) return;
      gsap.to(c, { y: -(40 + (i % 3) * 18), ease:'none',
        scrollTrigger:{ trigger:sec, start:'top bottom', end:'bottom top', scrub:1.2 } });
      gsap.to(c, { x:'+=' + (12 + (i % 3) * 5), duration:6 + (i % 4) * 1.5,
        ease:'sine.inOut', yoyo:true, repeat:-1 });
    });
    /* cửa sổ slider hero lùi nhẹ khi cuộn qua */
    const hero = main.querySelector('.hero');
    const hr = main.querySelector('.hero-right');
    if(hero && hr) gsap.to(hr, { y:56, ease:'none',
      scrollTrigger:{ trigger:hero, start:'top top', end:'bottom top', scrub:1 } });
    /* bản đồ Việt Nam trên dải expo bồng bềnh */
    const map = main.querySelector('.room-stage img');
    if(map) gsap.to(map, { y:-10, duration:3.6, ease:'sine.inOut', yoyo:true, repeat:-1 });
  }

  /* ---- entrance khi vào trang -------------------------------------------- */
  function entrance(main, page, isMobile){
    const tl = gsap.timeline({ defaults:{ ease:'power3.out' } });
    tl.fromTo(main, { autoAlpha:0 }, { autoAlpha:1, duration:.45, ease:'none', clearProps:'opacity,visibility' }, 0);

    const ph = main.querySelector('.page-hero');
    if(ph){
      tl.from(ph.querySelectorAll('.crumb, h1, p'), { y:26, autoAlpha:0, duration:.85, stagger:.11, clearProps:CLEAR }, .08)
        .from(ph.querySelectorAll('img'), { autoAlpha:0, duration:1.3, ease:'none' }, .3);
    }
    if(page === 'home' && main.querySelector('.hero-left')){
      tl.from('.hero-left .who',  { y:16, autoAlpha:0, duration:.55, clearProps:CLEAR }, .12)
        .from('.hero-left h1',    { y:34, autoAlpha:0, duration:.95, clearProps:CLEAR }, .2)
        .from('.hero-left .lead', { y:24, autoAlpha:0, duration:.8,  clearProps:CLEAR }, .38)
        .from('.hero-left .hero-cta > *', { y:18, autoAlpha:0, duration:.7, stagger:.08, clearProps:CLEAR }, .5)
        .from('.hero-left .play', { y:14, autoAlpha:0, duration:.6,  clearProps:CLEAR }, .64)
        .from('.hero .deco-cloud', { autoAlpha:0, duration:1.5, ease:'none' }, .45);
      if(!isMobile && main.querySelector('.hero-slider'))
        tl.from('.hero-slider', { autoAlpha:0, y:26, scale:1.05, duration:1.15, clearProps:CLEAR }, .3);
    }
  }

  /* ---- dựng toàn bộ hiệu ứng cho trang đang mở ---------------------------- */
  function build(page, withEntrance){
    const main = document.querySelector('main.active');
    if(!main) return;
    if(mm) mm.revert();                      // dọn sạch tween + ScrollTrigger của trang trước
    mm = gsap.matchMedia();
    let entranceDone = false;                // đổi breakpoint giữa chừng không diễn lại entrance
    mm.add(BP, ctx => {
      const { isDesktop, isMobile } = ctx.conditions;
      const dist = isMobile ? 24 : 36;
      const stag = isMobile ? .07 : .09;

      if(withEntrance && !entranceDone){ entranceDone = true; entrance(main, page, isMobile); }

      headReveals(main);
      batchRise(gsap.utils.toArray('.v-card, .mis, .gian, .b-card, .e-card, .art-card, .pat, .feat, .bst-card', main),
                { y:dist, scale:.985, stagger:stag });
      batchRise(gsap.utils.toArray('.p-card', main), { y:dist, stagger:stag, start:'top 94%' });
      batchRise(gsap.utils.toArray('.j-step', main), { y:28, stagger:isMobile ? .1 : .14, start:'top 88%' });
      splitReveals(main, isMobile);
      rowReveals(main);

      /* footer dùng chung — chỉ reveal lần đầu nhờ cờ kvShown */
      batchRise(gsap.utils.toArray('footer .f-grid > *, footer .f-news > *'), { y:26, stagger:.08 });

      ambient(main, isDesktop);
    });
    ScrollTrigger.refresh();
  }

  /* ---- API cho script.js -------------------------------------------------- */
  window.kvMotion = {
    /* đổi trang: xoá cờ để trang được diễn lại từ đầu */
    pageEnter(p){
      const main = document.querySelector('main.active');
      if(main) main.querySelectorAll('[data-kv-shown]').forEach(el => delete el.dataset.kvShown);
      build(p, true);
    },
    /* nội dung trong trang thay đổi (tab, bộ lọc): chỉ bổ sung, không diễn lại */
    refresh(){ build(null, false); }
  };

  /* thanh điều hướng chào một lần khi tải */
  gsap.from('.nav > *', { y:-16, autoAlpha:0, duration:.65, stagger:.07, ease:'power2.out', clearProps:CLEAR });

  /* modal mở: nền mờ dần, panel nổi lên, nội dung nối nhau */
  document.querySelectorAll('.modal').forEach(m => {
    let wasOpen = m.classList.contains('open');
    new MutationObserver(() => {
      const isOpen = m.classList.contains('open');
      if(isOpen && !wasOpen){
        const panel = m.querySelector('.panel');
        gsap.fromTo(m.querySelector('.back'), { autoAlpha:0 }, { autoAlpha:1, duration:.3, ease:'none', clearProps:'opacity,visibility' });
        if(panel) gsap.fromTo(panel, { autoAlpha:0, y:20, scale:.965 },
          { autoAlpha:1, y:0, scale:1, duration:.5, ease:'power3.out', clearProps:CLEAR });
        const body = panel && panel.querySelector('.m-body');
        if(body) gsap.from(body.children, { y:14, autoAlpha:0, duration:.5, stagger:.05, ease:'power2.out', delay:.1, clearProps:CLEAR });
      }
      wasOpen = isOpen;
    }).observe(m, { attributes:true, attributeFilter:['class'] });
  });

  /* ảnh lazy tải xong làm lệch layout → tính lại vị trí trigger */
  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* một số môi trường nhúng không phát sự kiện resize chuẩn — ResizeObserver
     đảm bảo trigger luôn được tính lại khi khung nhìn/nội dung đổi kích thước */
  let roT;
  new ResizeObserver(() => {
    clearTimeout(roT);
    roT = setTimeout(() => ScrollTrigger.refresh(), 250);
  }).observe(document.documentElement);

  /* bộ lọc/phân trang/tab làm thay đổi layout → tính lại sau khi render */
  document.addEventListener('click', e => {
    if(e.target.closest('.filters .chip, #marketPager [data-pg], .vtab, .sort'))
      requestAnimationFrame(() => ScrollTrigger.refresh());
  });
})();
