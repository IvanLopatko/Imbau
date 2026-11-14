/* =========================================================
   IM BAU — перевірка мобільної версії
   1) кожна сторінка на чотирьох ширинах телефона: чи не вилазить за екран, дрібні кнопки,
      дрібний текст, поля, що змушують iPhone збільшувати сторінку, контраст, обрізаний текст,
      накладання стікерів, скільки екрана лишається між закріпленими панелями;
   2) вікна й панелі: меню, фільтри, усі спливні вікна — чи вміщаються, чи видно кнопки;
   3) сценарії на телефоні: місто, запитання, сертифікат, форми, кошик, оформлення;
   4) телефон горизонтально: скільки екрана лишається для вмісту.
   Запуск: tools/qa/index.html?mobile=1 (з локального сервера). Результат — window.__MOB.
   ========================================================= */
(function () {
  'use strict';
  const BASE = QA.BASE, KEY = 'imbau_proto_v1', sleep = ms => new Promise(r => setTimeout(r, ms)), enc = encodeURIComponent;
  const SIZES = [[320, 568, 'малий телефон, 320'], [360, 740, 'Android, 360'], [390, 844, 'iPhone, 390'], [430, 932, 'великий телефон, 430']];
  const PAINT = 'category.html?sub=' + enc('Фарби інтер’єрні');
  const PAGES = ['index.html', 'catalog.html', 'section.html?s=lfm', PAINT, 'category.html?sub=' + enc('Шпаклівки'),
    'product.html?id=acr', 'product.html?id=tm12', 'product.html?id=stz', 'product.html?id=gre', 'product.html?id=tc16', 'product.html?id=nail', 'product.html?id=old', 'product.html?id=pf', 'product.html?id=fac', 'info.html?p=about', 'info.html?p=discounts',
    'search.html?q=' + enc('фарба'), 'search.html?q=' + enc('ййй'), 'cart.html', 'checkout.html', 'success.html', 'tracking.html', 'account.html', 'compare.html', 'compare.html?tab=fav',
    'promo.html', 'brand.html?b=front', 'brand.html?b=tigor', 'brands.html', 'tinting.html', 'podbor.html', 'kit.html', 'kit.html?t=' + enc('Для плитки'),
    'evidnovlennya.html', 'delivery.html', 'stores.html', 'blog.html', 'blog.html?a=1', 'info.html?p=return', 'info.html?p=faq', 'certificate.html', 'pro.html', 'suppliers.html', '404.html'];

  const frame = (w, h) => { const f = document.createElement('iframe'); f.style.cssText = `position:fixed;left:-4000px;top:0;border:0;width:${w}px;height:${h}px`; document.body.appendChild(f); return f; };
  /* Animations and smooth scrolling are switched off inside the test frame: measurements must not depend
     on whether the browser tab is in the foreground (a background tab pauses animations). */
  const calm = f => { try { const st = f.contentDocument.createElement('style'); st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}html{scroll-behavior:auto!important}'; f.contentDocument.head.appendChild(st); } catch (e) {} };
  const go = (f, u) => new Promise(r => { f.onload = () => { calm(f); setTimeout(r, 180); }; f.src = BASE + u; });
  const nav = (f, fn) => new Promise(r => { let done = false; f.onload = () => { calm(f); if (!done) { done = true; setTimeout(r, 220); } }; fn(); setTimeout(() => { if (!done) { done = true; r(); } }, 2600); });
  const reset = st => localStorage.setItem(KEY, JSON.stringify(Object.assign({ cart: [], fav: [], cmp: [], city: 'Харків', lang: 'UA', seen: [], orders: [], cookie: 'all', cityOk: true, gift: null, user: null, promo: null }, st || {})));
  const state = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const key = el => { const c = typeof el.className === 'string' && el.className.trim().split(/\s+/)[0]; return c ? '.' + c : el.tagName.toLowerCase(); };
  const hit = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
  const lum = c => { const a = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 1]; };
  const bgOf = (w, el) => { let c = [255, 255, 255]; const stack = []; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = w.getComputedStyle(e), b = rgb(cs.backgroundColor), a = b[3] === undefined ? 1 : b[3]; if (cs.backgroundImage !== 'none' && !stack.length) return null; if (a > 0) { stack.push(b); if (a >= 1) break; } } stack.reverse().forEach(b => { const a = b[3] === undefined ? 1 : b[3]; c = c.map((v, i) => v * (1 - a) + b[i] * a); }); return c; };
  const ratioOf = (w, el) => { const bg = bgOf(w, el); if (!bg) return null; const cs = w.getComputedStyle(el), fg = rgb(cs.color), a = fg[3] === undefined ? 1 : fg[3], col = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a)); return (Math.max(lum(col), lum(bg)) + .05) / (Math.min(lum(col), lum(bg)) + .05); };

  /* ---------- 1. Сторінка на одній ширині ---------- */
  function audit(f, vw, vh) {
    const d = f.contentDocument, w = f.contentWindow;
    const r = { over: 0, off: [], cut: {}, taps: {}, small: {}, zoom: {}, contrast: {}, clipped: {}, overlaps: [], rails: [], noSize: 0 };
    const V = el => { const b = el.getBoundingClientRect(), cs = w.getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0; };
    const skip = el => el.closest('.proto-flag, .sr-only, #modal, .cookie') || (el.closest('.drawer') && !el.closest('.drawer.is-open'));
    const clipAnc = el => { for (let e = el.parentElement; e && e.nodeType === 1; e = e.parentElement) { const o = w.getComputedStyle(e).overflowX; if (o !== 'visible') return o; } return ''; };
    const all = [...d.querySelectorAll('body *')].filter(el => !skip(el) && !el.closest('svg'));
    r.over = Math.max(0, d.documentElement.scrollWidth - vw);
    all.forEach(el => {
      if (!V(el)) return; const b = el.getBoundingClientRect(), cs = w.getComputedStyle(el);
      if (r.over > 1 && b.right > vw + 1 && b.left < vw && !clipAnc(el)) r.off.push(key(el));
      const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own) return;
      const fs = parseFloat(cs.fontSize);
      /* текст, який обрізає край екрана (батько ховає зайве, але не гортається) */
      if (b.right > vw + 3 && b.left < vw - 8 && /hidden|clip/.test(clipAnc(el))) r.cut[key(el)] = el.textContent.trim().slice(0, 30);
      if (fs < 12) r.small[key(el)] = Math.round(fs * 10) / 10;
      if (+cs.opacity < 1 || el.closest('.is-off, .is-disabled, [disabled], .is-out, .is-ended')) return;
      if (el.closest('[aria-hidden="true"]')) return; /* декоративне не читається взагалі */
      const ratio = ratioOf(w, el); if (ratio === null) return; const big = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
      if (ratio < (big ? 3 : 4.5)) { const k = key(el); if (!r.contrast[k] || r.contrast[k].r > ratio) r.contrast[k] = { r: Math.round(ratio * 100) / 100, fs, t: el.textContent.trim().slice(0, 26) }; }
    });
    r.off = [...new Set(r.off)].slice(0, 6);
    /* поля з шрифтом менше 16 px: iPhone сам збільшує сторінку, коли в таке поле натискають */
    d.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea').forEach(el => { if (skip(el) || !V(el)) return; const fs = parseFloat(w.getComputedStyle(el).fontSize); if (fs < 16) { const k = (el.closest('.qty') ? '.qty ' : el.closest('.search') ? '.search ' : '') + key(el); r.zoom[k] = fs; } });
    /* цілі для пальця: менша сторона до 44 px. Посилання всередині речення не рахуємо. */
    d.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary').forEach(el => {
      if (skip(el)) return; let box = el; const t = (el.getAttribute('type') || '').toLowerCase();
      if (t === 'checkbox' || t === 'radio') box = el.closest('label') || el;
      if (!V(box)) return; const cs = w.getComputedStyle(el);
      if ((el.tagName === 'A' || el.tagName === 'BUTTON') && cs.display === 'inline' && [...el.parentElement.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 3)) return;
      const b = box.getBoundingClientRect(), m = Math.round(Math.min(b.width, b.height)); if (m >= 44) return;
      const k = (box.closest('.footer') ? 'підвал ' : '') + key(box), o = r.taps[k] || (r.taps[k] = { m, n: 0, t: (el.getAttribute('aria-label') || box.textContent || el.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 24) }); o.n++; if (m < o.m) o.m = m;
    });
    /* обрізаний текст у кнопках і заголовках */
    d.querySelectorAll('button, a.btn, .chip, .tab, .pack, .pack-chip, h1, h2, .choice__title, .field__label, .sub-tile__name, .tile__name').forEach(el => { if (skip(el) || !V(el)) return; const cs = w.getComputedStyle(el); if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== 'visible' && !/auto|scroll/.test(cs.overflowX)) r.clipped[key(el)] = el.textContent.trim().slice(0, 30); });
    /* стікери на картках: чи не лягають на кнопки і скільки фото закривають */
    d.querySelectorAll('.pcard').forEach(c => { if (!V(c)) return; const R = s => [...c.querySelectorAll(s)].filter(V).map(x => x.getBoundingClientRect()), st = R('.pcard__badges .stk'), tl = R('.pcard__tools .icon-btn'), mk = R('.pcard__marks .stk'), media = c.querySelector('.pcard__media');
      if (st.some(a => tl.some(b => hit(a, b)))) r.overlaps.push('стікер лягає на кнопку «В обране»: ' + c.dataset.id);
      if (st.some(a => mk.some(b => hit(a, b)))) r.overlaps.push('верхній стікер лягає на нижню позначку: ' + c.dataset.id);
      if (media) { const mb = media.getBoundingClientRect(), cov = st.concat(mk).reduce((s, a) => s + a.width * a.height, 0); if (mb.width * mb.height && cov / (mb.width * mb.height) > .3) r.overlaps.push(`стікери закривають ${Math.round(cov / (mb.width * mb.height) * 100)} % фото: ` + c.dataset.id); } });
    /* стрічки, що гортаються вбік: чи видно, що далі щось є */
    all.forEach(el => { const cs = w.getComputedStyle(el); if (!/auto|scroll/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 8 || !V(el)) return; const b = el.getBoundingClientRect(); const gd = el.closest('.gallery') && el.closest('.gallery').querySelector('.gallery__dots'); /* підказки: обрізаний сусід, танучий край (app.js), крапки галереї */
      const cue = el.tagName === 'TABLE' || el.classList.contains('is-more-r') || el.classList.contains('is-more-l') || !!(gd && gd.getBoundingClientRect().width > 0) || [...el.children].some(ch => { const c = ch.getBoundingClientRect(); return c.left < b.right - 16 && c.right > b.right + 6; }); r.rails.push({ k: key(el), cue }); });
    r.noSize = [...d.images].filter(i => V(i) && !(i.getAttribute('width') && i.getAttribute('height'))).length;
    return r;
  }
  /* Скільки екрана лишається між закріпленими панелями вгорі та внизу */
  function cover(f, vw, vh) {
    const d = f.contentDocument, w = f.contentWindow; let top = 0, bot = vh; const parts = [];
    d.querySelectorAll('body *').forEach(el => { const cs = w.getComputedStyle(el); if (cs.position !== 'fixed' && cs.position !== 'sticky') return; if (el.closest('.proto-flag, #modal, .drawer, .toast-wrap, #lightbox')) return;
      const b = el.getBoundingClientRect(); if (b.width < vw * .5 || b.height < 8 || b.height > vh * .7 || cs.visibility === 'hidden' || +cs.opacity === 0) return;
      if (b.top <= 2 && b.bottom > 0) { top = Math.max(top, b.bottom); parts.push(key(el) + ' ' + Math.round(b.height)); }
      else if (b.bottom >= vh - 2 && b.top < vh) { bot = Math.min(bot, b.top); parts.push(key(el) + ' ' + Math.round(b.height)); }
      else if (cs.position === 'fixed' && b.top > vh * .4 && b.bottom <= vh) { bot = Math.min(bot, b.top); parts.push(key(el) + ' ' + Math.round(b.height) + ' плаває'); } });
    return { top: Math.round(top), bottom: Math.round(vh - bot), free: Math.round((bot - top) / vh * 100), parts };
  }
  async function pages(progress) {
    const rows = []; reset({ cart: [{ id: 'acr', pack: 2, qty: 1 }, { id: 'tm12', pack: 0, qty: 2 }], cmp: ['acr', 'mat'], fav: ['sat'], orders: [{ id: 'IMB-1', date: '01.11.2026', items: [{ id: 'acr', pack: 2, qty: 1 }], total: 628, method: 'pickup', pay: 'store', status: 2, tracked: true }] });
    for (const [vw, vh, nm] of SIZES) { const f = frame(vw, vh);
      for (const u of PAGES) { await go(f, u); const d = f.contentDocument, w = f.contentWindow, r = audit(f, vw, vh); r.page = decodeURIComponent(u); r.w = vw; r.dev = nm;
        r.cover0 = cover(f, vw, vh); r.screens = Math.round(d.documentElement.scrollHeight / vh * 10) / 10;
        const h1 = [...d.querySelectorAll('h1')].find(e => e.getBoundingClientRect().height > 0); r.h1 = h1 ? Math.round(h1.getBoundingClientRect().top) : null;
        w.scrollTo(0, 700); await sleep(220); r.cover1 = cover(f, vw, vh); rows.push(r); if (progress) progress(rows.length, SIZES.length * PAGES.length); }
      f.remove(); }
    return rows;
  }

  /* ---------- 2. Вікна й панелі ---------- */
  async function modals() {
    const out = [], box0 = d => d.querySelector('#modal .modal__box');
    const OPEN = [
      ['Меню', 'index.html', (w, d) => d.querySelector('.mhead [data-drawer="menu"]').click(), d => d.querySelector('.drawer.is-open .drawer__panel')],
      ['Ваше місто', 'index.html', (w, d) => d.querySelector('[data-modal="city"]').click(), box0],
      ['Замовити дзвінок', 'index.html', (w, d) => d.querySelector('[data-modal="callback"]').click(), box0],
      ['Поставити питання', 'index.html', (w, d) => d.querySelector('[data-modal="ask"]').click(), box0],
      ['Купити в 1 клік', 'product.html?id=tm12', w => w.IMB.oneClick('tm12'), box0],
      ['Додано до кошика', 'product.html?id=gs41', w => w.IMB.addToCart('gs41'), box0],
      ['Повідомити про надходження', 'product.html?id=gre', (w, d) => d.querySelector('[data-notify]').click(), box0],
      ['Відгук про товар', 'product.html?id=acr', (w, d) => { d.querySelector('[data-tab="reviews"]').click(); d.querySelector('[data-review]').click(); }, box0],
      ['Питання про товар', 'product.html?id=acr', (w, d) => { d.querySelector('[data-tab="qa"]').click(); d.querySelector('[data-ask]').click(); }, box0],
      ['Позначки на товарі', 'product.html?id=acr', (w, d) => d.querySelector('[data-stkinfo]').click(), box0],
      ['Фото на весь екран', 'product.html?id=acr', w => w.IMB.lightbox(w.IMB.P('acr'), 0), d => d.querySelector('#lightbox')],
      ['Фільтри', PAINT, (w, d) => d.querySelector('[data-openfilters]').click(), d => d.querySelector('.filters.is-sheet')],
      ['Кошик в 1 клік', 'cart.html', (w, d) => d.querySelector('[data-cart1click]').click(), box0],
    ];
    for (const [vw, vh] of [[320, 568], [390, 844]]) { const f = frame(vw, vh);
      for (const [nm, u, open, find] of OPEN) { const o = { name: nm, w: vw, h: vh };
        try { reset({ cart: [{ id: 'acr', pack: 2, qty: 1 }] }); await go(f, u); const d = f.contentDocument, w = f.contentWindow; open(w, d); await sleep(420); const box = find(d);
          if (!box) { o.err = 'не відкрилось'; out.push(o); continue; }
          const b = box.getBoundingClientRect(); o.size = Math.round(b.width) + '×' + Math.round(b.height); o.fitW = b.left >= -1 && b.right <= vw + 1; o.fitH = b.top >= -1 && b.bottom <= vh + 1;
          o.scroll = box.scrollHeight > box.clientHeight + 2; o.side = box.scrollWidth > box.clientWidth + 2;
          const cl = box.querySelector('.modal__close, [data-lbclose], [data-close]'); if (cl) { const c = cl.getBoundingClientRect(); o.close = Math.round(Math.min(c.width, c.height)); o.closeIn = c.top >= 0 && c.bottom <= vh && c.left >= 0 && c.right <= vw; } else o.close = 0;
          const pr = [...box.querySelectorAll('.btn--primary, .btn--dark')].filter(x => x.getBoundingClientRect().width > 0)[0]; if (pr) { const p = pr.getBoundingClientRect(); o.cta = p.top >= 0 && p.bottom <= vh + 1; }
          o.zoom = [...box.querySelectorAll('input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, textarea')].filter(x => x.getBoundingClientRect().width > 0 && parseFloat(w.getComputedStyle(x).fontSize) < 16).length;
          o.lock = d.body.style.overflow === 'hidden' || w.getComputedStyle(d.body).overflow === 'hidden';
          const ae = d.activeElement; o.focus = ae && ae !== d.body ? ae.tagName.toLowerCase() + (ae.id ? '#' + ae.id : '') : 'немає';
          o.keyboard = !!ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && !/checkbox|radio/.test(ae.type || '');
        } catch (e) { o.err = 'збій: ' + e.message; }
        out.push(o); }
      f.remove(); }
    return out;
  }

  /* ---------- 3. Сценарії на телефоні 390×844 ---------- */
  async function flows() {
    const out = [], vw = 390, vh = 844, f = frame(vw, vh); let d, w;
    const open = async u => { await go(f, u); d = f.contentDocument; w = f.contentWindow; };
    const T = async (test, fn) => { try { const r = await fn(); out.push({ test, ok: !!r[0], got: r[1] }); } catch (e) { out.push({ test, ok: false, got: 'збій: ' + e.message }); } };
    const rect = el => el.getBoundingClientRect(), inView = el => { const b = rect(el); return b.width > 0 && b.top >= 0 && b.bottom <= vh + 1 && b.left >= 0 && b.right <= vw + 1; };
    const fire = (el, type) => el.dispatchEvent(new w.Event(type, { bubbles: true }));
    const setv = (sel, v) => { const e = d.querySelector(sel); e.value = v; fire(e, 'input'); return e; };

    await T('Перший візит: питання про місто стоїть рядком, без окремого вікна', async () => { reset({ cityOk: false, cookie: null }); await open('index.html'); const s = d.querySelector('.mcity.is-ask'), c = d.querySelector('.cookie'); if (!s || !inView(s)) return [false, 'рядка з питанням немає'];
      const hd = rect(d.querySelector('#hdr')), free = Math.round(((c ? rect(c).top : vh) - hd.bottom) / vh * 100), btn = [...s.querySelectorAll('button')].map(b => Math.round(rect(b).height));
      return [!d.querySelector('#modal') && btn.every(h => h >= 36), `рядок ${Math.round(rect(s).height)} px, кнопки ${btn.join(' і ')} px; між шапкою і вікном cookie вільно ${free} % екрана`]; });
    await T('Відповідь «Так» прибирає питання і запам’ятовується', async () => { d.querySelector('.mcity [data-cityok]').click(); await sleep(150); return [!d.querySelector('.mcity.is-ask') && state().cityOk === true, d.querySelector('.mcity').textContent.trim().replace(/\s+/g, ' ').slice(0, 46)]; });
    await T('Вікно «Ваше місто»: місто обирається, кнопка збереження лишається на екрані', async () => { reset(); await open('product.html?id=acr'); d.querySelector('.mcity [data-modal="city"]').click(); await sleep(350); d.querySelector('[data-pickcity="Полтава"]').click(); await sleep(80);
      const b = d.querySelector('[data-setcity]'), ok = inView(b) && /Полтава/.test(b.textContent), kb = !!d.activeElement && d.activeElement.id === 'city-q', txt = b.textContent.trim(); await nav(f, () => b.click()); d = f.contentDocument; w = f.contentWindow;
      return [ok && state().city === 'Полтава' && !kb, `кнопка «${txt}» ${ok ? 'видна' : 'за межами екрана'}; клавіатура ${kb ? 'відкривається одразу й закриває перелік' : 'сама не відкривається'}; збережено: ${state().city}`]; });
    await T('Інше місто: видно, що товар туди не відправлять', async () => { const off = d.querySelectorAll('.shipbox .ship-line.is-off').length; await open(PAINT); const c = d.querySelector('.pcard'), st = c.querySelector('.stk--away'), heart = [...c.querySelectorAll('.pcard__tools .icon-btn')].filter(x => rect(x).width > 0), clash = !!st && heart.some(h => hit(rect(st), rect(h)));
      return [!!st && !clash && off >= 2, `на сторінці товару вимкнено способів: ${off}; на картці ${st ? 'є «Тільки Харків»' : 'позначки немає'}${clash ? ', вона лягає на кнопку «В обране»' : ''}; рядок отримання: «${c.querySelector('.pcard__ship').textContent.trim()}»`]; });
    await T('Часті запитання: теми гортаються вбік і фільтрують перелік', async () => { reset(); await open('index.html'); const q = d.querySelector('.faq'), row = q.querySelector('.faq__topics'); q.querySelector('[data-faqtopic="pay"]').click(); await sleep(80); const shown = [...q.querySelectorAll('details')].filter(x => !x.hidden);
      return [shown.length > 0 && shown.every(x => x.dataset.k === 'pay'), `показано ${shown.length} питання теми «Оплата»; рядок тем ${row.scrollWidth > row.clientWidth + 2 ? 'гортається вбік' : 'вміщається'}; рядок питання ${Math.round(rect(q.querySelector('details:not([hidden]) summary')).height)} px заввишки`]; });
    await T('Сертифікат: порожня форма не відправляється і показує, що заповнити', async () => { await open('certificate.html'); d.querySelector('[data-form="gift"]').requestSubmit(); await sleep(150); const bad = d.querySelectorAll('.field.is-invalid').length; return [bad >= 2 && !d.querySelector('#modal'), `підсвічено полів: ${bad}`]; });
    await T('Сертифікат: заповнена форма оформлюється, сертифікат показує введене', async () => { setv('#gf-to', 'Олена'); setv('#gf-ph', '0671234567'); setv('#gf-mail', 'test@example.com'); const g = d.querySelector('.gcard'), ok = /Олена/.test(g.textContent); d.querySelector('[data-form="gift"]').requestSubmit(); await sleep(300); const m = d.querySelector('#modal');
      return [ok && !!m && /оформлено/.test(m.textContent), `сертифікат ${Math.round(rect(g).width)}×${Math.round(rect(g).height)} px; ${m ? '«' + m.querySelector('.modal__title').textContent + '»' : 'вікна підтвердження немає'}`]; });
    await T('Оптовикам і майстрам: перемикач міняє форму, заявка відправляється', async () => { await open('pro.html'); d.querySelector('[data-proa="company"]').click(); await sleep(80); const who = d.querySelector('input[name="pwho"]:checked').value, co = [...d.querySelectorAll('[data-proco]')].every(x => !x.hidden), cutTab = [...d.querySelectorAll('[data-slot="pro-tabs"] .tab')].some(t => t.scrollWidth > t.clientWidth + 1);
      setv('#pr-n', 'Ігор'); setv('#pr-ph', '0671234567'); d.querySelector('[data-form="pro"]').requestSubmit(); await sleep(300); const m = d.querySelector('#modal');
      return [who === 'Компанія' && co && !cutTab && !!m, `тип у формі: ${who}; поля компанії ${co ? 'з’явились' : 'сховані'}; назви вкладок ${cutTab ? 'обрізані' : 'вміщаються'}; ${m ? '«' + m.querySelector('.modal__title').textContent + '»' : 'вікна підтвердження немає'}`]; });
    await T('Постачальникам: порожня форма не відправляється', async () => { await open('suppliers.html'); d.querySelector('[data-form="supplier"]').requestSubmit(); await sleep(200); const m = d.querySelector('#modal'); return [!m, m ? 'порожня форма відправилась' : 'браузер зупиняє на першому порожньому полі']; });
    await T('Кошик: код сертифіката зменшує суму і в підсумку, і на панелі внизу', async () => { reset({ cart: [{ id: 'acr', pack: 2, qty: 2 }] }); await open('cart.html'); const g = d.querySelector('[data-promo]'); g.querySelector('input').value = 'GIFT-1000'; g.requestSubmit(); await sleep(200);
      const tot = d.querySelector('.summary__total b').textContent.trim(), bar = ((d.querySelector('.sticky-buy__price') || {}).textContent || '').trim(); return [tot === '256 грн' && bar === tot, `разом ${tot}; на панелі внизу ${bar || 'суми немає'}`]; });
    await T('Поставки припинено: купити не можна, аналог додається в кошик', async () => { reset(); await open('product.html?id=old'); const buy = d.querySelector('.buybox [data-add], .sticky-buy [data-add]'), bar = d.querySelector('.sticky-buy a[href="#analogs"]'); d.querySelector('.analog [data-add]').click(); await sleep(300); const ids = state().cart.map(x => x.id).join(', ');
      return [!buy && !!bar && inView(bar) && /mat/.test(ids), `кнопки купівлі знятого товару ${buy ? 'є' : 'немає'}; внизу ${bar ? '«' + bar.textContent.trim() + '»' : 'нічого'}; у кошику: ${ids || 'порожньо'}`]; });
    await T('Товар на вагу: кількість у кілограмах доходить до кошика', async () => { reset(); await open('product.html?id=nail'); for (let i = 0; i < 2; i++) { d.querySelector('.buybox [data-qty] [data-d="1"]').click(); await sleep(60); } const unit = (d.querySelector('.buybox .qty__unit') || {}).textContent; d.querySelector('.buybox [data-add]').click(); await sleep(300); const line = state().cart.find(x => x.id === 'nail');
      return [unit === 'кг' && !!line && line.qty === 3, `одиниця «${unit}», у кошику ${line ? line.qty : 0} кг`]; });
    await T('Товар: ціна й кнопка купівлі видні на першому екрані', async () => { reset(); await open('product.html?id=acr'); const s = d.querySelector('.sticky-buy'), p = d.querySelector('.buybox__price'), sb = !!s && rect(s).height > 0 && rect(s).top < vh; return [sb, `закріплена панель ${sb ? 'видна одразу' : 'не видна'}; ціна в блоці купівлі на ${(rect(p).top / vh).toFixed(1)} екрана від верху`]; });
    await T('Закріплена кнопка «До кошика» додає обрану кількість', async () => { for (let i = 0; i < 3; i++) { d.querySelector('.buybox [data-qty] [data-d="1"]').click(); await sleep(60); } const want = +d.querySelector('.buybox [data-qty] input').value; d.querySelector('.sticky-buy [data-add]').click(); await sleep(300); const line = state().cart.find(x => x.id === 'acr'); return [!!line && line.qty === want, `обрано ${want} шт., у кошику ${line ? line.qty : 0}`]; });
    await T('Фото товару гортаються пальцем, крапки показують позицію', async () => { reset(); await open('product.html?id=acr'); const tr = d.querySelector('[data-gtrack]'), snap = w.getComputedStyle(tr).scrollSnapType, dots = d.querySelectorAll('.gallery__dots i'); tr.scrollTo({ left: tr.clientWidth, behavior: 'auto' }); tr.dispatchEvent(new w.Event('scroll')); await sleep(350); const on = [...dots].findIndex(x => x.classList.contains('is-on'));
      return [tr.scrollWidth > tr.clientWidth && /x/.test(snap) && on === 1, `прив’язка прокрутки ${/x/.test(snap) ? 'є' : 'немає'}; фото ${dots.length}, після гортання активна крапка ${on + 1}; крапка ${Math.round(rect(dots[0]).width)} px`]; });
    await T('Вікно cookie не закриває ціну й кнопку купівлі', async () => { reset({ cookie: null }); await open('product.html?id=acr'); const c = d.querySelector('.cookie'), s = d.querySelector('.sticky-buy'), clash = !!c && !!s && hit(rect(c), rect(s)); return [!clash, c ? `вікно ${Math.round(rect(c).height)} px заввишки${clash ? ' і лежить поверх панелі купівлі' : ''}` : 'вікна немає']; });
    await T('Підвал: посилання в розгорнутих списках читаються', async () => { reset(); await open('index.html'); const det = d.querySelector('.footer__mob details'); det.open = true; await sleep(60); const a = det.querySelector('.acc__body a'), ratio = ratioOf(w, a); return [ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1 за норми 4,5:1; рядок посилання ${Math.round(rect(a).height)} px заввишки`]; });
    await T('Меню: відкривається, пункти зручні, закривається', async () => { d.querySelector('.mhead [data-drawer="menu"]').click(); await sleep(380); const p = d.querySelector('.drawer.is-open .drawer__panel'); if (!p) return [false, 'не відкрилось']; const b = rect(p), links = [...p.querySelectorAll('.drawer__list a')], low = links.filter(a => rect(a).height < 44).length, sc = p.scrollHeight > p.clientHeight + 2; p.querySelector('[data-close]').click(); await sleep(380); const closed = !d.querySelector('.drawer.is-open');
      return [b.right <= vw + 1 && low === 0 && closed, `панель ${Math.round(b.width)}×${Math.round(b.height)} px, пунктів ${links.length}, нижчих за 44 px: ${low}; ${sc ? 'прокручується' : 'вміщається без прокрутки'}; ${closed ? 'закривається' : 'не закрилась'}`]; });
    await T('Пошук: підказки вміщаються в екран', async () => { const i = d.querySelector('#q-mob'); i.focus(); i.value = 'фарба'; fire(i, 'input'); await sleep(200); const s = i.closest('[data-search]').querySelector('.suggest'), b = rect(s), items = s.querySelectorAll('.suggest__item').length;
      return [s.classList.contains('is-open') && b.left >= 0 && b.right <= vw + 1 && items > 0, `підказок ${items}, блок ${Math.round(b.width)}×${Math.round(b.height)} px${b.bottom > vh ? ', низ за межами екрана' : ''}; шрифт поля ${parseFloat(w.getComputedStyle(i).fontSize)} px`]; });
    await T('Фільтри: панель на весь екран, кнопка застосування під рукою', async () => { await open(PAINT); d.querySelector('[data-openfilters]').click(); await sleep(350); const s = d.querySelector('.filters.is-sheet'); if (!s) return [false, 'не відкрились']; const b = rect(s), foot = s.querySelector('.filters__foot .btn, .filters__foot button'), rows = [...s.querySelectorAll('.check')].map(x => Math.round(rect(x).height)).filter(Boolean);
      return [b.right <= vw + 1 && !!foot && inView(foot), `панель ${Math.round(b.width)}×${Math.round(b.height)} px; кнопка застосування ${foot && inView(foot) ? 'на екрані' : 'за межами екрана'}; рядок фільтра ${rows.length ? Math.min(...rows) : 0} px заввишки`]; });
    await T('Оформлення на телефоні: від кошика до «Дякуємо»', async () => { reset({ cart: [{ id: 'tm12', pack: 0, qty: 2 }] }); await open('checkout.html'); const btn = d.querySelector('form[data-co] .summary .btn--primary'), scr = (rect(btn).bottom + w.scrollY) / vh; setv('#co-ph', '0671234567'); setv('#co-name', 'Тест');
      await nav(f, () => d.querySelector('form[data-co]').requestSubmit()); d = f.contentDocument; w = f.contentWindow; const ok = /success/.test(w.location.pathname); return [ok, `кнопка підтвердження на ${scr.toFixed(1)} екрані від верху; ${ok ? 'замовлення створено' : 'замовлення не створилось'}`]; });
    await T('Таблиця доставки не розтягує сторінку', async () => { await open('delivery.html'); const t = d.querySelector('.table'), over = d.documentElement.scrollWidth - vw; return [over <= 1, `таблиця ${t.scrollWidth} px у рамці ${Math.round(t.clientWidth)} px: ${t.scrollWidth > t.clientWidth + 2 ? 'гортається вбік усередині рамки' : 'вміщається'}`]; });
    await T('Порівняння не розтягує сторінку', async () => { reset({ cmp: ['acr', 'mat', 'sat'] }); await open('compare.html'); const over = d.documentElement.scrollWidth - vw; return [over <= 1, over > 1 ? `сторінка ширша за екран на ${over} px` : 'сторінка не ширша за екран']; });
    await T('Колерування: зразки кольору зручно натискати', async () => { reset(); await open('tinting.html'); const sw = [...d.querySelectorAll('.viz__groups button')].filter(x => rect(x).width > 0), m = sw.length ? Math.min(...sw.map(x => Math.min(rect(x).width, rect(x).height))) : 0; return [m >= 32, `зразків ${sw.length}, найменший ${Math.round(m)} px`]; });
    f.remove(); return out;
  }

  /* ---------- 4. Телефон горизонтально ---------- */
  async function landscape() {
    const out = []; reset({ cart: [{ id: 'acr', pack: 2, qty: 1 }] });
    for (const [vw, vh] of [[844, 390], [740, 360]]) { const f = frame(vw, vh);
      for (const u of ['index.html', PAINT, 'product.html?id=acr', 'cart.html', 'checkout.html']) { await go(f, u); const w = f.contentWindow, c0 = cover(f, vw, vh); w.scrollTo(0, 500); await sleep(250); const c1 = cover(f, vw, vh);
        out.push({ page: decodeURIComponent(u), w: vw, h: vh, over: Math.max(0, f.contentDocument.documentElement.scrollWidth - vw), free0: c0.free, free1: c1.free, parts: c1.parts }); }
      f.remove(); }
    return out;
  }

  /* спільні функції для desktop.js */
  QA._m = { audit, cover, frame, go, nav, reset, state, hit, PAGES, PAINT, sleep };

  QA.mobile = async function (progress) {
    const backup = localStorage.getItem(KEY); let res;
    try { const rows = await pages(progress); const mod = await modals(); const fl = await flows(); const land = await landscape(); res = { rows, modals: mod, flows: fl, land, sizes: SIZES.map(s => s[0]), pages: PAGES.length }; }
    finally { if (backup === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, backup); }
    return res;
  };
})();
