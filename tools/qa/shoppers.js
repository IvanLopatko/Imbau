/* =========================================================
   IM BAU — стенд «віртуальні покупці»
   50 сценаріїв проходять прототип у прихованому вікні: шукають, відкривають товари,
   кладуть у кошик, оформлюють замовлення. Кожен покупець має пристрій, потребу і «характер»:
   характер визначає, що він перевіряє (ціну за кг, відгуки, розмір кнопок) і скільки дій готовий зробити.
   Це НЕ живі люди: стенд ловить те, що можна виміряти (тупики, загублені дані, дрібні кнопки,
   відсутню інформацію). Запуск: відкрити tools/qa/index.html?run=1 з локального сервера.
   ========================================================= */
(function () {
  'use strict';
  const BASE = new URL('../../', document.currentScript.src).href;
  const KEY = 'imbau_proto_v1';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const SETTLE = 130, TICK = 45;
  const DEV = {
    desk: { w: 1440, h: 900, n: 'ПК 1440' }, lap: { w: 1300, h: 760, n: 'ноутбук 1300' },
    tab: { w: 820, h: 1100, touch: 1, n: 'планшет 820' }, ph: { w: 390, h: 844, touch: 1, n: 'телефон 390' },
    phs: { w: 360, h: 740, touch: 1, n: 'телефон 360' }, zoom: { w: 720, h: 450, n: 'ПК, масштаб 200 %' },
  };

  /* Довідник тертя: код → [вага 1–3, зона, опис]. 3 = не можу завершити, 2 = заважає, 1 = дрібниця. */
  const FR = {
    'no-methods': [3, 'Оформлення', 'Для міста немає жодного способу отримання, кнопка замовлення неактивна'],
    'form-reset': [3, 'Оформлення', 'Зміна способу отримання чи оплати стирає вже введені телефон та ім’я'],
    'sticky-qty': [3, 'Товар', 'Закріплена кнопка «До кошика» на телефоні додає 1 шт. замість обраної кількості'],
    'checkout-fail': [3, 'Оформлення', 'Замовлення не вдалося надіслати'],
    'missing': [3, 'Інтерфейс', 'Потрібного елемента немає на сторінці'],
    'dead-end': [3, 'Каталог', 'Перехід привів на порожній список'],
    'search-zero': [2, 'Пошук', 'Пошук нічого не знайшов за природним запитом'],
    'method-unavailable': [2, 'Оформлення', 'Бажаний спосіб отримання недоступний'],
    'pay-unavailable': [2, 'Оформлення', 'Бажаний спосіб оплати недоступний'],
    'shade-lost': [2, 'Колерування', 'Обраний відтінок не видно в оформленні або на сторінці «Дякуємо»'],
    'tint-no-cart': [2, 'Колерування', 'З примірки відтінку не можна одразу покласти фарбу цього кольору в кошик'],
    'shade-no-return': [2, 'Колерування', 'З «Усієї палітри» немає шляху назад до товару з обраним відтінком'],
    'docs-dead': [2, 'Товар', 'Техлист або сертифікат не відкривається'],
    'return-not-near': [2, 'Довіра', 'Умови повернення й гарантії не видно на сторінці товару, лише в підвалі'],
    'reviews-none': [1, 'Довіра', 'У товару немає відгуків'],
    'info-placeholder': [2, 'Довіра', 'Сторінка з умовами порожня: шаблонний текст'],
    'desc-placeholder': [1, 'Товар', 'Опис товару — шаблонний текст'],
    'np-cost-unknown': [2, 'Доставка', 'Вартість доставки в інше місто не видно до дзвінка менеджера'],
    'delivery-unknown-cart': [1, 'Доставка', 'У кошику не видно вартості доставки'],
    'total-excl-delivery': [2, 'Оформлення', 'Підсумок не включає доставку машиною: сума «від 450 грн» окремо'],
    'city-default': [2, 'Доставка', 'Сайт показує «Самовивіз сьогодні» покупцю з іншого міста, поки той сам не змінить місто'],
    'internal-note': [1, 'Інтерфейс', 'У кошику видно службову примітку для власника'],
    'success-no-items': [1, 'Оформлення', 'На сторінці «Дякуємо» немає складу замовлення'],
    'stock-unchecked': [2, 'Товар', 'Можна замовити більше, ніж є в магазині, без попередження'],
    'kit-qty-typed': [3, 'Підбірки', 'Кількість, введену в наборі з клавіатури, сайт ігнорує: у кошик іде 1 шт.'],
    'kit-no-area': [2, 'Підбірки', 'Набір не рахує кількість під площу'],
    'no-calc': [1, 'Товар', 'Немає калькулятора витрати'],
    'no-photo': [1, 'Товар', 'У товару немає фото'],
    'one-photo': [1, 'Товар', 'У товару лише одне фото'],
    'no-shade': [1, 'Колерування', 'У фарби немає вибору відтінку'],
    'compare-mobile': [1, 'Порівняння', 'На телефоні порівняння недоступне з картки в списку'],
    'compare-scroll': [1, 'Порівняння', 'Таблиця порівняння на телефоні гортається вбік'],
    'oos-no-alt': [2, 'Товар', 'Товару немає, а заміну не запропоновано поруч із кнопкою'],
    'tap-small': [1, 'Зручність', 'Елемент керування менший за 44 px'],
    'tap-tiny': [2, 'Зручність', 'Елемент керування менший за 24 px'],
    'contrast-low': [2, 'Зручність', 'Текст із контрастом нижче 4,5:1'],
    'font-small': [1, 'Зручність', 'Текст дрібніший за 12 px'],
    'cookie-overlap': [2, 'Зручність', 'Вікно cookie перекриває кнопку купівлі на телефоні'],
    'kb-no-skip': [1, 'Клавіатура', 'Немає посилання «Перейти до вмісту»'],
    'kb-many-tabs': [2, 'Клавіатура', 'До вмісту сторінки понад 25 натискань Tab'],
    'kb-modal-trap': [2, 'Клавіатура', 'Фокус виходить із відкритого вікна на сторінку під ним'],
    'patience': [2, 'Шлях', 'Шлях довший, ніж покупець готовий пройти'],
    'overflow': [2, 'Верстка', 'Сторінка ширша за екран'],
    'search-no-suggest': [1, 'Пошук', 'Підказки під пошуком не з’явились'],
    'login-no-code': [2, 'Кабінет', 'Вхід приймає порожній код'],
    'wrong-product': [2, 'Каталог', 'Невідомий товар відкриває інший товар замість повідомлення'],
    'crash': [3, 'Стенд', 'Сценарій обірвався'],
  };

  class Shopper {
    constructor(p, frame) { this.p = p; this.f = frame; this.actions = 0; this.pages = 0; this.fr = []; this.notes = []; }
    get d() { return this.f.contentDocument; } get w() { return this.f.contentWindow; } get IMB() { return this.w.IMB; }
    where() { try { return this.w.location.pathname.split('/').pop() + this.w.location.search; } catch (e) { return '?'; } }
    note(t) { this.notes.push(t); }
    friction(code, detail) { const base = code.split(':')[0]; if (this.fr.some(x => x.code === code && x.detail === detail)) return; this.fr.push({ code, base, sev: (FR[base] || [2])[0], detail: detail || '', at: decodeURIComponent(this.where()) }); }
    state() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
    $(s, r) { return (r || this.d).querySelector(s); } $$(s, r) { return [...(r || this.d).querySelectorAll(s)]; }
    vis(el) { if (!el) return false; const r = el.getBoundingClientRect(), cs = this.w.getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; }
    first(s, r) { return this.$$(s, r).find(e => this.vis(e)); }
    ev(el, type) { el.dispatchEvent(new this.w.Event(type, { bubbles: true })); }
    async _wait(fn) { await new Promise(res => { let fin = false; const done = () => { if (fin) return; fin = true; this.f.removeEventListener('load', done); res(); }; this.f.addEventListener('load', done); fn(); setTimeout(done, 5000); }); await sleep(SETTLE); this.pages++; this.afterLoad(); }
    async load(url) { await this._wait(() => { this.f.src = BASE + url; }); }
    async nav(fn) { await this._wait(fn); }
    afterLoad() {
      const de = this.d.documentElement; if (de.scrollWidth > this.p.dev.w + 1) this.friction('overflow', `${de.scrollWidth - this.p.dev.w} px зайвих`);
      if (this.p.dev.touch && this.$('.cookie')) { const c = this.$('.cookie').getBoundingClientRect(), b = this.first('.sticky-buy'); if (b) { const r = b.getBoundingClientRect(); if (c.bottom > r.top && c.top < r.bottom) this.friction('cookie-overlap'); } }
    }
    tapCheck(el, label) { if (!this.p.dev.touch) return; const r = el.getBoundingClientRect(), m = Math.round(Math.min(r.width, r.height)); if (m < 24) this.friction('tap-tiny:' + label, `${label}: ${m} px`); else if (m < 44 && (this.p.strict || m < 36)) this.friction('tap-small:' + label, `${label}: ${m} px`); }
    async click(t, label, o = {}) {
      const el = typeof t === 'string' ? this.first(t) : t;
      if (!el) { this.friction('missing:' + label, label); return false; }
      this.actions++; this.tapCheck(el, label);
      if (o.nav) await this.nav(() => el.click()); else { el.click(); await sleep(TICK); }
      return true;
    }
    setVal(t, v, label) { const el = typeof t === 'string' ? this.$(t) : t; if (!el) { this.friction('missing:' + (label || t), label || String(t)); return false; } el.focus(); el.value = v; this.ev(el, 'input'); this.ev(el, 'change'); this.actions++; return true; }

    /* ---- типові кроки ---- */
    async search(q) {
      const inp = this.first('.search__input'); if (!inp) { this.friction('missing:пошук', 'поле пошуку'); return 0; }
      inp.focus(); inp.value = q; this.ev(inp, 'input'); this.actions++; await sleep(TICK);
      const box = inp.closest('[data-search]'); this.lastSuggest = this.$$('.suggest__item', box).length;
      if (!this.$('.suggest.is-open', box)) this.friction('search-no-suggest', q);
      await this.nav(() => inp.form.requestSubmit()); this.actions++;
      const n = this.$$('.listing .pcard').length; this.note(`пошук «${q}»: ${n}`); return n;
    }
    async openCard(id) { const a = id ? this.$(`.pcard[data-id="${id}"] .pcard__name`) : this.$('.pcard .pcard__name'); if (!a) { this.friction('missing:картка ' + id, 'картка товару ' + id); return false; } a.scrollIntoView(); return this.click(a, 'назва товару', { nav: true }); }
    async toSub(sub) {  /* шлях у підрозділ через меню каталогу, як це зробила б людина */
      const want = a => { try { return new URL(a.href).searchParams.get('sub') === sub; } catch (e) { return false; } };
      if (this.p.dev.w > 1024) {
        await this.click('[data-mega]', 'Каталог товарів');
        const sec = this.IMB.SECTIONS.findIndex(s => s.subs.includes(sub)); const b = this.$(`[data-megasec="${sec}"]`); if (b) { b.click(); this.actions++; await sleep(TICK); }
        const a = this.$$('#mega a').find(want); if (a) return this.click(a, 'підрозділ у меню', { nav: true });
      } else {
        await this.click('[data-drawer="menu"]', 'меню'); const c = this.first('#drawer-menu a[href="catalog.html"]'); if (c) { await this.click(c, 'Каталог товарів', { nav: true }); const a = this.$$('main a').find(want); if (a) return this.click(a, 'підрозділ', { nav: true }); }
      }
      this.friction('missing:підрозділ ' + sub, 'шлях у підрозділ «' + sub + '»'); await this.load('category.html?sub=' + encodeURIComponent(sub)); this.actions += 2; return false;
    }
    async cardAdd(id, qty = 1) {
      const card = this.$(`.pcard[data-id="${id}"]`); if (!card) { this.friction('missing:картка ' + id, 'картка товару ' + id); return false; }
      card.scrollIntoView(); const before = (this.state().cart.find(x => x.id === id) || { qty: 0 }).qty;
      if (this.p.dev.w > 720) { if (qty > 1) this.setVal(this.$('.pcard__buy [data-qty] input', card), qty, 'кількість у картці'); await this.click(this.$('.pcard__buy [data-add]', card), 'До кошика в картці'); }
      else { await this.click(this.$('.pcard__quick', card), 'кошик у картці'); if (qty > 1) { const inp = this.$('#modal [data-addedline] input'); if (inp) this.setVal(inp, qty, 'кількість у вікні'); await sleep(TICK); } }
      const now = (this.state().cart.find(x => x.id === id) || { qty: 0 }).qty; if (now - before !== qty) this.friction('missing:кількість', `з картки додано ${now - before} шт. замість ${qty}`);
      return !!this.$('#modal');
    }
    async modalClose() { const b = this.$('#modal .modal__close'); if (b) { b.click(); this.actions++; await sleep(TICK); } }
    async modalCheckout() { return this.click('#modal a[href="checkout.html"]', 'Оформити замовлення у вікні', { nav: true }); }
    async toCart() { const a = this.first('a.icon-btn[href="cart.html"]'); if (a) return this.click(a, 'кошик у шапці', { nav: true }); await this.load('cart.html'); return true; }
    async pdpAdd(id, o = {}) {
      const qty = o.qty || 1;
      if (o.pack != null) await this.click(`.buybox [data-pk="${o.pack}"]`, 'фасовка');
      if (o.shade) { const b = this.$$('.shade__sw').find(x => (x.dataset.shade || '').split('|')[1] === o.shade); if (b) await this.click(b, 'зразок відтінку'); else this.friction('no-shade', o.shade); }
      if (qty > 1) { const inp = this.first('.buybox [data-qty] input'); if (inp) { this.setVal(inp, qty, 'кількість'); await sleep(TICK); } }
      const before = (this.state().cart.find(x => x.id === id) || { qty: 0 }).qty;
      const btn = o.via === 'sticky' ? this.first('.sticky-buy [data-add]') : this.first('.buybox [data-add]');
      if (!btn) { this.friction('missing:До кошика', 'кнопка «До кошика»'); return false; }
      await this.click(btn, o.via === 'sticky' ? 'До кошика (закріплена)' : 'До кошика');
      const got = (this.state().cart.find(x => x.id === id) || { qty: 0 }).qty - before;
      if (got !== qty) this.friction(o.via === 'sticky' ? 'sticky-qty' : 'missing:кількість', `обрано ${qty} шт., у кошик потрапило ${got}`);
      return !!this.$('#modal');
    }
    async checkout(o = {}) {
      if (!this.$('[data-co]')) { this.friction('checkout-fail', 'форма оформлення не відкрилась'); return false; }
      const fill = () => { this.setVal('#co-ph', o.phone || '0671234567', 'телефон'); this.setVal('#co-name', o.name || 'Олена', 'ім’я'); };
      if (o.contactsFirst) fill();
      if (o.city) { const c = this.$('#co-city'); c.focus(); c.value = o.city; this.ev(c, 'input'); this.actions++; await sleep(TICK); const b = this.$$('[data-cityset]').find(x => x.dataset.cityset === o.city) || this.$('[data-cityset]'); if (b) { b.click(); this.actions++; await sleep(TICK); } }
      const avail = this.$$('input[name="method"]').filter(x => !x.disabled).map(x => x.value); this.note('способи отримання: ' + (avail.join(', ') || 'немає'));
      if (!avail.length) { const rb = this.$('[data-co] .summary .btn--primary'); if (!rb || rb.disabled || !/заявк/i.test(rb.textContent)) { this.friction('no-methods', `місто ${o.city || this.state().city}`); return false; }
        this.note('способів отримання немає: надсилаю заявку менеджеру'); this.setVal('#co-ph', '0671234567', 'телефон'); this.setVal('#co-name', 'Тест', 'ім’я'); this.actions++; await this.nav(() => rb.click()); return /success/.test(this.w.location.pathname); }
      let m = o.method || avail[0]; if (!avail.includes(m)) { this.friction('method-unavailable', m); m = avail[0]; }
      const r = this.$(`input[name="method"][value="${m}"]`); if (r && !r.checked) { r.click(); this.actions++; await sleep(TICK); }
      if (o.company) { const c = this.$('[data-company]'); if (c && !c.checked) { c.click(); this.actions++; await sleep(TICK); } }
      if (o.pay) { const pr = this.$(`input[name="pay"][value="${o.pay}"]`); if (!pr) this.friction('pay-unavailable', o.pay); else if (!pr.checked) { pr.click(); this.actions++; await sleep(TICK); } }
      if (o.contactsFirst) { const ph = this.$('#co-ph'), nm = this.$('#co-name'); if (!ph.value || !nm.value) { this.friction('form-reset', 'телефон та ім’я зникли після вибору способу'); fill(); } } else fill();
      if (m === 'own') this.setVal('#co-addr', 'вул. Полтавський Шлях, 150', 'адреса');
      if (o.company) { this.setVal('#co-cn', 'ФОП Коваленко', 'назва компанії'); this.setVal('#co-ed', '3012345678', 'ЄДРПОУ'); }
      const sum = this.$('[data-co] .summary'), cart = this.state().cart;
      if (cart.some(x => x.shade) && !cart.filter(x => x.shade).every(x => sum.textContent.includes(x.shade))) this.friction('shade-lost', 'у підсумку оформлення');
      if (m === 'own' && !/від/.test((sum.querySelector('.summary__total b') || {}).textContent || '')) this.friction('total-excl-delivery'); /* сума має враховувати доставку машиною */
      if (o.before) await o.before(m);
      const btn = this.$('[data-co] .summary .btn--primary'); if (!btn || btn.disabled) { this.friction('checkout-fail', 'кнопка підтвердження неактивна'); return false; }
      this.tapCheck(btn, 'Підтвердити замовлення'); this.actions++; await this.nav(() => btn.click());
      const ok = /success\.html/.test(this.w.location.pathname) && !!this.$('.result__num'); if (!ok) { this.friction('checkout-fail', 'сторінка «Дякуємо» не відкрилась'); return false; }
      const res = this.$('.result').textContent; if (!cart.some(x => res.includes((this.IMB.byId[x.id] || {}).name || '§'))) this.friction('success-no-items');
      if (cart.some(x => x.shade) && !cart.filter(x => x.shade).every(x => res.includes(x.shade))) this.friction('shade-lost', 'на сторінці «Дякуємо»');
      return true;
    }
    /* ---- перевірки потреб на сторінці товару ---- */
    async pdpNeeds(id, list) {
      const P = this.IMB.byId[id], bb = this.$('.buybox'), h = this.p.dev.h;
      for (const n of list) {
        if (n === 'reviews' && !(this.IMB.REVIEWS[id] || []).length) this.friction('reviews-none', P.name);
        if (n === 'return' && !this.$$('main a').some(a => /p=(return|warranty)/.test(a.getAttribute('href') || '') && this.vis(a))) this.friction('return-not-near');
        if (n === 'calc' && !this.first('[data-calc]')) this.friction('no-calc', P.name);
        if (n === 'photos') { if (!P.img) this.friction('no-photo', P.name); else if (P.img.length < 2) this.friction('one-photo', P.name); }
        if (n === 'shade' && !this.$('.shade')) this.friction('no-shade', P.name);
        if (n === 'docs') { const t = this.$('[data-tab="docs"]'); if (t) { t.click(); this.actions++; await sleep(TICK); if (this.$$('.doc-link').every(a => a.getAttribute('href') === '#')) this.friction('docs-dead', P.name); } }
        if (n === 'desc') { const t = this.$('[data-tab="desc"]'); if (t) { t.click(); await sleep(TICK); if (/контент-менеджер/.test(this.$('.ptabs__panel').textContent)) this.friction('desc-placeholder', P.name); } }
        if (n === 'fold') { const b = this.first('.buybox [data-add]'), s = this.first('.sticky-buy'); if (!(b && b.getBoundingClientRect().top < h) && !s) this.friction('missing:купівля на першому екрані', 'кнопка купівлі нижче першого екрана'); }
        if (n === 'npcost') { const t = (this.$('.shipbox') || {}).textContent || ''; if (/за тарифом/.test(t)) this.friction('np-cost-unknown'); }
        if (n === 'stockwarn') { /* перевіряється у сценарії */ }
      }
    }
    /* ---- зручність: дрібні кнопки, контраст, дрібний текст ---- */
    lum(c) { const a = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; }
    rgb(s) { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 1]; }
    bgOf(el) { let c = [255, 255, 255], stack = []; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = this.w.getComputedStyle(e); const b = this.rgb(cs.backgroundColor); if (cs.backgroundImage !== 'none' && !stack.length) return null; if ((b[3] === undefined ? 1 : b[3]) > 0) { stack.push(b); if ((b[3] === undefined ? 1 : b[3]) >= 1) break; } } stack.reverse().forEach(b => { const a = b[3] === undefined ? 1 : b[3]; c = c.map((v, i) => v * (1 - a) + b[i] * a); }); return c; }
    audit(label) {
      const out = { contrast: {}, small: {}, taps: {} }, key = el => (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase());
      this.$$('body *').forEach(el => {
        if (!this.vis(el) || el.closest('.proto-flag, .sr-only, .cookie, svg, .logo__mark')) return;
        const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own) return;
        const cs = this.w.getComputedStyle(el), fs = parseFloat(cs.fontSize); if (parseFloat(cs.opacity) < 1 || el.closest('.is-off, .is-disabled, [disabled], .is-out')) return;
        if (fs < 12) out.small[key(el)] = Math.round(fs * 10) / 10;
        const bg = this.bgOf(el); if (!bg) return; const fg = this.rgb(cs.color), a = fg[3] === undefined ? 1 : fg[3], col = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
        const l1 = this.lum(col), l2 = this.lum(bg), ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05), big = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
        if (ratio < (big ? 3 : 4.5)) { const k = key(el); if (!out.contrast[k] || out.contrast[k].r > ratio) out.contrast[k] = { r: Math.round(ratio * 100) / 100, fs, t: el.textContent.trim().slice(0, 28) }; }
      });
      if (this.p.dev.touch) this.$$('main button, main input:not([type=hidden]):not([type=checkbox]):not([type=radio]), main select, main a.btn, main .chip, header button, header a.icon-btn').forEach(el => { if (!this.vis(el)) return; const r = el.getBoundingClientRect(), m = Math.round(Math.min(r.width, r.height)); if (m < 44) { const k = key(el); if (!out.taps[k] || out.taps[k] > m) out.taps[k] = m; } });
      Object.entries(out.contrast).forEach(([k, v]) => this.friction('contrast-low:' + k, `${k} ${v.r}:1 (${v.fs} px) «${v.t}»`));
      Object.entries(out.small).forEach(([k, v]) => this.friction('font-small:' + k, `${k} ${v} px`));
      Object.entries(out.taps).forEach(([k, v]) => this.friction((v < 24 ? 'tap-tiny:' : 'tap-small:') + k, `${k}: ${v} px`));
      this.note(`${label}: контраст ${Object.keys(out.contrast).length}, дрібний текст ${Object.keys(out.small).length}, дрібні кнопки ${Object.keys(out.taps).length}`);
      return out;
    }
  }

  /* =========================================================
     50 покупців. seg — хто, psy — характер, dev — пристрій, need — навіщо прийшов,
     budget — скільки дій готовий зробити, st — стартовий стан (перший візит, місто, вхід).
     ========================================================= */
  const first = { cookie: null };
  const P = [
    /* ---------- знають, що шукати ---------- */
    { id: 1, who: 'Олег, плиточник', psy: 'прагматик', dev: 'ph', need: 'Клей для плитки, 10 мішків, забрати сьогодні', budget: 11, run: async s => {
      await s.load('index.html'); const n = await s.search('клей для плитки'); if (!n) { s.friction('search-zero', 'клей для плитки'); return false; }
      await s.openCard('tm12'); await s.pdpNeeds('tm12', ['fold']); await s.pdpAdd('tm12', { qty: 10 }); await s.modalCheckout(); return s.checkout({ method: 'pickup', pay: 'store' }); } },
    { id: 2, who: 'Сергій, маляр', psy: 'нетерплячий', dev: 'ph', need: 'Фарба за артикулом, 4 відра, кнопкою внизу екрана', budget: 9, run: async s => {
      await s.load('index.html'); const n = await s.search('FR-ACR-07'); if (!n) { s.friction('search-zero', 'артикул FR-ACR-07'); await s.load('product.html?id=acr'); } else await s.openCard('acr');
      await s.pdpAdd('acr', { qty: 4, via: 'sticky' }); await s.modalCheckout(); return s.checkout({ method: 'pickup', pay: 'store' }); } },
    { id: 3, who: 'Марина, перший ремонт', psy: 'новачок', dev: 'lap', need: 'Фарба для кімнати 18 м², не знає скільки брати', budget: 16, st: first, run: async s => {
      await s.load('index.html'); const n = await s.search('фарба для стін'); if (!n) { s.friction('search-zero', 'фарба для стін'); await s.search('фарба'); }
      await s.openCard('acr'); await s.pdpNeeds('acr', ['calc', 'reviews', 'return', 'desc']);
      s.setVal('#c-area', 40, 'площа в калькуляторі'); await sleep(TICK); const b = s.$('[data-calcadd]'); const packs = b ? +b.dataset.calcadd : 0; s.note('калькулятор радить упаковок: ' + packs); await s.click(b, 'Додати з калькулятора');
      const got = (s.state().cart.find(x => x.id === 'acr') || { qty: 0 }).qty; if (got !== packs) s.friction('missing:калькулятор', `калькулятор порадив ${packs}, у кошику ${got}`);
      await s.modalCheckout(); return s.checkout({ method: 'pickup', pay: 'online' }); } },
    { id: 4, who: 'Андрій, шукає російською', psy: 'прагматик', dev: 'desk', need: 'Біла фарба, 3 кг', budget: 12, run: async s => {
      await s.load('index.html'); let n = await s.search('краска белая'); if (!n) { s.friction('search-zero', 'краска белая'); n = await s.search('краска'); if (!n) { s.friction('search-zero', 'краска'); return false; } }
      await s.openCard('mat'); await s.pdpAdd('mat', { pack: 1 }); await s.modalCheckout(); return s.checkout({ method: 'pickup', pay: 'online' }); } },
    { id: 5, who: 'Тетяна, шукає російською', psy: 'ощадлива', dev: 'phs', need: 'Фінішна шпаклівка з доставкою додому', budget: 14, run: async s => {
      await s.load('index.html'); let n = await s.search('шпатлевка финишная'); if (!n) { s.friction('search-zero', 'шпатлевка финишная'); n = await s.search('шпатлевка'); if (!n) { s.friction('search-zero', 'шпатлевка'); return false; } }
      await s.openCard('shp'); await s.pdpAdd('shp'); await s.modalClose(); await s.toCart(); if (/на наступному кроці/.test(s.$('.summary').textContent)) s.friction('delivery-unknown-cart');
      await s.click('.summary a[href="checkout.html"]', 'Оформити замовлення', { nav: true }); return s.checkout({ method: 'own', pay: 'cod' }); } },
    { id: 6, who: 'Ігор, поспішає', psy: 'нетерплячий', dev: 'ph', need: 'Штукатурка, 20 мішків, замовити дзвінком', budget: 8, run: async s => {
      await s.load('index.html'); let n = await s.search('шткатурка'); if (!n) { s.friction('search-zero', 'одруківка «шткатурка»'); n = await s.search('штукатурка'); }
      await s.openCard('gs41'); await s.click('.buybox [data-oneclick]', 'Купити в 1 клік'); s.setVal('#oc-ph', '0501112233', 'телефон'); const f = s.$('#modal form'); f.requestSubmit(); s.actions++; await sleep(TICK);
      return /прийнято/i.test((s.$('#modal') || {}).textContent || ''); } },
    { id: 7, who: 'Наталя, обирає очима', psy: 'візуал', dev: 'tab', need: 'Шовковиста фарба у потрібному кольорі', budget: 14, run: async s => {
      await s.load('index.html'); const n = await s.search('satinlatex'); if (!n) { s.friction('search-zero', 'satinlatex'); return false; }
      await s.openCard('sat'); await s.pdpNeeds('sat', ['photos', 'shade']); await s.pdpAdd('sat'); await s.modalCheckout(); return s.checkout({ method: 'pickup' }); } },
    { id: 8, who: 'Віктор, виконроб', psy: 'прагматик', dev: 'desk', need: 'Гіпсокартон, 40 листів, на компанію з ПДВ', budget: 14, run: async s => {
      await s.load('index.html'); await s.search('гіпсокартон'); await s.openCard('gkl'); await s.pdpAdd('gkl', { qty: 40 });
      const line = s.IMB.cartLines().find(l => l.id === 'gkl'); if (!line || line.unitPrice !== 425) s.friction('missing:ціна на обсяг', 'ціна від 30 шт. не застосувалась');
      await s.modalCheckout(); return s.checkout({ method: 'own', company: true, pay: 'invoice' }); } },
    { id: 9, who: 'Петро, 68 років', psy: 'літня людина', dev: 'tab', strict: 1, need: 'Ґрунтовка 5 л, оплатити готівкою в магазині', budget: 14, run: async s => {
      await s.load('index.html'); s.audit('головна'); const n = await s.search('грунтовка'); if (!n) { s.friction('search-zero', 'грунтовка'); return false; }
      await s.openCard('grn'); s.audit('товар'); await s.pdpAdd('grn'); await s.modalCheckout(); s.audit('оформлення'); return s.checkout({ method: 'pickup', pay: 'store' }); } },
    { id: 10, who: 'Юлія з Києва', psy: 'ощадлива', dev: 'ph', need: 'Монтажна піна з доставкою в Київ', budget: 12, st: first, run: async s => {
      await s.load('index.html'); await s.search('монтажна піна'); await s.openCard('foam');
      if (/Самовивіз/.test(s.$('.shipbox').textContent) && !s.$('.shipbox .ship-line.is-off')) s.friction('city-default');
      await s.pdpAdd('foam', { qty: 3 }); await s.modalCheckout(); return s.checkout({ city: 'Київ', method: 'np', pay: 'online' }); } },
    /* ---------- йдуть каталогом ---------- */
    { id: 11, who: 'Дмитро, порівнює', psy: 'дослідник', dev: 'desk', need: 'Фарба для вологої кімнати, порівняти дві', budget: 18, run: async s => {
      await s.load('index.html'); await s.toSub('Фарби інтер’єрні'); const c = s.$$('[data-f="use"]').find(x => x.value === 'Для вологих приміщень'); if (c) { c.click(); s.actions++; await sleep(TICK); }
      const n = s.$$('.listing .pcard').length; s.note('після фільтра: ' + n); if (!s.$('.applied .chip--applied')) s.friction('missing:чипи фільтрів', 'обраний фільтр не показано чипом');
      const sel = s.$('[data-slot="sort"]'); sel.value = 'cheap'; s.ev(sel, 'change'); s.actions++; await sleep(TICK);
      const ids = s.$$('.listing .pcard').slice(0, 2).map(x => x.dataset.id); for (const id of ids) await s.click(`.pcard[data-id="${id}"] [data-cmp]`, 'порівняти');
      await s.click('header a[href="compare.html"]', 'порівняння в шапці', { nav: true }); if (s.$$('.cmp thead td').length !== 2) s.friction('missing:порівняння', 'у порівнянні не два товари');
      await s.click('.cmp [data-add]', 'До кошика з порівняння'); await s.modalCheckout(); return s.checkout({ method: 'pickup' }); } },
    { id: 12, who: 'Олена, рахує кожну гривню', psy: 'ощадлива', dev: 'lap', need: 'Найдешевша шпаклівка за кілограм, з промокодом', budget: 16, run: async s => {
      await s.load('index.html'); await s.toSub('Шпаклівки'); const sel = s.$('[data-slot="sort"]'); sel.value = 'cheap'; s.ev(sel, 'change'); s.actions++; await sleep(TICK);
      if (!s.$$('.pcard__meta').some(m => /грн\/кг/.test(m.textContent))) s.friction('missing:ціна за кг', 'у картках немає ціни за кілограм');
      const id = s.$('.listing .pcard').dataset.id; await s.cardAdd(id, 2); await s.modalClose(); await s.toCart();
      if (/CRO|рішення власника/.test(s.$('main').textContent)) s.friction('internal-note'); if (/на наступному кроці/.test(s.$('.summary').textContent)) s.friction('delivery-unknown-cart');
      s.setVal('[data-promo] input', 'bau5', 'промокод'); s.$('[data-promo]').requestSubmit(); s.actions++; await sleep(TICK); if (!s.state().promo) s.friction('missing:промокод', 'промокод малими літерами не спрацював');
      await s.click('.summary a[href="checkout.html"]', 'Оформити замовлення', { nav: true }); return s.checkout({ method: 'pickup', pay: 'store' }); } },
    { id: 13, who: 'Роман, монтажник', psy: 'прагматик', dev: 'ph', need: 'Профіль CD ×20 і UD ×10 просто зі списку', budget: 16, run: async s => {
      await s.load('index.html'); await s.toSub('Профіль'); await s.cardAdd('cd', 20); await s.modalClose(); await s.cardAdd('ud', 10); await s.modalCheckout(); return s.checkout({ method: 'own', pay: 'cod' }); } },
    { id: 14, who: 'Ірина, утеплює балкон', psy: 'новачок', dev: 'ph', need: 'Пінопласт, порахувати кількість, спитати пораду', budget: 14, st: first, run: async s => {
      await s.load('index.html'); await s.toSub('Пінопласт'); await s.openCard('psb'); await s.pdpNeeds('psb', ['calc', 'reviews', 'desc']);
      await s.click('[data-tab="qa"]', 'вкладка Питання'); await s.click('[data-ask]', 'Запитати'); s.setVal('#qa-t', 'Скільки листів на балкон 6 м²?', 'питання'); s.setVal('#qa-ph', '0931234567', 'телефон'); s.$('#modal form').requestSubmit(); s.actions++; await sleep(TICK);
      return /надіслано/i.test((s.$('#modal') || {}).textContent || ''); } },
    { id: 15, who: 'Богдан, бере хіти', psy: 'нетерплячий', dev: 'desk', need: 'Хіт продажів з головної в кошик і одразу оформити', budget: 7, run: async s => {
      await s.load('index.html'); await s.click('[data-htab="hits"]', 'вкладка Хіти'); const id = s.$('[data-slot="products"] .pcard').dataset.id; await s.cardAdd(id, 1); await s.modalCheckout(); return s.checkout({ method: 'pickup' }); } },
    { id: 16, who: 'Світлана, читає все', psy: 'прискіплива', dev: 'desk', need: 'Емаль кольору «Теракота», з документами', budget: 20, run: async s => {
      await s.load('index.html'); await s.toSub('Емалі'); await s.openCard('pf'); await s.pdpNeeds('pf', ['docs', 'desc', 'reviews', 'return', 'photos']);
      await s.click('[data-tab="spec"]', 'Характеристики'); if (s.$$('.spec tr').length < 8) s.friction('missing:характеристики', 'менше восьми рядків характеристик');
      await s.pdpAdd('pf', { qty: 2, shade: 'Теракота' }); await s.modalCheckout(); return s.checkout({ method: 'own', pay: 'online' }); } },
    { id: 17, who: 'Микола, не довіряє', psy: 'недовірливий', dev: 'lap', need: 'Фарба TIGOR: відгуки, гарантія, хто продавець', budget: 14, run: async s => {
      await s.load('index.html'); await s.toSub('Фарби інтер’єрні'); await s.openCard('ti91'); await s.pdpNeeds('ti91', ['reviews', 'return', 'docs']);
      await s.load('info.html?p=about'); s.actions++; if (/Шаблон інформаційної сторінки/.test(s.$('main').textContent)) s.friction('info-placeholder', 'Про компанію');
      await s.load('product.html?id=ti91'); await s.click('.buybox [data-oneclick]', 'Купити в 1 клік'); s.setVal('#oc-ph', '0661234567', 'телефон'); s.$('#modal form').requestSubmit(); s.actions++; await sleep(TICK); return /прийнято/i.test((s.$('#modal') || {}).textContent || ''); } },
    { id: 18, who: 'Катерина, підбирає колір', psy: 'візуал', dev: 'ph', need: 'Шпаклівка TIGOR у відтінку «Троянда»', budget: 14, run: async s => {
      await s.load('brand.html?b=tigor'); const a = s.$$('.bline').find(x => /Шпаклівк/.test(x.textContent)); await s.click(a, 'лінійка марки', { nav: true });
      if (!s.$$('.listing .pcard').length) { s.friction('dead-end', 'лінійка «Шпаклівки» TIGOR'); return false; }
      await s.openCard('shp'); await s.pdpNeeds('shp', ['photos', 'shade']); await s.click('[data-zoom="cur"]', 'збільшити фото'); if (!s.$('#lightbox')) s.friction('missing:перегляд фото', 'фото не відкрилось на весь екран'); else { s.$('[data-lbclose]').click(); s.actions++; }
      await s.pdpAdd('shp', { shade: 'Троянда' }); await s.modalClose(); await s.toCart(); if (!/Троянда/.test(s.$('.cart-items').textContent)) s.friction('shade-lost', 'у кошику');
      await s.load('checkout.html'); s.actions++; return s.checkout({ method: 'pickup' }); } },
    { id: 19, who: 'Артем, гортає марку', psy: 'дослідник', dev: 'tab', need: 'Ґрунтовка саме FRONT', budget: 10, run: async s => {
      await s.load('brand.html?b=front'); const a = s.$$('.bline').find(x => /Ґрунтовки/.test(x.textContent)); await s.click(a, 'лінійка Ґрунтовки', { nav: true });
      const n = s.$$('.listing .pcard').length; if (!n) { s.friction('dead-end', 'лінійка «Ґрунтовки» FRONT відкриває порожній список'); return false; } return true; } },
    { id: 20, who: 'Олексій, закуповує на об’єкт', psy: 'прагматик', dev: 'desk', need: 'Піна ×12 і герметик ×6 марки TIGOR', budget: 16, run: async s => {
      await s.load('brand.html?b=tigor'); const a = s.$$('.bline').find(x => /Піни/.test(x.textContent)); await s.click(a, 'лінійка Піни й герметики', { nav: true });
      if (!s.$('.pcard[data-id="foam"]')) { s.friction('dead-end', 'лінійка «Піни й герметики»'); return false; } await s.cardAdd('foam', 12); await s.modalClose();
      if (!s.$('.pcard[data-id="seal"]')) { s.note('герметика в цьому списку немає, шукає окремо'); await s.search('герметик'); } await s.cardAdd('seal', 6); await s.modalCheckout(); return s.checkout({ method: 'pickup', pay: 'store' }); } },
    /* ---------- йдуть від задачі ---------- */
    { id: 21, who: 'Ганна, фарбує спальню', psy: 'новачок', dev: 'ph', need: 'Усе для фарбування одним набором', budget: 12, st: first, run: async s => {
      await s.load('index.html'); const a = s.$$('main a').find(x => /kit\.html/.test(x.getAttribute('href') || '') && /фарбування/i.test(x.textContent)); if (a) await s.click(a, 'задача «Для фарбування»', { nav: true }); else { s.friction('missing:задачі ремонту', 'на головній немає входу в підбірку'); await s.load('kit.html?t=' + encodeURIComponent('Для фарбування')); }
      if (!s.$('.layers__stage')) s.friction('missing:схема шарів', 'схеми шарів немає'); if (!s.$$('main a, main button').some(x => /площ/i.test(x.textContent) && !/podbor/.test(x.getAttribute('href') || ''))) s.friction('kit-no-area');
      await s.click('[data-kitall]', 'Додати все до кошика'); await s.toCart(); return (await s.click('.summary a[href="checkout.html"], .sticky-buy a[href="checkout.html"]', 'Оформити замовлення', { nav: true })) && s.checkout({ method: 'pickup' }); } },
    { id: 22, who: 'Василь, штукатурить гараж', psy: 'новачок', dev: 'desk', need: 'Набір для штукатурки на 30 м²', budget: 14, run: async s => {
      await s.load('kit.html?t=' + encodeURIComponent('Для штукатурки')); const l = s.$$('main a').find(x => /площ/i.test(x.textContent)); if (!l) { s.friction('kit-no-area'); return false; }
      await s.click(l, 'Порахувати під мою площу', { nav: true }); if (!/kit\.html/.test(s.where())) s.friction('kit-no-area', 'посилання веде на загальну форму, набір не перераховується');
      const sel = s.$('#calc-p'); if (sel) { sel.value = 'gs41'; s.ev(sel, 'change'); s.setVal('#c-area', 30, 'площа'); await sleep(TICK); const b = s.$('[data-calcadd]'); await s.click(b, 'Додати з калькулятора'); }
      await s.modalCheckout(); return s.checkout({ method: 'own' }); } },
    { id: 23, who: 'Ліда, кладе плитку у ванній', psy: 'тривожна', dev: 'tab', need: 'Набір для плитки з доставкою нашою машиною', budget: 14, run: async s => {
      await s.load('kit.html?t=' + encodeURIComponent('Для плитки')); await s.click('[data-kitall]', 'Додати все до кошика'); await s.toCart(); await s.click('.summary a[href="checkout.html"]', 'Оформити замовлення', { nav: true });
      return s.checkout({ method: 'own', pay: 'cod', contactsFirst: true }); } },
    { id: 24, who: 'Тарас, бригадир', psy: 'прагматик', dev: 'ph', need: 'Гіпсокартон із каркасом на компанію', budget: 18, run: async s => {
      await s.load('kit.html?t=' + encodeURIComponent('Для гіпсокартону')); for (const [id, q] of [['gkl', 30], ['cd', 40], ['ud', 20]]) { const inp = s.$(`[data-kq="${id}"] input`); if (inp) { inp.value = q; s.ev(inp, 'change'); s.actions++; } }
      await sleep(TICK); const shown = +(s.$('[data-kq="gkl"] input') || {}).value; if (shown !== 30) s.friction('missing:кількість у наборі', `у наборі не можна ввести кількість числом: лишилось ${shown}`);
      await s.click('[data-kitall]', 'Додати все до кошика'); const gq = (s.state().cart.find(x => x.id === 'gkl') || { qty: 0 }).qty; if (gq !== 30) s.friction('kit-qty-typed', `введено 30 листів, у кошику ${gq}`); await s.toCart(); await s.click('.sticky-buy a[href="checkout.html"], .summary a[href="checkout.html"]', 'Оформити замовлення', { nav: true }); return s.checkout({ method: 'own', company: true, pay: 'invoice' }); } },
    { id: 25, who: 'Зоя, утеплює фасад', psy: 'ощадлива', dev: 'lap', need: 'Набір для утеплення без мінвати', budget: 14, run: async s => {
      await s.load('kit.html?t=' + encodeURIComponent('Для утеплення')); const m = s.$('[data-kq="min"] [data-k="-1"]'); await s.click(m, 'мінус у наборі'); await s.click('[data-kitall]', 'Додати все до кошика');
      if (s.state().cart.some(x => x.id === 'min')) s.friction('missing:набір', 'товар із кількістю 0 потрапив у кошик'); await s.toCart(); if (/CRO|рішення власника/.test(s.$('main').textContent)) s.friction('internal-note');
      await s.click('.summary a[href="checkout.html"]', 'Оформити замовлення', { nav: true }); return s.checkout({ method: 'own' }); } },
    /* ---------- колір ---------- */
    { id: 26, who: 'Оксана, дизайнерка', psy: 'візуал', dev: 'desk', need: 'Приміряти чотири відтінки і замовити фарбу «Індиго»', budget: 14, run: async s => {
      await s.load('tinting.html'); for (const c of ['#DDE5D0', '#B4714F', '#7393A3', '#3F5A70']) await s.click(`[data-sw="${c}"]`, 'зразок на палітрі');
      if (s.$('[data-slot="room"]').style.getPropertyValue('--shade') !== '#3F5A70') s.friction('missing:примірка', 'стіна не перефарбувалась');
      if (!s.$$('.viz a, .viz button').some(x => /кошик/i.test(x.textContent))) s.friction('tint-no-cart');
      await s.click('[data-vizorder]', 'Замовити цей відтінок'); s.setVal('#tn-ph', '0671112233', 'телефон'); s.$('[data-form="tint"]').requestSubmit(); s.actions++; await sleep(TICK); return /прийнято/i.test((s.$('#modal') || {}).textContent || ''); } },
    { id: 27, who: 'Павло, тисне не читаючи', psy: 'нетерплячий', dev: 'ph', need: 'Замовити колерування швидко', budget: 7, run: async s => {
      await s.load('tinting.html'); await s.click('[data-sw="#C99A78"]', 'зразок на палітрі'); await s.click('[data-vizorder]', 'Замовити цей відтінок'); s.$('[data-form="tint"]').requestSubmit(); s.actions++; await sleep(TICK);
      if (!s.$('.field.is-invalid')) s.friction('missing:помилка у формі', 'порожній телефон не підсвічено'); s.setVal('#tn-ph', '0671112233', 'телефон'); s.$('[data-form="tint"]').requestSubmit(); s.actions++; await sleep(TICK); return /прийнято/i.test((s.$('#modal') || {}).textContent || ''); } },
    { id: 28, who: 'Аліна, вагається з кольором', psy: 'тривожна', dev: 'phs', need: 'Обрати відтінок у товарі, глянути всю палітру, повернутись і купити', budget: 14, run: async s => {
      await s.load('product.html?id=pf'); await s.click(s.$$('.shade__sw')[3], 'зразок відтінку'); const a = s.$('.shade__foot a'); await s.click(a, 'Уся палітра', { nav: true });
      await s.click('[data-sw="#A9BB98"]', 'зразок на палітрі'); if (!s.$$('main a').some(x => /product\.html/.test(x.getAttribute('href') || '') && s.vis(x) && x.closest('.viz'))) s.friction('shade-no-return');
      await s.load('product.html?id=pf'); s.actions += 2; if (s.$('.shade__sw[aria-pressed="true"]').dataset.shade) s.note('відтінок зберігся'); else s.friction('shade-no-return', 'після повернення відтінок скинувся на білий');
      await s.pdpAdd('pf'); await s.modalCheckout(); return s.checkout({ method: 'pickup' }); } },
    /* ---------- шукають інформацію ---------- */
    { id: 29, who: 'Людмила, спершу умови', psy: 'недовірлива', dev: 'desk', need: 'Як повернути товар, якщо не підійде', budget: 6, run: async s => {
      await s.load('product.html?id=mat'); await s.pdpNeeds('mat', ['return']); const a = s.$$('a').find(x => /p=return/.test(x.getAttribute('href') || '')); if (!a) { s.friction('missing:повернення', 'посилання на умови повернення немає'); return false; }
      await s.click(a, 'Обмін та повернення', { nav: true }); if (/Шаблон інформаційної сторінки/.test(s.$('main').textContent)) { s.friction('info-placeholder', 'Обмін та повернення'); return false; } return true; } },
    { id: 30, who: 'Євген із Полтави', psy: 'ощадливий', dev: 'lap', need: 'П’ять мішків клею в Полтаву: чи довезуть і за скільки', budget: 12, st: first, run: async s => {
      await s.load('product.html?id=tm12'); if (!s.$('.shipbox .ship-line.is-off')) s.friction('city-default'); await s.click('.shipbox [data-modal="city"]', 'змінити місто'); await s.click('[data-pickcity="Полтава"]', 'обрати Полтаву'); const b = s.$('[data-setcity]'); s.actions++; await s.nav(() => b.click());
      await s.pdpNeeds('tm12', ['npcost']); await s.pdpAdd('tm12', { qty: 5 }); await s.modalCheckout(); return s.checkout({ method: 'np', pay: 'cod' }); } },
    { id: 31, who: 'Стас, їде в магазин', psy: 'нетерплячий', dev: 'ph', need: 'Адреса, графік і маршрут з телефона', budget: 4, run: async s => {
      await s.load('index.html'); const a = s.first('main a[href="stores.html"]'); if (!a) { s.friction('missing:магазин', 'на головній немає входу до магазину'); await s.load('stores.html'); } else await s.click(a, 'Як доїхати', { nav: true });
      const t = s.$('main').textContent; return /Холодногірська/.test(t) && /9:00/.test(t) && !!s.first('a[href*="maps.google"]'); } },
    { id: 32, who: 'Валентина, 72 роки', psy: 'літня людина', dev: 'ph', strict: 1, need: 'Подзвонити або замовити дзвінок', budget: 5, run: async s => {
      await s.load('index.html'); const tel = s.first('header a[href^="tel:"]'); if (!tel) s.friction('missing:телефон', 'у шапці на телефоні немає номера'); else s.tapCheck(tel, 'телефон у шапці'); s.audit('головна');
      const cb = s.first('[data-modal="callback"]'); if (!cb) { await s.click('[data-drawer="menu"]', 'меню'); } const c2 = s.first('[data-modal="callback"]'); if (!c2) { s.friction('missing:дзвінок', 'кнопку «Замовити дзвінок» на телефоні не знайти'); return !!tel; }
      await s.click(c2, 'Замовити дзвінок'); s.setVal('#cb-ph', '0971234567', 'телефон'); s.$('#modal form').requestSubmit(); s.actions++; await sleep(TICK); return /замовлено/i.test((s.$('#modal') || {}).textContent || ''); } },
    { id: 33, who: 'Кирило, технагляд', psy: 'прискіпливий', dev: 'desk', need: 'Техлист і сертифікат на бетоноконтакт', budget: 6, run: async s => {
      await s.load('product.html?id=tc19'); await s.pdpNeeds('tc19', ['docs']); return !s.fr.some(x => x.base === 'docs-dead'); } },
    { id: 34, who: 'Алла, хвилюється за замовлення', psy: 'тривожна', dev: 'tab', need: 'Де моє замовлення', budget: 5, st: { orders: [{ id: 'IMB-104233', date: '09.11.2026', items: [{ id: 'tm12', pack: 0, qty: 8 }], total: 2376, method: 'own', status: 3 }] }, run: async s => {
      await s.load('index.html'); const a = s.first('a[href="tracking.html"]'); if (!a) { s.friction('missing:статус замовлення', 'посилання «Де моє замовлення?» не видно на планшеті'); await s.load('tracking.html'); s.actions += 2; } else await s.click(a, 'Де моє замовлення?', { nav: true });
      s.setVal('#tr-n', 'IMB-104233', 'номер замовлення'); s.$('[data-track]').requestSubmit(); s.actions++; await sleep(TICK); return !!s.$('.timeline .tl.is-now'); } },
    { id: 35, who: 'Максим, постійний покупець', psy: 'звичка', dev: 'desk', need: 'Повторити минуле замовлення', budget: 8, st: { user: '+38 (067) 123-45-67', orders: [{ id: 'IMB-104233', date: '02.11.2026', items: [{ id: 'tm12', pack: 0, qty: 8 }, { id: 'grn', pack: 2, qty: 1 }], total: 2604, method: 'pickup', status: 5 }] }, run: async s => {
      await s.load('index.html'); await s.click('a[href="account.html"]', 'кабінет', { nav: true }); await s.click('[data-repeat]', 'Повторити'); if (s.state().cart.length !== 2) s.friction('missing:повтор', 'повтор не поклав товари в кошик');
      await s.toCart(); await s.click('.summary a[href="checkout.html"]', 'Оформити замовлення', { nav: true }); return s.checkout({ method: 'pickup', pay: 'store' }); } },
    { id: 36, who: 'Дарина, єВідновлення', psy: 'тривожна', dev: 'ph', need: 'Купити штукатурку карткою єВідновлення', budget: 14, run: async s => {
      await s.load('evidnovlennya.html'); await s.click('main a[href="catalog.html"]', 'Обрати матеріали', { nav: true }); const a = s.$$('main a').find(x => /sub=/.test(x.getAttribute('href') || '') && /Штукатурки/.test(x.textContent)); await s.click(a, 'Штукатурки', { nav: true });
      await s.openCard('gs41'); if (!/єВідновлення/.test(s.$('.shipbox').textContent)) s.friction('missing:єВідновлення', 'на сторінці товару немає згадки про оплату єВідновленням'); await s.pdpAdd('gs41', { qty: 6 }); await s.modalCheckout(); return s.checkout({ method: 'pickup', pay: 'evid' }); } },
    { id: 37, who: 'Леонід, ФОП', psy: 'прагматик', dev: 'lap', need: 'Рахунок із ПДВ, спершу заповнює контакти', budget: 14, run: async s => {
      await s.load('product.html?id=tc19'); await s.pdpAdd('tc19', { qty: 4 }); await s.modalCheckout(); return s.checkout({ method: 'pickup', company: true, pay: 'invoice', contactsFirst: true }); } },
    { id: 38, who: 'Соломія, читає поради', psy: 'дослідниця', dev: 'desk', need: 'Стаття про фарбу, потім купити з неї', budget: 12, run: async s => {
      await s.load('blog.html'); await s.click('.afeature', 'перша стаття', { nav: true }); if (!s.$('.article__toc')) s.friction('missing:зміст статті', 'у статті немає змісту');
      await s.click('.ainline', 'товар у тексті', { nav: true }); await s.pdpAdd('acr', { pack: 1 }); await s.modalCheckout(); return s.checkout({ method: 'pickup' }); } },
    { id: 39, who: 'Гліб, прийшов за битим посиланням', psy: 'нетерплячий', dev: 'desk', need: 'Знайти товар після сторінки 404', budget: 6, run: async s => {
      await s.load('404.html'); const n = await s.search('клей'); if (!n) { s.friction('search-zero', 'клей'); return false; } return s.openCard('tm12'); } },
    { id: 40, who: 'Інна, відкладає на потім', psy: 'дослідниця', dev: 'ph', need: 'Зберегти три товари в обране і купити один', budget: 14, run: async s => {
      await s.load('category.html?sub=' + encodeURIComponent('Фарби інтер’єрні')); for (const id of ['acr', 'sat', 'soft']) await s.click(`.pcard[data-id="${id}"] [data-fav]`, 'обране в картці');
      await s.click('[data-drawer="menu"]', 'меню'); await s.click('#drawer-menu a[href="compare.html?tab=fav"]', 'Обране', { nav: true }); if (s.$$('.listing .pcard').length !== 3) s.friction('missing:обране', 'в обраному не три товари');
      await s.cardAdd('sat', 1); await s.modalCheckout(); return s.checkout({ method: 'pickup' }); } },
    /* ---------- крайні випадки ---------- */
    { id: 41, who: 'Юрій, хоче саме цю фарбу', psy: 'звичка', dev: 'lap', need: 'Greenlatex, якої немає в наявності', budget: 8, run: async s => {
      await s.load('product.html?id=gre'); const bb = s.$('.buybox'); if (!s.$$('a', bb).some(a => /#|similar|схож/i.test(a.getAttribute('href') || '') && /схож/i.test(a.textContent))) s.friction('oos-no-alt');
      await s.click('.buybox [data-notify]', 'Повідомити про надходження'); s.setVal('#nt-ph', '0501234567', 'телефон'); s.$('#modal form').requestSubmit(); s.actions++; await sleep(TICK); return /Готово|напишемо/i.test((s.$('#modal') || {}).textContent || ''); } },
    { id: 42, who: 'Вероніка зі Львова', psy: 'тривожна', dev: 'ph', need: 'Саморізи Новою поштою, оплата при отриманні', budget: 14, st: first, run: async s => {
      await s.load('product.html?id=sam'); if (!s.$('.shipbox .ship-line.is-off')) s.friction('city-default'); await s.click('.shipbox [data-modal="city"]', 'змінити місто'); await s.click('[data-pickcity="Львів"]', 'обрати Львів'); const b = s.$('[data-setcity]'); s.actions++; await s.nav(() => b.click());
      await s.pdpNeeds('sam', ['npcost']); await s.pdpAdd('sam', { qty: 2 }); await s.modalCheckout(); return s.checkout({ method: 'np', pay: 'cod' }); } },
    { id: 43, who: 'Захар із Чугуєва', psy: 'прагматик', dev: 'desk', need: 'Вісім мішків клею машиною в Чугуїв', budget: 12, run: async s => {
      await s.load('product.html?id=tm12'); await s.pdpAdd('tm12', { qty: 8 }); await s.modalCheckout(); return s.checkout({ city: 'Чугуїв', method: 'own', pay: 'cod' }); } },
    { id: 44, who: 'Нонна, передумала', psy: 'тривожна', dev: 'ph', need: 'Додати, видалити, почати знову', budget: 12, run: async s => {
      await s.load('product.html?id=mat'); await s.pdpAdd('mat'); await s.modalClose(); await s.toCart(); await s.click('[data-del="0"]', 'видалити з кошика'); if (!s.$('.empty')) s.friction('missing:порожній кошик', 'після видалення немає порожнього стану');
      if (s.first('.sticky-buy--cart a')) s.friction('missing:панель кошика', 'закріплена панель лишилась у порожньому кошику'); return s.click('.empty a[href="catalog.html"]', 'Перейти в каталог', { nav: true }); } },
    { id: 45, who: 'Орест, бере багато', psy: 'прагматик', dev: 'desk', need: '250 мішків штукатурки, коли в магазині 240', budget: 10, run: async s => {
      await s.load('product.html?id=gs41'); const inp = s.first('.buybox [data-qty] input'); s.setVal(inp, 250, 'кількість'); await sleep(TICK); const t = s.$('.buybox').textContent; if (!/склад|лише|доступно|завтра/i.test(t.replace(/Є в магазині: 240 шт\./, ''))) s.friction('stock-unchecked', '250 шт. при 240 у магазині');
      await s.click('.buybox [data-add]', 'До кошика'); await s.modalCheckout(); const m = s.$$('.choice').find(c => /Самовивіз/.test(c.textContent)); if (m && /сьогодні/.test(m.textContent)) s.friction('stock-unchecked', 'самовивіз обіцяно сьогодні, хоча товару бракує'); return s.checkout({ method: 'own', pay: 'cod' }); } },
    { id: 46, who: 'Емма, лише клавіатура', psy: 'клавіатура', dev: 'desk', need: 'Купити фарбу без миші', budget: 40, run: async s => {
      await s.load('product.html?id=acr'); const foc = s.$$('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').filter(e => s.vis(e) && !e.disabled); const firstMain = foc.findIndex(e => e.closest('main'));
      if (!/main|вміст/i.test((foc[0].getAttribute('href') || '') + foc[0].textContent)) s.friction('kb-no-skip'); if (firstMain > 25) s.friction('kb-many-tabs', `${firstMain} зупинок до вмісту`); s.note('зупинок Tab до вмісту: ' + firstMain);
      const btn = s.first('.buybox [data-add]'); btn.focus(); btn.click(); s.actions++; await sleep(TICK); const m = s.$('#modal'); if (!m || !m.contains(s.d.activeElement)) s.friction('missing:фокус у вікні', 'після відкриття вікна фокус лишився під ним');
      const outside = s.$$('a[href], button').filter(e => !e.closest('#modal') && s.vis(e) && !e.closest('[inert], [aria-hidden="true"]')).length; if (outside) s.friction('kb-modal-trap', `${outside} елементів під вікном доступні з клавіатури`);
      await s.modalCheckout(); return s.checkout({ method: 'pickup' }); } },
    { id: 47, who: 'Давид, слабкий зір', psy: 'збільшує масштаб', dev: 'zoom', need: 'Прочитати ціну й умови при масштабі 200 %', budget: 14, run: async s => {
      await s.load('index.html'); s.audit('головна'); await s.load('category.html?sub=' + encodeURIComponent('Фарби інтер’єрні')); s.audit('список'); await s.load('product.html?id=acr'); s.audit('товар'); await s.pdpAdd('acr'); await s.modalCheckout(); s.audit('оформлення'); return s.checkout({ method: 'pickup' }); } },
    { id: 48, who: 'Мирослава, порівнює з телефона', psy: 'дослідниця', dev: 'ph', need: 'Порівняти дві фарби на телефоні', budget: 12, run: async s => {
      await s.load('category.html?sub=' + encodeURIComponent('Фарби інтер’єрні')); if (!s.first('.pcard [data-cmp]')) s.friction('compare-mobile');
      for (const id of ['acr', 'mat']) { await s.load('product.html?id=' + id); s.actions++; await s.click('.pdp__meta [data-cmp]', 'Порівняти'); }
      await s.load('compare.html'); s.actions += 2; const w = s.$('.cmp-wrap'); if (!w) { s.friction('missing:порівняння', 'таблиці порівняння немає'); return false; } if (w.scrollWidth > w.clientWidth + 2) s.friction('compare-scroll', `таблиця ${w.scrollWidth} px на екрані ${w.clientWidth} px`); return s.$$('.cmp thead td').length === 2; } },
    { id: 49, who: 'Назар, уперше на сайті', psy: 'нетерплячий', dev: 'ph', need: 'Швидко купити з телефона при першому візиті', budget: 8, st: first, run: async s => {
      await s.load('product.html?id=tm12'); const c = s.$('.cookie'); if (c) { const r = c.getBoundingClientRect(); s.note(`вікно cookie займає ${Math.round(r.height)} px унизу екрана`); }
      await s.pdpAdd('tm12', { via: 'sticky' }); await s.modalCheckout(); return s.checkout({ method: 'pickup', pay: 'store' }); } },
    { id: 50, who: 'Раїса, не любить сайти', psy: 'літня людина', dev: 'desk', strict: 1, need: 'Надіслати список матеріалів і чекати дзвінка', budget: 8, run: async s => {
      await s.load('index.html'); const a = s.first('a[href="podbor.html"]'); await s.click(a, 'Прорахувати список', { nav: true }); s.audit('підбір');
      s.setVal('#pb-l', 'Штукатурка 10 мішків, ґрунтовка 10 л, шпаклівка', 'список'); s.setVal('#pb-ph', '0577001122', 'телефон'); s.$('[data-form="podbor"]').requestSubmit(); s.actions++; await sleep(TICK); return /прийнято/i.test((s.$('#modal') || {}).textContent || ''); } },
  ];

  /* ---------- запуск ---------- */
  async function run(onStep, only) {
    const backup = localStorage.getItem(KEY), out = [];
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:-4000px;top:0;border:0'; document.body.appendChild(f);
    for (const p of P) {
      if (only && !only.includes(p.id)) continue;
      const dev = DEV[p.dev]; f.style.width = dev.w + 'px'; f.style.height = dev.h + 'px';
      localStorage.setItem(KEY, JSON.stringify(Object.assign({ cart: [], fav: [], cmp: [], city: 'Харків', lang: 'UA', seen: [], orders: [], cookie: 'all', user: null, promo: null, cityOk: true, gift: null }, p.st || {})));
      const s = new Shopper(Object.assign({}, p, { dev }), f); let goal = false; const t0 = performance.now();
      try { goal = !!(await p.run(s)); } catch (e) { s.friction('crash', String(e && e.message || e).slice(0, 160)); }
      if (s.actions > p.budget) s.friction('patience', `${s.actions} дій при готовності до ${p.budget}`);
      const worst = s.fr.reduce((m, x) => Math.max(m, x.sev), 0);
      const GRP = { 'ощадлива': 'ощадливий', 'недовірлива': 'недовірливий', 'прискіплива': 'прискіпливий', 'дослідниця': 'дослідник', 'тривожна': 'тривожний' };
      out.push({ id: p.id, who: p.who, psy: p.psy, grp: GRP[p.psy] || p.psy, dev: dev.n, need: p.need, goal, verdict: !goal ? 'не досяг мети' : worst >= 3 ? 'досяг із втратами' : worst === 2 ? 'досяг, але заважало' : 'досяг', actions: s.actions, budget: p.budget, pages: s.pages, ms: Math.round(performance.now() - t0), fr: s.fr, notes: s.notes });
      if (onStep) onStep(out[out.length - 1], out.length, P.length);
    }
    f.remove(); if (backup === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, backup);
    return out;
  }
  function summary(res) {
    const agg = {}; res.forEach(r => r.fr.forEach(x => { const a = agg[x.base] || (agg[x.base] = { code: x.base, sev: x.sev, area: (FR[x.base] || [0, '?'])[1], title: (FR[x.base] || [0, 0, x.base])[2], who: new Set(), details: new Set() }); a.who.add(r.id); if (x.detail) a.details.add(x.detail); }));
    const list = Object.values(agg).map(a => ({ code: a.code, sev: a.sev, area: a.area, title: a.title, shoppers: [...a.who], n: a.who.size, details: [...a.details].slice(0, 12) })).sort((a, b) => b.sev - a.sev || b.n - a.n);
    const by = k => { const m = {}; res.forEach(r => { const g = m[r[k]] || (m[r[k]] = { total: 0, ok: 0, clean: 0 }); g.total++; if (r.goal) g.ok++; if (r.verdict === 'досяг') g.clean++; }); return m; };
    return { total: res.length, reached: res.filter(r => r.goal).length, clean: res.filter(r => r.verdict === 'досяг').length, overBudget: res.filter(r => r.actions > r.budget).length, byDevice: by('dev'), byPsy: by('grp'), frictions: list };
  }
  window.QA = { run, summary, personas: P, FR, DEV, Shopper, BASE };
})();
