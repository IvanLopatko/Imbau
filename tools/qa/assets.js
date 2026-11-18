/* =========================================================
   IMBAU — перевірка зображень та іконок
   Проходить усі сторінки прототипу (усі товари, розділи, статті, інформаційні сторінки, кабінет)
   на ширині 1440 і 390 px, у станах «гість» і «увійшов», та відкриває вікна й панелі.
   Шукає:
     · зображення, що не завантажились, без файлу в адресі, згорнуті до нуля, розтягнуті;
     · фонові зображення й маски зі стилів, яких немає;
     · іконки без малюнка, з нульовим розміром, роздуті чи стиснуті;
     · кнопки й посилання без тексту й без іконки;
     · місця під зображення, де нічого немає;
     · сліди збою в розмітці: «undefined», «NaN», «[object Object]»;
     · товари без справжнього фото (намальована заглушка) і з одним фото;
     · піктограму сайту для вкладки браузера, шрифти.
   Запуск: tools/qa/index.html?assets=1 (з локального сервера). Результат — window.__ASSETS.
   ========================================================= */
(function () {
  'use strict';
  const { frame, go, reset, PAGES, sleep } = QA._m, enc = encodeURIComponent;
  const key = el => { const c = el && typeof el.className === 'string' && el.className.trim().split(/\s+/)[0]; return c ? '.' + c : el ? el.tagName.toLowerCase() : '?'; };
  const path = el => { const a = []; for (let e = el, i = 0; e && e.nodeType === 1 && i < 3; e = e.parentElement, i++) a.unshift(key(e)); return a.join(' › '); };
  const head = new Map(); /* адреса → чи є файл */
  const exists = u => { if (!head.has(u)) head.set(u, fetch(u, { method: 'HEAD' }).then(r => r.ok).catch(() => false)); return head.get(u); };
  const dataOk = new Map();
  const dataLoads = u => { if (!dataOk.has(u)) dataOk.set(u, new Promise(r => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = u; setTimeout(() => r(false), 3000); })); return dataOk.get(u); };

  /* ---------- один стан однієї сторінки ---------- */
  async function scan(f, root) {
    const d = f.contentDocument, w = f.contentWindow, out = [], note = [], res = [], ph = [];
    const R = root || d.body;
    const shown = el => el.getClientRects().length > 0;
    const vis = el => { const b = el.getBoundingClientRect(), cs = w.getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0; };
    const add = (type, what) => out.push([type, what]);

    /* 1. зображення: ліниві вантажимо примусово, бо рамка стенда поза екраном */
    const imgs = [...R.querySelectorAll('img')];
    imgs.forEach(i => { if (i.loading === 'lazy') i.loading = 'eager'; });
    await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); setTimeout(r, 4000); })));
    imgs.forEach(i => {
      const src = i.getAttribute('src') || '';
      if (!src) return add('Зображення без адреси', path(i));
      if (/undefined|null|NaN|\[object/.test(src)) add('Адреса зображення зі збоєм', src);
      if (!i.complete || !i.naturalWidth) return add('Зображення не завантажилось', src);
      if (!i.hasAttribute('alt')) add('Зображення без атрибута alt', src);
      if (!i.hasAttribute('width') || !i.hasAttribute('height')) add('Зображення без розмірів у розмітці', src);
      if (!shown(i)) return;
      const b = i.getBoundingClientRect(), cs = w.getComputedStyle(i);
      if (b.width < 2 || b.height < 2) return add('Зображення згорнуте до нуля', `${src} у ${path(i.parentElement)}`);
      const rn = i.naturalWidth / i.naturalHeight, rb = b.width / b.height;
      if (cs.objectFit === 'fill' && Math.abs(rn / rb - 1) > 0.06) add('Зображення розтягнуте', `${src}: ${i.naturalWidth}×${i.naturalHeight} показано як ${Math.round(b.width)}×${Math.round(b.height)}`);
      if (!/\.svg(\?|$)/.test(src) && b.width >= 100) res.push([src.split('/').pop(), i.naturalWidth, Math.round(b.width)]);
    });
    /* адреси з srcset: те, що браузер зараз не вибрав, теж має існувати */
    for (const el of R.querySelectorAll('source[srcset], img[srcset]')) for (const part of el.getAttribute('srcset').split(',')) { const u = part.trim().split(/\s+/)[0]; if (u && !(await exists(new URL(u, d.baseURI).href))) add('Зображення зі srcset не знайдено', u); }
    /* намальовані заглушки замість фото: чиї вони */
    R.querySelectorAll('.shot:not(.shot--photo)').forEach(sh => { if (!shown(sh)) return; const card = sh.closest('[data-id]'), pr = card && w.IMB && w.IMB.byId[card.dataset.id]; const host = sh.closest('a, article, li, .need, .citem, .mini-item, .sec-card, .layer, figure') || sh.parentElement; ph.push(pr ? pr.name : ((host.getAttribute('aria-label') || host.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44) || path(sh))); });

    /* 2. фонові зображення, маски й картинки з псевдоелементів */
    const urls = new Map();
    const grab = (val, where) => { for (const m of String(val).matchAll(/url\((["']?)(.*?)\1\)/g)) if (m[2] && !urls.has(m[2])) urls.set(m[2], where); };
    R.querySelectorAll('*').forEach(el => { if (el.closest('svg')) return;
      for (const ps of [null, '::before', '::after']) { const cs = w.getComputedStyle(el, ps); if (ps && (cs.content === 'none' || cs.content === 'normal')) continue;
        if (cs.backgroundImage && cs.backgroundImage !== 'none') grab(cs.backgroundImage, key(el) + (ps || ''));
        const mk = cs.maskImage || cs.webkitMaskImage; if (mk && mk !== 'none') grab(mk, key(el) + (ps || '') + ' (маска)');
        if (ps && /url\(/.test(cs.content)) grab(cs.content, key(el) + ps);
        if (!ps && cs.listStyleImage && cs.listStyleImage !== 'none') grab(cs.listStyleImage, key(el) + ' (маркер списку)'); } });
    for (const [u, where] of urls) { const ok = u.startsWith('data:') ? await dataLoads(u) : await exists(new URL(u, d.baseURI).href); if (!ok) add('Фонове зображення не завантажилось', `${u.slice(0, 70)} у ${where}`); }

    /* 3. іконки SVG */
    R.querySelectorAll('svg').forEach(s => { if (s.parentElement && s.parentElement.closest('svg')) return;
      const host = s.parentElement, where = path(host);
      if (!s.querySelector('path, rect, circle, ellipse, line, polyline, polygon, use, text, image')) return add('Іконка без малюнка', where);
      s.querySelectorAll('path').forEach(p => { if (!(p.getAttribute('d') || '').trim()) add('Іконка з порожнім контуром', where); });
      s.querySelectorAll('use').forEach(u => { const h = u.getAttribute('href') || u.getAttribute('xlink:href') || ''; if (!h || (h[0] === '#' && !d.getElementById(h.slice(1)))) add('Іконка посилається на відсутній символ', `${h || 'без адреси'} у ${where}`); });
      if (!host || !shown(host) || !vis(host)) return;
      const cs = w.getComputedStyle(s); if (cs.display === 'none') return;
      const b = s.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) return add('Іконка з нульовим розміром', where);
      if (Math.min(b.width, b.height) < 8) add('Іконка стиснута, менша за 8 px', `${where}: ${Math.round(b.width)}×${Math.round(b.height)}`);
      const vb = (s.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
      if (vb.length === 4 && vb[2] === 24 && vb[3] === 24 && Math.max(b.width, b.height) > 72 && !s.closest('.shot, .task__ic, .empty, .result__icon, .eh, [class*="hero"], [class*="deco"]')) add('Іконка роздута', `${where}: ${Math.round(b.width)}×${Math.round(b.height)}`);
      if (cs.stroke === 'none' && (cs.fill === 'none' || cs.fill === 'rgba(0, 0, 0, 0)') && !s.querySelector('[stroke], [fill]:not([fill="none"])')) add('Іконка невидима: без заливки й обведення', where);
    });

    /* 4. кнопки й посилання без тексту й без іконки */
    R.querySelectorAll('button, a[href], [role="button"]').forEach(el => { if (!shown(el) || !vis(el) || el.closest('svg')) return;
      const txt = (el.textContent || '').trim(), label = el.getAttribute('aria-label') || el.getAttribute('title') || '';
      const media = el.querySelector('svg, img, picture, canvas');
      if (!txt && !media) { const cs = w.getComputedStyle(el), bg = cs.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
        const kids = [...el.querySelectorAll('*')].some(c => { const k = w.getComputedStyle(c); return shown(c) && (k.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(k.backgroundColor) || parseFloat(k.borderTopWidth) > 0); });
        const ps = ['::before', '::after'].some(p => { const k = w.getComputedStyle(el, p); return k.content !== 'none' && k.content !== 'normal'; });
        if (!(kids || ps || (bg && label))) add('Кнопка чи посилання без вмісту', `${path(el)}${label ? ' «' + label + '»' : ''}`); }
      else if (!txt && !label && !el.querySelector('img[alt]:not([alt=""])')) add('Кнопка-іконка без назви для читача екрана', path(el));
    });

    /* 5. місця під зображення, де нічого немає */
    R.querySelectorAll('[class]').forEach(el => { if (el.closest('svg')) return; const c = typeof el.className === 'string' ? el.className : '';
      if (!/(^|[\s_-])(img|media|logo|photo|shot|cover|pic|thumb|avatar|ic|icon|map|banner|visual|gallery)(?=$|[\s_-])/.test(c)) return;
      if (/^(IMG|PICTURE|SOURCE|VIDEO|IFRAME|CANVAS)$/.test(el.tagName) || !shown(el) || !vis(el)) return; const b = el.getBoundingClientRect(); if (b.width < 12 || b.height < 12) return;
      if (el.querySelector('img, svg, picture, video, iframe, canvas') || (el.textContent || '').trim()) return;
      const cs = w.getComputedStyle(el); if (cs.backgroundImage !== 'none') return;
      add('Місце під зображення порожнє', `${path(el)}: ${Math.round(b.width)}×${Math.round(b.height)}`); });

    /* 6. сліди збою в розмітці й тексті */
    const html = R.innerHTML;
    [...html.matchAll(/\s(?:src|href|srcset|class|style|alt|aria-label|title|value|data-[\w-]+)="[^"]*(?:\bundefined\b|\bNaN\b|\[object Object\])[^"]*"/g)].slice(0, 4).forEach(m => add('Збій у розмітці', m[0].trim().slice(0, 90)));
    const tw = d.createTreeWalker(R, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const t = n.textContent; if (!t || !/\bundefined\b|\bNaN\b|\[object Object\]|^\s*null\s*$/.test(t)) continue; const pe = n.parentElement; if (!pe || pe.closest('script, style, code, pre')) continue; add('Збій у тексті', `«${t.trim().slice(0, 50)}» у ${path(pe)}`); }

    /* 7. вбудовані рамки (карта) */
    R.querySelectorAll('iframe').forEach(i => { if (!i.getAttribute('src')) add('Рамка без адреси', path(i)); else note.push(['Зовнішній вміст, потрібен інтернет', i.getAttribute('src').split('?')[0]]); });
    return { out, note, res, ph, imgs: imgs.length, svgs: R.querySelectorAll('svg').length, bgs: urls.size };
  }

  /* ---------- вікна й панелі ---------- */
  const box0 = d => d.querySelector('#modal .modal__box');
  const OPEN = [
    ['Меню каталогу', 1440, 'index.html', (w, d) => d.querySelector('[data-mega]').click(), d => d.querySelector('#mega.is-open')],
    ['Швидкий перегляд', 1440, 'promo.html', (w, d) => d.querySelector('.js-quick').click(), box0],
    ['Мобільне меню', 390, 'index.html', (w, d) => d.querySelector('.mhead [data-drawer="menu"]').click(), d => d.querySelector('.drawer.is-open .drawer__panel')],
    ['Фільтри', 390, 'category.html?sub=' + enc('Фарби інтер’єрні'), (w, d) => d.querySelector('[data-openfilters]').click(), d => d.querySelector('.filters.is-sheet')],
    ['Ваше місто', 1440, 'index.html', (w, d) => d.querySelector('[data-modal="city"]').click(), box0],
    ['Замовити дзвінок', 1440, 'index.html', (w, d) => d.querySelector('[data-modal="callback"]').click(), box0],
    ['Поставити питання', 390, 'index.html', (w, d) => d.querySelector('[data-modal="ask"]').click(), box0],
    ['Купити в 1 клік', 390, 'product.html?id=tm12', w => w.IMB.oneClick('tm12'), box0],
    ['Додано до кошика', 1440, 'product.html?id=gs41', w => w.IMB.addToCart('gs41'), box0],
    ['Додано до кошика', 390, 'product.html?id=gs41', w => w.IMB.addToCart('gs41'), box0],
    ['Повідомити про надходження', 390, 'product.html?id=gre', (w, d) => d.querySelector('[data-notify]').click(), box0],
    ['Відгук про товар', 1440, 'product.html?id=acr', (w, d) => { d.querySelector('[data-tab="reviews"]').click(); d.querySelector('[data-review]').click(); }, box0],
    ['Питання про товар', 390, 'product.html?id=acr', (w, d) => { d.querySelector('[data-tab="qa"]').click(); d.querySelector('[data-ask]').click(); }, box0],
    ['Позначки на товарі', 1440, 'product.html?id=acr', (w, d) => d.querySelector('[data-stkinfo]').click(), box0],
    ['Фото на весь екран', 1440, 'product.html?id=acr', w => w.IMB.lightbox(w.IMB.P('acr'), 0), d => d.querySelector('#lightbox')],
    ['Фото на весь екран', 390, 'product.html?id=acr', w => w.IMB.lightbox(w.IMB.P('acr'), 0), d => d.querySelector('#lightbox')],
    ['Кошик в 1 клік', 390, 'cart.html', (w, d) => d.querySelector('[data-cart1click]').click(), box0],
    ['Підказка пошуку', 1440, 'index.html', async (w, d) => { const i = d.querySelector('.search input, input[type="search"]'); i.focus(); i.value = 'фарба'; i.dispatchEvent(new w.Event('input', { bubbles: true })); }, d => d.querySelector('.suggest, [role="listbox"]')],
  ];

  QA.assets = async function (progress) {
    const backup = localStorage.getItem('imbau_proto_v1');
    const FULL = { cart: [{ id: 'acr', pack: 2, qty: 1 }, { id: 'tm12', pack: 0, qty: 2 }, { id: 'fac', pack: 0, qty: 1 }], cmp: ['acr', 'mat', 'fac'], fav: ['sat', 'tm12'], orders: [{ id: 'IMB-1', date: '01.11.2026', items: [{ id: 'acr', pack: 2, qty: 1 }], total: 628, method: 'pickup', pay: 'store', status: 2, tracked: true }] };
    const USER = Object.assign({ user: '+38 (067) 123-45-67' }, FULL);
    const found = new Map(), notes = new Map(), lowres = new Map(), holders = new Map(); let checks = 0, imgs = 0, svgs = 0, bgs = 0;
    const put = (map, type, what, where) => { const k = type + '|' + what; if (!map.has(k)) map.set(k, { type, what, where: [] }); const a = map.get(k).where; if (!a.includes(where)) a.push(where); };
    const take = (r, where) => { checks++; imgs += r.imgs; svgs += r.svgs; bgs += r.bgs; r.out.forEach(([t, x]) => put(found, t, x, where)); r.note.forEach(([t, x]) => put(notes, t, x, where));
      r.res.forEach(([file, nat, shownW]) => { const o = lowres.get(file) || { file, px: nat, shown: 0, where: '' }; if (shownW > o.shown) { o.shown = shownW; o.where = where; } lowres.set(file, o); });
      r.ph.forEach(nm => { const o = holders.get(nm) || { name: nm, where: [] }; if (!o.where.includes(where)) o.where.push(where); holders.set(nm, o); }); };

    /* перелік сторінок: відомі стенду плюс усі товари, розділи, статті, набори, інформаційні сторінки */
    reset(FULL); const f0 = frame(1440, 900); await go(f0, 'index.html'); const I = f0.contentWindow.IMB;
    const prods = I.PRODUCTS.map(p => ({ id: p.id, name: p.name, img: p.img ? (Array.isArray(p.img) ? p.img : [p.img]) : [], state: I.state(p) }));
    const set = new Set(PAGES.map(decodeURIComponent));
    prods.forEach(p => set.add('product.html?id=' + p.id));
    I.SECTIONS.forEach(s => { set.add('section.html?s=' + s.slug); (s.subs || []).forEach(x => set.add('category.html?sub=' + (x.n || x))); });
    ['about', 'return', 'warranty', 'faq', 'discounts', 'price', 'reviews', 'certs', 'jobs', 'privacy', 'offer'].forEach(k => set.add('info.html?p=' + k));
    (I.TASKS || []).forEach(t => set.add('kit.html?t=' + t.n));
    for (let a = 1; a <= 12; a++) set.add('blog.html?a=' + a);
    ['tracking.html?o=IMB-100001', 'tinting.html?p=acr', 'sitemap.html', 'ui-kit.html', 'success.html?fail=1', 'search.html?q=tigor', 'compare.html', 'compare.html?tab=fav'].forEach(u => set.add(u));
    const pages = [...set].map(u => u.replace(/=([^&]+)/g, (m, v) => '=' + enc(decodeURIComponent(v))));
    f0.remove();
    const LOGGED = ['index.html', 'product.html?id=acr', 'product.html?id=fac', 'cart.html', 'checkout.html', 'account.html', 'account.html?tab=card', 'info.html?p=discounts', 'promo.html', 'category.html?sub=' + enc('Фарби інтер’єрні')];
    const total = pages.length * 2 + LOGGED.length * 2 + OPEN.length; let n = 0;
    const tick = () => { n++; if (progress) progress(n, total); };

    for (const vw of [1440, 390]) { const f = frame(vw, vw === 1440 ? 900 : 844), dev = vw === 1440 ? 'ПК' : 'телефон';
      reset(FULL);
      for (const u of pages) { await go(f, u); take(await scan(f), `${decodeURIComponent(u)} (${dev})`); tick(); }
      reset(USER);
      for (const u of LOGGED) { await go(f, u); take(await scan(f), `${decodeURIComponent(u)} (${dev}, увійшов)`); tick(); }
      f.remove(); }

    /* вікна й панелі */
    const opened = [];
    for (const [nm, vw, u, open, find] of OPEN) { reset(FULL); const f = frame(vw, vw === 1440 ? 900 : 844), where = `вікно «${nm}» (${vw === 1440 ? 'ПК' : 'телефон'})`;
      try { await go(f, u); await open(f.contentWindow, f.contentDocument); await sleep(350); const box = find(f.contentDocument);
        if (!box) { put(found, 'Вікно не відкрилось', nm, where); opened.push([nm, vw, false]); } else { take(await scan(f, box), where); opened.push([nm, vw, true]); } }
      catch (e) { put(found, 'Вікно не відкрилось', nm + ': ' + String(e).slice(0, 60), where); opened.push([nm, vw, false]); }
      f.remove(); tick(); }

    /* дані: файли фото всіх товарів, піктограми розділів */
    const fileOf = nm => new URL('../../assets/img/' + nm + '.webp', location.href).href;
    for (const p of prods) for (const nm of p.img) if (!(await exists(fileOf(nm)))) put(found, 'Файлу фото товару немає', nm + '.webp', p.name);
    const noPhoto = prods.filter(p => !p.img.length && p.state !== 'ended').map(p => p.name), onePhoto = prods.filter(p => p.img.length === 1).map(p => p.name);

    /* піктограма сайту і шрифти */
    const f1 = frame(1440, 900); await go(f1, 'index.html'); const d1 = f1.contentDocument;
    const ico = d1.querySelector('link[rel~="icon"]'); let favicon = 'немає';
    if (ico) favicon = (await exists(new URL(ico.getAttribute('href'), d1.baseURI).href)) ? 'є' : 'посилання є, файлу немає';
    const noIcon = []; for (const pg of [...new Set(pages.map(u => u.split('?')[0]))]) { await go(f1, pg); const l = f1.contentDocument.querySelector('link[rel~="icon"]'), a = f1.contentDocument.querySelector('link[rel="apple-touch-icon"]'); if (!l || !a || !(await exists(new URL(l.getAttribute('href'), f1.contentDocument.baseURI).href)) || !(await exists(new URL(a.getAttribute('href'), f1.contentDocument.baseURI).href))) noIcon.push(pg); }
    let fonts = {}; try { await go(f1, 'index.html'); const dd = f1.contentDocument; await dd.fonts.ready; await Promise.all([dd.fonts.load('400 16px Inter'), dd.fonts.load('600 16px Onest')]); fonts = { Inter: dd.fonts.check('400 16px Inter'), Onest: dd.fonts.check('600 16px Onest') }; } catch (e) { fonts = { error: String(e) }; }
    f1.remove();
    if (backup === null) localStorage.removeItem('imbau_proto_v1'); else localStorage.setItem('imbau_proto_v1', backup);
    /* фото, якому бракує пікселів: soft — розмите вже на звичайному екрані, retina — лише на екрані з подвійною щільністю */
    const low = [...lowres.values()].filter(o => o.shown * 2 > o.px * 1.1).map(o => Object.assign(o, { soft: o.shown > o.px * 1.02 })).sort((a, b) => b.shown / b.px - a.shown / a.px);
    return { pages: pages.length, checks, imgs, svgs, bgs, issues: [...found.values()], notes: [...notes.values()], lowres: low, holders: [...holders.values()], opened, noPhoto, onePhoto, products: prods.length, favicon, noIcon, fonts, files: [...head.entries()].filter(([u]) => /assets\/img\//.test(u)).map(([u]) => u.split('/').pop().split('?')[0]) };
  };
})();
