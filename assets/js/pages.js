/* =========================================================
   IMBAU — логіка окремих сторінок
   Кожна функція = один шаблон OpenCart (див. sitemap.html / HANDOFF.md)
   ========================================================= */
(function () {
  const IMB = window.IMB, { qs, qsa, P, esc, uah, num, url, pUrl, secUrl, catUrl, pack, state, perUnit, npReason, packshot, productCard, track, gaItem, IC, S } = IMB;
  const prm = new URLSearchParams(location.search);
  const PR = { A: 0, B: 1, C: 2 }, ST = { ok: 0, order: 1, out: 2, ended: 3 };
  const plural = n => n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'товар' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'товари' : 'товарів');
  const byDefault = (a, b) => (state(a) === 'ended') - (state(b) === 'ended') || PR[a.prio] - PR[b.prio] || ST[state(a)] - ST[state(b)] || b.sales - a.sales;
  /* Крихти. На ПК — повний шлях; на телефоні лишається один крок назад (до батьківського розділу),
     бо повний шлях займає три рядки над заголовком. */
  const crumbs = a => { const links = a.filter(Array.isArray), back = links.length ? links[links.length - 1] : ['Головна', 'index.html'];
    return `<nav class="crumbs" aria-label="Хлібні крихти"><a class="crumbs__back" href="${back[1]}">${IC.chev}<span>${back[0]}</span></a><span class="crumbs__full"><a href="index.html">Головна</a>${a.map(x => Array.isArray(x) ? `<span class="crumbs__sep" aria-hidden="true">›</span><a href="${x[1]}">${x[0]}</a>` : `<span class="crumbs__sep" aria-hidden="true">›</span><span aria-current="page">${esc(x)}</span>`).join('')}</span></nav>`; };
  /* Невідома адреса: пояснюємо й даємо вихід у каталог, а не показуємо мовчки інший товар чи розділ */
  const notFound = (h, t) => { document.title = h + ' | IMBAU'; const c = qs('main .container') || qs('main');
    c.innerHTML = `${crumbs([h])}<div class="empty" style="margin-top:24px"><h1 class="empty__title" style="font-size:28px">${h}</h1><p class="ink-2">${t}</p><div class="row row--wrap"><a class="btn btn--primary" href="catalog.html">Перейти в каталог</a><a class="btn btn--ghost" href="index.html">На головну</a></div></div><div class="section"><h2 style="margin-bottom:20px">Часто купують</h2><div class="listing grid-4" data-slot="nf"></div></div>`;
    IMB.renderList(qs('[data-slot="nf"]', c), ['tm12', 'gs41', 'fpr', 'gkl'], 'Не знайдено'); qsa('.sticky-buy').forEach(x => x.remove()); document.body.classList.remove('has-sticky'); };
  const faq = a => `<div class="acc">${a.map(([q, t]) => `<details><summary>${q}</summary><div class="acc__body">${t}</div></details>`).join('')}</div>`;
  const setTitle = (t, h1) => { document.title = t + ' | IMBAU'; const h = qs('[data-h1]'); if (h && h1) h.textContent = IMB.nb(h1); };
  /* Зображення розділу: своє фото, якщо є; інакше намальована піктограма розділу на панелі фото. */
  const secShot = (s, big) => s.img || s.icon ? packshot({ kind: s.kind, color: '#C8B48C', name: s.n, img: s.img || s.icon, eager: big ? 1 : 0 }, big) : `<span class="shot shot--ic">${IMB.secIc(s)}</span>`;
  IMB.secShot = secShot;
  const subCls = x => IMB.SUBPARENT[x] ? ' is-child' : '';
  const pl = (n, a, b, c) => { const u = n % 10, h = n % 100; return u === 1 && h !== 11 ? a : u >= 2 && u <= 4 && (h < 12 || h > 14) ? b : c; };
  /* Вікно з відео товару. yt — ідентифікатор ролика на YouTube; програвач вантажиться лише після кліку,
     тому сторінка товару не важчає. Поки роликів немає (yt порожній), вікно показує місце програвача. */
  IMB.video = (p, j) => { const v = (p.video || [])[j]; if (!v) return;
    IMB.openModal(`<h2 class="modal__title" id="modal-t">${esc(v.t)}</h2><div class="vplayer">${v.yt ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.yt)}?autoplay=1&rel=0" title="${esc(v.t)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>` : `<div class="vplayer__demo"><span class="vplayer__play">${IC.play}</span><b>Тут відтворюється відео</b><span>У прототипі роликів ще немає. На сайті тут буде програвач YouTube з роликом про цей товар.</span></div>`}</div><p class="small ink-2 vplayer__meta">${esc(p.name)} · ${v.dur}</p>`, { wide: true, nofocus: true }); };
  const tiles = secs => secs.map(s => `<a class="tile" href="${secUrl(s.n)}"><span class="tile__arrow">${IC.arrow}</span>${secShot(s, 0)}<span class="tile__name">${s.n.replace(', ', ',<br>').replace(' та ', '<br>та ')}</span></a>`).join('');
  IMB.tiles = tiles;

  /* Плитки виробників: логотип на фірмовому фоні, що постачає, скільки товарів у каталозі.
     На поточному сайті три виробники: Front, Tigor, Knauf. */
  const makersHtml = () => [['FRONT', 'brand-front.png', 120, 26, 'Фарби, ґрунтовки, емалі, декоративні штукатурки', 'brand.html?b=front'], ['TIGOR', 'brand-tigor.png', 720, 174, 'Сухі суміші, ґрунтовки, шпаклівки, піни й герметики', 'brand.html?b=tigor'],
      ['Knauf', 'brand-knauf.png', 500, 500, 'Гіпсокартон, профіль і мінеральна вата', 'category.html?sub=' + encodeURIComponent('Гіпсокартон') + '&brand=Knauf']].map(([n, img, w, h, d, href]) => { const cnt = IMB.PRODUCTS.filter(p => p.brand === n && state(p) !== 'ended').length;
      return `<a class="maker maker--${n.toLowerCase()}" href="${href}"><span class="maker__logo"><img src="assets/img/${img}" alt="${n}" width="${w}" height="${h}" loading="lazy"></span><span class="maker__text"><b>${n}</b><span>${d}</span></span><span class="maker__cnt">${plural(cnt)} ${IC.arrow}</span></a>`; }).join('');

  /* ================= ГОЛОВНА (home.twig) ================= */
  IMB.pages.home = () => {
    /* Розділи каталогу: 24 із файлу ліда. Одразу видно 12 головних (top) із зображеннями поточного сайту
       (assets/img/sec-<slug>.webp); решта 12 мають намальовану піктограму й відкриваються кнопкою під плитками. */
    const tileHtml = x => `<a class="sec-tile${x.icon ? '' : ' sec-tile--ic'}" href="${secUrl(x.n)}"><span class="sec-tile__img">${x.icon ? `<img src="assets/img/${x.icon}.webp" alt="" width="240" height="240" loading="lazy">` : IMB.secIc(x)}</span><span class="sec-tile__name">${x.n.replace('Електроінструмент', 'Електро&shy;інструмент')}</span></a>`;
    const tl = qs('[data-slot="tiles"]'), restS = IMB.SECTIONS.filter(x => !x.top), allTxt = `Показати всі ${IMB.SECTIONS.length} розділи`;
    tl.innerHTML = IMB.SECTIONS.filter(x => x.top).map(tileHtml).join('') + `<div class="sec-tiles__more" id="sec-more" hidden>${restS.map(tileHtml).join('')}</div>`;
    tl.insertAdjacentHTML('afterend', `<button type="button" class="sec-tiles__btn" aria-expanded="false" aria-controls="sec-more"><span>${allTxt}</span>${IC.down}</button>`);
    tl.nextElementSibling.addEventListener('click', e => { const b = e.currentTarget, m = qs('#sec-more'), open = m.hidden; m.hidden = !open; b.setAttribute('aria-expanded', open); qs('span', b).textContent = open ? 'Згорнути' : allTxt; });
    /* «Що плануєте зробити?»: піктограма задачі, назва і з чого складається набір */
    const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const TI = { 'Для фарбування': '<rect x="4" y="4" width="13" height="6" rx="1.5"/><path d="M17 7h3v5h-8v3M11 15h2v5h-2z"/>', 'Для штукатурки': '<path d="M4 5h16v5H4zM10 10v4h4v-4M11 14h2v6h-2z"/>', 'Для плитки': '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 4v16M4 12h16"/>',
      'Для гіпсокартону': '<path d="M3 8l9-4 9 4-9 4zM3 12l9 4 9-4M3 16l9 4 9-4"/>', 'Для утеплення': '<path d="M4 11l8-6 8 6v9H4z"/><path d="M8 14c1.3-1 2.7 1 4 0s2.7 1 4 0M8 17c1.3-1 2.7 1 4 0s2.7 1 4 0"/>', 'Для стяжки': '<rect x="3" y="9" width="18" height="6" rx="1.5"/><rect x="10" y="10.5" width="4" height="3" rx="1"/><path d="M6 12h1M17 12h1"/>' };
    const te = qs('[data-slot="tasks"]');
    if (te) te.innerHTML = IMB.TASKS.map(t => { const what = t.layers.filter(l => l.id).map(l => l.t.toLowerCase()).join(', ').replace(/^./, c => c.toUpperCase());
      return `<a class="task" href="${url('kit', { t: t.n })}"><span class="task__ic">${svg(TI[t.n] || TI['Для плитки'])}</span><span class="task__body"><b>${t.n}</b><span>${what}</span></span>${IC.arrow}</a>`; }).join('');
    /* Виробники: справжні логотипи з поточного сайту, що постачають і скільки товарів у каталозі */
    const mk = qs('[data-slot="makers"]');
    if (mk) mk.innerHTML = makersHtml();
    /* Накопичувальна картка: гостю — умови й вхід, покупцеві — його рівень */
    const cb = qs('[data-slot="cardband"]');
    if (cb) { const c = IMB.card();
      cb.innerHTML = IMB.nbp(`<div><h2>Накопичувальна картка</h2><p>${c.on ? `Ваша знижка зараз ${c.pct} %. ${c.next ? `До ${c.next.pct} % залишилось ${uah(c.left)} покупок.` : 'Це найвищий рівень.'} Ціни на сайті вже показано з нею.` : `Знижка ${c.first} % одразу після реєстрації. Далі вона росте разом із сумою ваших покупок у магазині й на сайті, до ${c.max} %.`}</p>
        <div class="card-band__act">${c.on ? '<a class="btn btn--dark" href="account.html?tab=card">Моя картка</a>' : `<a class="btn btn--primary" href="account.html?tab=card">Отримати картку</a>`}<a class="link" href="info.html?p=discounts">Умови картки</a></div></div>`) + IMB.stairs(); }
    const sets = { promo: IMB.PRODUCTS.filter(p => p.promo), hits: IMB.PRODUCTS.filter(p => p.hit), new: IMB.PRODUCTS.filter(p => p.isNew) };
    const names = { promo: 'Акції', hits: 'Хіти продажів', new: 'Новинки' };
    const draw = k => { IMB.renderList(qs('[data-slot="products"]'), sets[k].sort(byDefault).slice(0, 4).map(p => p.id), 'Головна: ' + names[k]); qsa('[data-slot="all-link"]').forEach(el => { el.innerHTML = `Усі ${names[k].toLowerCase()} ${IC.arrow}`; }); };
    qsa('[data-htab]').forEach(b => b.addEventListener('click', () => { qsa('[data-htab]').forEach(x => x.setAttribute('aria-selected', x === b)); draw(b.dataset.htab); }));
    draw('promo');

    /* Каталог ліворуч: при наведенні на розділ праворуч вилітає панель із підрозділами */
    const nav = qs('.side-cats');
    if (nav) {
      /* список біля банера: 12 головних розділів і рядок на весь каталог */
      qs('ul', nav).innerHTML = IMB.SECTIONS.filter(x => x.top).map(x => `<li><a href="${secUrl(x.n)}">${x.n}</a></li>`).join('') + `<li class="side-cats__all"><a href="catalog.html">Увесь каталог: ${IMB.SECTIONS.length} розділи</a></li>`;
      const fly = document.createElement('div'); fly.className = 'side-fly'; nav.append(fly);
      const links = qsa(':scope > ul > li > a', nav); let closeT, openT;
      const open = k => {
        /* у списку лише головні розділи, тому розділ шукаємо за адресою посилання; рядок «Увесь каталог» панелі не має */
        const s = IMB.SECTIONS.find(x => secUrl(x.n) === links[k].getAttribute('href')); if (!s) { close(); return; }
        links.forEach((a, j) => a.classList.toggle('is-active', j === k));
        fly.innerHTML = `<div class="side-fly__head"><a class="side-fly__title" href="${secUrl(s.n)}">${s.n}</a><a class="link-arrow" href="${secUrl(s.n)}">Усі товари ${IC.arrow}</a></div>
          <div class="side-fly__body"><ul class="side-fly__subs${s.subs.length > 10 ? ' side-fly__subs--long' : ''}">${s.subs.map(x => `<li><a class="${subCls(x).trim()}" href="${catUrl(x)}">${x}</a></li>`).join('')}</ul>${s.img || s.icon ? `<a class="side-fly__img" href="${secUrl(s.n)}" tabindex="-1" aria-hidden="true">${packshot({ img: s.img || s.icon, name: s.n })}</a>` : ''}</div>`;
        nav.classList.add('is-open');
      };
      const close = () => { nav.classList.remove('is-open'); links.forEach(a => a.classList.remove('is-active')); };
      links.forEach((a, k) => {
        a.addEventListener('mouseenter', () => { clearTimeout(closeT); clearTimeout(openT); openT = setTimeout(() => open(k), nav.classList.contains('is-open') ? 90 : 0); });
        a.addEventListener('mouseleave', () => clearTimeout(openT));
        a.addEventListener('focus', () => open(k));
      });
      nav.addEventListener('mouseleave', () => { clearTimeout(openT); closeT = setTimeout(close, 160); });
      nav.addEventListener('mouseenter', () => clearTimeout(closeT));
      nav.addEventListener('focusout', e => { if (!nav.contains(e.relatedTarget)) close(); });
      nav.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
  };

  /* ================= КАТАЛОГ: усі розділи ================= */
  IMB.pages.catalog = () => {
    qs('[data-slot="catalog"]').innerHTML = IMB.TREE.map(g => `<section class="catalog-group"><h2 class="catalog-group__title">${g.g}</h2><div class="grid grid-3">${g.r.map(s => `<div class="sec-card">${secShot(s, 0) /* без фото розділу беремо його зображення з плиток головної або піктограму */}<div><h3><a href="${secUrl(s.n)}">${s.n}</a></h3><ul>${s.subs.map(x => `<li><a class="${subCls(x).trim()}" href="${catUrl(x)}">${x}</a></li>`).join('')}</ul></div></div>`).join('')}</div></section>`).join('');
    qs('[data-slot="tasks"]').innerHTML = IMB.TASKS.map(t => `<a class="chip-tile" href="${url('kit', { t: t.n })}">${t.n}</a>`).join('');
  };

  /* ================= РОЗДІЛ (hub) ================= */
  IMB.pages.section = () => {
    if (prm.get('s') && !IMB.SECTIONS.some(x => x.slug === prm.get('s'))) { notFound('Розділ не знайдено', 'Такого розділу в каталозі немає. Можливо, посилання застаріло.'); return; }
    const s = IMB.SECTIONS.find(x => x.slug === prm.get('s')) || IMB.SECTIONS[0];
    setTitle(s.n + ': купити', s.n);
    qs('[data-slot="crumbs"]').innerHTML = crumbs([['Каталог', 'catalog.html'], s.n]);
    const inSec = IMB.PRODUCTS.filter(p => p.sec === s.n), cnt = n => inSec.filter(p => p.sub === n || (IMB.SUBGROUP[n] || []).includes(p.sub)).length;
    qs('[data-slot="sec-meta"]').textContent = (inSec.length ? plural(inSec.length) + ' · ' : '') + s.subs.length + ' ' + pl(s.subs.length, 'підрозділ', 'підрозділи', 'підрозділів');
    qs('[data-slot="sec-photo"]').innerHTML = secShot(s, 1);
    /* Підрозділи — текстові плитки. Однакова намальована картинка на кожній плитці нічого не повідомляла;
       фото на плитці з'явиться, коли буде своє для кожного підрозділу. */
    /* щоб в останньому ряду не лишалась одна плитка: 5, 9 чи 17 підрозділів стають у три стовпчики замість чотирьох */
    qs('[data-slot="subs"]').classList.toggle('sub-tiles--3', s.subs.length % 4 === 1 && s.subs.length % 3 !== 1);
    qs('[data-slot="subs"]').innerHTML = s.subs.map(x => `<a class="sub-tile${subCls(x)}" href="${catUrl(x)}"><span class="sub-tile__name">${x}</span>${cnt(x) ? `<span class="sub-tile__cnt">${plural(cnt(x))}</span>` : ''}${IC.arrow}</a>`).join('');
    const ids = inSec.slice().sort(byDefault).slice(0, 4).map(p => p.id);
    IMB.renderList(qs('[data-slot="products"]'), ids.length ? ids : ['tm12', 'gs41', 'acr', 'gkl'], 'Розділ: хіти');
    qs('[data-slot="seo-title"]').textContent = s.n + ': як обрати';
  };

  /* ================= КАТЕГОРІЯ + ФІЛЬТРИ + посадкова фільтра ================= */
  IMB.pages.category = () => {
    if (prm.get('sub') && !IMB.SECTIONS.some(x => x.subs.includes(prm.get('sub'))) && !IMB.PRODUCTS.some(x => x.sub === prm.get('sub'))) { notFound('Підрозділ не знайдено', 'Такого підрозділу в каталозі немає. Можливо, посилання застаріло.'); return; }
    const sub = prm.get('sub') || 'Фарби інтер’єрні', sec = (IMB.SECTIONS.find(s => s.subs.includes(sub)) || IMB.SECTIONS.find(s => s.slug === 'lfm')), par = IMB.SUBPARENT[sub], kids = IMB.SUBGROUP[sub] || [];
    /* вид товару з підвидами (наприклад «Малярний інструмент») показує товари всіх своїх підвидів */
    let base = IMB.PRODUCTS.filter(p => p.sub === sub || kids.includes(p.sub)), demoNote = '';
    if (!base.length) { base = IMB.PRODUCTS.filter(p => p.sec === sec.n); demoNote = `<div class="note" style="margin-bottom:16px">${IC.info}<span>Демо: у підрозділі «${sub}» немає демо-товарів, показано товари розділу. На бойовому сайті порожні підрозділи не показуємо.</span></div>`; }
    if (!base.length) base = IMB.PRODUCTS.slice(0, 6);
    const F = { brand: new Set(prm.getAll('brand')), use: new Set(prm.getAll('use')), pack: new Set(prm.getAll('pack')), avail: new Set(prm.getAll('avail')), min: prm.get('min') || '', max: prm.get('max') || '' };
    let sort = prm.get('sort') || 'default', shown = 6;
    const landing = F.brand.size === 1 && !F.use.size ? [...F.brand][0] : '';
    const h1 = landing ? `${sub} ${landing}` : sub;
    setTitle(`${h1}: ціна, купити з доставкою`, h1);
    qs('[data-slot="crumbs"]').innerHTML = crumbs([['Каталог', 'catalog.html'], [sec.n, secUrl(sec.n)]].concat(par ? [[par, catUrl(par)]] : []).concat(landing ? [[sub, catUrl(sub)], landing] : [sub]));
    /* чипи сусідніх видів: у виду з підвидами — його підвиди, у підвиду — сусіди й шлях назад до виду */
    qs('[data-slot="subs"]').innerHTML = (kids.length ? kids : par ? [par].concat(IMB.SUBGROUP[par]) : sec.subs.filter(x => !IMB.SUBPARENT[x])).map(x => `<a class="chip${x === sub ? ' is-on' : ''}" href="${catUrl(x)}">${x}</a>`).join('');
    const facets = {
      brand: ['Бренд', [...new Set(base.map(p => p.brand))]],
      use: ['Призначення', [...new Set(base.flatMap(p => p.use))]],
      pack: ['Фасовка', [...new Set(base.flatMap(p => p.packs.map(x => x[0])))]],
      avail: ['Наявність', ['В магазині сьогодні', 'На складі', 'Під замовлення']],
    };
    const availOf = p => [p.stock.kazka > 0 && 'В магазині сьогодні', p.stock.sklad > 0 && 'На складі', state(p) === 'order' && 'Під замовлення'].filter(Boolean);
    const match = (p, skip) => (skip === 'brand' || !F.brand.size || F.brand.has(p.brand)) && (skip === 'use' || !F.use.size || p.use.some(u => F.use.has(u))) && (skip === 'pack' || !F.pack.size || p.packs.some(x => F.pack.has(x[0]))) && (skip === 'avail' || !F.avail.size || availOf(p).some(a => F.avail.has(a))) && (!F.min || pack(p).price >= +F.min) && (!F.max || pack(p).price <= +F.max);
    const valOf = (k, p) => k === 'brand' ? [p.brand] : k === 'use' ? p.use : k === 'pack' ? p.packs.map(x => x[0]) : availOf(p);
    const fEl = qs('[data-slot="filters"]');
    const activeList = () => Object.entries(F).flatMap(([k, v]) => v instanceof Set ? [...v].map(x => [k, x, x]) : v ? [[k, v, (k === 'min' ? 'від ' : 'до ') + v + ' грн']] : []);
    const drawFilters = () => {
      const act = activeList().length;
      fEl.innerHTML = `<div class="filters__head"><b>Фільтри</b>${act ? '<button class="link small" data-unf="all">Скинути</button>' : ''}<button class="icon-btn filter-open" data-close aria-label="Закрити фільтри">${IC.close}</button></div>` + Object.entries(facets).filter(([, [, v]]) => v.length).map(([k, [t, vals]]) => `<fieldset class="filters__group"><legend class="filters__title">${t}</legend><div class="filters__opts">${vals.map(v => { const n = base.filter(p => match(p, k) && valOf(k, p).includes(v)).length; return `<label class="check${n ? '' : ' is-off'}"><input type="checkbox" data-f="${k}" value="${esc(v)}"${F[k].has(v) ? ' checked' : ''}${n || F[k].has(v) ? '' : ' disabled'}>${v}<span class="filters__cnt">${n}</span></label>`; }).join('')}</div></fieldset>`).join('') +
        `<div class="filters__group"><div class="filters__title">Ціна за упаковку, грн</div><div class="filters__price"><input class="input" data-price="min" inputmode="numeric" placeholder="від" aria-label="Ціна від" value="${F.min}"><input class="input" data-price="max" inputmode="numeric" placeholder="до" aria-label="Ціна до" value="${F.max}"></div></div>
        <div class="filters__foot filter-open">${act ? '<button class="btn btn--ghost" data-unf="all">Скинути</button>' : ''}<button class="btn btn--primary" data-close>Показати ${plural(base.filter(p => match(p)).length)}</button></div>`;
    };
    const PAGE = 6; /* у бою — 24 товари на сторінку */
    const drawList = () => {
      let list = base.filter(p => match(p));
      const sorters = { default: byDefault, cheap: (a, b) => pack(a).price - pack(b).price, dear: (a, b) => pack(b).price - pack(a).price, pop: (a, b) => b.sales - a.sales };
      list.sort(sorters[sort] || byDefault);
      const out = list.filter(p => state(p) === 'out'); list = list.filter(p => state(p) !== 'out').concat(out); /* немає в наявності завжди нижче */
      qs('[data-slot="count"]').textContent = plural(list.length);
      /* Обрані фільтри: чипи над списком. Кожен знімається окремо, поруч — «Скинути все».
         На кнопці «Фільтри» (телефон) — лічильник обраних. */
      const active = activeList();
      qs('[data-slot="active"]').innerHTML = active.length ? `<span class="applied__label">Обрано:</span>` + active.map(([k, v, t]) => `<button class="chip chip--applied" data-unf="${k}" data-v="${esc(v)}">${esc(t)}<span class="chip__x" aria-hidden="true">×</span><span class="sr-only"> — прибрати фільтр</span></button>`).join('') + '<button class="applied__reset" data-unf="all">Скинути все</button>' : '';
      qs('[data-slot="active"]').hidden = !active.length;
      const fb = qs('[data-openfilters]'); if (fb) fb.innerHTML = 'Фільтри' + (active.length ? `<span class="btn__count">${active.length}</span>` : '');
      const el = qs('[data-slot="listing"]');
      if (!list.length) { el.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty__title">За цими фільтрами товарів немає</div><p class="ink-2">Приберіть один із фільтрів або скиньте всі. Не знайшли потрібне — менеджер підбере аналог.</p><div class="row row--wrap"><button class="btn btn--dark" data-unf="all">Скинути фільтри</button><button class="btn btn--ghost" data-modal="callback">Запитати менеджера</button></div></div>`; qs('[data-slot="more"]').innerHTML = ''; return; }
      IMB.renderList(el, list.slice(0, shown).map(p => p.id), 'Категорія: ' + sub);
      /* «Показати ще»: лічильник «показано N із M», смужка прогресу і кнопка. Товари довантажуються
         в ту саму сітку, сторінка не перезавантажується і не стрибає нагору. */
      const vis = Math.min(shown, list.length), left = list.length - vis;
      qs('[data-slot="more"]').innerHTML = list.length > PAGE ? `<div class="more"><div class="more__count">Показано ${vis} із ${list.length}</div><div class="progress more__bar"><i style="width:${vis / list.length * 100}%"></i></div>${left ? `<button class="btn btn--outline btn--lg" data-more>Показати ще ${Math.min(PAGE, left)}</button>` : ''}</div>` : '';
      const u = new URLSearchParams({ sub }); F.brand.forEach(v => u.append('brand', v)); F.use.forEach(v => u.append('use', v)); F.avail.forEach(v => u.append('avail', v)); F.pack.forEach(v => u.append('pack', v)); if (F.min) u.set('min', F.min); if (F.max) u.set('max', F.max); /* фасовка й ціна теж в адресі: списком можна поділитися */ if (sort !== 'default') u.set('sort', sort);
      history.replaceState(null, '', 'category.html?' + u);
    };
    const redraw = () => { drawFilters(); drawList(); };
    fEl.addEventListener('change', e => { const c = e.target.closest('[data-f]'); if (c) { F[c.dataset.f][c.checked ? 'add' : 'delete'](c.value); shown = 6; redraw(); } const pr = e.target.closest('[data-price]'); if (pr) { F[pr.dataset.price] = pr.value.replace(/\D/g, ''); redraw(); } });
    document.addEventListener('click', e => { const u = e.target.closest('[data-unf]'); if (u) { if (u.dataset.unf === 'all') { ['brand', 'use', 'pack', 'avail'].forEach(k => F[k].clear()); F.min = F.max = ''; } else if (F[u.dataset.unf] instanceof Set) F[u.dataset.unf].delete(u.dataset.v); else F[u.dataset.unf] = ''; shown = PAGE; redraw(); } if (e.target.closest('[data-more]')) { shown += PAGE; drawList(); } if (e.target.closest('[data-openfilters]')) { fEl.classList.add('is-sheet'); document.body.style.overflow = 'hidden'; } });
    qs('[data-slot="sort"]').addEventListener('change', e => { sort = e.target.value; drawList(); });
    qs('[data-slot="sort"]').value = sort;
    qs('[data-slot="demo"]').innerHTML = demoNote;
    qs('[data-slot="seo-title"]').textContent = h1 + ': як обрати';
    const prices = base.map(p => pack(p).price);
    qs('[data-slot="seo-range"]').textContent = `У розділі ${plural(base.length)}, від ${Math.min(...prices)} до ${Math.max(...prices)} грн.`;
    redraw();
  };

  /* ================= КАРТКА ТОВАРУ (product.twig) ================= */
  IMB.pages.product = () => {
    if (prm.get('id') && !P(prm.get('id'))) { notFound('Товар не знайдено', 'Такого товару в каталозі немає. Можливо, посилання застаріло або товар зняли з продажу.'); return; }
    const p = P(prm.get('id')) || P('acr'); let k = p.sel; document.body.dataset.pid = p.id;
    const st = state(p), sec = IMB.SECTIONS.find(s => s.n === p.sec) || IMB.SECTIONS[0];
    const ended = st === 'ended';
    if (ended) setTitle(`${p.name}: поставки припинено, аналоги`, p.name); else setTitle(`${p.name}: ціна від ${pack(p, 0).price} грн`, p.byWeight ? p.name : `${p.name}, ${pack(p).label}`);
    S.seen = [p.id].concat(S.seen.filter(x => x !== p.id)).slice(0, 8); IMB.save();
    track('view_item', { ecommerce: { currency: 'UAH', value: pack(p).price, items: [gaItem(p)] } });
    qs('[data-slot="crumbs"]').innerHTML = crumbs([['Каталог', 'catalog.html'], [p.sec, secUrl(p.sec)], [p.sub, catUrl(p.sub)], p.name]);
    const brandHref = p.brand === 'FRONT' ? 'brand.html?b=front' : p.brand === 'TIGOR' ? 'brand.html?b=tigor' : 'brands.html';
    const fav = S.fav.includes(p.id), cmp = S.cmp.includes(p.id);
    const revs = IMB.REVIEWS[p.id] || [], qas = IMB.QA[p.id] || [];
    const avg = revs.length ? revs.reduce((a, r) => a + r.r, 0) / revs.length : 0, avgTxt = avg.toFixed(1).replace('.', ',');
    const revWord = n => n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'відгук' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'відгуки' : 'відгуків');
    qs('[data-slot="meta"]').innerHTML = `<span>Артикул: ${p.art}</span><a class="link" href="${brandHref}">${p.brand === 'Інші' ? 'Виробник' : p.brand}</a>${revs.length ? `<a class="pdp__rating" href="#tabs" data-tabgo="reviews">${IMB.stars(avg)}<b>${avgTxt}</b><span class="link">${revWord(revs.length)}</span></a>` : '<a class="link" href="#tabs" data-tabgo="reviews">Ще немає відгуків</a>'}<button class="row small${cmp ? ' is-on' : ''}" data-cmp="${p.id}" aria-pressed="${cmp}">${IC.cmp.replace('aria-hidden', 'style="width:18px" aria-hidden')} Порівняти</button><button class="row small${fav ? ' is-on' : ''}" data-fav="${p.id}" aria-pressed="${fav}">${(fav ? IC.heartFill : IC.heart).replace('aria-hidden', 'style="width:18px" aria-hidden')} В обране</button>`;

    /* --- Стікери ---
       На сторінці товару стоять усі стікери одним рядком. Натискання відкриває пояснення до кожного. */
    const stk = IMB.stickersOf(p), stkEl = qs('[data-slot="stickers"]');
    if (stkEl) {
      stkEl.hidden = !stk.length && !ended;
      stkEl.innerHTML = ended ? '<span class="state-ended">Поставки припинено</span>' : stk.map(x => `<button type="button" class="stk stk--${x} stk--lg" data-stkinfo>${IMB.sticker(x).replace(/^<span[^>]*>|<\/span>$/g, '')}</button>`).join('') + (stk.length ? '<button type="button" class="link small" data-stkinfo>Що означають позначки</button>' : '');
      stkEl.addEventListener('click', e => { if (!e.target.closest('[data-stkinfo]')) return;
        IMB.openModal(`<h2 class="modal__title" id="modal-t">Позначки на цьому товарі</h2><div class="stk-legend">${stk.map(x => { const d = IMB.STICKERS[x]; return `<div class="stk-legend__row">${IMB.sticker(x, 'stk--lg')}<p>${x === 'markdown' && p.markdown ? esc(p.markdown) + '. ' : ''}${d.hint}${d.href ? ` <a class="link" href="${d.href}">Докладніше</a>` : ''}</p></div>`; }).join('')}</div>`); });
    }

    /* --- Відео (18.11.2026): мініатюра в галереї, кнопка на фото і вкладка «Відео» --- */
    const vids = p.video || [];
    /* --- Галерея ---
       Одна стрічка з прив'язкою прокрутки: на ПК перемикається мініатюрами, на телефоні гортається пальцем
       (мініатюри сховані, замість них крапки). Клік по фото відкриває перегляд на весь екран. */
    const imgs = Array.isArray(p.img) ? p.img : [], n = Math.max(1, imgs.length), gal = qs('[data-slot="gallery"]');
    gal.classList.toggle('gallery--single', n < 2); gal.classList.toggle('is-ended', ended);
    gal.innerHTML = `${n > 1 ? `<div class="gallery__thumbs">${imgs.map((_, j) => `<button aria-current="${j === 0}" aria-label="Фото ${j + 1}" data-shot="${j}">${packshot(p, 0, j)}</button>`).join('')}${vids.length ? `<button class="gallery__vthumb" data-video="0" aria-label="Відео: ${esc(vids[0].t)}">${packshot(p, 0, 0)}<span class="gallery__play">${IC.play}</span></button>` : ''}</div>` : ''}
      <div class="gallery__stage"><div class="gallery__track" data-gtrack>${Array.from({ length: n }, (_, j) => imgs.length ? `<button class="gallery__slide" data-zoom="${j}" aria-label="Відкрити фото ${j + 1} на весь екран">${packshot(p, 1, j)}</button>` : `<div class="gallery__slide">${packshot(p, 1)}</div>`).join('')}</div>
        ${stk.some(x => IMB.STICKERS[x].tier === 'photo') ? `<span class="gallery__stk">${stk.filter(x => IMB.STICKERS[x].tier === 'photo').slice(0, 2).map(x => IMB.sticker(x, 'stk--lg')).join('')}</span>` : ''}
        <span class="gallery__shade" data-slot="gshade" hidden></span>
        ${vids.length ? `<button class="gallery__video" data-video="0" aria-label="Дивитись відео: ${esc(vids[0].t)}">${IC.play}<span>Відео</span></button>` : ''}
        ${imgs.length ? `<button class="gallery__zoom" data-zoom="cur" aria-label="Збільшити фото">${IC.zoom}</button>` : ''}
        ${n > 1 ? `<div class="gallery__dots" aria-hidden="true">${imgs.map((_, j) => `<i${j ? '' : ' class="is-on"'}></i>`).join('')}</div>` : ''}</div>`;
    const gtr = qs('[data-gtrack]', gal); let shot = 0;
    const markShot = () => { qsa('.gallery__thumbs button[data-shot]', gal).forEach((b, j) => b.setAttribute('aria-current', j === shot)); qsa('.gallery__dots i', gal).forEach((d, j) => d.classList.toggle('is-on', j === shot)); };
    gtr.addEventListener('scroll', () => { const j = Math.round(gtr.scrollLeft / Math.max(1, gtr.clientWidth)); if (j !== shot) { shot = j; markShot(); } }, { passive: true });
    gal.addEventListener('click', e => { const vb = e.target.closest('[data-video]'); if (vb) { IMB.video(p, +vb.dataset.video); return; } const t = e.target.closest('[data-shot]'); if (t) { shot = +t.dataset.shot; gtr.scrollTo({ left: shot * gtr.clientWidth, behavior: 'smooth' }); markShot(); return; } const z = e.target.closest('[data-zoom]'); if (z) IMB.lightbox(p, z.dataset.zoom === 'cur' ? shot : +z.dataset.zoom); });

    /* --- Блок купівлі --- */
    const buy = qs('[data-slot="buybox"]'); let shade = p.tint && (S.shades || {})[p.id] || null; /* відтінок, обраний раніше для цього товару */
    /* Відтінки для фарб, що колеруються: вісім популярних просто в картці, решта — на сторінці колерування */
    const quick = p.tint ? IMB.SHADES.map(g => g.list[1]).concat([IMB.SHADES[2].list[3], IMB.SHADES[4].list[3]]) : [];
    if (shade && !quick.some(x => x[0] === shade[0])) quick.unshift(shade);
    const drawBuy = () => {
      /* Поставки припинено: замість ціни й кнопки — пояснення і вихід на аналоги */
      if (ended) { const na = (p.analogs || []).length; buy.classList.add('buybox--ended');
        buy.innerHTML = `<div class="ended__state">Поставки припинено</div><p>Цей товар більше не постачається, тому замовити його не можна.</p>
          ${na ? `<a class="btn btn--dark btn--lg btn--block" href="#analogs">Показати аналоги: ${na}</a>` : ''}<button class="btn btn--ghost btn--block" data-modal="callback">Запитати менеджера про заміну</button>
          <p class="xs ink-2">Сторінку залишили, щоб ви могли звірити характеристики й підібрати заміну.</p>`; return; }
      const pk = pack(p, k), q = +(qs('[data-qty] input', buy) || { value: 1 }).value || 1, unit = p.step && q >= p.step[0] ? Math.min(p.step[1], pk.price) : pk.price, was = IMB.oldPrice(p, k), cd = IMB.card(), guestPrice = IMB.cut(pk.full, cd.first), kop = v => Math.round(v * 100) % 100 ? num(v) + ' грн' : uah(v); /* дешеві товари: з копійками */
      buy.dataset.pack = k; if (shade) buy.dataset.shade = shade[1]; else delete buy.dataset.shade;
      buy.innerHTML = `${p.packs.length > 1 ? `<div><div class="small ink-2" style="margin-bottom:8px">Фасовка</div><div class="packs">${p.packs.map((x, j) => `<button class="pack" data-pk="${j}" aria-pressed="${j === k}"><b>${x[0]}</b><span>${num(pack(p, j).price)} грн</span></button>`).join('')}</div></div>` : ''}
        ${p.tint ? `<div class="shade"><div class="shade__head"><span class="small ink-2">Колір</span><b>${shade ? esc(shade[1]) : 'Білий, без колерування'}</b></div>
          <div class="shade__row" role="group" aria-label="Відтінок колерування"><button class="shade__sw shade__sw--base" data-shade="" aria-pressed="${!shade}" aria-label="Білий, без колерування" title="Білий, без колерування"></button>${quick.map(([c, t]) => `<button class="shade__sw" style="--sw:${c}" data-shade="${c}|${esc(t)}" aria-pressed="${!!shade && shade[0] === c}" aria-label="${esc(t)}" title="${esc(t)}"></button>`).join('')}</div>
          <div class="shade__foot">${shade ? '<span>Заколеруємо в магазині перед видачею. Вартість колерування назве менеджер.</span>' : '<span>Оберіть відтінок, і ми заколеруємо фарбу в магазині.</span>'} <a class="link" href="tinting.html?p=${p.id}${shade ? '&c=' + encodeURIComponent(shade[0]) : ''}">Уся палітра</a></div></div>` : ''}
        ${p.markdown ? `<div class="markdown-note">${IC.tag}<span><b>Уцінка.</b> ${esc(p.markdown)}.</span></div>` : p.saleTill ? `<div class="markdown-note markdown-note--sale">${IC.tag}<span><b>Акція.</b> Ціна діє до ${p.saleTill}.</span></div>` : ''}
        <div><div class="row row--wrap" style="align-items:baseline;gap:6px 12px"><span class="buybox__price">${num(pk.price)}</span><span class="price__unit">грн / ${p.byWeight ? 'кг' : p.unit === 'шт' || p.unit === 'уп' ? p.unit + '.' : 'уп. ' + pk.label}</span>${IMB.offHtml(p, pk, true)}</div>
        <div class="small ink-2" style="margin-top:6px">${p.byWeight ? 'Продається на вагу: вкажіть, скільки кілограмів потрібно.' : perUnit(p, k)}${p.step && p.step[1] < pk.price ? ` · <b style="color:var(--c-ink)">від ${p.step[0]} шт.: ${p.step[1]} грн</b>` : ''}</div></div>
        ${st === 'out' ? '' : IMB.nbp( /* картка клієнта: гостю — ціна з карткою, покупцеві — його знижка й шлях до наступного рівня */
          pk.by === 'promo' ? `<div class="mydisc mydisc--off"><span>Накопичувальна картка з акційною ціною не сумується: діє більша знижка.</span><a class="link" href="info.html?p=discounts">Умови картки</a></div>`
          : unit < pk.price || (!cd.on && unit <= guestPrice) ? `<div class="mydisc mydisc--off"><span>Ціна від ${p.step[0]} шт. вигідніша за знижку картки, тому діє вона.</span><a class="link" href="info.html?p=discounts">Умови картки</a></div>`
          : cd.on ? `<div class="mydisc">${IC.card}<span><b>Ціна з вашою карткою, ${cd.pct} %</b> <span class="mydisc__save">економія ${kop((pk.full - unit) * q)}</span></span><a class="link" href="account.html?tab=card">${cd.next ? `До ${cd.next.pct} % залишилось ${uah(cd.left)} покупок` : 'Моя картка: найвищий рівень'}</a></div>`
          : `<div class="mydisc">${IC.card}<span><b>З карткою клієнта: ${kop(guestPrice)}</b> <span class="mydisc__save">−${cd.first} %</span></span><a class="link" href="info.html?p=discounts">Картка дає ${cd.first} % одразу і до ${cd.max} % з покупками</a></div>`)}
        <div>${st === 'ok' ? `<span class="stock">${p.stock.kazka ? `Є в магазині: ${p.stock.kazka} ${p.byWeight ? 'кг' : 'шт.'}` : 'На складі, самовивіз завтра'}</span>` : st === 'order' ? '<span class="stock stock--order">Під замовлення: 3–5 днів</span>' : '<span class="stock stock--out">Немає в наявності</span>'}</div>
        ${st === 'out' ? `<button class="btn btn--dark btn--lg btn--block" data-notify="${p.id}">Повідомити про надходження</button><p class="small ink-2">Схожі товари в наявності — нижче.</p>` : `
        <div class="buybox__row">${IMB.qtyCtl(q, '', p.byWeight ? 'кг' : '')}<button class="btn btn--primary btn--lg" data-add="${p.id}">До кошика</button></div>
        <div class="buybox__total">Разом: <b>${uah(unit * q)}</b> · ${num(pk.kg * q)} кг${p.step && q >= p.step[0] && unit < pk.price ? ' · діє ціна від ' + p.step[0] + ' шт.' : ''}</div>
        ${p.stock.kazka > 0 && q > p.stock.kazka ? `<div class="stock-note">У магазині ${p.stock.kazka} ${p.byWeight ? 'кг' : 'шт.'} Решту привеземо зі складу: самовивіз завтра.</div>` : ''}
        <div class="grid grid-2" style="gap:8px"><button class="btn btn--ghost" data-oneclick="${p.id}">Купити в 1 клік</button><button class="btn btn--ghost" data-modal="callback">Ціна на обсяг</button></div>`}`;
      qsa('[data-pk]', buy).forEach(b => b.addEventListener('click', () => { k = +b.dataset.pk; drawBuy(); drawSide(); drawSticky(); }));
      qsa('[data-shade]', buy).forEach(b => b.addEventListener('click', () => { shade = b.dataset.shade ? b.dataset.shade.split('|') : null; S.shades = S.shades || {}; if (shade) S.shades[p.id] = shade; else delete S.shades[p.id]; IMB.save(); const g = qs('[data-slot="gshade"]'); g.hidden = !shade; if (shade) g.innerHTML = `<i style="background:${shade[0]}"></i>${esc(shade[1])}`; drawBuy(); const s2 = qs('.sticky-buy'); if (s2) { if (shade) s2.dataset.shade = shade[1]; else delete s2.dataset.shade; } qs(`[data-shade="${b.dataset.shade}"]`, buy).focus(); }));
      const inp = qs('[data-qty] input', buy); if (inp) inp.addEventListener('change', drawBuy);
      drawSticky();
    };
    const side = qs('[data-slot="side"]');
    const drawSide = () => {
      if (ended) { side.hidden = true; return; }
      const r = npReason(p, k), when = IMB.pickupWhen(p), kh = IMB.isLocal(S.city);
      side.innerHTML = `<div class="shipbox"><div class="shipbox__city"><b>Отримання</b><button class="link" data-modal="city">${esc(S.city)}</button></div>
        <div class="ship-line${kh ? '' : ' is-off'}">${IC.store}<span><b>Самовивіз</b>, ${IMB.STORE.name}<br><span class="ink-2">${kh ? when + ', резерв 3 дні' : 'лише в Харкові'}</span></span><b>${kh ? '0 грн' : '—'}</b></div>
        <div class="ship-line${kh ? '' : ' is-off'}">${IC.truck}<span><b>Наша машина</b> по Харкову<br><span class="ink-2">${kh ? 'завтра або в зручний день' : 'лише Харків і область'}</span></span><b>${kh ? 'від 450 грн' : '—'}</b></div>
        <div class="ship-line${r ? ' is-off' : ''}">${IC.box}<span><b>Нова пошта, Укрпошта</b>${r ? `<br><span style="color:var(--c-warn)">Не відправляємо: ${r}</span>` : '<br><span class="ink-2">по Україні, платить покупець</span>'}</span><b>${r ? '—' : 'за тарифом'}</b></div>
        <div class="store-stock small"><b>Наявність по точках</b><div><span>${IMB.STORE.name}</span><span>${p.stock.kazka ? p.stock.kazka + (p.byWeight ? ' кг' : ' шт.') : '—'}</span></div><div><span>Склад у Харкові</span><span>${p.stock.sklad ? p.stock.sklad + (p.byWeight ? ' кг' : ' шт.') : '—'}</span></div></div>
        <div class="small ink-2">Машина привозить до під’їзду або воріт. Оплата: онлайн, карткою, готівкою, рахунок, єВідновлення. <a class="link" href="delivery.html">Умови</a></div></div>`;
    };
    const calcEl = qs('[data-slot="calc"]'); if (p.calc && !ended) { calcEl.innerHTML = calcBox(p); bindCalc(calcEl, p); } else calcEl.hidden = true;
    const sticky = qs('[data-slot="sticky"]');
    const drawSticky = () => { if (ended) { sticky.innerHTML = (p.analogs || []).length ? `<a class="btn btn--dark" href="#analogs">Показати аналоги</a>` : `<button class="btn btn--dark" data-modal="callback">Запитати менеджера</button>`; } else if (st === 'out') { sticky.innerHTML = `<button class="btn btn--dark" data-notify="${p.id}">Повідомити про надходження</button>`; } else { const q = +(qs('[data-qty] input', buy) || { value: 1 }).value || 1, unit = p.step && q >= p.step[0] ? Math.min(p.step[1], pack(p, k).price) : pack(p, k).price; sticky.dataset.pack = k; sticky.dataset.qty = q;
      sticky.innerHTML = `<div><div class="sticky-buy__price">${uah(unit * q)}</div><div class="xs ink-2">${p.byWeight ? q + ' кг' : pack(p, k).label + (q > 1 ? ' × ' + q : '')}</div></div><button class="btn btn--primary" data-add="${p.id}">До кошика</button><button class="icon-btn" data-oneclick="${p.id}" aria-label="Купити в 1 клік">${IC.phone}</button>`; } document.body.classList.add('has-sticky'); };
    drawBuy(); drawSide(); drawSticky();
    if (shade) { const g = qs('[data-slot="gshade"]'); if (g) { g.hidden = false; g.innerHTML = `<i style="background:${shade[0]}"></i>${esc(shade[1])}`; } const s2 = qs('.sticky-buy'); if (s2) s2.dataset.shade = shade[1]; }

    const rateTxt = p.rateLabel || (p.calc ? (p.calc.type === 'cover' ? `${p.calc.rate} м²/${p.unit}` : p.calc.type === 'mass' ? `${p.calc.rate} кг/м²${p.calc.mm ? ' при шарі ' + p.calc.mm + ' мм' : ''}` : `${p.calc.per} м²/лист`) : '—');
    qs('[data-slot="facts"]').innerHTML = [['Витрата', rateTxt], ['Основа', p.base || '—'], ['Висихання', p.dry || '—'], [p.water ? 'Вода' : 'Фасовка', p.water || p.packs.map(x => x[0]).join(' · ')]].map(([a, b]) => `<div class="fact"><span>${a}</span><b>${b}</b></div>`).join('');

    /* --- Аналоги (лише для товару зі станом «Поставки припинено») ---
       Перший у переліку — найближча заміна. У кожного аналога одне речення, чим він схожий або відрізняється,
       і ті самі характеристики, що в знятого товару: збіг позначено. */
    const anEl = qs('[data-slot="analogs"]'), ans = ended ? (p.analogs || []).map(([id, note]) => ({ a: P(id), note })).filter(x => x.a && state(x.a) !== 'ended') : [];
    if (anEl && ans.length) {
      const rows = [['Основа', 'base'], ['Фініш', 'finish'], ['Висихання', 'dry']];
      anEl.hidden = false;
      anEl.innerHTML = `<div class="section-head"><h2>Аналоги</h2><span class="section-head__note">Чим замінити товар, якого більше не постачають</span></div>
        <div class="analogs">${ans.map(({ a, note }, j) => `<article class="analog" data-buy data-pack="${a.sel}">
          <a class="analog__media" href="${pUrl(a)}">${packshot(a)}</a>
          <div class="analog__body">${j === 0 ? '<span class="analog__best">Найближча заміна</span>' : ''}<div class="pcard__brand">${a.brand}</div><a class="analog__name" href="${pUrl(a)}">${esc(a.name)}</a><p class="analog__note">${esc(note)}</p></div>
          <dl class="analog__spec">${rows.map(([t, f]) => `<div class="${a[f] && a[f] === p[f] ? 'is-same' : ''}"><dt>${t}</dt><dd>${a[f] || '—'}${a[f] && a[f] === p[f] ? `<span class="analog__same">${IC.check}так само</span>` : ''}</dd></div>`).join('')}<div><dt>Фасовка</dt><dd>${a.packs.map(x => x[0]).join(' · ')}</dd></div></dl>
          <div class="analog__buy"><div class="price"><span class="price__val">${num(pack(a).price)}</span><span class="price__unit">грн / уп. ${pack(a).label}</span></div><span class="stock${state(a) === 'ok' ? '' : ' stock--order'}">${state(a) === 'ok' ? 'В наявності' : 'Під замовлення'}</span><button class="btn btn--primary" data-add="${a.id}">До кошика</button></div>
        </article>`).join('')}</div>`;
    }

    const rel = (IMB.RELATED[p.id] || []).map(P).filter(Boolean);
    qs('[data-slot="need"]').innerHTML = rel.length ? `<div class="section-head"><h2>Що ще потрібно для цієї роботи</h2><button class="btn btn--dark" data-addall>Додати все до кошика</button></div><div class="need-list">${rel.map(r => `<div class="need">${packshot(r)}<a class="need__name" href="${pUrl(r)}">${esc(r.name)}<br><span class="xs ink-2">${pack(r).label} · ${state(r) === 'ok' ? 'в наявності' : 'під замовлення'}</span></a><b class="need__price">${uah(pack(r).price)}</b><button class="btn btn--ghost btn--sm" data-add="${r.id}" data-silent="1">+ Додати</button></div>`).join('')}</div>` : '';
    const aa = qs('[data-addall]'); if (aa) aa.addEventListener('click', () => { rel.forEach(r => IMB.addToCart(r.id, null, 1, true)); IMB.toast(`Додано ${rel.length} товари · <a href="cart.html">У кошик</a>`); aa.textContent = 'Додано ✓'; aa.disabled = true; });

    /* --- Вкладки --- */
    const tabs = [['desc', 'Опис'], ['spec', 'Характеристики'], ['rate', 'Витрата'], ...(vids.length ? [['video', `Відео${vids.length > 1 ? ' (' + vids.length + ')' : ''}`]] : []), ['docs', 'Документи'], ['reviews', `Відгуки${revs.length ? ' (' + revs.length + ')' : ''}`], ['qa', `Питання${qas.length ? ' (' + qas.length + ')' : ''}`]];
    /* Відгуки: зліва підсумок (середня оцінка, розподіл за зірками, кнопка), справа — самі відгуки.
       Питання: запитання покупця і відповідь технолога одним блоком. */
    const reviewsHtml = revs.length ? `<div class="reviews"><aside class="reviews__sum"><div class="reviews__avg">${avgTxt}</div>${IMB.stars(avg, 'stars--lg')}<div class="small ink-2">${revWord(revs.length)}</div>
        <div class="rbars">${[5, 4, 3, 2, 1].map(v => { const c = revs.filter(r => r.r === v).length; return `<div class="rbar"><span>${v}</span><i><b style="width:${c / revs.length * 100}%"></b></i><span>${c}</span></div>`; }).join('')}</div>
        <button class="btn btn--dark btn--block" data-review>Написати відгук</button><p class="xs muted">Демо-відгуки: показують, як виглядає заповнений блок.</p></aside>
        <div class="reviews__list">${revs.map(r => `<article class="review"><header class="review__head"><span class="review__ava" aria-hidden="true">${esc(r.n[0])}</span><span><b>${esc(r.n)}</b><span class="review__who">${esc(r.who)}</span></span>${IMB.stars(r.r)}<time>${r.d}</time></header><div class="xs ink-2">Купував: ${esc(r.pack)}</div><p>${esc(r.t)}</p>${r.ans ? `<div class="review__ans"><b>Відповідь IMBAU</b><p>${esc(r.ans)}</p></div>` : ''}</article>`).join('')}</div></div>`
      : `<div class="empty"><div class="empty__title">Відгуків ще немає</div><p class="ink-2">Купували цей товар? Розкажіть, як він показав себе в роботі — це допоможе іншим покупцям.</p><button class="btn btn--dark" data-review>Написати відгук</button></div>`;
    const qaHtml = qas.length ? `<div class="qa"><div class="qa__list">${qas.map(x => `<article class="qa__item"><h3 class="qa__q">${esc(x.q)}</h3><div class="qa__a"><b>Технолог IMBAU</b> <time>${x.d}</time><p>${esc(x.a)}</p></div></article>`).join('')}</div><aside class="qa__ask"><b>Не знайшли відповіді?</b><p class="small ink-2">Запитайте — відповість технолог або менеджер магазину.</p><button class="btn btn--dark btn--block" data-ask>Поставити питання</button></aside></div>`
      : `<div class="empty"><div class="empty__title">Поставте питання про товар</div><p class="ink-2">Відповість технолог або менеджер магазину. Відповіді з’являться тут.</p><button class="btn btn--dark" data-ask>Запитати</button></div>`;
    const body = {
      desc: p.about ? `<div class="prose">${p.about.map(t => `<p>${t}</p>`).join('')}</div>` : `<div class="prose"><p><b>Для чого:</b> ${p.use.length ? p.use.join(', ').toLowerCase() : 'ремонтні та оздоблювальні роботи'}. ${p.base ? 'Основа — ' + p.base.toLowerCase() + '.' : ''}</p><p><b>Де не застосовувати:</b> текст від технолога ${p.brand} — заповнює контент-менеджер з техлиста.</p><p>Опис унікальний для IMBAU: як обрати, чим відрізняється від схожих, поради з підготовки основи.</p></div>`,
      spec: `<table class="spec"><tbody>${[['Бренд', p.brand], ['Артикул', p.art], ['Фасовка', p.packs.map(x => x[0]).join(', ')], ['Вага нетто', pack(p, k).kg + ' кг'], ['Основа', p.base || '—'], ['Розчинник', p.solvent], ['Щільність', p.density], ['Час висихання', p.dry || '—'], ['Фініш', p.finish || '—'], ['Призначення', p.use.join(', ') || '—'], ['Колерування', p.tint ? 'так, у магазині' : 'ні'], ['Термін зберігання', p.shelf]].filter(x => x[1]).map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table>`,
      rate: `<div class="prose"><p>${p.calc ? `Норма витрати: <b>${rateTxt}</b>. Фактична витрата залежить від основи і способу нанесення.` : 'Витрату уточнить менеджер.'}</p><p>Скористайтеся калькулятором під фото — він порахує кількість упаковок і додасть їх у кошик.</p></div>`,
      docs: `<div class="stack">${['Технічний лист (PDF)', 'Сертифікат відповідності (PDF)', 'Інструкція з нанесення (PDF)'].map(t => `<a class="doc-link" href="#">${IC.doc}<span>${t}</span></a>`).join('')}</div>`,
      video: `<div class="pvideos">${vids.map((v, j) => `<button type="button" class="pvideo" data-video="${j}"><span class="pvideo__poster">${packshot(p, 0, 0)}<span class="pvideo__play">${IC.play}</span><span class="pvideo__dur">${v.dur}</span></span><b>${esc(v.t)}</b></button>`).join('')}</div>`,
      reviews: reviewsHtml, qa: qaHtml,
    };
    const tb = qs('[data-slot="tabs"]');
    const drawTab = id => { tb.innerHTML = `<div class="ptabs__bar" role="tablist">${tabs.map(([t, n]) => `<button role="tab" data-tab="${t}" aria-selected="${t === id}">${n}</button>`).join('')}</div><div class="ptabs__panel" role="tabpanel">${body[id]}</div>`; };
    tb.addEventListener('click', e => {
      const b = e.target.closest('[data-tab]'); if (b) drawTab(b.dataset.tab);
      const vb = e.target.closest('[data-video]'); if (vb) IMB.video(p, +vb.dataset.video);
      if (e.target.closest('[data-review]')) IMB.openModal(`<h2 class="modal__title" id="modal-t">Відгук про товар</h2><p class="ink-2" style="margin-bottom:16px">${esc(p.name)}</p><form class="stack" data-form="review"><fieldset class="rate-pick"><legend class="field__label">Ваша оцінка</legend>${[5, 4, 3, 2, 1].map(v => `<label><input type="radio" name="rate" value="${v}"${v === 5 ? ' checked' : ''}><span aria-hidden="true">★</span><span class="sr-only">${v} з 5</span></label>`).join('')}</fieldset><div class="field"><label class="field__label" for="rv-n">Ім’я</label><input class="input" id="rv-n" autocomplete="given-name"></div><div class="field"><label class="field__label" for="rv-t">Як товар показав себе в роботі</label><textarea class="input textarea" id="rv-t" rows="4" placeholder="Для чого використовували, скільки шарів, чи вистачило"></textarea></div><button class="btn btn--primary btn--block btn--lg">Надіслати відгук</button></form>`);
      if (e.target.closest('[data-ask]')) IMB.openModal(`<h2 class="modal__title" id="modal-t">Питання про товар</h2><p class="ink-2" style="margin-bottom:16px">${esc(p.name)}</p><form class="stack" data-form="ask"><div class="field"><label class="field__label" for="qa-t">Ваше питання</label><textarea class="input textarea" id="qa-t" rows="4" placeholder="Наприклад: чи підійде для ванної кімнати?"></textarea></div>${IMB.phoneField('qa-ph', 'Телефон — повідомимо про відповідь')}<button class="btn btn--primary btn--block btn--lg">Надіслати питання</button></form>`);
    });
    IMB.onForm = kind => { const m = { review: ['Дякуємо за відгук', 'Він з’явиться на сторінці після перевірки модератором.'], ask: ['Питання надіслано', 'Відповідь з’явиться на сторінці товару, а ми напишемо вам у Viber або SMS.'] }[kind]; if (m) IMB.openModal(`<div class="result__icon">${IC.check}</div><h2 class="modal__title" id="modal-t" style="margin-top:16px">${m[0]}</h2><p class="ink-2">${m[1]}</p><button class="btn btn--dark" style="margin-top:20px" data-close>Добре</button>`); };
    document.addEventListener('click', e => { const g = e.target.closest('[data-tabgo]'); if (g) drawTab(g.dataset.tabgo); });
    drawTab('desc');
    IMB.renderList(qs('[data-slot="similar"]'), IMB.PRODUCTS.filter(x => state(x) !== 'ended' && (x.sub === p.sub && x.id !== p.id || x.sec === p.sec && x.id !== p.id)).sort(byDefault).slice(0, 4).map(x => x.id), 'Картка: схожі');
    const seen = S.seen.filter(x => x !== p.id).slice(0, 4);
    if (seen.length) { qs('[data-slot="seen-wrap"]').hidden = false; IMB.renderList(qs('[data-slot="seen"]'), seen, 'Картка: переглянуті'); }
  };

  /* Калькулятор витрати (модуль «Калькулятор расхода», після запуску — заклали в макет) */
  function calcBox(p) {
    const c = p.calc;
    return `<div class="calc" data-calc><b>Скільки потрібно?</b>
      <div class="calc__row"><div class="field"><label class="field__label" for="c-area">Площа, м²</label><input class="input" id="c-area" inputmode="decimal" value="20"></div>
      ${c.type === 'cover' ? `<div class="field"><label class="field__label" for="c-l">Шарів</label><select class="select" id="c-l"><option>1</option><option selected>2</option><option>3</option></select></div>` : c.type === 'mass' && c.mm ? `<div class="field"><label class="field__label" for="c-mm">Шар, мм</label><input class="input" id="c-mm" inputmode="decimal" value="${c.mm}"></div>` : '<div></div>'}</div>
      <div class="calc__res" data-calcres></div></div>`;
  }
  function bindCalc(root, p) {
    const box = qs('[data-calc]', root); if (!box) return;
    const run = () => {
      const c = p.calc, a = parseFloat((qs('#c-area', box).value || '0').replace(',', '.')) || 0, pk = pack(p);
      let need; if (c.type === 'cover') need = a * (+qs('#c-l', box).value) / c.rate; else if (c.type === 'mass') need = a * c.rate * (c.mm ? (parseFloat((qs('#c-mm', box).value || '0').replace(',', '.')) || 0) / c.mm : 1); else need = a / c.per;
      if (!(a > 0) || !(need > 0)) { qs('[data-calcres]', box).innerHTML = '<span class="ink-2">Вкажіть площу більшу за нуль: порахуємо, скільки упаковок потрібно.</span>'; return; }
      const n = Math.max(1, Math.ceil(need / pk.base));
      qs('[data-calcres]', box).innerHTML = `Потрібно ≈ ${num(need)} ${c.type === 'area' ? 'листів' : p.unit} → <b>${n} уп. × ${pk.label} = ${uah(n * pk.price)}</b><button class="btn btn--dark btn--block" style="margin-top:10px" data-calcadd="${n}">Додати ${n} уп. до кошика</button>`;
    };
    box.addEventListener('input', run); box.addEventListener('change', run);
    box.addEventListener('click', e => { const b = e.target.closest('[data-calcadd]'); if (b) IMB.addToCart(p.id, p.sel, +b.dataset.calcadd); });
    run();
  }
  IMB.calcBox = calcBox; IMB.bindCalc = bindCalc;

  /* ================= ПОШУК ================= */
  IMB.pages.search = () => {
    const q = prm.get('q') || ''; const res = IMB.search(q);
    setTitle('Пошук: ' + q, q ? `Результати за «${q}»` : 'Пошук');
    qsa('.search__input').forEach(i => { i.value = q; });
    qs('[data-slot="count"]').textContent = q ? `Знайдено ${res.length}` : '';
    if (res.length) IMB.renderList(qs('[data-slot="listing"]'), res.map(p => p.id), 'Пошук');
    else qs('[data-slot="listing"]').innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty__title">${q ? `За запитом «${esc(q)}» нічого не знайшли` : 'Введіть назву, бренд або артикул'}</div><p class="ink-2">Перевірте написання — шукаємо українською і російською. Спробуйте простіше слово або оберіть розділ.</p><div class="chips">${IMB.POPULAR.map(x => `<a class="chip" href="search.html?q=${encodeURIComponent(x)}">${x}</a>`).join('')}</div><button class="btn btn--dark" data-modal="callback">Менеджер підбере товар</button></div>`;
  };

  /* ================= КОШИК ================= */
  IMB.pages.cart = () => {
    const root = qs('[data-slot="cart"]'), bar = qs('[data-slot="cartbar"]');
    /* Телефон: сума і «Оформити» закріплені внизу, поки справжня кнопка в підсумку не з'явилася на екрані */
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => bar && bar.classList.toggle('is-away', en.isIntersecting)), { rootMargin: '0px 0px -72px 0px' }) : null;
    const drawBar = t => { if (!bar) return; if (io) io.disconnect(); if (!t.lines.length) { bar.innerHTML = ''; document.body.classList.remove('has-sticky'); return; }
      bar.innerHTML = `<div><div class="sticky-buy__price">${uah(t.total)}</div><div class="xs ink-2">${IMB.cartCount()} шт. · ${num(t.kg)} кг</div></div><a class="btn btn--primary" href="checkout.html">Оформити замовлення</a>`;
      document.body.classList.add('has-sticky'); const cta = qs('.summary .btn--primary', root); if (io && cta) io.observe(cta); };
    const draw = () => {
      const t = IMB.cartTotals(); const cd = IMB.card(), after = IMB.cardAt(cd.spent + t.total); drawBar(t);
      if (!t.lines.length) { root.innerHTML = `<div class="empty"><div class="empty__title">Кошик порожній</div><p class="ink-2">Почніть із розділу або скористайтеся пошуком. Список матеріалів можна надіслати нам — порахуємо й зберемо.</p><div class="row row--wrap"><a class="btn btn--primary" href="catalog.html">Перейти в каталог</a><a class="btn btn--ghost" href="podbor.html">Надіслати список</a></div></div><div class="section"><h2 style="margin-bottom:20px">Часто купують</h2><div class="listing grid-4" data-slot="pop"></div></div>`; IMB.renderList(qs('[data-slot="pop"]'), ['tm12', 'gs41', 'acr', 'gkl'], 'Кошик: порожній'); return; }
      track('view_cart', { ecommerce: { currency: 'UAH', value: t.total, items: t.lines.map(l => gaItem(l.p, l.pack, l.qty)) } });
      const rel = [...new Set(t.lines.flatMap(l => IMB.RELATED[l.id] || []))].filter(id => !S.cart.some(c => c.id === id)).slice(0, 3).map(P);
      root.innerHTML = `<div class="cart-layout"><div>
        <div class="cart-items">${t.lines.map((l, j) => `<div class="citem">${packshot(l.p)}<div><a class="citem__name" href="${pUrl(l.p)}">${esc(l.p.name)}</a><div class="citem__meta">${l.pk.label} · ${num(l.kg)} кг · ${IMB.pickupWhen(l.p) === 'сьогодні' ? 'самовивіз сьогодні' : 'самовивіз ' + IMB.pickupWhen(l.p)}${l.unitPrice < l.pk.price ? ` · <b style="color:var(--c-green)">ціна від ${l.p.step[0]} шт.</b>` : ''}${l.shade ? ` · колір: ${esc(l.shade)}` : ''}</div></div>
          <div class="qty qty--sm" data-cartq="${j}"><button data-cq="-1" aria-label="Менше">−</button><input value="${l.qty}" inputmode="numeric" aria-label="Кількість"><button data-cq="1" aria-label="Більше">+</button></div>
          <div class="citem__sum">${l.full > l.sum ? `<s class="price__old" aria-label="Без картки ${uah(l.full)}">${uah(l.full)}</s>` : ''}${uah(l.sum)}</div><button class="citem__del" data-del="${j}" aria-label="Видалити">${IC.trash}</button></div>`).join('')}</div>
        ${t.np.length ? `<div class="note note--warn" style="margin-top:16px">${IC.warn}<span><b>Новою поштою й Укрпоштою це замовлення не поїде:</b> ${t.np.map(esc).join('; ')}. Доступно: самовивіз у ${IMB.STORE.name} і наша машина по Харкову.</span></div>` : `<div class="note" style="margin-top:16px">${IC.check}<span>Усі товари можна відправити Новою поштою або Укрпоштою.</span></div>`}
        ${rel.length ? `<h2 style="margin:32px 0 12px;font-size:var(--fs-h3)">Не забудьте для роботи</h2><div class="need-list">${rel.map(r => `<div class="need">${packshot(r)}<a class="need__name" href="${pUrl(r)}">${esc(r.name)}</a><b class="need__price">${uah(pack(r).price)}</b><button class="btn btn--ghost btn--sm" data-add="${r.id}" data-silent="1">+ Додати</button></div>`).join('')}</div>` : ''}
      </div>
      <aside class="summary"><b style="font-size:18px">Ваше замовлення</b>
        <div class="summary__line"><span>Товари, ${IMB.cartCount()} шт.</span><span>${uah(t.sub + t.card)}</span></div>
        ${t.card ? `<div class="summary__line" style="color:var(--c-green)"><span>Картка клієнта, ${cd.pct}\u00A0%</span><span>−${uah(t.card)}</span></div>` : ''}
        ${t.disc ? `<div class="summary__line" style="color:var(--c-green)"><span>Промокод ${S.promo.code}</span><span>−${uah(t.disc)}</span></div>` : ''}
        <div class="summary__line"><span>Вага</span><span>${num(t.kg)} кг</span></div>
        <div class="summary__line"><span>Доставка</span><span class="ink-2">на наступному кроці</span></div>
        ${t.gift ? `<div class="summary__line" style="color:var(--c-green)"><span>Сертифікат ${esc(S.gift.code)}</span><span>−${uah(t.gift)}</span></div>` : ''}
        <!-- Одне поле для промокоду і номера подарункового сертифіката (схема ліда). Демо: BAU5 і ${IMB.GIFT.demo.code} -->
        <div class="promo-box"><label class="small ink-2" for="cart-code">Є промокод або подарунковий сертифікат?</label>
          <form class="promo-row" data-promo><input class="input" id="cart-code" placeholder="Код або номер сертифіката" value="${S.gift ? esc(S.gift.code) : S.promo ? S.promo.code : ''}"><button class="btn btn--ghost">Застосувати</button></form></div>
        <div class="cart-disc">${IC.card}<span>${IMB.nbp(cd.on ? `Картка клієнта, ${cd.pct} %. ${!cd.next ? 'Це найвищий рівень.' : after.pct > cd.pct ? `Після цієї покупки знижка стане ${after.pct} %.` : `Після цієї покупки до ${cd.next.pct} % залишиться ${uah(after.left)}.`} <a class="link" href="account.html?tab=card">Моя картка</a>` : t.ifCard ? `З карткою клієнта це замовлення дешевше на ${uah(t.ifCard)}. <a class="link" href="account.html?back=cart">Увійти й отримати ${cd.first} %</a>` : `Картка клієнта дає ${cd.first} % одразу після реєстрації. <a class="link" href="info.html?p=discounts">Умови картки</a>`)}</span></div>
        <div class="summary__total"><span>Разом</span><b>${uah(t.total)}</b></div>
        <a class="btn btn--primary btn--lg btn--block" href="checkout.html">Оформити замовлення</a>
        <button class="btn btn--ghost btn--block" data-cart1click>Замовити в 1 клік</button>
        <div class="row row--between small"><a class="link" href="catalog.html">Продовжити покупки</a><button class="link" data-share>Поділитися кошиком</button></div>
      </aside></div>`;
    };
    root.addEventListener('click', e => {
      const c = e.target.closest('[data-cq]'); if (c) { const j = +c.closest('[data-cartq]').dataset.cartq; S.cart[j].qty = Math.max(1, S.cart[j].qty + +c.dataset.cq); IMB.save(); draw(); }
      const d = e.target.closest('[data-del]'); if (d) { const it = S.cart.splice(+d.dataset.del, 1)[0]; IMB.save(); track('remove_from_cart', { ecommerce: { items: [gaItem(P(it.id), it.pack, it.qty)] } }); IMB.toast('Товар видалено'); draw(); }
      if (e.target.closest('[data-cart1click]')) IMB.openModal(`<h2 class="modal__title" id="modal-t">Замовити в 1 клік</h2><p class="ink-2" style="margin-bottom:16px">Увесь кошик на ${uah(IMB.cartTotals().total)}. Менеджер передзвонить і уточнить отримання.</p><form class="stack" data-form="oneclick" data-id="${S.cart[0].id}">${IMB.phoneField('oc2')}<button class="btn btn--primary btn--block btn--lg">Замовити</button></form>`);
      if (e.target.closest('[data-share]')) { const link = location.origin + location.pathname + '?items=' + S.cart.map(x => `${x.id}:${x.pack}:${x.qty}`).join(','); try { navigator.clipboard.writeText(link); } catch (er) {} IMB.toast('Посилання на кошик скопійовано'); }
    });
    root.addEventListener('change', e => { const w = e.target.closest('[data-cartq]'); if (w) { S.cart[+w.dataset.cartq].qty = Math.max(1, +e.target.value || 1); IMB.save(); draw(); } });
    root.addEventListener('submit', e => {
      if (e.target.matches('[data-promo]')) { e.preventDefault(); const v = qs('input', e.target).value.trim().toUpperCase(), g = IMB.GIFT.demo; if (v === 'BAU5') { S.promo = { code: v, pct: 5 }; IMB.toast('Промокод застосовано: −5%'); } else if (v === g.code) { S.gift = { code: g.code, sum: g.sum }; IMB.toast('Сертифікат застосовано: −' + uah(g.sum)); } else { S.promo = null; S.gift = null; IMB.toast(v ? 'Такого промокоду чи сертифіката немає' : 'Промокод і сертифікат прибрано'); } IMB.save(); draw(); } });
    const shared = prm.get('items'); if (shared) { shared.split(',').forEach(s => { const [id, pk, q] = s.split(':'); if (P(id) && !S.cart.some(c => c.id === id)) S.cart.push({ id, pack: +pk, qty: +q }); }); IMB.save(); history.replaceState(null, '', 'cart.html'); }
    draw();
  };

  /* ================= ОФОРМЛЕННЯ (checkout.twig) ================= */
  IMB.pages.checkout = () => {
    const t0 = IMB.cartTotals(); const root = qs('[data-slot="checkout"]');
    if (!t0.lines.length) { root.innerHTML = `<div class="empty"><div class="empty__title">У кошику немає товарів</div><p class="ink-2">Додайте товари, щоб оформити замовлення.</p><a class="btn btn--primary" href="catalog.html">До каталогу</a></div>`; return; }
    track('begin_checkout', { ecommerce: { currency: 'UAH', value: t0.total, items: t0.lines.map(l => gaItem(l.p, l.pack, l.qty)) } });
    const O = { city: S.city, method: IMB.isLocal(S.city) ? 'pickup' : (t0.np.length ? '' : 'np'), pay: 'online', company: false };
    const methods = () => { const kh = IMB.isLocal(O.city), np = !IMB.cartTotals().np.length; return [
      { id: 'pickup', t: 'Самовивіз з магазину', m: `${IMB.STORE.name}, ${IMB.STORE.address} · ${IMB.cartLines().every(l => l.p.stock.kazka >= l.qty) ? 'сьогодні' : 'завтра'}, резерв 3 дні`, price: '0 грн', on: kh },
      { id: 'own', t: 'Наша машина', m: 'Харків і область · завтра або в зручний день · до під’їзду або воріт', price: 'від 450 грн', on: kh },
      { id: 'np', t: 'Нова пошта', m: np ? 'Відділення або поштомат · 1–3 дні' : 'Недоступно для цього замовлення: ' + IMB.cartTotals().np.map(s => s.split(' — ')[1]).filter((v, j, a) => a.indexOf(v) === j).join('; '), price: np ? 'за тарифом' : '—', on: np },
      { id: 'up', t: 'Укрпошта', m: np ? 'Відділення · за тарифом перевізника' : 'Недоступно: ті самі обмеження, що й для Нової пошти', price: np ? 'за тарифом' : '—', on: np },
    ]; };
    const pays = () => [
      ['online', 'Онлайн карткою', 'LiqPay: Visa, Mastercard, Apple Pay, Google Pay', true],
      ['store', 'Карткою або готівкою в магазині', 'Під час самовивозу', O.method === 'pickup'],
      ['cod', O.method === 'np' || O.method === 'up' ? 'Накладений платіж' : 'Готівкою або карткою водію', 'Під час отримання', O.method === 'np' || O.method === 'up' || O.method === 'own'],
      ['invoice', 'За рахунком-фактурою', 'Для компаній і ФОП, з ПДВ', O.company],
      ['evid', 'Карткою «єВідновлення»', 'Державна програма на ремонт житла', O.method !== 'np' && O.method !== 'up'],
    ];
    const draw = () => {
      /* перед перемальовуванням запам'ятовуємо все, що людина вже ввела */
      const keep = {}; qsa('input[id], select[id], textarea[id]', root).forEach(el => { keep[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
      const t = IMB.cartTotals(), ms = methods(); if (!ms.find(m => m.id === O.method && m.on)) O.method = (ms.find(m => m.on) || {}).id || '';
      const none = !ms.some(m => m.on); /* у це місто товар не їде: приймаємо заявку для менеджера */
      const ps = pays(); if (!ps.find(p => p[0] === O.pay && p[3])) O.pay = 'online';
      const ship = none ? 'узгодить менеджер' : O.method === 'pickup' ? '0 грн' : O.method === 'own' ? 'від 450 грн, підтвердить менеджер' : O.method === 'np' || O.method === 'up' ? 'за тарифом перевізника' : 'оберіть спосіб';
      /* доставка машиною коштує від 450 грн: показуємо суму разом із нею, а не лише товари */
      const own = !none && O.method === 'own', totalTxt = (own ? 'від ' : '') + uah(t.total + (own ? 450 : 0));
      const topOpen = (qs('.co-top', root) || {}).open; /* підсумок угорі (телефон і планшет) не згортається після перемальовування */
      root.innerHTML = `<form class="checkout" data-co novalidate><details class="co-top"${topOpen ? ' open' : ''}><summary><span>Замовлення, ${IMB.cartCount()} шт.</span><b>${totalTxt}</b></summary><div class="co-top__body">${t.lines.map(l => `<div class="mini-item">${packshot(l.p)}<span>${esc(l.p.name)}<br><span class="ink-2">${l.pk.label} × ${l.qty}${l.shade ? ' · колір: ' + esc(l.shade) : ''}</span></span><b>${uah(l.sum)}</b></div>`).join('')}<div class="summary__line"><span>Доставка</span><span>${ship}</span></div></div></details><div>
        <section class="step"><div class="step__title"><span class="step__num">1</span><h2 style="font-size:22px">Місто й отримання</h2></div>
          <div class="field city-pick"><label class="field__label" for="co-city">Місто</label><input class="input" id="co-city" value="${esc(O.city)}" autocomplete="off"><div class="city-list" data-citylist></div><span class="field__hint">Від міста залежать способи отримання</span></div>
          <div class="choices" style="margin-top:16px">${ms.map(m => `<label class="choice${m.on ? '' : ' is-disabled'}"><input type="radio" name="method" value="${m.id}"${O.method === m.id ? ' checked' : ''}${m.on ? '' : ' disabled'}><span><span class="choice__title">${m.t}</span><br><span class="choice__meta">${m.m}</span></span><span class="choice__price">${m.price}</span></label>`).join('')}</div>
          ${!ms.some(m => m.on) ? `<div class="note note--warn" style="margin-top:12px">${IC.warn}<span>У ${esc(O.city)} ці товари доставити не можемо: поштою вони не їдуть. Залиште телефон і надішліть заявку: менеджер запропонує, як отримати замовлення.</span></div>` : ''}
          ${O.method === 'np' ? `<div class="field" style="margin-top:16px"><label class="field__label" for="co-np">Відділення Нової пошти</label><select class="select" id="co-np">${IMB.NP_BRANCHES(O.city).map(b => `<option>${b}</option>`).join('')}</select></div>` : ''}
          ${O.method === 'up' ? `<div class="field" style="margin-top:16px"><label class="field__label" for="co-up">Індекс і адреса відділення Укрпошти</label><input class="input" id="co-up" placeholder="61000, Харків, вул. …"></div>` : ''}
          ${O.method === 'own' ? `<div class="step__grid" style="margin-top:16px"><div class="field full"><label class="field__label" for="co-addr">Адреса об’єкта</label><input class="input" id="co-addr" placeholder="Вулиця, будинок" required><span class="field__error">Вкажіть адресу доставки</span></div><div class="field full"><label class="field__label" for="co-date">Дата</label><input class="input" id="co-date" type="date" min="${new Date().toISOString().slice(0, 10)}"></div></div>` : ''}
          ${O.method === 'pickup' ? `<p class="small ink-2" style="margin-top:12px">Напишемо у Viber, коли замовлення буде зібране. ${IMB.STORE.hours}.</p>` : ''}
        </section>
        <section class="step"><div class="step__title"><span class="step__num">2</span><h2 style="font-size:22px">Контакти</h2></div>
          <div class="step__grid">${IMB.phoneField('co-ph', 'Телефон')}<div class="field"><label class="field__label" for="co-name">Ім’я</label><input class="input" id="co-name" autocomplete="given-name" required><span class="field__error">Вкажіть ім’я</span></div>
          <label class="check full"><input type="checkbox" id="co-viber" checked> Зв’язатися у Viber або Telegram замість дзвінка</label>
          <label class="check full"><input type="checkbox" data-company${O.company ? ' checked' : ''}> Замовлення на компанію (рахунок, ПДВ)</label>
          ${O.company ? '<div class="field"><label class="field__label" for="co-cn">Назва компанії</label><input class="input" id="co-cn"></div><div class="field"><label class="field__label" for="co-ed">ЄДРПОУ або ІПН</label><input class="input" id="co-ed" inputmode="numeric"></div>' : ''}
          <div class="field full"><label class="field__label" for="co-cm">Коментар (необов’язково)</label><input class="input" id="co-cm" placeholder="Наприклад: зателефонуйте за годину до доставки"></div></div>
          <p class="small ink-2" style="margin-top:12px">Реєстрація не потрібна. <a class="link" href="account.html">Увійти</a>, щоб зберегти адреси і бачити історію.</p>
        </section>
        <section class="step"><div class="step__title"><span class="step__num">3</span><h2 style="font-size:22px">Оплата</h2></div>
          ${none ? '<p class="ink-2">Спосіб оплати узгодите з менеджером, коли він запропонує варіант отримання.</p>' : ''}<div class="choices"${none ? ' hidden' : ''}>${ps.filter(p => p[3]).map(([id, tt, m]) => `<label class="choice"><input type="radio" name="pay" value="${id}"${O.pay === id ? ' checked' : ''}><span><span class="choice__title">${tt}</span><br><span class="choice__meta">${m}</span></span></label>`).join('')}</div>
        </section></div>
        <aside class="summary"><b style="font-size:18px">Замовлення · <a class="link small" href="cart.html">змінити</a></b>
          ${t.lines.map(l => `<div class="mini-item">${packshot(l.p)}<span>${esc(l.p.name)}<br><span class="ink-2">${l.pk.label} × ${l.qty}${l.shade ? ' · колір: ' + esc(l.shade) : ''}</span></span><b>${uah(l.sum)}</b></div>`).join('')}
          <div class="summary__line"><span>Товари</span><span>${uah(t.sub + t.card)}</span></div>
          ${t.card ? `<div class="summary__line" style="color:var(--c-green)"><span>Картка клієнта, ${IMB.card().pct}\u00A0%</span><span>−${uah(t.card)}</span></div>` : ''}
          ${t.disc ? `<div class="summary__line" style="color:var(--c-green)"><span>Промокод</span><span>−${uah(t.disc)}</span></div>` : ''}
          ${t.gift ? `<div class="summary__line" style="color:var(--c-green)"><span>Сертифікат</span><span>−${uah(t.gift)}</span></div>` : ''}
          <div class="summary__line"><span>Доставка</span><span>${ship}</span></div>
          <div class="summary__total"><span>Разом</span><b>${totalTxt}</b></div>${own ? '<p class="xs ink-2" style="margin-top:-8px">Сума вже з доставкою машиною від 450 грн. Точну вартість менеджер підтвердить дзвінком.</p>' : ''}
          <button class="btn btn--primary btn--lg btn--block"${none || O.method ? '' : ' disabled'}>${none ? 'Надіслати заявку менеджеру' : O.pay === 'online' ? 'Перейти до оплати' : 'Підтвердити замовлення'}</button>
          <p class="xs ink-2">Менеджер підтвердить наявність перед відправкою. Натискаючи кнопку, ви приймаєте <a class="link" href="info.html?p=offer">публічну оферту</a> і <a class="link" href="info.html?p=privacy">політику конфіденційності</a>.</p>
        </aside></form>`;
      Object.entries(keep).forEach(([id, v]) => { const el = id !== 'co-city' && qs('#' + id, root); if (el) { if (el.type === 'checkbox') el.checked = v; else el.value = v; } });
    };
    root.addEventListener('change', e => {
      if (e.target.name === 'method') { O.method = e.target.value; track('add_shipping_info', { ecommerce: { shipping_tier: O.method } }); draw(); }
      if (e.target.name === 'pay') { O.pay = e.target.value; track('add_payment_info', { ecommerce: { payment_type: O.pay } }); draw(); }
      if (e.target.matches('[data-company]')) { O.company = e.target.checked; draw(); }
    });
    root.addEventListener('input', e => { if (e.target.id === 'co-city') { const v = e.target.value.toLowerCase(), l = qs('[data-citylist]'); const m = IMB.CITIES.filter(c => c.toLowerCase().startsWith(v)); l.innerHTML = m.map(c => `<button type="button" data-cityset="${c}">${c}</button>`).join('') || `<button type="button" data-cityset="${esc(e.target.value)}">${esc(e.target.value)} — інше місто</button>`; l.classList.add('is-open'); } });
    root.addEventListener('click', e => { const c = e.target.closest('[data-cityset]'); if (c) { O.city = c.dataset.cityset; S.city = O.city; IMB.save(); draw(); } });
    root.addEventListener('submit', e => {
      e.preventDefault(); const f = e.target; let ok = true;
      const ph = qs('#co-ph', f); if (!IMB.checkPhone(ph)) ok = false;
      qsa('[required]', f).forEach(inp => { if (inp.classList.contains('js-phone')) return; const bad = !inp.value.trim(); inp.closest('.field').classList.toggle('is-invalid', bad); if (bad) ok = false; });
      if (!ok) { const first = qs('.is-invalid input', f); if (first) first.focus(); return; }
      if (root.dataset.sent) return; root.dataset.sent = '1'; /* друге натискання не створює друге замовлення */
      const none = !methods().some(m => m.on);
      const t = IMB.cartTotals(), id = 'IMB-' + String(Date.now()).slice(-6);
      S.orders.unshift({ id, date: new Date().toLocaleDateString('uk-UA'), items: S.cart.slice(), total: t.total, card: t.card, cardPct: IMB.card().pct, method: none ? 'ask' : O.method, pay: none ? 'ask' : O.pay, city: O.city, phone: ph.value, status: 1, tracked: false });
      S.cart = []; S.promo = null; S.gift = null; IMB.save();
      location.href = (O.pay === 'online' && !none ? 'success.html?pay=liqpay&o=' : 'success.html?o=') + id;
    });
    draw();
  };

  /* ================= УСПІХ ================= */
  IMB.pages.success = () => {
    const o = S.orders.find(x => x.id === prm.get('o')) || S.orders[0]; const root = qs('[data-slot="result"]');
    if (prm.get('fail')) { root.innerHTML = `<div class="result__icon" style="background:var(--c-danger-bg)">${IC.warn}</div><h1>Оплата не пройшла</h1><p class="ink-2">Замовлення збережене, гроші не списано. Спробуйте ще раз або оберіть оплату при отриманні.</p><div class="row row--wrap"><a class="btn btn--primary" href="#">Оплатити ще раз</a><button class="btn btn--ghost" data-modal="callback">Зв’язатися з менеджером</button></div>`; return; }
    if (!o) { root.innerHTML = `<h1>Замовлення не знайдено</h1><a class="btn btn--primary" href="catalog.html">До каталогу</a>`; return; }
    if (!o.tracked) { track('purchase', { ecommerce: { transaction_id: o.id, value: o.total, currency: 'UAH', shipping_tier: o.method, payment_type: o.pay, items: o.items.map(x => gaItem(P(x.id), x.pack, x.qty)) } }); o.tracked = true; IMB.save(); }
    const next = { pickup: `Зберемо замовлення і напишемо у Viber, коли можна забрати. ${IMB.STORE.name}, ${IMB.STORE.address}.`, own: 'Менеджер передзвонить протягом 15 хвилин, узгодить час доставки і вартість машини.', np: 'Відправимо протягом дня і надішлемо номер ТТН у Viber або SMS.', up: 'Відправимо Укрпоштою і надішлемо номер відправлення у Viber або SMS.', ask: 'Це заявка: у ваше місто ці товари не їдуть поштою. Менеджер зателефонує в робочий час і запропонує, як отримати замовлення.' }[o.method];
    /* картка клієнта: що зміниться після цієї покупки */
    const cd = IMB.card(), aft = IMB.cardAt(cd.spent + o.total);
    const cardNote = o.method === 'ask' ? `Картка клієнта дає ${cd.first} % одразу після реєстрації і до ${cd.max} % з покупками. <a class="link" href="info.html?p=discounts">Умови картки</a>`
      : cd.on ? `Після отримання замовлення зарахуємо ${uah(o.total)} на вашу картку клієнта. ${aft.pct > cd.pct ? `Знижка стане ${aft.pct} %.` : aft.next ? `До ${aft.next.pct} % залишиться ${uah(aft.left)}.` : ''}`
      : `Наступну покупку можна зробити зі знижкою ${cd.first} %: увійдіть у кабінет за номером телефону й отримаєте картку клієнта. <a class="link" href="account.html?tab=card">Отримати картку</a>`;
    root.innerHTML = `<div class="result__icon">${IC.check}</div><h1>Дякуємо, замовлення прийнято</h1>
      <div><span class="ink-2">Номер замовлення</span><div class="result__num">${o.id}</div></div>
      ${prm.get('pay') ? '<div class="note">' + IC.check + '<span>Оплату отримано через LiqPay.</span></div>' : ''}
      <div class="panel" style="padding:20px"><b>Що далі</b><p style="margin-top:6px">${next}</p></div>
      <div class="order-items"><b>Склад замовлення</b>${o.items.map(x => { const pr = P(x.id); return pr ? `<div class="mini-item">${packshot(pr)}<span>${esc(pr.name)}<br><span class="ink-2">${pack(pr, pr.packs[x.pack] ? x.pack : pr.sel).label} × ${x.qty}${x.shade ? ' · колір: ' + esc(x.shade) : ''}</span></span></div>` : ''; }).join('')}</div>
      ${o.card ? `<div class="summary__line" style="color:var(--c-green)"><span>Картка клієнта, ${o.cardPct}\u00A0%</span><span>−${uah(o.card)}</span></div>` : ''}
      <div class="summary__line" style="font-size:16px"><span>Сума</span><b>${uah(o.total)}</b></div>
      <div class="note">${IC.card}<span>${IMB.nbp(cardNote)}</span></div>
      <div><b>Стежте за статусом у месенджері</b><div class="row row--wrap" style="margin-top:10px"><a class="btn btn--dark" href="#">Viber</a><a class="btn btn--dark" href="#">Telegram</a><a class="btn btn--ghost" href="tracking.html?o=${o.id}">Статус замовлення</a></div></div>
      <a class="link" href="catalog.html">Повернутися до покупок</a>`;
  };

  /* ================= ВІДСТЕЖЕННЯ ================= */
  IMB.pages.tracking = () => {
    const f = qs('[data-track]'), out = qs('[data-slot="timeline"]');
    const show = id => {
      const o = S.orders.find(x => x.id === id) || (id === 'IMB-100001' ? { id, total: 1890, method: 'np', status: 3 } : null); /* демо-номер для карти прототипу */
      if (!o) { out.innerHTML = id ? `<div class="empty"><div class="empty__title">Замовлення ${esc(id)} не знайдено</div><p class="ink-2">Перевірте номер у повідомленні від магазину або зателефонуйте нам: ${IMB.STORE.phone}.</p></div>` : ''; return; }
      const steps = [['Прийнято', 'Замовлення зареєстровано'], ['Підтверджено', 'Менеджер перевірив наявність'], ['Зібрано', o.method === 'pickup' ? 'Можна забирати в магазині' : 'Готуємо до відправки'], [o.method === 'np' ? 'Відправлено' : o.method === 'own' ? 'У дорозі' : 'Видано', o.method === 'np' ? 'ТТН 20450000000000 · Нова пошта' : ''], ['Виконано', '']];
      const s = o.status || 1;
      out.innerHTML = `<div class="card"><div class="row row--between row--wrap" style="margin-bottom:20px"><h2 style="font-size:22px">Замовлення ${esc(o.id)}</h2><b>${uah(o.total)}</b></div><div class="timeline">${steps.map(([a, b], j) => `<div class="tl ${j < s ? 'is-done' : j === s ? 'is-now' : 'is-wait'}"><span class="tl__dot"></span><span><span class="tl__t">${a}</span>${b && j <= s ? `<br><span class="small ink-2">${b}</span>` : ''}</span><span class="small muted">${j < s ? 'сьогодні' : ''}</span></div>`).join('')}</div><div class="row row--wrap" style="margin-top:12px"><button class="btn btn--ghost" data-modal="callback">Питання щодо замовлення</button><a class="btn btn--ghost" href="account.html">Повторити замовлення</a></div></div>`;
    };
    f.addEventListener('submit', e => { e.preventDefault(); show(qs('#tr-n').value.trim().toUpperCase()); });
    const o = prm.get('o') || (S.orders[0] && S.orders[0].id); if (o) { qs('#tr-n').value = o; show(o); }
  };

  /* ================= КАБІНЕТ ================= */
  IMB.pages.account = () => {
    const root = qs('[data-slot="account"]');
    const login = step => { root.innerHTML = `<div class="result" style="max-width:480px"><h1 style="font-size:28px">Вхід у кабінет</h1><p class="ink-2">За номером телефону, без пароля. Надішлемо код у Viber або SMS.</p>
      <form class="stack" data-login="${step}">${step === 1 ? IMB.phoneField('lg-ph') : `<div class="field"><label class="field__label" for="lg-c">Код із повідомлення</label><input class="input" id="lg-c" inputmode="numeric" maxlength="4" placeholder="1234" autocomplete="one-time-code"><span class="field__hint">Демо: будь-які 4 цифри</span></div>`}<button class="btn btn--primary btn--lg btn--block">${step === 1 ? 'Отримати код' : 'Увійти'}</button></form>
      <div class="note">${IC.card}<span>Після входу діє накопичувальна картка: ${IMB.card().first}\u00A0% одразу і до ${IMB.card().max}\u00A0% з покупками. <a class="link" href="info.html?p=discounts">Умови картки</a></span></div>
      <p class="small ink-2">Можна купувати без реєстрації. Кабінет зберігає адреси об’єктів, історію і дає повторити замовлення.</p></div>`; };
    const cab = tab => { const cd = IMB.card();
      const orders = S.orders.length ? S.orders : [{ id: 'IMB-104233', date: '02.11.2026', items: [{ id: 'tm12', pack: 0, qty: 8 }, { id: 'grn', pack: 1, qty: 1 }], total: 2788, status: 5 }];
      const T = { orders: `<h2 style="margin-bottom:12px">Мої замовлення</h2>${orders.map(o => `<div class="order-row"><span><b>${o.id}</b> · ${o.date}<br><span class="small ink-2">${o.items.map(x => P(x.id).name.split(' ').slice(0, 3).join(' ') + ' × ' + x.qty).join(', ')}</span></span><b>${uah(o.total)}</b><span class="row"><a class="btn btn--ghost btn--sm" href="tracking.html?o=${o.id}">Статус</a><button class="btn btn--dark btn--sm" data-repeat="${o.id}">Повторити</button></span></div>`).join('')}`,
        addr: `<h2 style="margin-bottom:12px">Адреси об’єктів</h2><div class="card card--flat" style="background:var(--c-bg)"><b>Квартира, Холодна Гора</b><br><span class="small ink-2">вул. Полтавський Шлях, 150, кв. 12 · 7 поверх, ліфт є</span></div><button class="btn btn--ghost" style="margin-top:12px">+ Додати адресу</button>`,
        card: `<h2 style="margin-bottom:16px">Картка клієнта</h2><div class="mycard"><div class="mycard__card"><span class="mycard__top"><span>IMBAU</span><span>картка клієнта</span></span><b>${cd.pct}\u00A0%</b><span class="mycard__ph">${esc(S.user)}</span></div>
          <div class="mycard__body"><p><b>Накопичено ${uah(cd.spent)}.</b> ${cd.next ? `До ${cd.next.pct}\u00A0% залишилось ${uah(cd.left)} покупок.` : 'У вас найвищий рівень знижки.'}</p>${IMB.stairs()}<p class="small ink-2">Рахуємо разом покупки в магазині й на сайті за вашим номером телефону. У магазині назвіть номер на касі. Ціни на сайті вже показано з вашою знижкою: звичайна ціна перекреслена.</p><a class="link" href="info.html?p=discounts">Умови картки</a></div></div>`,
        profile: `<h2 style="margin-bottom:12px">Профіль</h2><div class="step__grid"><div class="field"><label class="field__label">Телефон</label><input class="input" value="${esc(S.user)}" disabled></div><div class="field"><label class="field__label" for="pf-n">Ім’я</label><input class="input" id="pf-n" value="Олександр"></div></div><button class="btn btn--ghost" style="margin-top:16px" data-logout>Вийти</button>` };
      root.innerHTML = `<h1 class="page-title">Кабінет</h1><div class="cat-layout"><nav class="acc-nav" role="tablist">${[['orders', 'Замовлення'], ['addr', 'Адреси об’єктів'], ['card', 'Картка клієнта'], ['profile', 'Профіль']].map(([k, t]) => `<button role="tab" data-atab="${k}" aria-selected="${k === tab}">${t}</button>`).join('')}</nav><div class="card">${T[tab]}</div></div>`;
    };
    root.addEventListener('submit', e => { const f = e.target.closest('[data-login]'); if (!f) return; e.preventDefault(); if (f.dataset.login === '1') { const ph = qs('.js-phone', f); if (!IMB.checkPhone(ph)) return; root.dataset.ph = ph.value; login(2); qs('#lg-c').focus(); } else { const c = qs('#lg-c', f); if (!/^\d{4}$/.test(c.value.trim())) { c.closest('.field').classList.add('is-invalid'); IMB.toast('Введіть чотири цифри з повідомлення'); c.focus(); return; } S.user = root.dataset.ph; IMB.save(); track('login', { method: 'phone' }); if (prm.get('back') === 'cart') { location.href = 'cart.html'; return; } /* із кошика: назад у кошик уже з карткою */ IMB.syncUser(); cab(prm.get('tab') === 'card' ? 'card' : 'orders'); } });
    root.addEventListener('click', e => { const t = e.target.closest('[data-atab]'); if (t) cab(t.dataset.atab); if (e.target.closest('[data-logout]')) { S.user = null; IMB.save(); IMB.syncUser(); login(1); } const r = e.target.closest('[data-repeat]'); if (r) { const o = S.orders.find(x => x.id === r.dataset.repeat) || { items: [{ id: 'tm12', pack: 0, qty: 8 }, { id: 'grn', pack: 1, qty: 1 }] }; o.items.forEach(x => IMB.addToCart(x.id, x.pack, x.qty, true)); IMB.toast('Товари додано в кошик · <a href="cart.html">Перейти</a>'); } });
    S.user ? cab(prm.get('tab') === 'card' ? 'card' : 'orders') : login(1);
  };

  /* ================= ПОРІВНЯННЯ / ОБРАНЕ ================= */
  IMB.pages.compare = () => {
    let tab = prm.get('tab') === 'fav' ? 'fav' : 'cmp', diff = false; const root = qs('[data-slot="compare"]');
    const draw = () => {
      const bar = `<div class="tabs" role="tablist" style="margin-bottom:24px"><button class="tab" role="tab" data-ctab="cmp" aria-selected="${tab === 'cmp'}">Порівняння (${S.cmp.length})</button><button class="tab" role="tab" data-ctab="fav" aria-selected="${tab === 'fav'}">Обране (${S.fav.length})</button></div>`;
      const ids = S[tab];
      if (!ids.length) { root.innerHTML = bar + `<div class="empty"><div class="empty__title">${tab === 'cmp' ? 'Немає товарів для порівняння' : 'В обраному порожньо'}</div><p class="ink-2">${tab === 'cmp' ? 'Натисніть ⇄ на картці товару, щоб порівняти до 4 товарів за витратою, ціною і характеристиками.' : 'Натисніть ♡ на картці, щоб зберегти товар і повернутися до нього пізніше.'}</p><a class="btn btn--primary" href="catalog.html">До каталогу</a></div>`; return; }
      if (tab === 'fav') { root.innerHTML = bar + '<div class="listing grid-4" data-slot="favlist"></div>'; IMB.renderList(qs('[data-slot="favlist"]'), ids, 'Обране'); return; }
      const ps = ids.map(P);
      const rows = [['Ціна', p => uah(pack(p).price)], ['За одиницю', p => perUnit(p) || '—'], ['Бренд', p => p.brand], ['Розділ', p => p.sub], ['Фасовка', p => p.packs.map(x => x[0]).join(', ')], ['Основа', p => p.base || '—'], ['Висихання', p => p.dry || '—'], ['Витрата', p => p.calc ? (p.calc.type === 'cover' ? p.calc.rate + ' м²/' + p.unit : p.calc.type === 'mass' ? p.calc.rate + ' кг/м²' : p.calc.per + ' м²') : '—'], ['Нова пошта', p => npReason(p) ? 'ні' : 'так'], ['Наявність', p => state(p) === 'ok' ? 'є' : state(p) === 'order' ? 'під замовлення' : state(p) === 'ended' ? 'поставки припинено' : 'немає']];
      root.innerHTML = bar + `<label class="check" style="margin-bottom:12px"><input type="checkbox" data-diff${diff ? ' checked' : ''}> Тільки відмінності</label><div class="cmp-wrap"><table class="cmp"><thead><tr><th></th>${ps.map(p => `<td><div style="max-width:140px">${packshot(p)}</div><a href="${pUrl(p)}" style="display:block;margin:8px 0;font-weight:500">${esc(p.name)}</a><div class="row"><button class="btn btn--primary btn--sm" data-add="${p.id}">До кошика</button><button class="btn btn--ghost btn--sm" data-cmp="${p.id}" data-rm>Прибрати</button></div></td>`).join('')}</tr></thead><tbody>${rows.map(([n, f]) => { const v = ps.map(f), d = new Set(v).size > 1; return diff && !d ? '' : `<tr class="${d ? 'is-diff' : ''}"><th>${n}</th>${v.map(x => `<td>${x}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>`;
    };
    root.addEventListener('click', e => { const c = e.target.closest('[data-ctab]'); if (c) { tab = c.dataset.ctab; draw(); } if (e.target.closest('[data-rm]')) setTimeout(draw, 0); });
    root.addEventListener('change', e => { if (e.target.matches('[data-diff]')) { diff = e.target.checked; draw(); } });
    draw();
  };

  /* ================= АКЦІЇ ================= */
  IMB.pages.promo = () => IMB.renderList(qs('[data-slot="listing"]'), IMB.PRODUCTS.filter(p => p.promo || p.step).sort(byDefault).map(p => p.id), 'Акції');

  /* ================= БРЕНД FRONT / TIGOR ================= */
  IMB.pages.brand = () => {
    const b = prm.get('b') === 'tigor' ? 'TIGOR' : 'FRONT', front = b === 'FRONT', B = IMB.BRANDS[b];
    const title = front ? 'Фарби, ґрунтовки й лаки FRONT' : 'Ґрунтовки, шпаклівки й піни TIGOR';
    setTitle(`${b}: IMBAU — дилер торгової марки`);
    qs('[data-slot="crumbs"]').innerHTML = crumbs([['Виробники', 'brands.html'], b]);
    const ps = IMB.PRODUCTS.filter(p => p.brand === b).sort(byDefault);
    /* Банер марки (перероблено 18.11.2026). Світла панель кольору фото товарів, ліворуч логотип, заголовок
       і дві дії, унизу рядок фактів, які перевіряються по каталогу. Мотив у кожної марки свій, з упаковки:
       FRONT — триколірне кільце з літери «O» логотипа за відрами (фото вирізані на прозорий фон, B.cut);
       TIGOR — помаранчева смуга з тигровими смугами по лівому краю, як на етикетці. */
    const band = front ? '' : '<span class="brandtop__band" aria-hidden="true"><svg viewBox="0 0 120 460" preserveAspectRatio="xMidYMid slice"><path d="M0 22c34 4 66 20 92 52-30-14-60-18-92-14zM120 96c-36 6-66 24-90 58 30-18 60-24 90-22zM0 170c38 2 72 22 98 60-32-18-64-24-98-20zM120 250c-38 4-70 24-94 60 30-20 62-26 94-24zM0 326c36 4 68 22 94 56-30-16-62-20-94-16zM120 400c-36 6-66 24-88 56 30-18 58-22 88-20z"/></svg></span>';
    qs('[data-slot="hero"]').outerHTML = `<section class="brandtop brandtop--${front ? 'front' : 'tigor'}" style="--accent:${B.accent}">${band}
      <div class="brandtop__text"><span class="brandtop__logo"><img src="assets/img/${B.logo}" alt="${b}" width="${B.lw}" height="${B.lh}"></span>
        <h1 class="brandtop__title">${title}</h1><p class="brandtop__lead">${B.lead}</p>
        <div class="brandtop__cta"><a class="btn btn--dark btn--lg" href="#brand-products">Товари ${b}</a>${front ? '<a class="btn btn--white btn--lg" href="tinting.html">Колерування</a>' : '<a class="btn btn--white btn--lg" href="kit.html">Підбірки під роботу</a>'}</div></div>
      <div class="brandtop__media" aria-hidden="true">${front ? '<span class="brandtop__ring"></span>' : ''}<span class="brandtop__shots">${B.hero.map(n => `<span class="shot shot--photo"><img src="assets/img/${n}${B.cut ? '-cut' : ''}.webp" alt="" width="720" height="720"></span>`).join('')}</span></div>
      <dl class="brandtop__facts">${B.facts.map(([a, c]) => `<div><dt>${a}</dt><dd>${c}</dd></div>`).join('')}</dl></section>`;
    qs('[data-slot="lines"]').innerHTML = B.lines.filter(l => IMB.PRODUCTS.some(x => x.brand === b && x.sub === l[3] && state(x) !== 'ended')).map(([t, d, img, sub]) => `<a class="bline" href="${catUrl(sub, { brand: b })}"><span class="shot shot--photo"><img src="assets/img/${img}.webp" alt="" width="720" height="720" loading="lazy"></span><span class="bline__text"><b>${t}</b><span>${d}</span></span>${IC.arrow}</a>`).join('');
    IMB.renderList(qs('[data-slot="products"]'), ps.map(p => p.id), 'Бренд ' + b);
    qs('[data-slot="docs"]').innerHTML = ps.slice(0, 4).map(p => `<a class="doc-link" href="#">${IC.doc}<span>Техлист: ${esc(p.name)}</span></a>`).join('');
  };

  /* ================= ВИРОБНИКИ ================= */
  IMB.pages.brands = () => { const el = qs('[data-slot="makers"]'); el.className = 'makers'; el.innerHTML = makersHtml(); };

  /* ================= КОЛЕРУВАННЯ ================= */
  IMB.pages.tinting = () => {
    /* Примірка відтінку. Три шари в одній рамці: фото кімнати → сірий шар стін (room-walls.webp, прозорий
       поза стінами) → колір відтінку з накладанням multiply і тією ж маскою. Тіні й світло лишаються з фото.
       Змінюється лише CSS-змінна --shade, тому перефарбування миттєве. */
    const room = qs('[data-slot="room"]'), tag = qs('[data-slot="vtag"]'), box = qs('[data-slot="swatches"]'), sq = qs('#viz-q'), tabs = qs('[data-slot="pals"]');
    /* Палітри (правка ліда 18.11.2026). Угорі сторінки обирають палітру: чотири справжні з IMB.PALETTES
       (palettes.js) і «Популярні» — 24 названі відтінки з картки товару. Під нею смужка гам: натиснув гаму —
       бачиш її зразки з назвами. Зразок = [назва або код, колір]. */
    const POP = { id: 'pop', n: 'Популярні відтінки', short: 'Популярні', by: 'з карток товарів', total: 0, groups: [IMB.SHADES.flatMap(g => g.list.map(x => [x[1], x[0]]))] };
    POP.count = POP.groups[0].length;
    const PALS = IMB.PALETTES.concat([POP]), G = IMB.GAMMAS, shW = n => pl(n, 'відтінок', 'відтінки', 'відтінків'), smW = n => pl(n, 'зразок', 'зразки', 'зразків');
    let pal = PALS[0], fam = window.innerWidth < 721 ? 7 : -1, cur = null;   /* cur = [назва, колір, палітра] */
    const sw = (x, p, named) => `<button type="button" class="viz__sw${named ? ' viz__sw--named' : ''}" style="--sw:${x[1]}" data-sw="${x[1]}" data-n="${esc(x[0])}" data-pal="${p.id}" aria-pressed="false" aria-label="${esc(x[0])}, ${esc(p.n)}" title="${esc(x[0])} · ${esc(p.short)}">${named ? `<i></i><span>${esc(x[0])}</span>` : ''}</button>`;
    const mark = () => qsa('[data-sw]', box).forEach(x => x.setAttribute('aria-pressed', !!cur && x.dataset.pal === cur[2].id && x.dataset.n === cur[0]));
    /* Віяло на картці палітри: сім смужок, кожна — одна гама (жовті, помаранчеві, червоні, фіолетові, сині, бірюзові,
       зелені), на смужці чотири тони. Назовні, де смужку видно найкраще, стоять середній і темний тон: так віяло яскравіше;
       світлі тони ближче до осі. У «Популярних» шість смужок по чотири відтінки. */
    const fanOf = p => { const st = p.groups.length === 1 ? Array.from({ length: 6 }, (_, k) => p.groups[0].slice(k * 4, k * 4 + 4))
        : [6, 5, 4, 10, 9, 8, 7].map(g => { const L = p.groups[g] || []; return [.5, .78, .28, .08].map(t => L[Math.round(t * (L.length - 1))]).filter(Boolean); });
      return `<span class="fan" aria-hidden="true" style="--n:${st.length}">${st.map((x, k) => `<i style="--k:${k};background:linear-gradient(${x.map((c, j) => `${c[1]} ${Math.round(j * 100 / x.length)}% ${Math.round((j + 1) * 100 / x.length)}%`).join(',')})"></i>`).join('')}</span>`; };
    const noteEl = qs('[data-slot="palnote"]');
    const drawTabs = () => { tabs.innerHTML = PALS.map(p => `<button type="button" class="pal-tab${p === pal ? ' is-on' : ''}" role="tab" aria-selected="${p === pal}" data-pal="${p.id}">${fanOf(p)}<span class="pal-tab__txt"><b>${p.short}</b><span class="pal-tab__n">${p.total ? IMB.num(p.total) + ' ' + shW(p.total) : p.count + ' ' + shW(p.count)}</span><span class="pal-tab__by">${p.by}</span></span></button>`).join('');
      if (noteEl) noteEl.textContent = pal.total ? `${pal.n}: на сторінці ${pal.count} ${smW(pal.count)} з ${IMB.num(pal.total)}. Повне віяло покажемо в магазині.` : 'Популярні: 24 відтінки, які замовляють найчастіше. Вони ж є в картці товару.'; };
    const draw = q => {
      const n = (q || '').trim().toLowerCase();
      if (n) { const found = []; PALS.forEach(p => p.groups.forEach(g => g.forEach(x => { if ((x[0] + ' ' + x[1]).toLowerCase().includes(n)) found.push([x, p]); })));
        box.innerHTML = found.length ? `<div class="viz__gname">Знайдено в усіх палітрах: ${found.length}</div><div class="viz__grid viz__grid--named">${found.slice(0, 24).map(([x, p]) => sw(x, p, 1)).join('')}</div>` : `<p class="small ink-2">За запитом «${esc(q)}» нічого немає. Спробуйте код або назву, наприклад S 1002-B чи Agave.</p>`;
        mark(); return; }
      const single = pal.groups.length === 1;
      const strip = single ? '' : `<div class="gamma" role="group" aria-label="Гама кольору"><button type="button" class="gamma__all${fam < 0 ? ' is-on' : ''}" data-fam="-1" aria-pressed="${fam < 0}" aria-label="Усі гами" title="Усі гами"><i></i></button>${G.map(([t, c], k) => (pal.groups[k] || []).length ? `<button type="button" class="gamma__seg${fam === k ? ' is-on' : ''}" style="--sw:${c}" data-fam="${k}" aria-pressed="${fam === k}" aria-label="${t}" title="${t}"></button>` : '').join('')}</div>`;
      const head = single ? `${pal.count} ${shW(pal.count)} із картки товару` : fam < 0 ? `Усі гами: ${pal.count} ${smW(pal.count)} з ${IMB.num(pal.total)} у палітрі` : `${G[fam][0]}: ${pal.groups[fam].length} ${smW(pal.groups[fam].length)}`;
      const grid = single ? `<div class="viz__grid viz__grid--pop">${pal.groups[0].map(x => sw(x, pal)).join('')}</div>`
        : fam < 0 ? `<div class="viz__rows">${pal.groups.map(g => g.length ? `<div class="viz__grid viz__grid--all">${g.map(x => sw(x, pal)).join('')}</div>` : '').join('')}</div>`
        : `<div class="viz__grid viz__grid--named">${pal.groups[fam].map(x => sw(x, pal, 1)).join('')}</div>`;
      box.innerHTML = `${strip}<div class="viz__gname">${head}</div>${grid}`;
      mark(); };
    const pick = (x, p) => { cur = [x[0], x[1], p];
      room.style.setProperty('--shade', x[1]); tag.innerHTML = `<i style="background:${x[1]}"></i><span><b>${esc(x[0])}</b><small>${p.id === 'pop' ? '' : esc(p.n) + ' · '}${x[1].toUpperCase()}</small></span>`;
      mark(); qs('#tn-code').value = `${p.id === 'pop' ? '' : p.n + ', '}${x[0]}, ${x[1].toUpperCase()}`; };
    /* відтінок за кольором з адреси (?c=): спершу серед популярних, потім у палітрах */
    const byHex = c => { c = String(c || '').toLowerCase(); for (const p of [POP].concat(IMB.PALETTES)) for (const g of p.groups) { const x = g.find(y => y[1].toLowerCase() === c); if (x) return [x, p]; } return null; };
    /* Прийшли з картки товару: обраний відтінок запам'ятовуємо для нього й даємо кнопку назад */
    const back = P(prm.get('p')) && P(prm.get('p')).tint ? P(prm.get('p')) : null, remember = () => { if (back && cur) { S.shades = S.shades || {}; S.shades[back.id] = [cur[1], cur[0]]; IMB.save(); } };
    if (back) { const bl = document.createElement('a'); bl.className = 'btn btn--dark btn--lg btn--block'; bl.href = pUrl(back); bl.textContent = 'Обрати цей відтінок і повернутись до товару'; bl.addEventListener('click', remember); qs('.viz__panel [data-vizorder]').before(bl); }
    box.addEventListener('click', e => { const b = e.target.closest('[data-sw]'); if (b) { pick([b.dataset.n, b.dataset.sw], PALS.find(x => x.id === b.dataset.pal)); remember(); return; } const f = e.target.closest('[data-fam]'); if (f) { fam = +f.dataset.fam; if (sq) sq.value = ''; draw(''); } });
    tabs.addEventListener('click', e => { const t = e.target.closest('[data-pal]'); if (!t) return; pal = PALS.find(x => x.id === t.dataset.pal); if (fam >= 0 && !(pal.groups[fam] || []).length) fam = -1; if (sq) sq.value = ''; drawTabs(); draw(''); });
    if (sq) sq.addEventListener('input', () => draw(sq.value));
    const first = byHex(prm.get('c')) || byHex('#C3CFB3') || [POP.groups[0][0], POP];
    if (prm.get('c') && first[1] === POP) pal = POP;
    drawTabs(); draw('');
    qsa('[data-vizorder]').forEach(b => b.addEventListener('click', () => { qs('[data-form="tint"]').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => qs('#tn-ph').focus({ preventScroll: true }), 450); }));
    pick(first[0], first[1]);
    IMB.renderList(qs('[data-slot="products"]'), IMB.PRODUCTS.filter(p => p.tint).map(p => p.id), 'Колерування');
    IMB.onForm = kind => { if (kind === 'tint') IMB.openModal(`<div class="result__icon">${IC.check}</div><h2 class="modal__title" id="modal-t" style="margin-top:16px">Заявку на колерування прийнято</h2><p class="ink-2">Передзвонимо, уточнимо відтінок і об’єм. У магазині ви побачите відтінок наживо перед колеруванням. Забрати замовлення можна в ${IMB.STORE.name} або замовити доставку.</p><button class="btn btn--dark" style="margin-top:20px" data-close>Добре</button>`); };
  };

  /* ================= ПІДБІР МАТЕРІАЛІВ + КАЛЬКУЛЯТОРИ ================= */
  IMB.pages.podbor = () => {
    IMB.onForm = kind => { if (kind === 'podbor') IMB.openModal(`<div class="result__icon">${IC.check}</div><h2 class="modal__title" id="modal-t" style="margin-top:16px">Список прийнято</h2><p class="ink-2">Технолог порахує матеріали і надішле кошик з цінами у Viber протягом робочого дня.</p><button class="btn btn--dark" style="margin-top:20px" data-close>Добре</button>`); };
    const sel = qs('#calc-p'), box = qs('[data-slot="calc"]');
    const calcIds = IMB.PRODUCTS.filter(p => p.calc).map(p => p.id);
    sel.innerHTML = calcIds.map(id => `<option value="${id}">${esc(P(id).name)}</option>`).join('');
    const draw = () => { const p = P(sel.value); box.innerHTML = calcBox(p); bindCalc(box, p); };
    sel.addEventListener('change', draw); draw();
  };

  /* ================= КОМПЛЕКТ ПІД РОБОТУ ================= */
  IMB.pages.kit = () => {
    const t = IMB.TASKS.find(x => x.n === prm.get('t')) || IMB.TASKS[1];
    setTitle(`Усе ${t.n.toLowerCase()}`, `Усе ${t.n.toLowerCase()}`);
    qs('[data-slot="crumbs"]').innerHTML = crumbs([['Каталог', 'catalog.html'], 'Підбірки', t.n]);
    qs('[data-slot="tasks"]').innerHTML = IMB.TASKS.map(x => `<a class="chip${x === t ? ' is-on' : ''}" href="${url('kit', { t: x.n })}">${x.n}</a>`).join('');
    /* Схема шарів: зріз «пирога» від основи до фінішу. Кожна смуга — шар, номер збігається з номером у списку
       під схемою. Наведення на рядок або смугу підсвічує пару; шар із товаром веде на його рядок у наборі. */
    const L = t.layers, lay = qs('[data-slot="layers"]'), step = 100 / L.length;
    lay.innerHTML = `<div class="layers__stage" data-stage>${L.map((l, j) => `<div class="layer" data-li="${j}" style="--from:${j * step}%;--z:${j}"><i class="layer__fill layer--${l.tone}"></i></div>`).join('')}${L.map((l, j) => `<span class="layer__n" style="left:${j * step + step / 2 + (j ? 3 : 0)}%" aria-hidden="true">${j + 1}</span>`).join('')}</div>
      <ol class="layers__list">${L.map((l, j) => { const pr = l.id && P(l.id); return `<li data-li="${j}"><span class="layers__num">${j + 1}</span><span class="layers__txt"><b>${l.t}</b><span>${l.note}</span></span>${pr ? `<a class="layers__prod" href="#kit-${pr.id}">${esc(pr.name)}</a>` : '<span class="layers__prod layers__prod--none">є на об’єкті</span>'}</li>`; }).join('')}</ol>`;
    const hl = j => { qs('[data-stage]', lay).dataset.on = j == null ? '' : j; qsa('[data-li]', lay).forEach(x => x.classList.toggle('is-on', j != null && +x.dataset.li === +j)); };
    lay.addEventListener('mouseover', e => { const x = e.target.closest('[data-li]'); hl(x ? x.dataset.li : null); });
    lay.addEventListener('mouseleave', () => hl(null));
    lay.addEventListener('focusin', e => { const x = e.target.closest('[data-li]'); if (x) hl(x.dataset.li); });
    lay.addEventListener('focusout', () => hl(null));
    const ps = t.ids.map(P).filter(Boolean), q = {}; ps.forEach(p => { q[p.id] = 1; });
    const layerOf = id => L.findIndex(l => l.id === id);
    const list = qs('[data-slot="kit"]');
    const draw = () => { const sum = ps.reduce((s, p) => s + (q[p.id] || 0) * pack(p).price, 0);
      list.innerHTML = `<div class="cart-items">${ps.map(p => { const li = layerOf(p.id); return `<div class="citem" id="kit-${p.id}">${packshot(p)}<div><a class="citem__name" href="${pUrl(p)}">${esc(p.name)}</a><div class="citem__meta">${li >= 0 ? `<span class="kit-layer">Шар ${li + 1}</span>` : '<span class="kit-layer kit-layer--tool">Інструмент</span>'}${pack(p).label} · ${uah(pack(p).price)}</div></div><div class="qty qty--sm" data-kq="${p.id}"><button data-k="-1" aria-label="Менше">−</button><input value="${q[p.id]}" aria-label="Кількість"><button data-k="1" aria-label="Більше">+</button></div><div class="citem__sum">${uah(q[p.id] * pack(p).price)}</div><span></span></div>`; }).join('')}</div>
      <div class="summary" style="margin-top:16px;position:static"><div class="summary__total" style="border:0;padding:0"><span>Разом за набір</span><b>${uah(sum)}</b></div><button class="btn btn--primary btn--lg" data-kitall>Додати все до кошика</button><a class="link small" href="podbor.html">Порахувати кількість під мою площу</a></div>`; };
    list.addEventListener('change', e => { const wq = e.target.closest('[data-kq]'); if (wq) { q[wq.dataset.kq] = Math.max(0, Math.round(parseFloat(String(e.target.value).replace(',', '.'))) || 0); draw(); } });
    list.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { const id = b.closest('[data-kq]').dataset.kq; q[id] = Math.max(0, q[id] + +b.dataset.k); draw(); } if (e.target.closest('[data-kitall]')) { ps.forEach(p => q[p.id] && IMB.addToCart(p.id, null, q[p.id], true)); IMB.toast('Набір додано в кошик · <a href="cart.html">Перейти</a>'); } });
    draw();
  };

  /* Тексти інформаційних сторінок. ЧЕРНЕТКИ: структура за схемою ліда, формулювання уточнює контент,
     умови повернення й оферту — юрист. Цифри в «Про компанію» — лише ті, що видно з каталогу. */
  const INFO = {
    about: () => `<p class="info-lead">IMBAU створений, щоб будівництво й ремонт були простішими, зрозумілішими й комфортнішими.</p>
      <p>IMBAU — будівельний магазин, де можна купувати онлайн і офлайн. Продаємо вроздріб і оптом будівельні матеріали, товари для ремонту, оздоблення та облаштування приміщень. Ми зібрали в одному місці все необхідне: від базових матеріалів до інструментів, кріплення й дрібниць, про які зазвичай згадують уже посеред роботи. Але наша задача — не просто запропонувати товар. Ми хочемо допомогти знайти правильне рішення.</p>
      <div class="info-facts"><div><b>${IMB.SECTIONS.length}</b><span>розділи каталогу</span></div><div><b>3</b><span>склади: Київ, Харків, Хмельницький</span></div><div><b>2</b><span>торгові марки, дилером яких ми є: FRONT і TIGOR</span></div><div><b>2026</b><span>1 жовтня відкрито перший магазин, у Харкові</span></div></div>
      <h3>Чому IMBAU</h3>
      <ul class="theses"><li>${IC.check}<span>IMBAU — простір для легкого і зручного вибору будівельних матеріалів.</span></li><li>${IC.check}<span>Купуйте <a class="link" href="catalog.html">онлайн</a> або <a class="link" href="stores.html">в магазині</a>. Доставляємо по всій Україні, склади в Києві, Харкові та Хмельницькому.</span></li><li>${IC.check}<span>Широкий асортимент для будівництва, ремонту та облаштування дому.</span></li><li>${IC.check}<span>Замовимо товар, навіть якщо його немає на полицях магазину.</span></li><li>${IC.check}<span>Власна <a class="link" href="tinting.html">колерувальна студія</a> в магазині в Харкові.</span></li><li>${IC.check}<span>Дилер торгових марок <a class="link" href="brand.html?b=front">FRONT</a> і <a class="link" href="brand.html?b=tigor">TIGOR</a>.</span></li><li>${IC.check}<span>Бонусні програми для <a class="link" href="info.html?p=discounts">постійних</a> та <a class="link" href="pro.html">оптових</a> клієнтів.</span></li><li>${IC.check}<span>Перший магазин у Харкові, попереду нові магазини в інших містах України.</span></li></ul>
      <p>Вам не потрібно шукати матеріали в різних магазинах: допоможемо знайти й замовити потрібне в одному місці.</p>
      <h3>Що ми продаємо</h3><p>Широкий асортимент будівельних матеріалів і супутніх товарів для різних етапів будівництва та ремонту: від чорнових робіт до фінішного оздоблення й облаштування приміщень.</p>
      <ul class="info-cols"><li><a class="link" href="section.html?s=sukhi-sumishi">Сухі будівельні суміші</a>: штукатурки, шпаклівки, клейові та інші суміші для будівельних і оздоблювальних робіт.</li><li><a class="link" href="section.html?s=lfm">Лакофарбові матеріали</a>: фарби, емалі, ґрунтовки, декоративні покриття.</li><li><a class="link" href="section.html?s=uteplyuvachi">Утеплювачі та ізоляційні матеріали</a>: теплоізоляція і все для утеплення.</li><li><a class="link" href="section.html?s=tsegla-bloky">Стінові матеріали</a>: газоблоки й матеріали для будівельних робіт.</li><li><a class="link" href="section.html?s=shpalery">Малярні та оздоблювальні матеріали</a>: флізелін, склополотно, малярні стрічки, скотч, витратні матеріали.</li><li><a class="link" href="section.html?s=budivelna-khimiya">Герметики та супутні матеріали</a>: для монтажних і ремонтних робіт.</li><li><a class="link" href="section.html?s=elektryka">Електрика</a>: кабелі, проводи, монтажні коробки, автоматичні вимикачі, електроустановчі вироби.</li><li><a class="link" href="section.html?s=ruchnyi-instrument">Інструменти</a>: ручні й електричні, приладдя та оснастка.</li><li><a class="link" href="section.html?s=santekhnika">Сантехніка та обладнання для ванної</a>: душові кабіни, дзеркала, умивальники, умивальники з тумбами.</li><li><a class="link" href="section.html?s=santekhnika">Водопостачання і каналізація</a>: каналізаційні труби, труби під паяння, комплектуючі.</li><li><a class="link" href="section.html?s=opalennya">Опалення та нагрівальне обладнання</a>: радіатори, бойлери, електричні обігрівачі.</li><li><a class="link" href="section.html?s=ventylyatsiya">Вентиляційне обладнання</a>: витяжки й обладнання для вентиляції.</li><li><a class="link" href="section.html?s=gospodarski">Господарські товари</a>: відра, щітки, рукавички.</li><li><a class="link" href="section.html?s=osnastka">Будівельні витратні матеріали</a>: супутні товари для ремонту, монтажу, будівництва й оздоблення.</li></ul><p><a class="link" href="catalog.html">Увесь каталог: ${IMB.SECTIONS.length} розділи</a></p>
      <h3>Наші партнери</h3><p>IMBAU — дилер торгових марок FRONT і TIGOR. <a class="link" href="brand.html?b=front">FRONT</a> — українська торгова марка лакофарбових матеріалів із 25-річною історією виробництва: матеріали для будівельних, ремонтних та оздоблювальних робіт. <a class="link" href="brand.html?b=tigor">TIGOR</a>: сухі будівельні суміші, лакофарбові матеріали, декоративні оздоблювальні покриття, матеріали для зовнішніх і фасадних робіт.</p>
      <h3>Послуги та можливості</h3><ul><li><b>Колерувальна студія.</b> Працює в магазині в Харкові: оберіть відтінок і <a class="link" href="tinting.html">замовте колерування</a> у свій колір.</li><li><b>Індивідуальні замовлення.</b> Замовимо товари, яких немає на полицях магазину.</li><li><b>Онлайн і в магазині.</b> Купуйте в магазині або оформлюйте замовлення на сайті.</li><li><b>Доставка по Україні.</b> Відправляємо Новою поштою й Укрпоштою. Доставку оплачує покупець за умовами обраної служби.</li><li><b>Доставка по Харкову.</b> Вартість рахуємо індивідуально: вона залежить від ваги й габаритів замовлення та відстані від основного складу до адреси. <a class="link" href="delivery.html">Умови доставки</a></li><li><b>Прорахунок і оплата.</b> <a class="link" href="podbor.html">Рахуємо матеріали</a> за списком або кошторисом, приймаємо оплату карткою <a class="link" href="evidnovlennya.html">єВідновлення</a>, виставляємо рахунки компаніям.</li></ul>
      <h3>Розвиток</h3><p>IMBAU — молодий будівельний магазин. Перший відкрився 1 жовтня 2026 року в Харкові. Плануємо розширювати асортимент, розвивати онлайн-продажі й відкривати магазини в інших містах України.</p>
      <h3>Де нас знайти</h3><p>${IMB.STORE.name}, ${IMB.STORE.address}, Харків. ${IMB.STORE.hours}, без вихідних. <a class="link" href="stores.html">Як доїхати</a></p>`,
    return: () => `<div class="info-two"><div class="info-yes"><b>Можна повернути або обміняти</b><ul><li>Невикористаний товар у цілій упаковці</li><li>Із чеком або номером замовлення</li><li>Протягом 14 днів від дня покупки</li></ul></div><div class="info-no"><b>Не можна</b><ul><li>Заколеровану фарбу, емаль чи шпаклівку</li><li>Товар, відрізаний або відважений на замовлення</li><li>Відкриті упаковки й залишки після робіт</li></ul></div></div>
      <h3>Як повернути</h3><ol><li>Залиште заявку нижче або зателефонуйте: ${IMB.STORE.phone}.</li><li>Привезіть товар у магазин: ${IMB.STORE.name}, ${IMB.STORE.address}. Якщо товар привозила наша машина, домовимось про зворотний рейс.</li><li>Гроші повертаємо тим самим способом, яким ви платили.</li></ol>
      <h3>Якщо товар із браком</h3><p>Сфотографуйте упаковку й дефект і надішліть нам. Замінимо товар або повернемо гроші.</p>
      <h3>Заявка на повернення</h3><form class="info-form" data-form="returnreq"><div class="step__grid"><div class="field"><label class="field__label" for="rt-o">Номер замовлення</label><input class="input" id="rt-o" placeholder="IMB-000000"></div>${IMB.phoneField('rt-ph', 'Телефон')}<div class="field full"><label class="field__label" for="rt-t">Товар і кількість</label><input class="input" id="rt-t" required></div><div class="field full"><label class="field__label" for="rt-r">Причина</label><select class="select" id="rt-r"><option>Не підійшов</option><option>Брак</option><option>Залишок після робіт</option></select></div></div><div class="row row--wrap"><button class="btn btn--primary">Надіслати заявку</button><a class="link" href="#">Завантажити бланк заяви</a></div></form>`,
    warranty: () => `<h3>Марки FRONT і TIGOR</h3><p>Строк придатності й умови зберігання вказані на упаковці та в технічному листі. Матеріал зберігає властивості, якщо його зберігали й наносили за інструкцією.</p>
      <h3>Інші товари</h3><p>Діє гарантія виробника. На електроінструмент видаємо гарантійний талон: зберігайте його разом із чеком, з ним звертаються до сервісного центру.</p>
      <h3>Якщо виявили дефект</h3><ol><li>Не використовуйте товар далі.</li><li>Сфотографуйте упаковку з номером партії й сам дефект.</li><li>Напишіть або зателефонуйте нам: ${IMB.STORE.phone}. Розглянемо звернення й запропонуємо заміну або повернення грошей.</li></ol>
      <h3>Документи</h3><p>Сертифікати відповідності й технічні листи зібрано на сторінці <a class="link" href="info.html?p=certs">«Сертифікати та документи»</a>.</p>`,
    discounts: () => { const c = IMB.card();
      return IMB.nbp(`<p class="info-lead">Картка клієнта дає знижку на покупки в магазині й на сайті: ${c.first} % одразу після реєстрації. Далі знижка росте разом із сумою ваших покупок, до ${c.max} %.</p>
      ${IMB.stairs({ pick: true })}
      <div class="card-ex" data-cardex>${IMB.cardEx(c.on ? c.i : 0)}</div>
      <p class="small ink-2">Натисніть на рівень, щоб побачити ціну з ним. Так ціни виглядають на сайті після входу: звичайна перекреслена, поруч ваша.</p>
      ${c.on ? `<p><b>Накопичено ${uah(c.spent)}.</b> ${c.next ? `До ${c.next.pct} % залишилось ${uah(c.left)} покупок.` : 'У вас найвищий рівень знижки.'} <a class="link" href="account.html?tab=card">Моя картка</a></p>`
        : `<div class="row row--wrap" style="align-items:center;gap:12px 20px"><a class="btn btn--primary" href="account.html?tab=card">Отримати картку</a><span class="small ink-2">Потрібен лише номер телефону.</span></div>`}
      <h3>Як це працює</h3>${faq([['Як отримати картку?', `Увійдіть на сайті за номером телефону або назвіть номер на касі в магазині. Знижка ${c.first} % діє одразу.`], ['Як росте знижка?', `Рахуємо суму всіх ваших покупок за номером телефону: ${IMB.DISCOUNT.tiers.slice(1).map(([s, p]) => p + ' % від ' + uah(s)).join(', ')}.`], ['Де я побачу свою ціну?', 'Після входу ціни на сайті показано вже з вашою знижкою: звичайна ціна перекреслена, поруч ваша. У кошику видно, скільки заощаджено і скільки залишилось до наступного рівня.'], ['Чи діє картка в магазині?', 'Так, знижка одна для магазину й сайту.'], ['Чи сумується з акціями?', 'Ні. Якщо на товар діє акційна ціна, уцінка або ціна від кількості, застосовується більша знижка.']])}`); },
    price: () => `<div class="row row--between row--wrap" style="margin-bottom:16px"><p>Актуальні ціни й наявність одним файлом.</p><a class="btn btn--dark" href="#">${IC.doc} Завантажити XLS</a></div>
      <div style="overflow-x:auto"><table class="table"><thead><tr><th>Назва</th><th>Фасовка</th><th>Ціна</th><th>Наявність</th></tr></thead><tbody>${IMB.PRODUCTS.filter(p => state(p) !== 'ended').sort(byDefault).slice(0, 12).map(p => `<tr><td><a class="link" href="${pUrl(p)}">${esc(p.name)}</a></td><td>${pack(p).label}</td><td>${uah(pack(p).price)}</td><td>${state(p) === 'ok' ? 'є' : state(p) === 'order' ? 'під замовлення' : 'немає'}</td></tr>`).join('')}</tbody></table></div>
      <p class="small ink-2" style="margin-top:12px">Показано перші 12 позицій. Оновлено: 12.11.2026.</p>`,
    reviews: () => `<div class="row row--between row--wrap" style="margin-bottom:8px"><p>Відгуки покупців про магазин і доставку. Публікуємо після перевірки покупки.</p><button class="btn btn--dark" data-modal="sreview">Написати відгук</button></div>
      ${[['Олена К.', '02.11.2026', 5, 'Купувала емаль FRONT, підібрали відтінок за фото, забрала того ж дня.', 'Дякуємо, раді бачити знову!'], ['Сергій, майстер', '28.10.2026', 5, 'Беру суміші TIGOR на об’єкти. Надіслав кошторис, зібрали замовлення і привезли наступного дня.', ''], ['Наталія', '19.10.2026', 4, 'Замовляла гіпсокартон і профіль з доставкою. Привезли вчасно, до під’їзду, далі заносили самі.', 'Дякуємо за відгук. Машина справді привозить до під’їзду або воріт: попереджаємо про це під час оформлення.']].map(([n, d, r, t, ans]) => `<article class="review"><header class="review__head"><span class="review__ava" aria-hidden="true">${n[0]}</span><span><b>${n}</b><span class="review__who">Покупка підтверджена</span></span>${IMB.stars(r)}<time>${d}</time></header><p>${t}</p>${ans ? `<div class="review__ans"><b>Відповідь IMBAU</b><p>${ans}</p></div>` : ''}</article>`).join('')}`,
    certs: () => `<p>Показуємо документи на товари, які є в продажу.</p>
      <div style="overflow-x:auto;margin-top:12px"><table class="table"><thead><tr><th>Товар</th><th>Тип документа</th><th>Дійсний до</th><th>Файл</th></tr></thead><tbody>${IMB.PRODUCTS.filter(p => (p.brand === 'FRONT' || p.brand === 'TIGOR') && state(p) !== 'ended').slice(0, 8).map((p, j) => `<tr><td>${esc(p.name)}</td><td>${j % 2 ? 'Технічний лист' : 'Сертифікат відповідності'}</td><td>${j % 2 ? 'безстроково' : '31.12.2027'}</td><td><a class="link" href="#">PDF</a></td></tr>`).join('')}</tbody></table></div>`,
    jobs: () => `<p class="info-lead">Шукаємо людей, які розуміються на матеріалах і люблять допомагати з ремонтом.</p>
      <div class="jobs">${[['Продавець-консультант', 'Торговий зал, ТЦ «Казка»', 'Допомагати покупцям обрати матеріали, рахувати кількість, оформлювати замовлення.'], ['Комірник', 'Склад у Харкові', 'Приймати товар, збирати замовлення для самовивозу й доставки.']].map(([t, w, d]) => `<div class="job"><span class="job__ex">Приклад вакансії</span><b>${t}</b><span class="small ink-2">${w}</span><p>${d}</p></div>`).join('')}</div>
      <h3>Не знайшли свою вакансію?</h3><p>Напишіть нам кілька слів про себе: зв’яжемося, коли з’явиться відповідне місце.</p>
      <form class="info-form" data-form="cv"><div class="step__grid"><div class="field"><label class="field__label" for="cv-n">Ім’я</label><input class="input" id="cv-n" required></div>${IMB.phoneField('cv-ph', 'Телефон')}<div class="field full"><label class="field__label" for="cv-t">Про себе</label><textarea class="input textarea" id="cv-t" rows="3"></textarea></div></div><button class="btn btn--primary">Надіслати</button></form>`,
    privacy: () => `<div class="info-short"><b>Коротко</b><ul><li><b>Які дані збираємо:</b> ім’я, телефон, e-mail, адресу доставки, історію замовлень.</li><li><b>Навіщо:</b> щоб оформити й доставити замовлення, повідомити про його статус, порахувати накопичувальну знижку.</li><li><b>Як видалити:</b> напишіть на ${IMB.STORE.email} або зателефонуйте. Видалимо дані, які не зобов’язані зберігати за законом.</li></ul></div>
      <h3>Файли cookie</h3><p>Необхідні файли потрібні для кошика й входу. Аналітичні та рекламні вмикаємо лише з вашої згоди; її можна змінити будь-коли.</p>
      <h3>Кому передаємо дані</h3><p>Службам доставки й платіжному сервісу: лише те, що потрібно для виконання замовлення. Іншим особам дані не передаємо.</p>
      <h3>Як із нами зв’язатися</h3><p>${IMB.STORE.email}, ${IMB.STORE.phone}.</p><p class="small ink-2">Оновлено: 12.11.2026.</p>`,
    offer: () => `<p>Цей договір є публічною пропозицією інтернет-магазину IMBAU укласти договір купівлі-продажу товарів дистанційно.</p>
      <h3>1. Загальні положення</h3><p>Оформлюючи замовлення на сайті або телефоном, покупець приймає умови цього договору.</p>
      <h3>2. Товар і ціна</h3><p>Ціни вказано в гривнях. Наявність і остаточну суму менеджер підтверджує перед відправленням.</p>
      <h3>3. Оплата й доставка</h3><p>Способи оплати та доставки описано на сторінці <a class="link" href="delivery.html">«Доставка та оплата»</a>. Доставку оплачує покупець.</p>
      <h3>4. Повернення</h3><p>Умови описано на сторінці <a class="link" href="info.html?p=return">«Обмін та повернення»</a>.</p>
      <h3>5. Реквізити продавця</h3><p>Додаються після узгодження з юристом.</p><p class="small ink-2">Редакція від 12.11.2026.</p>`,
  };

  /* ================= ІНФО-СТОРІНКИ (information.twig) ================= */
  IMB.pages.info = () => {
    const pages = { about: 'Про компанію', return: 'Обмін та повернення', warranty: 'Гарантія', faq: 'Часті запитання', discounts: 'Накопичувальна картка', price: 'Прайс-лист', reviews: 'Відгуки', certs: 'Сертифікати та документи', jobs: 'Вакансії', privacy: 'Політика конфіденційності', offer: 'Публічна оферта' };
    if (prm.get('p') === 'pro') { location.replace('pro.html'); return; }
    const k = prm.get('p') || 'about', t = pages[k] || pages.about;
    setTitle(t, t);
    /* «Питання та відповіді» — повний перелік із тим самим блоком, що стоїть на інших сторінках */
    if (k === 'faq') { setTitle('Часті запитання', 'Часті запитання'); const art = qs('article.card'); if (art) art.outerHTML = IMB.faqBlock({ all: false, title: 'Усі теми', lead: 'Оберіть тему або знайдіть питання в переліку.', cls: 'faq--page' }); }
    qs('[data-slot="crumbs"]').innerHTML = crumbs([k === 'faq' ? 'Часті запитання' : t]);
    const art = qs('article.card'); if (art && k !== 'faq' && INFO[k]) art.innerHTML = INFO[k]().replace(/<h3>/g, '<h2 class="prose__h">').replace(/<\/h3>/g, '</h2>') /* підзаголовки другого рівня з виглядом третього: після h1 не має йти h3 */ + '<p class="xs muted info-draft">Чернетка тексту від 12.11.2026. Формулювання й цифри уточнюються.</p>';
    qs('[data-slot="nav"]').innerHTML = Object.entries(pages).map(([a, b]) => `<a class="chip${a === k ? ' is-on' : ''}" href="info.html?p=${a}">${b}</a>`).join('');
  };

  /* ================= ПОДАРУНКОВИЙ СЕРТИФІКАТ (account/voucher.twig) =================
     Сертифікат намальовано як картку-зразок кольору з віяла фарб: кольорове поле з номіналом і біла
     смужка з підписом. Номінал, оформлення, імена й побажання одразу видно на картці. */
  IMB.pages.certificate = () => {
    const GF = IMB.GIFT, G = { sum: 2000, own: false, theme: GF.themes[0].k, format: 'e', to: '', from: '', msg: '' };
    const card = qs('[data-slot="gcard"]'), form = qs('[data-slot="gform"]');
    const sumNow = () => G.own ? Math.max(0, Math.round(+String(qs('#gf-own', form).value).replace(/\D/g, '') || 0)) : G.sum;
    const okSum = v => v >= GF.min && v <= GF.max;
    const drawCard = () => { const th = GF.themes.find(x => x.k === G.theme), v = sumNow();
      card.style.setProperty('--g-bg', th.bg); card.style.setProperty('--g-ink', th.ink);
      card.innerHTML = `<div class="gcard__field"><div class="gcard__top"><span class="logo__mark" aria-hidden="true">IMBAU</span><span class="gcard__kind">Подарунковий сертифікат</span></div>
          <div class="gcard__sum">${okSum(v) ? num(v) : '—'}<span>грн</span></div><div class="gcard__theme">${th.t}</div></div>
        <div class="gcard__label"><div class="gcard__who"><span><i>Для</i><b>${esc(G.to) || 'Ім’я одержувача'}</b></span>${G.from ? `<span><i>Від</i><b>${esc(G.from)}</b></span>` : ''}</div>
          ${G.msg ? `<p class="gcard__msg">${esc(G.msg)}</p>` : ''}<div class="gcard__code"><span>${th.code}</span><span>№ 0000 0000 0000</span></div></div>`;
      const b = qs('[data-gpay]', form); if (b) { b.textContent = okSum(v) ? `Перейти до оплати: ${uah(v)}` : 'Перейти до оплати'; b.disabled = !okSum(v); }
      const own = qs('[data-gown]', form); if (own) own.classList.toggle('is-invalid', G.own && !!qs('#gf-own', form).value && !okSum(v)); };
    form.innerHTML = `<h2>Оформлення сертифіката</h2>
      <fieldset class="gf"><legend>Номінал</legend><div class="gf__sums">${GF.sums.map(v => `<label class="gf__sum"><input type="radio" name="gsum" value="${v}"${v === G.sum ? ' checked' : ''}><span>${num(v)} грн</span></label>`).join('')}<label class="gf__sum"><input type="radio" name="gsum" value="own"><span>Своя сума</span></label></div>
        <div class="field gf__own" data-gown hidden><label class="field__label" for="gf-own">Сума, грн</label><input class="input" id="gf-own" inputmode="numeric" placeholder="Від ${num(GF.min)} до ${num(GF.max)}"><span class="field__error">Вкажіть суму від ${num(GF.min)} до ${num(GF.max)} грн</span></div></fieldset>
      <fieldset class="gf"><legend>Оформлення</legend><div class="gf__themes">${GF.themes.map(t => `<label class="gf__theme"><input type="radio" name="gtheme" value="${t.k}"${t.k === G.theme ? ' checked' : ''}><i style="background:${t.bg}"></i><span>${t.t}</span></label>`).join('')}</div></fieldset>
      <fieldset class="gf"><legend>Формат</legend><div class="choices"><label class="choice"><input type="radio" name="gformat" value="e" checked><span><span class="choice__title">Електронний</span><br><span class="choice__meta">Надішлемо на e-mail після оплати. Можна переслати у Viber</span></span></label>
        <label class="choice"><input type="radio" name="gformat" value="p"><span><span class="choice__title">Друкований</span><br><span class="choice__meta">Заберете в магазині: ${IMB.STORE.name}, ${IMB.STORE.address}</span></span></label></div></fieldset>
      <fieldset class="gf"><legend>Кому й від кого</legend><div class="step__grid"><div class="field"><label class="field__label" for="gf-to">Ім’я одержувача</label><input class="input" id="gf-to" maxlength="24" required><span class="field__error">Вкажіть, для кого сертифікат</span></div><div class="field"><label class="field__label" for="gf-from">Від кого (необов’язково)</label><input class="input" id="gf-from" maxlength="24"></div>
        <div class="field full"><label class="field__label" for="gf-msg">Побажання (необов’язково)</label><textarea class="input textarea" id="gf-msg" rows="2" maxlength="90" placeholder="Наприклад: нехай ремонт закінчиться швидко"></textarea><span class="field__hint"><span data-gcount>0</span> із 90 символів</span></div></div></fieldset>
      <fieldset class="gf"><legend>Ваші контакти</legend><div class="step__grid">${IMB.phoneField('gf-ph', 'Телефон')}<div class="field" data-gmail><label class="field__label" for="gf-mail">E-mail для сертифіката</label><input class="input" id="gf-mail" type="email" autocomplete="email" placeholder="name@example.com" required><span class="field__error">Вкажіть e-mail, на який надіслати сертифікат</span></div></div></fieldset>
      <button class="btn btn--primary btn--lg btn--block" data-gpay>Перейти до оплати</button>
      <p class="xs ink-2">Сертифікат приймаємо в магазині та на сайті: код вводиться в кошику. Строк дії вказано на сертифікаті.</p>`;
    form.addEventListener('input', e => { const t = e.target;
      if (t.name === 'gsum') { G.own = t.value === 'own'; if (!G.own) G.sum = +t.value; qs('[data-gown]', form).hidden = !G.own; if (G.own) qs('#gf-own', form).focus(); }
      if (t.name === 'gtheme') G.theme = t.value;
      if (t.name === 'gformat') { G.format = t.value; const m = qs('[data-gmail]', form); m.hidden = G.format === 'p'; qs('input', m).required = G.format === 'e'; }
      if (t.id === 'gf-to') G.to = t.value.trim(); if (t.id === 'gf-from') G.from = t.value.trim();
      if (t.id === 'gf-msg') { G.msg = t.value.trim(); qs('[data-gcount]', form).textContent = t.value.length; }
      if (t.closest('.field') && t.id !== 'gf-own') t.closest('.field').classList.remove('is-invalid');
      drawCard(); });
    /* Перевірка перед відправкою: обов'язкові поля підсвічуємо самі, без системних підказок браузера */
    form.noValidate = true;
    form.addEventListener('submit', e => { let bad = null; qsa('[required]', form).forEach(inp => { if (inp.classList.contains('js-phone') || inp.closest('[hidden]')) return; const no = !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value.trim())); inp.closest('.field').classList.toggle('is-invalid', no); if (no && !bad) bad = inp; });
      if (bad) { e.preventDefault(); e.stopImmediatePropagation(); bad.focus(); } }, true);
    IMB.onForm = kind => { if (kind !== 'gift') return; const v = sumNow();
      IMB.openModal(`<div class="result__icon">${IC.check}</div><h2 class="modal__title" id="modal-t" style="margin-top:16px">Сертифікат на ${uah(v)} оформлено</h2><p class="ink-2">${G.format === 'e' ? 'Після оплати надішлемо його на вказаний e-mail.' : `Після оплати підготуємо його до видачі й напишемо у Viber. Забрати можна в магазині: ${IMB.STORE.name}, ${IMB.STORE.address}.`}</p><p class="xs muted" style="margin-top:8px">У прототипі оплата не відбувається.</p><button class="btn btn--dark" style="margin-top:20px" data-close>Добре</button>`); };
    drawCard();
  };

  /* ================= ОПТОВИКАМ І МАЙСТРАМ (information/pro.twig) =================
     Дві аудиторії на одній сторінці: перемикач міняє переваги й підставляє тип покупця у форму.
     Розміри знижок тут не названо: таблицю умов затверджує власник, під неї лишено місце. */
  IMB.pages.pro = () => {
    const A = {
      master: { t: 'Майстрам і бригадам', who: 'Майстер', items: [
        [IC.tag, 'Ціна від обсягу', 'На суміші й гіпсокартон нижча ціна діє автоматично від 20–30 штук. Поріг видно в картці товару.', 'promo.html', 'Товари з ціною від обсягу'],
        [IC.list, 'Прорахунок за списком', 'Надішліть перелік матеріалів файлом, фото або текстом. Порахуємо кількість і зберемо замовлення.', 'podbor.html', 'Надіслати список'],
        [IC.truck, 'Доставка на об’єкт', 'Нашою машиною по Харкову й області, у зручний день. Від 450 грн, вартість рахуємо індивідуально.', 'delivery.html', 'Умови доставки'],
        [IC.clock, 'Резерв на 3 дні', 'Зібране замовлення чекає в магазині три дні. Заберете, коли зручно.'],
        [IC.palette, 'Колерування за 15 хвилин', 'Рецепт зберігаємо за номером телефону: докупите той самий відтінок для наступного об’єкта.', 'tinting.html', 'Про колерування'],
        [IC.phone, 'Замовлення одним дзвінком', 'Залиште номер у картці товару, і менеджер оформить замовлення сам.'],
      ] },
      company: { t: 'Оптовикам і компаніям', who: 'Компанія', items: [
        [IC.doc, 'Рахунок і документи', 'Працюємо з компаніями та ФОП (фізичними особами-підприємцями) за безготівковим розрахунком. Виставляємо рахунок, видаємо накладну.'],
        [IC.tag, 'Ціна під ваш обсяг', 'На великі партії менеджер рахує ціну окремо. Залиште заявку з переліком і кількістю.'],
        [IC.list, 'Прайс-лист', 'Актуальні ціни на весь асортимент одним файлом.', 'info.html?p=price', 'Відкрити прайс-лист'],
        [IC.check, 'Сертифікати на товар', 'Сертифікати відповідності й технічні листи для ваших замовників і тендерів.', 'info.html?p=certs', 'Сертифікати та документи'],
        [IC.truck, 'Доставка на об’єкт або склад', 'Нашою машиною по Харкову й області. В інші міста відправляємо Новою поштою те, що вона приймає.', 'delivery.html', 'Умови доставки'],
        [IC.box, 'Дилер марок FRONT і TIGOR', 'Лакофарбові матеріали й сухі будівельні суміші двох торгових марок, дилером яких є IMBAU.', 'brand.html?b=tigor', 'Про TIGOR'],
      ] },
    };
    let cur = prm.get('a') === 'company' ? 'company' : 'master';
    const tabs = qs('[data-slot="pro-tabs"]'), grid = qs('[data-slot="pro-grid"]'), form = qs('[data-form="pro"]');
    const draw = () => {
      tabs.innerHTML = Object.entries(A).map(([k, v]) => `<button class="tab" role="tab" data-proa="${k}" aria-selected="${k === cur}">${v.t}</button>`).join('');
      grid.innerHTML = A[cur].items.map(([ic, t, d, href, label]) => `<div class="pro-perk">${ic}<b>${t}</b><p>${d}</p>${href ? `<a class="link small" href="${href}">${label}</a>` : ''}</div>`).join('');
    };
    const sync = () => { const v = (qs('input[name="pwho"]:checked', form) || {}).value, co = v === 'Компанія' || v === 'Магазин'; qsa('[data-proco]', form).forEach(x => { x.hidden = !co; }); };
    tabs.addEventListener('click', e => { const b = e.target.closest('[data-proa]'); if (!b) return; cur = b.dataset.proa; draw(); const r = qs(`input[name="pwho"][value="${A[cur].who}"]`, form); if (r) { r.checked = true; sync(); } qs(`[data-proa="${cur}"]`, tabs).focus(); });
    form.addEventListener('change', sync);
    draw(); const r0 = qs(`input[name="pwho"][value="${A[cur].who}"]`, form); if (r0) r0.checked = true; sync();
  };

  /* ================= ПОСТАЧАЛЬНИКАМ (information/suppliers.twig, прихована) ================= */
  IMB.pages.suppliers = () => {
    const el = qs('[data-slot="sup-cats"]'); if (el) el.innerHTML = IMB.SECTIONS.map(x => `<span class="chip-tile chip-tile--static">${x.n}</span>`).join('');
    const sel = qs('#sp-cat'); if (sel) sel.innerHTML = '<option value="">Оберіть розділ</option>' + IMB.SECTIONS.map(x => `<option>${x.n}</option>`).join('') + '<option>Інше</option>';
  };

  /* ================= БЛОГ ================= */
  IMB.pages.blog = () => {
    const A = IMB.ARTICLES, a = +prm.get('a');
    /* Обкладинка статті: фото товару на кольоровому полі + рубрика. Не залежить від наявності ілюстрацій:
       редактор обирає товар і тон, обкладинка збирається сама. */
    const cover = (x, big) => `<span class="acover acover--${x.tone}${big ? ' acover--big' : ''}" data-tag="${x.tag}"><span class="acover__tag">${x.tag}</span><img src="assets/img/${x.img}.webp" alt="" width="720" height="720"${big ? '' : ' loading="lazy"'}></span>`;
    const card = (x, j) => `<a class="acard" href="blog.html?a=${j + 1}">${cover(x)}<span class="acard__meta">${x.date} · ${x.min} хв читання</span><b class="acard__title">${x.t}</b><span class="acard__lead">${x.d}</span></a>`;
    if (a) {
      const x = A[a - 1] || A[0], full = a === 1;
      setTitle(x.t, x.t); document.body.classList.add('is-article'); qs('[data-h1]').hidden = true;
      qs('[data-slot="crumbs"]').innerHTML = crumbs([['Поради', 'blog.html'], x.t]);
      /* Шаблон статті: заголовок і вступ → обкладинка → зміст збоку → текст із вставками (порада, таблиця,
         товар у тексті) → товари зі статті → інші статті. Перша стаття заповнена повністю як зразок. */
      const sections = full ? [
        ['Матова чи шовковиста', `<p>Матова фарба ховає дрібні нерівності стіни, тому її беруть для стелі та віталень. Шовковисто-матова трохи блищить і краще миється, тому вона доречна в коридорі, на кухні й у дитячій.</p><div class="atable-wrap"><table class="table atable"><thead><tr><th>Фарба</th><th>Вигляд</th><th>Де доречна</th></tr></thead><tbody><tr><td>FRONT акрилова інтер’єрна</td><td>Матова</td><td>Стеля, спальня, вітальня</td></tr><tr><td>FRONT маттлатекс</td><td>Матова</td><td>Стіни й стеля, вологі приміщення</td></tr><tr><td>FRONT Satinlatex</td><td>Шовковисто-матова</td><td>Коридор, кухня, дитяча</td></tr></tbody></table></div>`],
        ['Скільки фарби брати', `<p>Акрилова інтер’єрна фарба FRONT витрачається по 250–300 г на квадратний метр за один шар. Фарбують у два шари, тож на 20 м² стін потрібно близько 11 кг: одне відро 7 кг і одне 3 кг із невеликим запасом.</p><div class="atip"><b>Порада технолога</b><p>Беріть усю фарбу одразу, особливо заколеровану. Якщо докуповувати пізніше, відтінок може трохи відрізнятися.</p></div>${IMB.byId.acr ? `<a class="ainline" href="${pUrl(P('acr'))}">${packshot(P('acr'))}<span><b>${esc(P('acr').name)}</b><span>від ${pack(P('acr'), 0).price} грн · калькулятор витрати в картці товару</span></span>${IC.arrow}</a>` : ''}`],
        ['Як підготувати стіну', `<p>Стіна має бути сухою, чистою й рівною. Тріщини й нерівності закривають шпаклівкою, після висихання наносять ґрунтовку. Вона зменшує витрату фарби і дає рівний колір без плям.</p><p>Свіжу штукатурку й бетон фарбують не раніше ніж через 28 діб.</p>`],
        ['Як фарбувати', `<p>Перший шар можна розвести водою до 10 %, другий — до 5 %. Другий шар наносять після висихання першого, через 1–2 години. Працюйте при температурі від +10 до +25 °C і не робіть перерв посеред стіни, щоб не лишилося стиків.</p>`],
      ] : [['Коротко', `<p>${x.d}</p><p>Текст статті пише технолог. Тут він розбитий на розділи з підзаголовками, як у статті про фарбу.</p>`], ['На що дивитися', `<p>Розділ із таблицею або переліком. Кожна стаття веде в розділ каталогу і на конкретні товари.</p><div class="atip"><b>Порада технолога</b><p>Вставка для короткої практичної поради.</p></div>`]];
      qs('[data-slot="blog"]').innerHTML = `<article class="article"><header class="article__head"><span class="article__tag">${x.tag}</span><h1>${x.t}</h1><p class="lead">${x.d}</p><p class="article__meta">Технолог IMBAU · ${x.date} · ${x.min} хв читання</p></header>
        ${cover(x, true)}
        <div class="article__body"><nav class="article__toc" aria-label="Зміст статті"><b>У статті</b><ol>${sections.map(([h], j) => `<li><a href="#s${j + 1}">${h}</a></li>`).join('')}<li><a href="#art-products">Товари зі статті</a></li></ol></nav>
          <div class="prose article__text">${sections.map(([h, t], j) => `<h2 id="s${j + 1}">${h}</h2>${t}`).join('')}</div></div></article>
        <section class="section" id="art-products"><div class="section-head"><h2>Товари зі статті</h2></div><div class="listing grid-4" data-slot="art-p"></div></section>
        <section class="section"><div class="section-head"><h2>Читайте також</h2><a class="link" href="blog.html">Усі поради</a></div><div class="acards">${A.map((y, j) => y === x ? '' : card(y, j)).join('')}</div></section>`;
      IMB.renderList(qs('[data-slot="art-p"]'), x.ids, 'Стаття'); return;
    }
    qs('[data-slot="crumbs"]').innerHTML = crumbs(['Поради']);
    /* Перша стаття — велика, решта — картками */
    qs('[data-slot="blog"]').innerHTML = `<a class="afeature" href="blog.html?a=1">${cover(A[0], true)}<span class="afeature__text"><span class="acard__meta">${A[0].date} · ${A[0].min} хв читання</span><b class="afeature__title">${A[0].t}</b><span class="acard__lead">${A[0].d}</span><span class="afeature__go">Читати ${IC.arrow}</span></span></a><div class="acards">${A.slice(1).map((y, j) => card(y, j + 1)).join('')}</div>`;
  };

  /* ================= 404 ================= */
  IMB.pages.notfound = () => { qs('[data-slot="tiles"]').innerHTML = tiles(IMB.SECTIONS.filter(x => x.top).slice(0, 6)); };

  /* ================= UI-KIT ================= */
  IMB.pages.uikit = () => {
    const vars = ['--c-bg', '--c-surface', '--c-sage', '--c-chip', '--c-line', '--c-ink', '--c-ink-2', '--c-muted', '--c-lime', '--c-lime-h', '--c-green', '--c-brand', '--c-brand-print', '--c-brand-grey', '--c-warn', '--c-warn-bg', '--c-danger', '--c-danger-bg'];
    const cs = getComputedStyle(document.documentElement);
    qs('[data-slot="sw"]').innerHTML = vars.map(v => `<div><i style="background:var(${v})"></i><span><b>${v}</b><br>${cs.getPropertyValue(v).trim()}</span></div>`).join('');
    IMB.renderList(qs('[data-slot="cards"]'), ['acr', 'lor', 'gre', 'stz'], 'UI-kit');
    /* Раунд 12.11: стікери, стан «Поставки припинено», блок запитань */
    const ks = qs('[data-slot="kit-stickers"]');
    if (ks) {
      const where = { photo: 'на фото вгорі', mark: 'на фото внизу', pack: 'у рядку фасовки', ship: 'у рядку отримання' };
      ks.innerHTML = `<div class="kit-stk">${Object.entries(IMB.STICKERS).map(([k, d], j) => `<div class="kit-stk__row"><span class="kit-stk__n">${j + 1}</span><span class="kit-stk__s">${IMB.sticker(k, 'stk--lg')}</span><span class="kit-stk__s">${IMB.sticker(k)}</span><span class="kit-stk__s">${d.tier === 'mark' ? `<span class="pcard__marks is-n3" style="position:static">${IMB.sticker(k, 'stk--mark')}</span>` : k === 'kharkiv' ? IMB.sticker(k, 'stk--away') : ''}</span><span class="small"><b>${where[d.tier]}</b><br><span class="ink-2">${d.hint}</span></span></div>`).join('')}</div>`;
      IMB.renderList(qs('[data-slot="kit-stkcards"]'), ['tc16', 'acr', 'tm12', 'sat', 'lor', 'gs41', 'nail', 'old', 'gre'], 'UI-kit: стікери');
      /* Три варіанти вигляду для «Акція», «Хіт», «Новинка». Кнопка вмикає варіант на всьому сайті (S.stk). */
      const kv = qs('[data-slot="kit-stkvars"]');
      if (kv) { const V = [['a', 'А. Плашка з піктограмою', 'Назва й піктограма разом. Читається без підказки, тому це основний варіант.'], ['b', 'Б. Круглий значок', 'Лише піктограма й колір. Займає найменше місця на фото; назва є в підказці та для читача екрана.'], ['c', 'В. Прапорець', 'Смужка від лівого краю фото. Найпомітніший варіант, для сильних акцій.']];
        const drawV = () => { kv.innerHTML = V.map(([v, t, d]) => `<div class="kit-var${S.stk === v ? ' is-on' : ''}"><div class="kit-var__shot">${packshot(P('acr'))}<span class="kit-var__stk">${['sale', 'hit', 'new'].map(k => IMB.sticker(k, '', v)).join('')}</span></div><b>${t}</b><p class="small ink-2">${d}</p><button type="button" class="btn ${S.stk === v ? 'btn--dark' : 'btn--ghost'} btn--sm" data-stkvar="${v}" aria-pressed="${S.stk === v}">${S.stk === v ? 'Зараз на сайті' : 'Показати на сайті'}</button></div>`).join(''); };
        drawV(); kv.addEventListener('click', e => { const b = e.target.closest('[data-stkvar]'); if (!b) return; IMB.setStk(b.dataset.stkvar); drawV(); IMB.renderList(qs('[data-slot="kit-stkcards"]'), ['tc16', 'acr', 'tm12', 'sat', 'lor', 'gs41', 'nail', 'old', 'gre'], 'UI-kit: стікери'); IMB.toast && IMB.toast('Варіант увімкнено на всьому сайті'); }); }
    }
    /* Блоки раундів 10–11.11: фото й заглушки, плитки, обкладинки */
    const box = (html, w, cap) => `<figure style="width:${w}px">${html}<figcaption class="xs ink-2" style="margin-top:6px">${cap}</figcaption></figure>`;
    qs('[data-slot="kit-shots"]').innerHTML = box(packshot(P('acr')), 140, 'Фото товару') + box(packshot(P('stz')), 140, 'Немає фото, картка') + box(packshot(P('stz'), 1), 220, 'Немає фото, сторінка товару') + `<figure class="photo-slot" style="width:220px"><div class="shot shot--empty" style="aspect-ratio:1">${IC.store}<span class="shot__note">Фото готується</span></div><figcaption class="xs ink-2" style="margin-top:6px">Місце під фото магазину</figcaption></figure>`;
    const B = IMB.BRANDS.FRONT.lines[0];
    qs('[data-slot="kit-tiles"]').innerHTML = tiles(IMB.SECTIONS.filter(x => x.slug === 'lfm')) + `<a class="sub-tile" href="#"><span class="sub-tile__name">Фарби інтер’єрні</span><span class="sub-tile__cnt">7 товарів</span>${IC.arrow}</a><a class="chip-tile" href="#">Для фарбування</a><a class="bline" href="#"><span class="shot shot--photo"><img src="assets/img/${B[2]}.webp" alt="" width="720" height="720" loading="lazy"></span><span class="bline__text"><b>${B[0]}</b><span>${B[1]}</span></span>${IC.arrow}</a>`;
    qs('[data-slot="kit-covers"]').innerHTML = IMB.ARTICLES.slice(0, 2).map(x => `<a class="acard" href="blog.html"><span class="acover acover--${x.tone}" data-tag="${x.tag}"><span class="acover__tag">${x.tag}</span><img src="assets/img/${x.img}.webp" alt="" width="720" height="720" loading="lazy"></span><span class="acard__meta">${x.date} · ${x.min} хв читання</span><b class="acard__title">${x.t}</b></a>`).join('');
    qs('[data-slot="kit-modal"]').addEventListener('click', e => { const b = e.target.closest('[data-kitm]'); if (!b) return; ({ add: () => IMB.addToCart('gs41'), one: () => IMB.oneClick('tm12'), toast: () => IMB.toast('Додано в обране · <a href="compare.html?tab=fav">Переглянути</a>') })[b.dataset.kitm](); });
  };
})();
