/* =========================================================
   IMBAU — технічна перевірка прототипу
   1) кожна сторінка на трьох ширинах: ширина, заголовки, фото, назви кнопок і полів, однакові id;
   2) усі внутрішні посилання: чи відкривається адреса; скільки посилань-заглушок «#»;
   3) крайні випадки: неправильні адреси, дивні кількості, порожні форми, зіпсований кошик.
   ========================================================= */
(function () {
  'use strict';
  const BASE = QA.BASE, KEY = 'imbau_proto_v1', sleep = ms => new Promise(r => setTimeout(r, ms));
  const enc = encodeURIComponent;
  const PAGES = ['index.html', 'catalog.html', 'section.html?s=lfm', 'section.html?s=sukhi-sumishi', 'category.html?sub=' + enc('Фарби інтер’єрні'), 'category.html?sub=' + enc('Шпаклівки'), 'category.html?sub=' + enc('Емалі'),
    'product.html?id=acr', 'product.html?id=tm12', 'product.html?id=stz', 'product.html?id=gre', 'product.html?id=gkl', 'search.html?q=' + enc('фарба'), 'search.html?q=' + enc('ййй'), 'cart.html', 'checkout.html', 'success.html', 'tracking.html', 'account.html', 'compare.html', 'compare.html?tab=fav',
    'promo.html', 'brand.html?b=front', 'brand.html?b=tigor', 'brands.html', 'tinting.html', 'podbor.html', 'kit.html', 'kit.html?t=' + enc('Для плитки'), 'evidnovlennya.html', 'delivery.html', 'stores.html', 'blog.html', 'blog.html?a=1', 'info.html?p=return', 'info.html?p=faq', 'certificate.html', 'pro.html', 'suppliers.html', 'product.html?id=tc16', 'product.html?id=nail', 'product.html?id=old', '404.html'];
  const WIDTHS = [1440, 820, 390];
  const frame = (w, h) => { const f = document.createElement('iframe'); f.style.cssText = `position:fixed;left:-4000px;top:0;border:0;width:${w}px;height:${h || 900}px`; document.body.appendChild(f); return f; };
  const go = (f, u) => new Promise(r => { f.onload = () => setTimeout(r, 160); f.src = BASE + u; });
  const reset = st => localStorage.setItem(KEY, JSON.stringify(Object.assign({ cart: [], fav: [], cmp: [], city: 'Харків', lang: 'UA', seen: [], orders: [], cookie: 'all', cityOk: true, gift: null, user: null, promo: null }, st || {})));
  const state = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const vis = (w, el) => { if (!el) return false; const r = el.getBoundingClientRect(), cs = w.getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'; };
  const name = el => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim() || (el.querySelector('img[alt]:not([alt=""])') ? 'img' : '');

  async function pages() {
    const rows = [], links = new Map(); reset({ cart: [{ id: 'acr', pack: 2, qty: 1 }, { id: 'tm12', pack: 0, qty: 2 }], cmp: ['acr', 'mat'], fav: ['sat'], orders: [{ id: 'IMB-1', date: '01.11.2026', items: [{ id: 'acr', pack: 2, qty: 1 }], total: 628, method: 'pickup', pay: 'store', status: 2, tracked: true }] });
    for (const wd of WIDTHS) {
      const f = frame(wd);
      for (const u of PAGES) {
        await go(f, u); const d = f.contentDocument, w = f.contentWindow, r = { page: decodeURIComponent(u), w: wd, issues: [] };
        const over = d.documentElement.scrollWidth - wd; if (over > 1) r.issues.push(`сторінка ширша за екран на ${over} px`);
        const h1 = [...d.querySelectorAll('h1')].filter(e => vis(w, e)); if (h1.length !== 1) r.issues.push(`заголовків h1: ${h1.length}`);
        let prev = 0; [...d.querySelectorAll('main h1, main h2, main h3, main h4')].filter(e => vis(w, e)).some(h => { const l = +h.tagName[1]; if (prev && l > prev + 1) { r.issues.push(`заголовок перескакує рівень: h${prev} → h${l} «${h.textContent.trim().slice(0, 30)}»`); return true; } prev = l; return false; });
        const noAlt = [...d.images].filter(i => !i.hasAttribute('alt')).length; if (noAlt) r.issues.push(`фото без опису (alt): ${noAlt}`);
        const broken = [...d.images].filter(i => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map(i => i.getAttribute('src')); if (broken.length) r.issues.push('фото не завантажилось: ' + broken.join(', '));
        const btn = [...d.querySelectorAll('button, a[href]')].filter(e => vis(w, e) && !name(e)).map(e => (e.className || e.tagName).toString().slice(0, 30)); if (btn.length) r.issues.push(`кнопки без назви для читача екрана: ${[...new Set(btn)].slice(0, 4).join(', ')} (${btn.length})`);
        const inp = [...d.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(e => vis(w, e) && !(e.getAttribute('aria-label') || (e.id && d.querySelector(`label[for="${e.id}"]`)) || e.closest('label'))).map(e => e.id || e.className || e.placeholder || e.type); if (inp.length) r.issues.push(`поля без підпису: ${[...new Set(inp)].slice(0, 4).join(', ')} (${inp.length})`);
        const ids = {}; d.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; }); const dup = Object.keys(ids).filter(k => ids[k] > 1); if (dup.length) r.issues.push('однакові id: ' + dup.slice(0, 5).join(', '));
        if (!d.documentElement.lang) r.issues.push('не вказано мову сторінки');
        if (wd === 1440) d.querySelectorAll('a[href]').forEach(a => { const h = a.getAttribute('href'); const k = h === '#' ? '#' : /^(https?:|tel:|mailto:)/.test(h) ? null : h.split('#')[0]; if (k === null || k === '') return; const m = links.get(k) || { n: 0, from: new Set(), text: new Set() }; m.n++; m.from.add(r.page.split('?')[0]); if (k === '#') m.text.add((a.textContent || '').trim().slice(0, 40)); links.set(k, m); });
        rows.push(r);
      }
      f.remove();
    }
    const dead = [], hash = links.get('#'); links.delete('#');
    for (const [h, m] of links) { try { const res = await fetch(BASE + h.split('?')[0], { method: 'HEAD' }); if (!res.ok) dead.push({ href: h, status: res.status, from: [...m.from].slice(0, 3) }); } catch (e) { dead.push({ href: h, status: 'error', from: [...m.from].slice(0, 3) }); } }
    return { rows, checked: rows.length, withIssues: rows.filter(r => r.issues.length), linksChecked: links.size, dead, placeholders: hash ? { n: hash.n, pages: [...hash.from], texts: [...hash.text].filter(Boolean).slice(0, 30) } : null };
  }

  async function edges() {
    const out = [], f = frame(1300), add = (t, ok, got) => out.push({ test: t, ok: !!ok, got: String(got) });
    const d = () => f.contentDocument, w = () => f.contentWindow, ev = (el, t) => el.dispatchEvent(new (w().Event)(t, { bubbles: true }));
    try {
      reset(); await go(f, 'product.html?id=nema-takoho'); add('Невідомий товар у адресі показує повідомлення, а не інший товар', !/Фарба водоемульсійна акрилова/.test(d().querySelector('h1').textContent), d().querySelector('h1').textContent.trim());
      await go(f, 'category.html?sub=' + enc('Неіснуючий розділ')); add('Невідомий підрозділ показує повідомлення', /не знайд|немає такого/i.test(d().querySelector('main').textContent), 'h1: ' + d().querySelector('h1').textContent.trim() + '; товарів: ' + d().querySelectorAll('.pcard').length);
      await go(f, 'section.html?s=nema'); add('Невідомий розділ показує повідомлення', /не знайд/i.test(d().querySelector('main').textContent), 'h1: ' + d().querySelector('h1').textContent.trim());
      await go(f, 'search.html?q=' + enc('<img src=x onerror="window.__xss=1">')); await sleep(200); add('Пошук не виконує чужий код із запиту', !w().__xss && !d().querySelector('main img[src="x"]'), w().__xss ? 'код виконався' : 'безпечно');
      await go(f, 'search.html?q=' + enc('фарба '.repeat(60))); add('Дуже довгий запит не ламає сторінку', d().documentElement.scrollWidth <= 1301, 'ширина ' + d().documentElement.scrollWidth);
      /* кількість у товарі */
      await go(f, 'product.html?id=acr'); const qv = async v => { const i = d().querySelector('.buybox [data-qty] input'); i.value = v; ev(i, 'change'); await sleep(50); return d().querySelector('.buybox [data-qty] input').value + ' → ' + d().querySelector('.buybox__total').textContent.trim().slice(0, 40); };
      let g = await qv('0'); add('Кількість 0 виправляється на 1', /^1 /.test(g), g); g = await qv('-5'); add('Від’ємна кількість виправляється', /^1 /.test(g), g); g = await qv('abc'); add('Літери замість кількості виправляються', /^1 /.test(g), g);
      g = await qv('2.5'); add('Дробова кількість упаковок округлюється', /^(2|3) /.test(g), g); g = await qv('99999'); add('Величезна кількість має межу або попередження', !/^99999 /.test(g) || /склад|доступно|уточн/i.test(d().querySelector('.buybox').textContent), g);
      add('Сума величезного замовлення не вилазить за блок', d().querySelector('.buybox').scrollWidth <= d().querySelector('.buybox').clientWidth + 1, d().querySelector('.buybox').scrollWidth + ' / ' + d().querySelector('.buybox').clientWidth);
      /* калькулятор */
      await go(f, 'product.html?id=acr'); const cv = async v => { const i = d().querySelector('#c-area'); i.value = v; ev(i, 'input'); await sleep(40); return d().querySelector('[data-calcres]').textContent.trim().slice(0, 60); };
      g = await cv('0'); add('Калькулятор при площі 0 не радить купувати', !/Додати/.test(g), g); g = await cv('-10'); add('Калькулятор при від’ємній площі не радить купувати', !/Додати/.test(g) || !/-/.test(g), g); g = await cv(''); add('Калькулятор при порожній площі не радить купувати', !/Додати/.test(g), g); g = await cv('20,5'); add('Калькулятор розуміє кому як десятковий знак', /11,39|11.39/.test(g), g);
      /* зіпсований кошик */
      localStorage.setItem(KEY, '{зламано'); await go(f, 'cart.html'); add('Зіпсовані збережені дані не ламають сторінку', !!d().querySelector('.empty, .cart-items'), d().querySelector('h1').textContent);
      reset({ cart: [{ id: 'znyklyi', pack: 0, qty: 2 }, { id: 'acr', pack: 9, qty: 1 }] }); await go(f, 'cart.html'); add('Товар, якого вже немає в каталозі, не ламає кошик', !!d().querySelector('.empty, .cart-items'), (d().querySelector('main').textContent.match(/Кошик порожній|Ваше замовлення/) || ['нічого'])[0] + '; слотів заповнено: ' + (d().querySelector('[data-slot="cart"]').innerHTML.length > 0));
      /* оформлення */
      reset({ cart: [{ id: 'tm12', pack: 0, qty: 1 }] }); await go(f, 'checkout.html'); d().querySelector('[data-co] .summary .btn--primary').click(); await sleep(80);
      add('Порожня форма оформлення показує помилки біля полів', d().querySelectorAll('.field.is-invalid').length >= 2, 'підсвічено полів: ' + d().querySelectorAll('.field.is-invalid').length); add('Після помилки фокус стає в перше неправильне поле', d().activeElement && d().activeElement.closest('.field.is-invalid'), (d().activeElement || {}).id || 'ні');
      const ph = d().querySelector('#co-ph'); ph.value = '067123'; ev(ph, 'input'); d().querySelector('#co-name').value = 'Ім’я'; d().querySelector('[data-co] .summary .btn--primary').click(); await sleep(80); add('Неповний телефон не проходить', /checkout/.test(w().location.pathname), w().location.pathname);
      for (const [raw, label] of [['+380671234567', 'вставлений +380…'], ['80671234567', 'вставлений 8067…'], ['671234567', 'без нуля']]) { const p2 = d().querySelector('#co-ph'); p2.value = raw; ev(p2, 'input'); add(`Телефон, ${label}, перетворюється на правильний`, p2.value.replace(/\D/g, '') === '380671234567', p2.value); }
      reset({ cart: [{ id: 'tm12', pack: 0, qty: 1 }] }); await go(f, 'checkout.html'); const p3 = d().querySelector('#co-ph'); p3.value = '0671234567'; ev(p3, 'input'); d().querySelector('#co-name').value = 'Тест'; const b = d().querySelector('[data-co] .summary .btn--primary'); b.click(); b.click(); await new Promise(r => { f.onload = () => setTimeout(r, 200); setTimeout(r, 2500); }); add('Подвійне натискання не створює два замовлення', state().orders.length === 1, 'замовлень: ' + state().orders.length);
      reset(); await go(f, 'success.html'); add('Сторінка «Дякуємо» без замовлення пояснює, що сталося', /не знайдено/i.test(d().querySelector('main').textContent), d().querySelector('h1').textContent);
      reset({ cart: [{ id: 'gkl', pack: 0, qty: 1 }] }); await go(f, 'checkout.html'); const own = d().querySelector('input[name="method"][value="own"]'); own.click(); await sleep(60); const dt = d().querySelector('#co-date'); add('Дата доставки не дозволяє минуле', dt && !!dt.min, dt ? 'min=' + (dt.min || 'немає') : 'поля немає');
      const p4 = d().querySelector('#co-ph'); p4.value = '0671234567'; ev(p4, 'input'); d().querySelector('#co-name').value = 'Тест'; d().querySelector('[data-co] .summary .btn--primary').click(); await sleep(80); add('Доставка машиною без адреси не проходить', /checkout/.test(w().location.pathname) && !!d().querySelector('.field.is-invalid #co-addr'), d().querySelectorAll('.field.is-invalid').length + ' підсвічено');
      /* кабінет, порівняння, промокод, відстеження */
      reset(); await go(f, 'account.html'); const lp = d().querySelector('#lg-ph'); lp.value = '0671234567'; ev(lp, 'input'); d().querySelector('[data-login]').requestSubmit(); await sleep(60); d().querySelector('[data-login]').requestSubmit(); await sleep(60); add('Вхід не пускає з порожнім кодом', !state().user, state().user ? 'увійшов без коду' : 'не пустив');
      reset({ cmp: ['acr', 'mat', 'fac', 'sat'] }); await go(f, 'category.html?sub=' + enc('Фарби інтер’єрні')); d().querySelector('.pcard[data-id="soft"] [data-cmp]').click(); await sleep(60); add('П’ятий товар у порівнянні не додається, є пояснення', state().cmp.length === 4 && !!d().querySelector('.toast'), 'у порівнянні ' + state().cmp.length + (d().querySelector('.toast') ? ', є підказка' : ', підказки немає'));
      reset({ cart: [{ id: 'tm12', pack: 0, qty: 1 }] }); await go(f, 'cart.html'); const pr = d().querySelector('[data-promo] input'); pr.value = 'NEMA'; d().querySelector('[data-promo]').requestSubmit(); await sleep(60); add('Неправильний промокод дає зрозуміле повідомлення', /немає|минув/i.test((d().querySelector('.toast') || {}).textContent || ''), ((d().querySelector('.toast') || {}).textContent || 'без повідомлення').slice(0, 50));
      const ci = d().querySelector('[data-cartq] input'); ci.value = '0'; ev(ci, 'change'); await sleep(60); add('Кількість 0 у кошику не лишає рядок із нулем', (state().cart[0] || { qty: 1 }).qty >= 1 || !state().cart.length, 'кількість: ' + (state().cart[0] || {}).qty);
      await go(f, 'tracking.html'); const tn = d().querySelector('#tr-n'); tn.value = 'IMB-000000'; d().querySelector('[data-track]').requestSubmit(); await sleep(60); add('Неіснуючий номер замовлення не показує чужий статус', !d().querySelector('.timeline'), d().querySelector('.timeline') ? 'показано статус для вигаданого номера' : 'повідомлення про помилку');
      await go(f, 'cart.html?items=acr:2:3,tm12:0:5'); add('Посилання «Поділитися кошиком» відновлює товари', state().cart.length === 2, 'рядків: ' + state().cart.length);
      /* повернення назад після фільтра */
      reset(); await go(f, 'category.html?sub=' + enc('Фарби інтер’єрні')); const pk = [...d().querySelectorAll('[data-f="pack"]')].find(x => x.value === '7 кг'); pk.click(); await sleep(60); const pm = d().querySelector('[data-price="max"]'); pm.value = '600'; ev(pm, 'change'); await sleep(60); const url = w().location.search; add('Фільтри фасовки й ціни зберігаються в адресі (можна поділитися, повернутися назад)', /pack|max/.test(decodeURIComponent(url)), decodeURIComponent(url).slice(0, 80));
    } catch (e) { add('Перевірка обірвалась', false, String(e && e.message || e)); }
    f.remove(); return out;
  }

  QA.sweep = async function () { const backup = localStorage.getItem(KEY); const p = await pages(); const e = await edges(); if (backup === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, backup); return { pages: p, edges: e }; };
})();
