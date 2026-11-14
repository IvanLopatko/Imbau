/* =========================================================
   IM BAU — ядро прототипу
   - стан (кошик, обране, порівняння, місто) у localStorage
   - спільні частини: шапка, футер, картка товару, модалки
   - бізнес-правила: ціна за одиницю, сходинка ціни, обмеження НП
   - dataLayer: події GA4 ecommerce (див. HANDOFF.md → Аналітика)
   ========================================================= */
(function () {
  const IMB = window.IMB;

  /* ---------- Іконки (inline SVG, stroke = currentColor) ---------- */
  const i = (d, w = 1.7) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    search: i('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    pin: i('<path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    truck: i('<path d="M2 6h11v10H2zM13 9h4l4 4v3h-8"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
    heart: i('<path d="M12 20s-8-4.6-8-10.4A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.6C20 15.4 12 20 12 20z"/>'),
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-8-4.6-8-10.4A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.6C20 15.4 12 20 12 20z"/></svg>',
    cmp: i('<path d="M4 8h15l-3.5-3.5M20 16H5l3.5 3.5"/>'),
    bag: i('<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>'),
    grid: i('<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>'),
    arrow: i('<path d="M4 12h15M13 6l6 6-6 6"/>'),
    close: i('<path d="M6 6l12 12M18 6 6 18"/>'),
    check: i('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 2),
    phone: i('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
    palette: i('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.6-1-2.6 1-1.4 2-1.4h2a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>'),
    doc: i('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
    user: i('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    menu: i('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    trash: i('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>'),
    info: i('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    warn: i('<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17v.5"/>'),
    store: i('<path d="M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18M9 20v-6h6v6"/>'),
    box: i('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'),
    chat: i('<path d="M4 5h16v11H9l-5 4z"/>'),
    calc: i('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h4"/>'),
    chev: i('<path d="m9 6 6 6-6 6"/>'),
    euro: i('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>'),
    back: i('<path d="M20 12H5M11 6l-6 6 6 6"/>'),
    zoom: i('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>'),
    clock: i('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    lock: i('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    upload: i('<path d="M12 16V5M7 9l5-5 5 5M5 19h14"/>'),
    scale: i('<circle cx="12" cy="6.5" r="2.5"/><path d="M8.5 9h7L19 20H5z"/>'),
    home: i('<path d="M4 11l8-6.5 8 6.5v9H4z"/><path d="m9 14.5 2 2 4-4"/>'),
    gift: i('<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-1.5-4-6-4-5.5-1.5S10 9 12 9zm0 0c1.5-4 6-4 5.5-1.5S14 9 12 9z"/>'),
    down: i('<path d="m6 9 6 6 6-6"/>'),
    brief: i('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>'),
    list: i('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>', 2),
    tag: i('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>'),
  };
  IC.card = IC.euro;
  IMB.IC = IC;

  /* ---------- Сховище ---------- */
  const KEY = 'imbau_proto_v1';
  const DEF = { cart: [], fav: [], cmp: [], city: 'Харків', lang: 'UA', seen: [], orders: [], cookie: null, user: null, promo: null, cityOk: false, gift: null };
  let S;
  try { S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = Object.assign({}, DEF); }
  if (!Array.isArray(S.cart)) S.cart = [];
  S.cart = S.cart.filter(x => x && IMB.byId[x.id]); /* товар міг зникнути з каталогу */
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} updateCounters(); };
  IMB.S = S; IMB.save = save;

  /* ---------- Хелпери ---------- */
  const uah = n => Math.round(n).toLocaleString('uk-UA').replace(/,/g, ' ') + ' грн';
  const num = n => (Math.round(n * 100) / 100).toLocaleString('uk-UA');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const P = id => IMB.byId[id];
  const url = (page, params) => page + '.html' + (params ? '?' + new URLSearchParams(params) : '');
  const pUrl = p => url('product', { id: p.id });
  const secUrl = n => url('section', { s: (IMB.SECTIONS.find(x => x.n === n) || {}).slug || '' });
  const catUrl = (sub, extra) => url('category', Object.assign({ sub }, extra || {}));
  Object.assign(IMB, { uah, num, esc, qs, qsa, P, url, pUrl, secUrl, catUrl });

  const state = p => p.state || ((p.stock.kazka + p.stock.sklad) > 0 ? 'ok' : 'out');
  /* ---------- Накопичувальна картка ----------
     Картка є в покупця, що увійшов; рівень залежить від суми покупок (IMB.DISCOUNT у data.js).
     Знижки не сумуються: діє більша — картка, акційна ціна чи ціна від кількості. */
  const cardAt = spent => { const T = IMB.DISCOUNT.tiers; let i = 0; T.forEach((t, j) => { if (spent >= t[0]) i = j; }); const nx = T[i + 1]; return { i, pct: T[i][1], spent, next: nx ? { sum: nx[0], pct: nx[1] } : null, left: nx ? nx[0] - spent : 0 }; };
  const card = () => { const T = IMB.DISCOUNT.tiers, c = cardAt(S.user ? IMB.DISCOUNT.demo.spent : 0); c.on = !!S.user; if (!c.on) c.pct = 0; c.first = T[0][1]; c.max = T[T.length - 1][1]; return c; };
  /* Ціна зі знижкою: від 50 грн округлюємо до гривні, дешевші товари — до копійки */
  const cut = (v, pct) => { const x = v * (1 - pct / 100); return v >= 50 ? Math.round(x) : Math.round(x * 100) / 100; };
  /* «5 %» не розривається між рядками */
  const nbp = v => String(v).replace(/(\d) %/g, '$1\u00A0%');
  Object.assign(IMB, { card, cardAt, cut, nbp });

  /* Фасовка товару. price — ціна, яку платить покупець; full — звичайна ціна (її перекреслюємо);
     off — відсоток знижки; by — звідки знижка: 'card' (картка клієнта), 'promo' (акція чи уцінка) або ''. */
  const pack = (p, k = p.sel) => { const [label, kg, shelf, base] = p.packs[k]; const full = p.was ? Math.round(shelf / (1 - p.was / 100)) : shelf, c = card().pct, byCard = c > (p.was || 0);
    return { k, label, kg, base, full, price: byCard ? cut(full, c) : shelf, off: byCard ? c : p.was || 0, by: byCard ? 'card' : p.was ? 'promo' : '' }; };
  const perUnit = (p, k) => { const pk = pack(p, k); return pk.base > 1 || p.unit === 'кг' || p.unit === 'л' || p.unit === 'м²' ? `${num(pk.price / pk.base)} грн/${p.unit}` : ''; };
  /* Обмеження Нової пошти: ЛФМ не відправляємо; >30 кг або листові — тільки місто */
  const npReason = (p, k = p.sel) => p.sec.startsWith('ЛФМ') ? 'фарби та ЛФМ' : (pack(p, k).kg > 30 || p.kind === 'sheet' && p.id === 'gkl') ? 'вага чи габарит понад ліміт (30 кг)' : '';
  const shipLine = p => npReason(p) ? 'Самовивіз сьогодні · доставка · без пошти' : 'Самовивіз сьогодні · доставка · Нова пошта, Укрпошта';
  const pickupWhen = p => p.stock.kazka > 0 ? 'сьогодні' : p.stock.sklad > 0 ? 'завтра, зі складу' : 'після надходження';
  Object.assign(IMB, { state, pack, perUnit, npReason, shipLine, pickupWhen });

  /* ---------- Стікери (довідник і правила — IMB.STICKERS у data.js) ---------- */
  const STK_ON = { markdown: p => !!p.markdown, sale: p => !!p.promo, new: p => !!p.isNew, order: p => state(p) === 'order', kharkiv: p => !!npReason(p), weight: p => !!p.byWeight, tint: p => !!p.tint, ua: p => !!p.ua, evid: p => !!p.evid };
  /* Стікери товару в порядку пріоритету. У знятого з поставок товару стікерів немає. */
  const stickersOf = p => state(p) === 'ended' ? [] : Object.keys(IMB.STICKERS).filter(k => STK_ON[k](p));
  const STK_IC = { pin: IC.pin, scale: IC.scale, evid: IC.home, tint: '<i class="stk__dot stk__dot--tint" aria-hidden="true"></i>', ua: '<i class="stk__dot stk__dot--ua" aria-hidden="true"></i>' };
  const sticker = (k, cls = '') => { const d = IMB.STICKERS[k]; return `<span class="stk stk--${k}${cls ? ' ' + cls : ''}" title="${esc(d.hint)}">${d.ic ? STK_IC[d.ic] : ''}<span class="stk__t">${d.t}</span></span>`; };
  /* Стара ціна для уцінки: p.was — на скільки відсотків вона була вищою */
  const oldPrice = (p, k = p.sel) => { const pk = pack(p, k); return pk.full > pk.price ? pk.full : 0; };
  /* Перекреслена ціна й плашка відсотка. Акція — лаймова, уцінка — жовта, картка клієнта — зелена з піктограмою картки. */
  const offHtml = (p, pk, lg) => pk.full > pk.price ? `<s class="price__old${lg ? ' price__old--lg' : ''}" aria-label="${pk.by === 'card' ? 'Ціна без картки' : 'Стара ціна'} ${num(pk.full)} грн">${num(pk.full)}${lg ? ' грн' : ''}</s><span class="price__pct${lg ? ' price__pct--lg' : ''}${pk.by === 'card' ? ' price__pct--card' : p.markdown ? ' price__pct--md' : ''}"${pk.by === 'card' ? ' title="Знижка за вашою карткою клієнта"' : ''}>${pk.by === 'card' ? IC.card + '<span class="sr-only">за карткою клієнта </span>' : ''}−${pk.off}\u00A0%${lg && pk.by === 'card' ? ' за карткою' : ''}</span>` : '';
  /* Сходинки знижки: чотири рівні картки. pick — рівні можна натискати (сторінка картки показує приклад ціни). */
  const stairs = (opt = {}) => { const c = card(), sel = c.on ? c.i : 0;
    return nbp(`<div class="dstairs${opt.pick ? ' dstairs--pick' : ''}"${opt.pick ? ' role="group" aria-label="Рівні знижки: натисніть, щоб побачити ціну"' : ' role="list"'}>${IMB.DISCOUNT.tiers.map(([sum, pct], j) => {
      const now = c.on && j === c.i, done = c.on && j < c.i, fill = done ? 100 : now ? (c.next ? Math.round((c.spent - sum) / (c.next.sum - sum) * 100) : 100) : 0;
      const inner = `<b class="dstep__pct">${pct} %</b><span class="dstep__lbl">${sum ? 'від ' + uah(sum) : 'за реєстрацію'}</span>${now ? '<i class="dstep__now">ваш рівень</i>' : ''}${c.on ? `<span class="dstep__bar" aria-hidden="true"><i style="width:${fill}%"></i></span>` : ''}`;
      const cls = `dstep${now ? ' is-now' : done ? ' is-done' : ''}`;
      return opt.pick ? `<button type="button" class="${cls}" data-tier="${j}" aria-pressed="${j === sel}" style="--i:${j}">${inner}</button>` : `<div class="${cls}" role="listitem" style="--i:${j}">${inner}</div>`; }).join('')}</div>`); };
  /* Приклад ціни для обраного рівня: так ціна виглядає на сайті після входу */
  const cardEx = j => { const p = IMB.byId.acr, k = p.packs.length - 1, full = p.packs[k][2], pct = IMB.DISCOUNT.tiers[j][1], price = cut(full, pct);
    return nbp(`${packshot(p)}<span class="card-ex__name"><span class="small ink-2">Наприклад</span><b>${nb(esc(p.name))}, ${nb(p.packs[k][0])}</b></span><span class="card-ex__price"><span class="card-ex__old"><s class="price__old" aria-label="Ціна без картки ${num(full)} грн">${num(full)} грн</s><span class="price__pct price__pct--card">${IC.card}−${pct} %</span></span><b>${uah(price)}</b><span class="card-ex__save">економія ${uah(full - price)}</span></span>`); };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.dstairs--pick [data-tier]'); if (!b) return; qsa('[data-tier]', b.closest('.dstairs')).forEach(x => x.setAttribute('aria-pressed', x === b)); const ex = qs('[data-cardex]'); if (ex) ex.innerHTML = cardEx(+b.dataset.tier); });
  Object.assign(IMB, { stickersOf, sticker, oldPrice, offHtml, stairs, cardEx });

  /* Кількість: ціле число від 1. Більше, ніж є в магазині й на складі разом, замовити не можна. */
  const maxQty = p => p && state(p) === 'ok' ? Math.max(1, p.stock.kazka + p.stock.sklad) : 999;
  const normQty = (v, p) => { let n = Math.round(parseFloat(String(v).replace(',', '.'))); if (!isFinite(n) || n < 1) n = 1; return Math.min(n, maxQty(p)); };
  Object.assign(IMB, { maxQty, normQty });

  /* Кошик */
  const cartLines = () => S.cart.filter(x => P(x.id) && state(P(x.id)) !== 'ended').map(x => { const p = P(x.id); if (!p.packs[x.pack]) x.pack = p.sel; /* фасовку могли прибрати */ x.qty = normQty(x.qty, p); const pk = pack(p, x.pack); const unitPrice = p.step && x.qty >= p.step[0] && x.pack === p.sel ? Math.min(p.step[1], pk.price) : pk.price; /* full — сума без картки; ifCard — скільки заощадив би гість із карткою першого рівня */ const viaCard = pk.by === 'card' && unitPrice === pk.price, first = IMB.DISCOUNT.tiers[0][1], guest = !S.user && first > (p.was || 0) ? Math.min(unitPrice, cut(pk.full, first)) : unitPrice; return Object.assign({ p, pk, unitPrice, sum: unitPrice * x.qty, full: (viaCard ? pk.full : unitPrice) * x.qty, ifCard: (unitPrice - guest) * x.qty, kg: pk.kg * x.qty }, x); });
  const cartCount = () => S.cart.reduce((s, x) => s + x.qty, 0);
  const cartTotals = () => { const l = cartLines(); const sub = l.reduce((s, x) => s + x.sum, 0); const disc = S.promo ? Math.round(sub * S.promo.pct / 100) : 0; /* подарунковий сертифікат покриває суму повністю або частково */ const gift = S.gift && l.length ? Math.min(S.gift.sum, sub - disc) : 0; return { lines: l, sub, disc, gift, card: Math.round(l.reduce((s, x) => s + x.full - x.sum, 0)), ifCard: Math.round(l.reduce((s, x) => s + x.ifCard, 0)), total: sub - disc - gift, kg: l.reduce((s, x) => s + x.kg, 0), np: l.map(x => npReason(x.p, x.pack) && x.p.name + ' — ' + npReason(x.p, x.pack)).filter(Boolean) }; };
  Object.assign(IMB, { cartLines, cartCount, cartTotals });

  /* ---------- Аналітика: GA4 ecommerce у dataLayer ---------- */
  window.dataLayer = window.dataLayer || [];
  const gaItem = (p, k = p.sel, qty = 1, idx) => ({ item_id: p.art || p.id, item_name: p.name, item_brand: p.brand, item_category: p.sec, item_category2: p.sub, item_variant: pack(p, k).label, price: pack(p, k).price, quantity: qty, index: idx });
  const track = (event, data = {}) => {
    window.dataLayer.push({ ecommerce: null });
    const payload = Object.assign({ event }, data);
    window.dataLayer.push(payload);
    if (window.console) console.info('%c[dataLayer] ' + event, 'color:#4F6B2C;font-weight:600', payload);
  };
  Object.assign(IMB, { track, gaItem });

  /* ---------- Пекшот: SVG-заглушка фото товару ---------- */
  /* Якщо в товару/розділу є поле img — показуємо справжнє фото (assets/img/*.webp, 640×640).
     n — номер фото в галереї. Без фото малюємо SVG-заглушку за типом товару. */
  const packshot = (p, big, n = 0) => {
    const photo = p.img && (Array.isArray(p.img) ? (p.img[n] || p.img[0]) : p.img);
    if (photo) return `<div class="shot shot--photo"${big ? ' style="border-radius:12px"' : ''}><img src="assets/img/${photo}.webp" alt="${esc(p.name || '')}" width="720" height="720" loading="${big || p.eager ? 'eager' : 'lazy'}" decoding="async"></div>`;
    /* Фото ще немає: нейтральна панель із контурною піктограмою типу товару. Один стиль для всіх
       товарів без фото — щоб намальовані «відра» не сперечалися зі справжніми знімками. */
    const k = p.kind || p;
    const G = {
      bucket: '<path d="M33 48h54l-5 50H38z"/><path d="M29 40h62v8H29z"/><path d="M37 44c0-20 46-20 46 0"/>',
      can: '<rect x="38" y="36" width="44" height="62" rx="5"/><path d="M52 36V26h16v10M38 56h44M38 80h44"/>',
      bag: '<path d="M36 28h48l5 72H31z"/><path d="M36 28l3 11h42l3-11M47 60h26M47 70h16"/>',
      sheet: '<path d="M20 62l48-22 32 14-48 22z"/><path d="M20 72l32 14 48-22M20 82l32 14 48-22"/>',
      roll: '<rect x="26" y="42" width="68" height="46" rx="23"/><ellipse cx="40" cy="65" rx="10" ry="23"/>',
      tape: '<circle cx="60" cy="62" r="32"/><circle cx="60" cy="62" r="15"/>',
      screws: '<path d="M40 30h18M49 30v58M44 44l10 5M44 56l10 5M44 68l10 5M72 40h18M81 40v52M76 54l10 5M76 66l10 5M76 78l10 5"/>',
      profile: '<path d="M18 78l70-42 14 7-70 42z"/><path d="M18 78v9l14 7v-9M32 94l70-42v-9"/>',
      door: '<rect x="38" y="20" width="44" height="80" rx="2"/><path d="M45 28h30v30H45zM45 64h30v28H45zM72 60h4"/>',
      tool: '<rect x="28" y="24" width="64" height="30" rx="11"/><path d="M60 54v12M56 66h8v34h-8z"/>',
      box: '<path d="M26 46l34-15 34 15v38l-34 15-34-15z"/><path d="M26 46l34 15 34-15M60 61v38"/>',
    };
    return `<div class="shot shot--empty"${big ? ' style="border-radius:12px"' : ''} role="img" aria-label="Фото товару готується: ${esc(p.name || '')}"><svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${G[k] || G.box}</svg>${big ? '<span class="shot__note">Фото готується</span>' : ''}</div>`;
  };
  IMB.packshot = packshot;

  /* ---------- Картка товару (product-card.twig) ---------- */
  const qtyCtl = (v = 1, cls = '', unit = '') => `<div class="qty ${cls}${unit ? ' qty--unit' : ''}" data-qty><button type="button" data-d="-1" aria-label="Менше">−</button><input inputmode="numeric" value="${v}" aria-label="Кількість${unit ? ', ' + unit : ''}">${unit ? `<span class="qty__unit" aria-hidden="true">${unit}</span>` : ''}<button type="button" data-d="1" aria-label="Більше">+</button></div>`;
  IMB.qtyCtl = qtyCtl;
  const productCard = (p, opt = {}) => {
    const st = state(p), pk = pack(p), fav = S.fav.includes(p.id), cmp = S.cmp.includes(p.id);
    /* «Поставки припинено» — не стікер, а окремий стан картки: без ціни й кнопки купівлі, з виходом на аналоги. */
    if (st === 'ended') { const has = (p.analogs || []).length; return `<article class="pcard is-ended" data-id="${p.id}" data-list="${esc(opt.list || '')}">
      <a class="pcard__media" aria-label="${esc(p.name)}" href="${pUrl(p)}" data-select="${p.id}" tabindex="-1">${packshot(p)}</a>
      <div class="pcard__brand">${p.brand === 'Інші' ? '&nbsp;' : p.brand}</div>
      <a class="pcard__name" href="${pUrl(p)}" data-select="${p.id}">${nb(esc(p.name))}</a>
      <div class="pcard__ended"><b>Поставки припинено</b><span>Товар більше не постачається. ${has ? 'Підібрали, чим його замінити.' : 'Менеджер підкаже заміну.'}</span></div>
      <div class="pcard__notify">${has ? `<a class="btn btn--outline btn--block" href="${pUrl(p)}#analogs">Показати аналоги</a>` : '<button class="btn btn--outline btn--block" data-modal="callback">Запитати менеджера</button>'}</div>
    </article>`; }
    /* Стікери. Угорі на фото — ціна і статус, не більше двох. Унизу на фото — властивості товару.
       «На вагу» стоїть у рядку фасовки, «Тільки Харків» — у рядку отримання. Якщо обране місто не Харків
       і область, «Тільки Харків» стає першим стікером на фото: покупцеві цей товар не відправлять. */
    const all = stickersOf(p), local = IMB.isLocal(S.city), away = all.includes('kharkiv') && !local;
    const top = (away ? ['kharkiv'] : []).concat(all.filter(k => IMB.STICKERS[k].tier === 'photo')).slice(0, 2).map(k => sticker(k, k === 'kharkiv' ? 'stk--away' : '')).join('');
    const marks = all.filter(k => IMB.STICKERS[k].tier === 'mark');
    const was = oldPrice(p);
    const stock = st === 'ok' ? (p.stock.kazka ? `<span class="stock">Є в магазині: ${p.stock.kazka} ${p.byWeight ? 'кг' : 'шт.'}</span>` : `<span class="stock">На складі, самовивіз завтра</span>`)
      : st === 'order' ? '<span class="stock stock--order">Під замовлення: 3–5 днів</span>' : '<span class="stock stock--out">Немає в наявності</span>';
    const packs = p.byWeight ? `<div class="pcard__pack">${sticker('weight', 'stk--sm')}</div>`
      : p.packs.length > 1 ? `<div class="pcard__packs" role="group" aria-label="Фасовка">${p.packs.map((x, k) => `<button type="button" class="pack-chip${k === p.sel ? ' is-on' : ''}" data-cardpack="${k}" aria-pressed="${k === p.sel}">${x[0]}</button>`).join('')}</div>` : `<div class="pcard__pack">${pk.label}</div>`;
    const ship = st === 'out' ? 'Повідомимо, щойно з’явиться' : away ? '<span class="pcard__away">В інші міста не відправляємо</span>'
      : all.includes('kharkiv') ? `${sticker('kharkiv', 'stk--sm')}<span>самовивіз і доставка</span>` : local ? shipLine(p) : `Нова пошта або Укрпошта: ${esc(S.city)}`;
    return `<article class="pcard${st === 'out' ? ' is-out' : ''}" data-id="${p.id}" data-list="${esc(opt.list || '')}">
      <div class="pcard__badges">${top}</div>
      <div class="pcard__tools">
        <button class="icon-btn js-quick" data-quick="${p.id}" aria-label="Швидкий перегляд">${IC.search}</button>
        <button class="icon-btn js-cmp${cmp ? ' is-on' : ''}" data-cmp="${p.id}" aria-pressed="${cmp}" aria-label="Порівняти">${IC.cmp}</button>
        <button class="icon-btn${fav ? ' is-on' : ''}" data-fav="${p.id}" aria-pressed="${fav}" aria-label="В обране">${fav ? IC.heartFill : IC.heart}</button>
      </div>
      <a class="pcard__media" aria-label="${esc(p.name)}" href="${pUrl(p)}" data-select="${p.id}" tabindex="-1">${packshot(p)}${marks.length ? `<span class="pcard__marks is-n${Math.min(3, marks.length)}">${marks.map(k => sticker(k, 'stk--mark')).join('')}</span>` : ''}</a>
      <div class="pcard__brand">${p.brand === 'Інші' ? '&nbsp;' : p.brand}</div>
      <a class="pcard__name" href="${pUrl(p)}" data-select="${p.id}">${nb(esc(p.name))}</a>
      ${packs}
      <div class="pcard__priceline">
        <div class="price"><span class="price__val">${num(pk.price)}</span><span class="price__unit">грн / ${p.byWeight ? 'кг' : p.unit === 'шт' || p.unit === 'уп' ? p.unit + '.' : 'уп.'}</span>${offHtml(p, pk)}</div>
        ${st === 'out' ? '' : `<button class="pcard__quick" data-add="${p.id}" aria-label="До кошика: ${esc(p.name)}">${IC.bag}<span class="incart" data-incart="${p.id}" hidden></span></button>`}
      </div>
      <div class="pcard__meta"><span>${perUnit(p) && !p.byWeight ? perUnit(p) : '&nbsp;'}</span>${p.step && p.step[1] < pk.price ? `<span class="pcard__step">Від ${p.step[0]} шт.: ${p.step[1]} грн</span>` : ''}</div>
      <div class="pcard__stock">${stock}</div>
      <div class="pcard__ship">${ship}</div>
      ${st === 'out'
        ? `<div class="pcard__notify"><button class="btn btn--outline btn--block" data-notify="${p.id}">Повідомити про надходження</button></div>`
        : `<div class="pcard__buy">${qtyCtl(1, '', p.byWeight ? 'кг' : '')}<button class="btn btn--primary" data-add="${p.id}">До кошика<span class="incart" data-incart="${p.id}" hidden></span></button><button class="btn btn--ghost js-oneclick" data-oneclick="${p.id}">1 клік</button></div>`}
    </article>`;
  };
  IMB.productCard = productCard;
  IMB.renderList = (el, ids, list) => { if (!el) return; const ps = ids.map(P).filter(Boolean); el.innerHTML = ps.map(p => productCard(p, { list })).join(''); updateCounters(); if (ps.length) track('view_item_list', { ecommerce: { item_list_name: list, items: ps.map((p, k) => gaItem(p, p.sel, 1, k)) } }); };

  /* ---------- Шапка (header.twig) ---------- */
  const NAV = [['Акції', 'promo'], ['Колерування', 'tinting'], ['Підбір матеріалів', 'podbor'], ['єВідновлення', 'evidnovlennya'], ['FRONT', 'brand', { b: 'front' }], ['TIGOR', 'brand', { b: 'tigor' }], ['Магазин', 'stores'], ['Поради', 'blog']];
  const logo = `<a class="logo" href="index.html" aria-label="IM BAU — на головну"><span class="logo__mark">IM<br>BAU</span><span><span class="logo__name">IM BAU</span><span class="logo__tag" style="display:block">Будуємо разом</span></span></a>`;
  const searchBox = id => `<div class="search" data-search><form class="search__form" action="search.html" role="search">${IC.search}<label class="sr-only" for="${id}">Пошук товарів</label><input class="search__input" id="${id}" name="q" placeholder="Назва, бренд або артикул" autocomplete="off"><button class="search__btn">Пошук</button></form><div class="suggest" role="listbox"></div></div>`;
  /* Місто в шапці. Перший візит: питаємо, чи правильно визначили місто (у бою — за IP).
     ПК — підказка під назвою міста у верхньому рядку. Телефон — рядок над логотипом, без окремого вікна:
     на першому екрані вже є банер cookie, друге вікно поверх нього було б зайвим. */
  const cityAsk = () => `<span class="cityask" role="group" aria-label="Підтвердження міста"><b>Ваше місто — ${esc(S.city)}?</b><span class="cityask__note">Від міста залежать способи й строки отримання.</span><span class="cityask__btns"><button class="btn btn--dark btn--sm" data-cityok>Так, ${esc(S.city)}</button><button class="btn btn--ghost btn--sm" data-modal="city">Обрати інше</button></span></span>`;
  const mcity = () => `<div class="mcity${S.cityOk ? '' : ' is-ask'}"><div class="container mcity__in">${S.cityOk
    ? `<button class="mcity__btn" data-modal="city">${IC.pin}<span>Ваше місто: <b>${esc(S.city)}</b></span>${IC.down}</button><a class="mcity__link" href="delivery.html">Доставка та оплата</a>`
    : `<span class="mcity__q">${IC.pin}<span>Ваше місто — <b>${esc(S.city)}</b>?</span></span><span class="mcity__btns"><button class="btn btn--dark btn--sm" data-cityok>Так</button><button class="btn btn--ghost btn--sm" data-modal="city">Змінити</button></span>`}</div></div>`;
  const userLink = () => S.user ? `<a class="topbar__strong" href="account.html">Кабінет<span class="topbar__card" title="Знижка за вашою карткою клієнта">−${card().pct}\u00A0%</span></a>` : '<a class="topbar__strong" href="account.html">Увійти</a>';
  /* після входу чи виходу в кабінеті оновлюємо посилання в шапці без перезавантаження */
  IMB.syncUser = () => { qsa('.topbar__strong').forEach(a => { a.outerHTML = userLink(); }); qsa('[data-userlink]').forEach(a => { a.firstChild.textContent = S.user ? 'Кабінет, картка ' + card().pct + ' %' : 'Увійти / кабінет'; }); };
  const renderHeader = () => {
    const el = qs('#site-header'); if (!el) return;
    const cur = document.body.dataset.page;
    /* Оформлення замовлення: без каталогу, пошуку й меню — лише шлях назад, логотип і допомога.
       Покупця на останньому кроці нічого не відволікає. */
    if (cur === 'checkout') {
      el.outerHTML = `<header class="cohead"><div class="container cohead__in">
        <a class="cohead__back" href="cart.html">${IC.back}<span>Назад у кошик</span></a>
        ${logo}
        <div class="cohead__help"><a class="cohead__phone" href="tel:${IMB.STORE.phoneHref}">${IC.phone}<b>${IMB.STORE.phone}</b></a><span class="cohead__hours">${IMB.STORE.hours}</span></div>
      </div></header>`;
      return;
    }
    const icons = `<a class="icon-btn" href="compare.html" aria-label="Порівняння">${IC.cmp}<span class="counter counter--auto" data-counter="cmp">0</span></a>
            <a class="icon-btn" href="compare.html?tab=fav" aria-label="Обране">${IC.heart}<span class="counter counter--auto" data-counter="fav">0</span></a>
            <a class="icon-btn" href="cart.html" aria-label="Кошик">${IC.bag}<span class="counter" data-counter="cart">0</span></a>`;
    const navHtml = NAV.map(([t, pg, prm]) => { const on = pg === cur && (!prm || new URLSearchParams(location.search).get('b') === prm.b); return `<a href="${url(pg, prm)}"${on ? ' aria-current="page"' : ''}>${t}</a>`; }).join('');
    el.outerHTML = `
    <div class="topbar"><div class="container topbar__in">
      <span class="topbar__addr">${IC.pin}${IMB.STORE.name}, ${IMB.STORE.address}</span>
      <span>${IMB.STORE.hours}</span>
      <nav class="topbar__links" aria-label="Сервісне меню"><a href="delivery.html">Доставка та оплата</a><a href="tracking.html">Де моє замовлення?</a><span class="topbar__cityw"><button data-modal="city" class="js-city topbar__city" aria-label="Ваше місто: ${esc(S.city)}. Змінити">${IC.pin}<span>${esc(S.city)}</span>${IC.down}</button>${S.cityOk ? '' : cityAsk()}</span></nav>
      ${userLink()}
      <span class="lang"><a href="#" data-lang="UA"${S.lang === 'UA' ? ' aria-current="true"' : ''}>UA</a> / <a href="#" data-lang="RU"${S.lang === 'RU' ? ' aria-current="true"' : ''}>RU</a></span>
    </div></div>
    ${mcity()}
    <header class="header" id="hdr">
      <div class="container">
        <div class="header__main">
          ${logo}
          ${searchBox('q-desk')}
          <div class="header__phone"><a href="tel:${IMB.STORE.phoneHref}">${IMB.STORE.phone}</a><button data-modal="callback">Замовити дзвінок</button></div>
          <div class="header__icons">${icons}</div>
        </div>
        <!-- Рядок меню. Коли сторінку прокручено (клас .is-stuck на #hdr), він лишається закріпленим
             і замість посилань показує пошук та кошик: .header__mini + .header__stuck -->
        <div class="header__nav">
          <a class="header__mini" href="index.html" aria-label="IM BAU — на головну"><span class="logo__mark">IM<br>BAU</span></a>
          <button class="catalog-btn" aria-expanded="false" aria-controls="mega" data-mega>${IC.grid}<span>Каталог товарів</span></button>
          <nav class="nav" aria-label="Головне меню">${navHtml}</nav>
          <a class="header__calc" href="podbor.html">Прорахувати список</a>
          <div class="header__stuck">${searchBox('q-stuck')}<a class="header__stuck-phone" href="tel:${IMB.STORE.phoneHref}">${IMB.STORE.phone}</a><div class="header__icons">${icons}</div></div>
        </div>
      </div>
      <div class="mega" id="mega"><div class="container mega__in">
        <div class="mega__secs">${IMB.SECTIONS.map((s, k) => `<button class="mega__sec${k === 0 ? ' is-active' : ''}" data-megasec="${k}">${s.n}<span aria-hidden="true">›</span></button>`).join('')}</div>
        <div class="mega__panel" data-megapanel></div>
      </div></div>
      <div class="mhead"><div class="container">
        <!-- Мобільна шапка: 2 рядки. Перший (логотип) прокручується, другий (пошук) лишається закріпленим;
             у закріпленому стані біля пошуку з'являються меню й кошик (.mhead__stuck) -->
        <div class="mhead__row">${logo}
          <div class="mhead__icons">
            <a class="icon-btn" href="tel:${IMB.STORE.phoneHref}" aria-label="Подзвонити">${IC.phone}</a>
            <a class="icon-btn" href="cart.html" aria-label="Кошик">${IC.bag}<span class="counter" data-counter="cart">0</span></a>
            <button class="icon-btn" data-drawer="menu" aria-label="Меню">${IC.menu}</button>
          </div>
        </div>
        <div class="mhead__search">
          <button class="icon-btn mhead__stuck" data-drawer="menu" aria-label="Меню">${IC.menu}</button>
          ${searchBox('q-mob')}
          <a class="icon-btn mhead__stuck" href="cart.html" aria-label="Кошик">${IC.bag}<span class="counter" data-counter="cart">0</span></a>
        </div>
      </div></div>
    </header>
    <div class="drawer" id="drawer-menu"><div class="drawer__bg" data-close></div><div class="drawer__panel" role="dialog" aria-label="Меню">
      <div class="drawer__head">${logo}<button class="icon-btn" data-close aria-label="Закрити">${IC.close}</button></div>
      <div class="drawer__meta"><button class="drawer__city" data-modal="city">${IC.pin}${esc(S.city)}</button><span class="lang"><a href="#" data-lang="UA"${S.lang === 'UA' ? ' aria-current="true"' : ''}>UA</a> / <a href="#" data-lang="RU"${S.lang === 'RU' ? ' aria-current="true"' : ''}>RU</a></span></div>
      <a class="btn btn--primary btn--split" href="catalog.html">Каталог товарів ${IC.arrow}</a>
      <div class="drawer__list">${NAV.map(([t, pg, prm]) => `<a href="${url(pg, prm)}">${t}<span aria-hidden="true">›</span></a>`).join('')}
        <a href="compare.html">Порівняння<span class="counter" style="position:static" data-counter="cmp">0</span></a>
        <a href="compare.html?tab=fav">Обране<span class="counter" style="position:static" data-counter="fav">0</span></a>
        <a href="account.html" data-userlink>${S.user ? 'Кабінет, картка ' + card().pct + ' %' : 'Увійти / кабінет'}<span aria-hidden="true">›</span></a>
        <a href="tracking.html">Де моє замовлення?<span aria-hidden="true">›</span></a>
        <a href="delivery.html">Доставка та оплата<span aria-hidden="true">›</span></a>
        <a href="pro.html">Оптовикам і майстрам<span aria-hidden="true">›</span></a>
        <a href="certificate.html">Подарунковий сертифікат<span aria-hidden="true">›</span></a></div>
      <div class="stack small"><a class="footer__phone" style="color:var(--c-ink)" href="tel:${IMB.STORE.phoneHref}">${IMB.STORE.phone}</a><button class="link" data-modal="callback">Замовити дзвінок</button><span class="ink-2">${IMB.STORE.name}, ${IMB.STORE.address}<br>${IMB.STORE.hours}</span><span class="row"><a class="btn btn--ghost btn--sm" href="#">Viber</a><a class="btn btn--ghost btn--sm" href="#">Telegram</a><a class="btn btn--ghost btn--sm" href="#">WhatsApp</a></span></div>
    </div></div>`;
    renderMega(0);
  };
  const renderMega = k => {
    const s = IMB.SECTIONS[k], el = qs('[data-megapanel]'); if (!el) return;
    el.innerHTML = `<h3><a href="${secUrl(s.n)}">${s.n} ›</a></h3><div class="mega__subs">${s.subs.map(x => `<a href="${catUrl(x)}">${x}</a>`).join('')}</div>
      <div class="mega__tasks"><div class="small ink-2" style="margin-bottom:8px">Під задачу</div><div class="chips">${IMB.TASKS.map(t => `<a class="chip" href="${url('kit', { t: t.n })}">${t.n}</a>`).join('')}</div></div>`;
    qsa('.mega__sec').forEach((b, j) => b.classList.toggle('is-active', j === k));
  };

  /* ---------- Футер (footer.twig) ---------- */
  const FCOL = {
    'Каталог': IMB.SECTIONS.slice(0, 7).map(s => [s.n, secUrl(s.n)]).concat([['Усі розділи ›', 'catalog.html']]),
    'Покупцям': [['Доставка та оплата', 'delivery.html'], ['Обмін та повернення', 'info.html?p=return'], ['Гарантія', 'info.html?p=warranty'], ['Де моє замовлення?', 'tracking.html'], ['Оплата частинами', 'evidnovlennya.html'], ['Часті запитання', 'info.html?p=faq'], ['Накопичувальна картка', 'info.html?p=discounts'], ['Акції', 'promo.html'], ['Уцінка', 'promo.html']],
    'Послуги': [['Колерування', 'tinting.html'], ['Підбір матеріалів', 'podbor.html'], ['Калькулятори', 'podbor.html#calc'], ['єВідновлення', 'evidnovlennya.html'], ['Оптовикам і майстрам', 'pro.html'], ['Подарунковий сертифікат', 'certificate.html'], ['Прайс-лист', 'info.html?p=price'], ['Підбірки товарів', 'kit.html']],
    'IM BAU': [['Про компанію', 'info.html?p=about'], ['Магазин і контакти', 'stores.html'], ['Відгуки', 'info.html?p=reviews'], ['Сертифікати та документи', 'info.html?p=certs'], ['Поради', 'blog.html'], ['Відео', 'blog.html'], ['Вакансії', 'info.html?p=jobs']],
  };
  const renderFooter = () => {
    const el = qs('#site-footer'); if (!el) return;
    if (document.body.dataset.page === 'checkout') {
      el.outerHTML = `<footer class="cofoot"><div class="container cofoot__in"><span>IM BAU © 2026</span><span class="cofoot__safe">${IC.lock} Оплата карткою проходить на захищеній сторінці LiqPay</span><span><a href="info.html?p=offer">Публічна оферта</a> · <a href="info.html?p=privacy">Конфіденційність</a></span></div></footer><a class="proto-flag" href="sitemap.html" title="Карта прототипу">Прототип · карта сторінок</a>`;
      return;
    }
    const list = a => `<ul class="footer__list">${a.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul>`;
    const contacts = `<div class="footer__contacts"><a class="footer__phone" href="tel:${IMB.STORE.phoneHref}">${IMB.STORE.phone}</a><a href="mailto:${IMB.STORE.email}">${IMB.STORE.email}</a><span>${IMB.STORE.name},<br>${IMB.STORE.address}</span><span>Щодня 9:00–19:00</span><span><a href="#">Viber</a> · <a href="#">Telegram</a> · <a href="#">WhatsApp</a></span><span><a href="#">TikTok</a> · <a href="#">Instagram</a></span></div>`;
    el.outerHTML = `<footer class="footer"><div class="container">
      <div class="footer__cols">${Object.entries(FCOL).map(([t, a]) => `<div><div class="footer__title">${t}</div>${list(a)}</div>`).join('')}<div><div class="footer__title">Контакти</div>${contacts}</div></div>
      <div class="footer__mob"><div class="footer__brand">IM BAU</div><p style="margin:12px 0 20px">Будівельні матеріали. Зручно. Поруч.</p>
        <div class="acc" style="border-color:#3a403a">${Object.entries(FCOL).map(([t, a]) => `<details style="border-color:#3a403a"><summary style="color:#fff">${t}</summary><div class="acc__body">${list(a)}</div></details>`).join('')}</div>
        <div style="margin-top:24px">${contacts}</div></div>
      <div class="footer__bar"><span>Бренди: <a href="brand.html?b=front">FRONT</a> · <a href="brand.html?b=tigor">TIGOR</a> · <a href="brands.html?b=knauf">Knauf</a> · <a href="brands.html">Усі виробники</a></span><span>Версія сайту: <b>Україна / Харків</b> &nbsp; Мова: <a href="#" data-lang="UA">UA</a> | <a href="#" data-lang="RU">RU</a></span></div>
      <div class="footer__bar" style="margin-top:20px"><span>IM BAU © 2026</span><span><a href="info.html?p=privacy">Конфіденційність</a> · <a href="info.html?p=offer">Публічна оферта</a> · <a href="sitemap.html">Карта сайту</a></span><span>Оплата: LiqPay, картка, рахунок, єВідновлення</span></div>
    </div></footer><a class="proto-flag" href="sitemap.html" title="Карта прототипу">Прототип · карта сторінок</a>`;
  };

  /* ---------- Лічильники ---------- */
  function updateCounters() {
    const v = { cart: cartCount(), fav: S.fav.length, cmp: S.cmp.length };
    qsa('[data-counter]').forEach(el => { const n = v[el.dataset.counter]; el.textContent = n; el.dataset.count = n; });
    /* Позначка «вже в кошику» на кнопках карток */
    qsa('[data-incart]').forEach(el => { const n = S.cart.filter(x => x.id === el.dataset.incart).reduce((s, x) => s + x.qty, 0); el.textContent = n || ''; el.hidden = !n; });
  }
  IMB.updateCounters = updateCounters;

  /* ---------- Тости ---------- */
  const toast = (html, ms = 3200) => {
    let w = qs('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; w.setAttribute('role', 'status'); document.body.append(w); }
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; w.append(t); setTimeout(() => t.remove(), ms);
  };
  IMB.toast = toast;

  /* ---------- Модалки (popup.twig) ---------- */
  let lastFocus;
  const openModal = (html, opt = {}) => {
    closeModal();
    lastFocus = document.activeElement;
    const m = document.createElement('div'); m.className = 'modal is-open'; m.id = 'modal';
    m.innerHTML = `<div class="modal__bg" data-close></div><div class="modal__box${opt.wide ? ' modal__box--wide' : ''}${opt.cls ? ' ' + opt.cls : ''}" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-t"><button class="icon-btn modal__close" data-close aria-label="Закрити">${IC.close}</button>${html}</div>`;
    document.body.append(m); document.body.style.overflow = 'hidden';
    /* сторінка під вікном недоступна для клавіатури й читача екрана, поки вікно відкрите */
    [...document.body.children].forEach(el => { if (el !== m && !el.classList.contains('toast-wrap') && !el.inert) { el.inert = true; el.dataset.modalInert = '1'; } });
    /* на телефоні курсор у поле не ставимо: клавіатура закрила б половину вікна раніше, ніж його прочитають */
    const phone = window.matchMedia('(max-width: 720px)').matches;
    const f = opt.nofocus || phone ? qs('.modal__box', m) : qs('input, textarea, select, button:not(.modal__close)', m); if (f) f.focus();
    return m;
  };
  const closeModal = () => { const m = qs('#modal'); if (m) { m.remove(); document.body.style.overflow = ''; qsa('[data-modal-inert]').forEach(el => { el.inert = false; delete el.dataset.modalInert; }); if (lastFocus) lastFocus.focus(); } };
  Object.assign(IMB, { openModal, closeModal });

  /* ---------- Перегляд фото на весь екран ----------
     Стрічка з прив'язкою прокрутки: на телефоні гортається пальцем, на ПК — стрілками й клавішами ← →. */
  const closeLightbox = () => { const l = qs('#lightbox'); if (l) { l.remove(); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); } };
  const lightbox = (p, start = 0) => {
    const imgs = Array.isArray(p.img) ? p.img : p.img ? [p.img] : []; if (!imgs.length) return;
    closeLightbox(); lastFocus = document.activeElement;
    const l = document.createElement('div'); l.className = 'lightbox'; l.id = 'lightbox'; l.setAttribute('role', 'dialog'); l.setAttribute('aria-modal', 'true'); l.setAttribute('aria-label', 'Фото: ' + p.name);
    l.innerHTML = `<div class="lightbox__bar"><span class="lightbox__title">${esc(p.name)}</span><span class="lightbox__count" data-lbcount></span><button class="icon-btn" data-lbclose aria-label="Закрити">${IC.close}</button></div>
      <div class="lightbox__track" data-lbtrack>${imgs.map((n, j) => `<div class="lightbox__slide"><img src="assets/img/${n}.webp" alt="${esc(p.name)}, фото ${j + 1}" width="720" height="720"></div>`).join('')}</div>
      ${imgs.length > 1 ? `<button class="lightbox__nav lightbox__nav--prev" data-lbgo="-1" aria-label="Попереднє фото">${IC.back}</button><button class="lightbox__nav lightbox__nav--next" data-lbgo="1" aria-label="Наступне фото">${IC.arrow}</button>
      <div class="lightbox__thumbs">${imgs.map((n, j) => `<button data-lbto="${j}" aria-label="Фото ${j + 1}"><img src="assets/img/${n}.webp" alt="" width="72" height="72"></button>`).join('')}</div>` : ''}`;
    document.body.append(l); document.body.style.overflow = 'hidden';
    const tr = qs('[data-lbtrack]', l); let cur = start;
    const mark = () => { qs('[data-lbcount]', l).textContent = imgs.length > 1 ? `${cur + 1} / ${imgs.length}` : ''; qsa('[data-lbto]', l).forEach((b, j) => b.setAttribute('aria-current', j === cur)); };
    const go = (j, smooth) => { cur = Math.max(0, Math.min(imgs.length - 1, j)); tr.scrollTo({ left: cur * tr.clientWidth, behavior: smooth ? 'smooth' : 'auto' }); mark(); };
    tr.addEventListener('scroll', () => { const j = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); if (j !== cur) { cur = j; mark(); } }, { passive: true });
    l.addEventListener('click', e => { if (e.target.closest('[data-lbclose]') || e.target === l || e.target.classList.contains('lightbox__slide')) return closeLightbox(); const g = e.target.closest('[data-lbgo]'); if (g) go(cur + +g.dataset.lbgo, true); const t = e.target.closest('[data-lbto]'); if (t) go(+t.dataset.lbto, true); });
    l.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(cur + 1, true); if (e.key === 'ArrowLeft') go(cur - 1, true); });
    go(start); qs('[data-lbclose]', l).focus();
  };
  IMB.lightbox = lightbox;

  /* Зірки рейтингу: r від 0 до 5, заповнення через CSS-змінну */
  IMB.stars = (r, cls = '') => `<span class="stars ${cls}" style="--r:${r}" role="img" aria-label="Оцінка ${String(r).replace('.', ',')} з 5"></span>`;

  const phoneField = (id = 'ph', label = 'Телефон') => `<div class="field"><label class="field__label" for="${id}">${label}</label><input class="input js-phone" id="${id}" type="tel" inputmode="tel" placeholder="+38 (0__) ___-__-__" required><span class="field__error">Вкажіть номер у форматі +38 (0XX) XXX-XX-XX</span></div>`;
  IMB.phoneField = phoneField;
  const validPhone = v => v.replace(/\D/g, '').length === 12;
  const checkPhone = inp => { const ok = validPhone(inp.value); inp.closest('.field').classList.toggle('is-invalid', !ok); return ok; };
  IMB.checkPhone = checkPhone;

  /* ---------- Вибір міста (city-popup.twig) ----------
     Ліворуч пошук і перелік, праворуч — що зміниться для обраного міста. Вибір застосовується кнопкою:
     спершу людина бачить, які способи отримання їй доступні, потім підтверджує. */
  const cityHow = c => { const loc = IMB.isLocal(c);
    const row = (ic, t, txt, on) => `<div class="cityhow__row${on ? '' : ' is-off'}">${ic}<span><b>${t}</b><span>${txt}</span></span>${on ? `<i aria-hidden="true">${IC.check}</i>` : '<i class="cityhow__no">немає</i>'}</div>`;
    return `<div class="cityhow__title">${esc(c)}: як отримати замовлення</div>
      ${row(IC.store, 'Самовивіз', loc ? `${IMB.STORE.name}, ${IMB.STORE.address}. Сьогодні, якщо товар є в магазині.` : `Лише в Харкові: ${IMB.STORE.name}.`, loc)}
      ${row(IC.truck, 'Наша машина', loc ? 'Завтра або в зручний день. Від 450 грн.' : 'Лише Харків і область.', loc)}
      ${row(IC.box, 'Нова пошта, Укрпошта', 'За тарифом перевізника, доставку оплачує покупець.', true)}
      <p class="cityhow__note">${loc ? 'Товари з позначкою «Тільки Харків» можна забрати самому або замовити доставку нашою машиною.' : 'Фарби, вантажі понад 30 кг і довгі матеріали поштою не відправляємо. На таких товарах стоїть позначка «Тільки Харків».'}</p>`; };
  const cityModal = () => {
    let pick = S.city;
    const m = openModal(`<h2 class="modal__title" id="modal-t">Ваше місто</h2>
      <div class="citypick"><div class="citypick__main">
        <label class="citypick__search">${IC.search}<span class="sr-only">Пошук міста</span><input class="input" id="city-q" placeholder="Введіть назву міста" autocomplete="off"></label>
        <div class="citypick__list" data-citylist></div></div>
        <aside class="cityhow" data-cityhow aria-live="polite"></aside></div>
      <div class="citypick__foot"><button class="btn btn--primary btn--lg" data-setcity="${esc(pick)}">Зберегти: ${esc(pick)}</button><span class="small ink-2" data-cityshort></span></div>`, { wide: true, nofocus: true, cls: 'modal__box--city' });
    const inp = qs('#city-q', m), listEl = qs('[data-citylist]', m);
    const chip = c => `<button class="chip${c === pick ? ' is-on' : ''}" data-pickcity="${esc(c)}" aria-pressed="${c === pick}">${esc(c)}</button>`;
    const draw = () => {
      const q = inp.value.trim().toLowerCase(), hit = IMB.CITY_LIST.filter(c => !q || c[0].toLowerCase().includes(q));
      const loc = hit.filter(c => c[1] === 'local').map(c => c[0]), rest = hit.filter(c => c[1] !== 'local').map(c => c[0]);
      const custom = q.length > 1 && !hit.length ? inp.value.trim().replace(/^./, ch => ch.toUpperCase()) : '';
      listEl.innerHTML = (loc.length ? `<div class="citypick__group"><div class="citypick__label">Харків і область</div><div class="chips">${loc.map(chip).join('')}</div></div>` : '')
        + (rest.length ? `<div class="citypick__group"><div class="citypick__label">Інші міста України</div><div class="chips">${rest.map(chip).join('')}</div></div>` : '')
        + (!hit.length ? `<div class="citypick__group"><div class="citypick__label">У переліку такого міста немає</div><p class="small ink-2" style="margin-bottom:12px">Якщо там є відділення Нової пошти, доставимо. Оберіть місто так, як ви його написали:</p>${custom ? `<div class="chips">${chip(custom)}</div>` : ''}</div>` : '');
    };
    const set = c => { pick = c; const b = qs('[data-setcity]', m); b.dataset.setcity = c; b.textContent = 'Зберегти: ' + c;
      qs('[data-cityhow]', m).innerHTML = cityHow(c); qs('[data-cityshort]', m).textContent = IMB.isLocal(c) ? 'Доступні самовивіз, наша машина, Нова пошта й Укрпошта.' : 'Доступні Нова пошта й Укрпошта. Частину товарів не відправляємо.';
      qsa('[data-pickcity]', m).forEach(x => { const on = x.dataset.pickcity === c; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); }); };
    IMB._cityPick = set; inp.addEventListener('input', draw); draw(); set(pick);
  };

  /* ---------- Блок «Часті запитання» (faq.twig) ----------
     Один блок для всіх сторінок. opt.topics — які теми показати (без нього всі); opt.top — лише найчастіші;
     opt.limit — скільки питань; opt.title і opt.lead — заголовок і підпис; opt.all === false — без посилання на повний перелік.
     У розмітці сторінки достатньо поставити <div data-faqslot data-topics="delivery,pay"></div>. */
  let faqN = 0;
  const faqBlock = (opt = {}) => {
    let list = IMB.FAQ.filter(x => (!opt.topics || opt.topics.includes(x.k)) && (!opt.top || x.top)); if (opt.limit) list = list.slice(0, opt.limit);
    const keys = IMB.FAQ_TOPICS.filter(([k]) => list.some(x => x.k === k)), name = 'faq' + (++faqN);
    return `<section class="faq${opt.cls ? ' ' + opt.cls : ''}" data-faq aria-label="Часті запитання">
      <div class="faq__side"><h2>${opt.title || 'Часті запитання'}</h2>${opt.lead ? `<p class="faq__lead">${opt.lead}</p>` : ''}
        <div class="faq__help"><b>Не знайшли відповіді?</b><p class="small ink-2">Запитайте менеджера. Відповімо в робочий час.</p><div class="faq__helprow"><button class="btn btn--dark" data-modal="ask">Поставити питання</button><a class="faq__phone" href="tel:${IMB.STORE.phoneHref}">${IMB.STORE.phone}</a></div></div></div>
      <div class="faq__main">${keys.length > 1 ? `<div class="faq__topics" role="group" aria-label="Тема запитань"><button class="chip is-on" data-faqtopic="" aria-pressed="true">Усі</button>${keys.map(([k, t]) => `<button class="chip" data-faqtopic="${k}" aria-pressed="false">${t}</button>`).join('')}</div>` : ''}
        <div class="acc faq__list">${list.map(x => `<details name="${name}" data-k="${x.k}"><summary>${x.q}</summary><div class="acc__body">${x.a}</div></details>`).join('')}</div>
        ${opt.all === false ? '' : `<a class="link-arrow faq__all" href="info.html?p=faq">Усі запитання ${IC.arrow}</a>`}</div></section>`;
  };
  IMB.faqBlock = faqBlock;

  const MODALS = {
    callback: () => openModal(`<h2 class="modal__title" id="modal-t">Замовити дзвінок</h2><p class="ink-2" style="margin-bottom:20px">Передзвонимо в робочий час протягом 15 хвилин. ${IMB.STORE.hours}.</p>
      <form class="stack" data-form="callback">${phoneField('cb-ph')}<div class="field"><label class="field__label" for="cb-n">Ім’я</label><input class="input" id="cb-n"></div><div class="field"><label class="field__label" for="cb-t">Питання (необов’язково)</label><input class="input" id="cb-t" placeholder="Наприклад: скільки штукатурки на 40 м²"></div><button class="btn btn--primary btn--block btn--lg">Замовити дзвінок</button></form>`),
    city: () => cityModal(),
    sreview: () => openModal(`<h2 class="modal__title" id="modal-t">Відгук про магазин</h2><p class="ink-2" style="margin-bottom:20px">Відгук з’явиться на сторінці після перевірки.</p>
      <form class="stack" data-form="sreview"><div class="field"><label class="field__label" for="sr-n">Ім’я</label><input class="input" id="sr-n" required></div><div class="field"><label class="field__label" for="sr-t">Ваш відгук</label><textarea class="input textarea" id="sr-t" rows="4" required></textarea></div>${phoneField('sr-ph', 'Телефон, за яким робили покупку')}<button class="btn btn--primary btn--block btn--lg">Надіслати відгук</button></form>`),
    ask: () => openModal(`<h2 class="modal__title" id="modal-t">Поставити питання</h2><p class="ink-2" style="margin-bottom:20px">Відповімо у Viber або SMS у робочий час. ${IMB.STORE.hours}.</p>
      <form class="stack" data-form="faqask"><div class="field"><label class="field__label" for="fq-t">Ваше питання</label><textarea class="input textarea" id="fq-t" rows="4" required></textarea></div>${phoneField('fq-ph')}<button class="btn btn--primary btn--block btn--lg">Надіслати питання</button></form>`),
  };

  const oneClick = id => {
    const p = P(id), pk = pack(p);
    openModal(`<h2 class="modal__title" id="modal-t">Купити в 1 клік</h2>
      <div class="added" style="margin-bottom:20px">${packshot(p)}<div><div class="small ink-2">${p.brand}</div><b>${esc(p.name)}</b><div class="small ink-2">${pk.label}</div></div><b>${uah(pk.price)}</b></div>
      <form class="stack" data-form="oneclick" data-id="${id}">${phoneField('oc-ph')}<p class="small ink-2">Менеджер передзвонить, уточнить кількість, наявність і спосіб отримання. Реєстрація не потрібна.</p><button class="btn btn--primary btn--block btn--lg">Замовити</button></form>`);
  };
  const quickView = id => {
    const p = P(id);
    openModal(`<div class="grid grid-2" style="align-items:start">${packshot(p, 1)}<div class="stack"><div class="pcard__brand">${p.brand}</div><h2 id="modal-t" style="font-size:22px">${esc(p.name)}</h2>${productCard(p).match(/<div class="price">[\s\S]*?<\/div>/)[0]}<div>${perUnit(p)}</div><div class="row">${qtyCtl()}<button class="btn btn--primary" data-add="${p.id}">До кошика</button></div><a class="link" href="${pUrl(p)}">Усе про товар</a></div></div>`, { wide: true });
  };

  /* Додавання в кошик + вікно «Додано» (CRO: окно после «Купить») */
  const addToCart = (id, k, qty = 1, silent) => {
    const p = P(id); if (state(p) === 'ended') return; k = k == null || !p.packs[+k] ? p.sel : +k; qty = normQty(qty, p);
    const e = S.cart.find(x => x.id === id && x.pack === k); if (e) e.qty = normQty(e.qty + qty, p); else S.cart.push({ id, pack: k, qty });
    save(); track('add_to_cart', { ecommerce: { currency: 'UAH', value: pack(p, k).price * qty, items: [gaItem(p, k, qty)] } });
    if (silent) return;
    const t = cartTotals(), rel = (IMB.RELATED[id] || []).map(P).filter(x => x && state(x) !== 'out').slice(0, 3);
    openModal(`<h2 class="modal__title" id="modal-t">Додано до кошика</h2>
      <div class="added">${packshot(p)}<div><b>${esc(p.name)}</b><div class="small ink-2" style="margin-bottom:8px">${pack(p, k).label}</div>
        <div class="added__row"><div class="qty qty--sm" data-qty data-addedline="${id}:${k}"><button type="button" data-d="-1" aria-label="Менше">−</button><input inputmode="numeric" value="${(S.cart.find(x => x.id === id && x.pack === k) || { qty }).qty}" aria-label="Кількість"><button type="button" data-d="1" aria-label="Більше">+</button></div><b class="added__sum" data-addedsum>${uah((cartLines().find(l => l.id === id && l.pack === k) || { sum: pack(p, k).price * qty }).sum)}</b></div></div></div>
      ${npReason(p, k) ? `<div class="note note--warn" style="margin-top:12px">${IC.warn}<span>Цей товар не відправляємо Новою поштою й Укрпоштою: ${npReason(p, k)}. Доступно: самовивіз і наша машина по Харкову.</span></div>` : ''}
      ${rel.length ? `<h3 style="margin:24px 0 12px;font-size:17px">Що ще знадобиться для роботи</h3><div class="need-list">${rel.map(r => `<div class="need">${packshot(r)}<a class="need__name" href="${pUrl(r)}">${esc(r.name)}</a><b class="need__price">${uah(pack(r).price)}</b><button class="btn btn--ghost btn--sm" data-add="${r.id}" data-silent="1">+ Додати</button></div>`).join('')}</div>` : ''}
      <div class="modal__foot"><div class="summary__line" style="font-size:16px"><span data-addedcount>У кошику ${cartCount()} шт. на суму</span><b data-addedtotal>${uah(t.total)}</b></div><div class="grid grid-2" style="margin-top:12px"><button class="btn btn--outline" data-close>Продовжити покупки</button><a class="btn btn--primary" href="checkout.html">Оформити замовлення</a></div></div>`);
  };
  IMB.addToCart = addToCart;
  IMB.oneClick = oneClick;

  /* ---------- Число й одиниця не розриваються: «7 кг», «50 мм» ---------- */
  function nb(v) { return String(v).replace(/(\d) (?=(?:кг|г|л|мл|мм|см|м|шт)(?:[\s.,;:)×]|$))/g, '$1\u00A0'); }
  IMB.nb = nb;

  /* ---------- Стрічки, що гортаються вбік: край тане, поки далі щось є ---------- */
  const RAILS = '.sub-strip, .ptabs__bar';
  const railCue = el => { const rest = el.scrollWidth - el.clientWidth - el.scrollLeft; el.classList.toggle('is-more-r', rest > 6); el.classList.toggle('is-more-l', el.scrollLeft > 6); };
  const railsAll = () => qsa(RAILS).forEach(railCue);
  document.addEventListener('scroll', e => { if (e.target.matches && e.target.matches(RAILS)) railCue(e.target); }, true);
  window.addEventListener('resize', railsAll); window.addEventListener('load', railsAll);
  { let t; new MutationObserver(() => { clearTimeout(t); t = setTimeout(railsAll, 50); }).observe(document.body, { childList: true, subtree: true }); }

  /* ---------- Пошук з підказками ---------- */
  const norm = s => { s = s.toLowerCase().replace(/ё/g, 'е'); Object.entries(IMB.SYN).forEach(([a, b]) => { s = s.replace(new RegExp(a, 'g'), b); }); return s.replace(/[ыи]/g, 'и'); };
  /* Запит спершу переписуємо: російські назви й марки кирилицею. Потім шукаємо кожне слово за початком,
     а якщо не знайшли — з однією-двома одруківками. У пошуку бере участь і призначення товару («для стін»). */
  const REWRITE = [[/шпа[тк]л[еіи]в?к[а-яіїєґ]*/g, 'шпаклівка'], [/(^|\s)пен[аыуое](?=\s|$)/g, '$1піна'], [/утеплител[а-я]*/g, 'утеплювач'], [/(^|\s)фронт[а-я]*/g, '$1front'], [/(^|\s)т[иі]гор[а-я]*/g, '$1tigor'], [/(^|\s)кнауф[а-я]*/g, '$1knauf'],
    [/бел(ая|ый|ое|ые|ой|ую)/g, 'біла'], [/(^|\s)стен(?=\s|$)/g, '$1стін'], [/(^|\s)потолк[а-я]*/g, '$1стел'], [/эмал[а-я]*/g, 'емаль']];
  const lev = (x, y, max) => { if (Math.abs(x.length - y.length) > max) return max + 1; let prev = Array.from({ length: y.length + 1 }, (_, k) => k);
    for (let r = 1; r <= x.length; r++) { const cur = [r]; let best = r; for (let c = 1; c <= y.length; c++) { cur[c] = Math.min(prev[c] + 1, cur[c - 1] + 1, prev[c - 1] + (x[r - 1] === y[c - 1] ? 0 : 1)); best = Math.min(best, cur[c]); } if (best > max) return max + 1; prev = cur; } return prev[y.length]; };
  const search = q => { let n = String(q).toLowerCase().replace(/ё/g, 'е'); REWRITE.forEach(([re, to]) => { n = n.replace(re, to); }); n = norm(n).trim(); const words = n.split(/\s+/).filter(w => w.length > 1); if (!words.length) return [];
    const hit = (p, w) => { const h = p._h || (p._h = norm([p.name, p.brand, p.sub, p.sec, p.art, (p.use || []).join(' ')].join(' '))), lim = w.length >= 8 ? 2 : 1; return h.includes(w.slice(0, Math.max(3, w.length - 1))) || (w.length >= 5 && h.split(/[^a-zа-яіїєґ0-9]+/).some(t => lev(w, t.slice(0, w.length + 1), lim) <= lim)); };
    const rank = (x, y) => ({ A: 0, B: 1, C: 2 }[x.prio] - { A: 0, B: 1, C: 2 }[y.prio]) || y.sales - x.sales;
    const strict = IMB.PRODUCTS.filter(p => words.every(w => hit(p, w))).sort(rank);
    /* Точних збігів мало: після них показуємо схожі товари, де збіглося хоча б одне змістовне слово */
    const loose = strict.length < 4 && words.length > 1 ? IMB.PRODUCTS.filter(p => !strict.includes(p) && words.some(w => w.length >= 4 && hit(p, w))).sort(rank) : [];
    return strict.concat(loose); };
  IMB.search = search;
  const bindSearch = box => {
    const inp = qs('input', box), sug = qs('.suggest', box); let act = -1;
    const draw = () => {
      const q = inp.value.trim(), res = search(q).slice(0, 5);
      const cats = q ? IMB.SECTIONS.flatMap(s => s.subs).filter(s => norm(s).includes(norm(q).slice(0, 4))).slice(0, 4) : [];
      sug.innerHTML = !q ? `<div class="suggest__title">Часто шукають</div><div class="suggest__cats">${IMB.POPULAR.map(x => `<a class="chip" href="search.html?q=${encodeURIComponent(x)}">${x}</a>`).join('')}</div>`
        : (cats.length ? `<div class="suggest__title">Розділи</div><div class="suggest__cats">${cats.map(c => `<a class="chip" href="${catUrl(c)}">${c}</a>`).join('')}</div>` : '') +
          (res.length ? `<div class="suggest__title">Товари</div>${res.map(p => `<a class="suggest__item" role="option" href="${pUrl(p)}">${packshot(p)}<span>${esc(p.name)}<br><span class="xs ink-2">${state(p) === 'ended' ? 'поставки припинено, є аналоги' : pack(p).label + ' · ' + (state(p) === 'ok' ? 'в наявності' : state(p) === 'order' ? 'під замовлення' : 'немає')}</span></span><span class="suggest__price">${state(p) === 'ended' ? '' : uah(pack(p).price)}</span></a>`).join('')}<a class="suggest__item" href="search.html?q=${encodeURIComponent(q)}" style="grid-template-columns:1fr"><b>Усі результати (${search(q).length}) ›</b></a>`
            : `<div style="padding:12px"><b>Нічого не знайшли за «${esc(q)}»</b><p class="small ink-2">Перевірте написання або спробуйте: ${IMB.POPULAR.slice(0, 3).join(', ')}. Можна <button class="link" data-modal="callback">запитати менеджера</button>.</p></div>`);
      sug.classList.add('is-open'); act = -1;
    };
    inp.addEventListener('focus', draw); inp.addEventListener('input', draw);
    inp.addEventListener('keydown', e => { const it = qsa('.suggest__item', sug); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + it.length) % it.length; it.forEach((x, k) => x.classList.toggle('is-active', k === act)); } if (e.key === 'Enter' && act >= 0 && it[act]) { e.preventDefault(); location.href = it[act].href; } if (e.key === 'Escape') sug.classList.remove('is-open'); });
    document.addEventListener('click', e => { if (!box.contains(e.target)) sug.classList.remove('is-open'); });
    qs('form', box).addEventListener('submit', e => { if (!inp.value.trim()) e.preventDefault(); else track('search', { search_term: inp.value.trim() }); });
  };

  /* ---------- Cookie-банер (Consent Mode v2) ---------- */
  const cookieBanner = () => {
    if (S.cookie) return;
    const c = document.createElement('div'); c.className = 'cookie'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'Файли cookie');
    c.innerHTML = `<b>Файли cookie</b><span class="ink-2">Необхідні — для кошика і входу. Аналітичні й рекламні — тільки з вашої згоди.</span><div class="cookie__btns"><button class="btn btn--dark btn--sm" data-cookie="all">Прийняти всі</button><button class="btn btn--ghost btn--sm" data-cookie="necessary">Лише необхідні</button><a class="btn btn--sm" href="info.html?p=privacy">Детальніше</a></div>`;
    document.body.append(c);
  };

  /* ---------- Поле телефону: маска +38 (0XX) XXX-XX-XX ---------- */
  const maskPhone = v => { let d = v.replace(/\D/g, ''); if (/^80/.test(d)) d = '3' + d; else if (/^[01245679]/.test(d)) d = '38' + (d[0] === '0' ? '' : '0') + d; else if (!d.startsWith('38')) d = '38' + d; if (/^3880/.test(d)) d = '38' + d.slice(3); d = d.slice(0, 12); const p = d.slice(2); let o = '+38'; if (p.length) o += ' (' + p.slice(0, 3); if (p.length >= 3) o += ') ' + p.slice(3, 6); if (p.length >= 6) o += '-' + p.slice(6, 8); if (p.length >= 8) o += '-' + p.slice(8, 10); return o; };

  /* ---------- Делегування подій ---------- */
  document.addEventListener('input', e => { if (e.target.classList.contains('js-phone')) { e.target.value = maskPhone(e.target.value); e.target.closest('.field').classList.remove('is-invalid'); } });
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a'); if (!t) { if (e.target.matches('[data-close]')) { closeModal(); const dr = e.target.closest('.drawer'); if (dr) { dr.classList.remove('is-open'); document.body.style.overflow = ''; } } return; }
    const d = t.dataset;
    if (d.close !== undefined) { closeModal(); const dr = t.closest('.drawer'); if (dr) dr.classList.remove('is-open'); const fl = t.closest('.filters'); if (fl) fl.classList.remove('is-sheet'); if (dr || fl) document.body.style.overflow = ''; return; }
    if (d.d) { const q = t.closest('[data-qty]'), inp = qs('input', q); inp.value = Math.max(1, (+inp.value || 1) + +d.d); inp.dispatchEvent(new Event('change', { bubbles: true })); return; }
    if (d.add) { const card = t.closest('.pcard, .buybox, .need, .modal__box, [data-buy]'); const q = card && qs('[data-qty] input', card); const k = card && card.dataset.pack != null ? card.dataset.pack : null; addToCart(d.add, k, q ? q.value : (card && card.dataset.qty) || 1, d.silent); if (card && card.dataset.shade) { const ln = S.cart.find(x => x.id === d.add && x.pack === (k == null ? P(d.add).sel : +k)); if (ln) { ln.shade = card.dataset.shade; save(); } } if (d.silent) { t.textContent = 'Додано ✓'; t.disabled = true; } return; }
    if (d.oneclick) { oneClick(d.oneclick); return; }
    if (d.quick) { quickView(d.quick); return; }
    if (d.fav || d.cmp) { const key = d.fav ? 'fav' : 'cmp', id = d.fav || d.cmp, a = S[key], on = !a.includes(id); if (on) { if (key === 'cmp' && a.length >= 4) { toast('У порівнянні до 4 товарів. Приберіть один, щоб додати новий.'); return; } a.push(id); } else a.splice(a.indexOf(id), 1); save(); t.classList.toggle('is-on', on); t.setAttribute('aria-pressed', on); if (key === 'fav') { t.innerHTML = on ? IC.heartFill : IC.heart; if (on) track('add_to_wishlist', { ecommerce: { items: [gaItem(P(id))] } }); } toast(on ? `${key === 'fav' ? 'Додано в обране' : 'Додано до порівняння'} · <a href="compare.html${key === 'fav' ? '?tab=fav' : ''}">Переглянути</a>` : (key === 'fav' ? 'Прибрано з обраного' : 'Прибрано з порівняння')); return; }
    if (d.cardpack) { const card = t.closest('.pcard'), p = P(card.dataset.id); p.sel = +d.cardpack; card.outerHTML = productCard(p, { list: card.dataset.list }); updateCounters(); return; }
    if (d.notify) { openModal(`<h2 class="modal__title" id="modal-t">Повідомити про надходження</h2><p class="ink-2" style="margin-bottom:16px">${esc(P(d.notify).name)}</p><form class="stack" data-form="notify">${phoneField('nt-ph', 'Телефон для Viber / SMS')}<button class="btn btn--primary btn--block">Повідомити мене</button></form>`); return; }
    if (d.modal) { e.preventDefault(); MODALS[d.modal] && MODALS[d.modal](); return; }
    if (d.cityok !== undefined) { S.cityOk = true; save(); qsa('.cityask').forEach(x => x.remove()); const mc = qs('.mcity'); if (mc) mc.outerHTML = mcity(); return; }
    if (d.pickcity !== undefined) { if (IMB._cityPick) IMB._cityPick(d.pickcity); return; }
    if (d.setcity) { S.city = d.setcity; S.cityOk = true; save(); closeModal(); toast('Місто: ' + esc(d.setcity)); setTimeout(() => location.reload(), 400); return; }
    if (d.faqtopic !== undefined) { const box = t.closest('[data-faq]'); qsa('[data-faqtopic]', box).forEach(b => { b.setAttribute('aria-pressed', b === t); b.classList.toggle('is-on', b === t); }); qsa('details', box).forEach(x => { x.hidden = !!d.faqtopic && x.dataset.k !== d.faqtopic; x.open = false; }); return; }
    if (d.lang) { e.preventDefault(); S.lang = d.lang; save(); toast(d.lang === 'RU' ? 'RU-версія буде на /ru/ — у прототипі лише перемикач' : 'Українська версія'); qsa('[data-lang]').forEach(a => a.toggleAttribute('aria-current', a.dataset.lang === d.lang)); return; }
    if (d.drawer) { qs('#drawer-' + d.drawer).classList.add('is-open'); document.body.style.overflow = 'hidden'; return; }
    if (d.mega !== undefined) { const m = qs('#mega'), on = !m.classList.contains('is-open'); m.classList.toggle('is-open', on); t.setAttribute('aria-expanded', on); return; }
    if (d.megasec) { renderMega(+d.megasec); return; }
    if (d.cookie) { S.cookie = d.cookie; save(); t.closest('.cookie').remove(); track('consent_update', { analytics_storage: d.cookie === 'all' ? 'granted' : 'denied', ad_storage: d.cookie === 'all' ? 'granted' : 'denied' }); return; }
    if (d.select) { const card = t.closest('.pcard'); track('select_item', { ecommerce: { item_list_name: card && card.dataset.list, items: [gaItem(P(d.select))] } }); }
  });
  /* Поле кількості в картці, на сторінці товару й у вікнах: лише ціле число від 1 до залишку.
     Слухаємо на фазі перехоплення, щоб сторінка прочитала вже виправлене значення. */
  document.addEventListener('change', e => {
    const inp = e.target; if (!inp.matches || !inp.matches('[data-qty] input')) return;
    const card = inp.closest('.pcard'), line = inp.closest('[data-addedline]'), p = P(card ? card.dataset.id : line ? line.dataset.addedline.split(':')[0] : inp.closest('.buybox') ? document.body.dataset.pid : '');
    const raw = Math.round(parseFloat(String(inp.value).replace(',', '.'))), v = normQty(inp.value, p); inp.value = v;
    if (p && raw > v) toast(`У наявності ${v} ${p.byWeight ? 'кг' : 'шт.'} Більшу кількість уточнить менеджер.`);
  }, true);

  /* Кількість у вікні «Додано до кошика»: змінює рядок кошика і перераховує суми на місці */
  document.addEventListener('change', e => {
    const w = e.target.closest('[data-addedline]'); if (!w) return;
    const [id, k] = w.dataset.addedline.split(':'), line = S.cart.find(x => x.id === id && x.pack === +k); if (!line) return;
    line.qty = Math.max(1, +e.target.value || 1); e.target.value = line.qty; save();
    const box = w.closest('.modal__box'), l = cartLines().find(x => x.id === id && x.pack === +k);
    qs('[data-addedsum]', box).textContent = uah(l.sum);
    qs('[data-addedcount]', box).textContent = `У кошику ${cartCount()} шт. на суму`;
    qs('[data-addedtotal]', box).textContent = uah(cartTotals().total);
  });
  document.addEventListener('mouseover', e => { const b = e.target.closest('[data-megasec]'); if (b) renderMega(+b.dataset.megasec); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (qs('#lightbox')) { closeLightbox(); return; } closeModal(); qsa('.drawer.is-open').forEach(d => d.classList.remove('is-open')); qsa('.filters.is-sheet').forEach(x => x.classList.remove('is-sheet')); document.body.style.overflow = ''; const m = qs('#mega.is-open'); if (m) { m.classList.remove('is-open'); qs('[data-mega]').setAttribute('aria-expanded', 'false'); } } });
  document.addEventListener('click', e => { const m = qs('#mega.is-open'); if (m && !e.target.closest('#mega, [data-mega]')) { m.classList.remove('is-open'); qs('[data-mega]').setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
    const ph = qs('.js-phone', f); if (ph && !checkPhone(ph)) { ph.focus(); return; }
    const kind = f.dataset.form;
    if (kind === 'oneclick') { const p = P(f.dataset.id); track('generate_lead', { lead_type: 'one_click', ecommerce: { items: [gaItem(p)] } }); }
    else track('generate_lead', { lead_type: kind });
    const msg = { callback: ['Дзвінок замовлено', 'Передзвонимо протягом 15 хвилин у робочий час.'], oneclick: ['Замовлення прийнято', 'Менеджер передзвонить за 15 хвилин, щоб підтвердити наявність і отримання.'], notify: ['Готово', 'Напишемо у Viber або SMS, щойно товар з’явиться.'], sreview: ['Дякуємо за відгук', 'Він з’явиться на сторінці після перевірки.'], returnreq: ['Заявку на повернення прийнято', 'Менеджер зателефонує в робочий час і підкаже, як передати товар.'], cv: ['Дякуємо', 'Ми отримали ваше повідомлення й відповімо, якщо з’явиться відповідна вакансія.'], faqask: ['Питання надіслано', 'Відповімо у Viber або SMS у робочий час.'], supplier: ['Пропозицію надіслано', 'Закупівельник перегляне її й відповість на вказаний телефон або e-mail.'], pro: ['Заявку прийнято', 'Менеджер зателефонує в робочий час і уточнить, що саме ви купуєте.'] }[kind];
    if (msg) openModal(`<div class="result__icon">${IC.check}</div><h2 class="modal__title" id="modal-t" style="margin-top:16px">${msg[0]}</h2><p class="ink-2">${msg[1]}</p><button class="btn btn--dark" style="margin-top:20px" data-close>Добре</button>`);
    else if (IMB.onForm) IMB.onForm(kind, f);
  });

  /* ---------- Закріплена шапка ----------
     Шапка має position: sticky з від'ємним top (див. --hdr-hide у styles.css): перший рядок
     прокручується, другий лишається. Клас .is-stuck лише перемикає вміст закріпленого рядка,
     висота не змінюється — сторінка не «стрибає». */
  const bindStickyHeader = () => {
    const hdr = qs('#hdr'); if (!hdr) return;
    let limit = 0, ticking = false;
    const measure = () => { const tb = qs('.topbar'), mc = qs('.mcity'), first = [qs('.header__main', hdr), qs('.mhead__row', hdr)].find(el => el && el.offsetHeight); limit = (tb ? tb.offsetHeight : 0) + (mc ? mc.offsetHeight : 0) + (first ? first.offsetHeight : 0); };
    const apply = () => { ticking = false; hdr.classList.toggle('is-stuck', window.scrollY > limit); };
    measure(); apply();
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    window.addEventListener('resize', () => { measure(); apply(); });
  };

  /* ---------- Старт ---------- */
  IMB.pages = IMB.pages || {};
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader(); renderFooter(); updateCounters(); bindStickyHeader();
    qsa('[data-search]').forEach(bindSearch);
    qsa('[data-faqslot]').forEach(el => { const d = el.dataset; el.outerHTML = faqBlock({ topics: d.topics ? d.topics.split(',') : null, top: d.top !== undefined, limit: +d.limit || 0, title: d.title, lead: d.lead, all: d.all !== 'no', cls: d.cls }); });
    const pg = document.body.dataset.page; if (IMB.pages[pg]) IMB.pages[pg]();
    cookieBanner();
  });
})();
