/* Taobao Finds · October 2026
   Vanilla JS, no build step, no libraries.
   Data is treated as untrusted: text goes in with textContent (via h()),
   and every link or image URL passes safeUrl() first. */
(() => {
  'use strict';

  /* ---------- constants ---------- */
  const KEYS = { saved: 'tf-oct2026-saved', theme: 'tf-theme', promo: 'tf-oct2026-promo-closed' };
  const SWIPE_PX = 100;          // drag distance that commits a swipe
  const FLICK_SPEED = 0.55;      // px per ms that counts as a flick
  const FLICK_MIN_PX = 28;       // minimum drag for a flick to count
  const DRAG_START_PX = 8;       // movement before a press becomes a drag
  const THEME_COLORS = { light: '#F6F1E7', dark: '#14110D' };

  const CATS = {
    audio: { label: 'Audio', emoji: '\u{1F3A7}', hue: 255 },
    phone_tech: { label: 'Phone & tech', emoji: '\u{1F4F1}', hue: 230 },
    smart_home: { label: 'Smart home', emoji: '\u{1F4A1}', hue: 85 },
    home_living: { label: 'Home & living', emoji: '\u{1F3E0}', hue: 40 },
    kitchen: { label: 'Kitchen', emoji: '\u{1F373}', hue: 55 },
    apparel: { label: 'Apparel', emoji: '\u{1F455}', hue: 20 },
    shoes: { label: 'Shoes', emoji: '\u{1F45F}', hue: 305 },
    bags_accessories: { label: 'Bags & accessories', emoji: '\u{1F45C}', hue: 10 },
    beauty_personal_care: { label: 'Beauty & care', emoji: '\u{1F9F4}', hue: 350 },
    outdoor_sport: { label: 'Outdoor & sport', emoji: '\u{1F392}', hue: 150 },
    desk_stationery: { label: 'Desk & stationery', emoji: '\u{1F4DD}', hue: 200 },
    toys_collectibles: { label: 'Toys & collectibles', emoji: '\u{1F9F8}', hue: 70 },
    pets: { label: 'Pets', emoji: '\u{1F43E}', hue: 120 },
    other: { label: 'Other', emoji: '\u{2728}', hue: 280 }
  };
  const CAT_ORDER = Object.keys(CATS);

  const TAGS = {
    design: 'Design',
    fun: 'Fun',
    life_easier: 'Life easier',
    gift: 'Gift',
    value: 'Value',
    quality: 'Quality',
    conversation_starter: 'Conversation starter'
  };

  const PLATFORMS = { tiktok: 'TikTok', douyin: 'Douyin', xiaohongshu: 'RED', youtube: 'YouTube' };
  const PLATFORM_ORDER = ['tiktok', 'douyin', 'xiaohongshu', 'youtube'];

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const ICONS = {
    deck: [['path', 'M12 2 2 7l10 5 10-5-10-5z'], ['path', 'M2 17l10 5 10-5'], ['path', 'M2 12l10 5 10-5']],
    grid: [
      ['rect', { x: 3, y: 3, width: 7, height: 7, rx: 1 }], ['rect', { x: 14, y: 3, width: 7, height: 7, rx: 1 }],
      ['rect', { x: 14, y: 14, width: 7, height: 7, rx: 1 }], ['rect', { x: 3, y: 14, width: 7, height: 7, rx: 1 }]
    ],
    heart: [['path', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z']],
    undo: [['path', 'M1 4v6h6'], ['path', 'M3.51 15a9 9 0 1 0 2.13-9.36L1 10']],
    x: [['path', 'M18 6 6 18'], ['path', 'M6 6l12 12']],
    external: [['path', 'M7 17 17 7'], ['path', 'M8 7h9v9']],
    share: [['path', 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7'], ['path', 'M16 6l-4-4-4 4'], ['path', 'M12 2v13']],
    moon: [['path', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z']],
    sun: [
      ['circle', { cx: 12, cy: 12, r: 4 }], ['path', 'M12 2v2'], ['path', 'M12 20v2'], ['path', 'M4.93 4.93l1.41 1.41'],
      ['path', 'M17.66 17.66l1.41 1.41'], ['path', 'M2 12h2'], ['path', 'M20 12h2'], ['path', 'M4.93 19.07l1.41-1.41'],
      ['path', 'M17.66 6.34l1.41-1.41']
    ],
    search: [['circle', { cx: 11, cy: 11, r: 7 }], ['path', 'M21 21l-4.35-4.35']],
    check: [['path', 'M20 6 9 17l-5-5']]
  };

  /* ---------- tiny helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad2 = (n) => (n < 10 ? '0' + n : String(n));
  const hasCJK = (s) => /[㐀-鿿豈-﫿]/.test(s);
  const reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduceMotion = () => !!(reduceMQ && reduceMQ.matches);

  /* Build a DOM node. Text always goes in as a text node, never as HTML. */
  function h(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else node.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return node;
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function icon(name) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'ico-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    (ICONS[name] || []).forEach(([tag, a]) => {
      const n = document.createElementNS(SVG_NS, tag);
      const attrs = typeof a === 'string' ? { d: a } : a;
      for (const k of Object.keys(attrs)) n.setAttribute(k, attrs[k]);
      svg.append(n);
    });
    return svg;
  }

  /* Only http and https links or images are ever used. */
  function safeUrl(u) {
    if (typeof u !== 'string') return null;
    const s = u.trim();
    if (!s) return null;
    try {
      const x = new URL(s);
      return x.protocol === 'http:' || x.protocol === 'https:' ? x.href : null;
    } catch (e) {
      return null;
    }
  }

  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  };

  function fmtShort(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    const mi = Number(m[2]) - 1;
    return mi >= 0 && mi < 12 ? MONTHS[mi] + ' ' + Number(m[3]) : '';
  }
  function fmtLong(iso) {
    const s = fmtShort(iso);
    return s ? s + ', ' + iso.slice(0, 4) : '';
  }
  function fmtNum(n) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  /* ---------- state ---------- */
  const state = {
    meta: { title: 'Taobao Finds', edition: 'October 2026', updated: '', method: '', promo: null },
    items: [],
    byId: new Map(),
    view: 'deck',
    cat: 'all',
    must: false,
    q: '',
    deck: [],
    pos: 0,
    history: [],
    saved: [],
    savedSet: new Set(),
    chipEls: new Map(),
    busy: false
  };
  let suppressClickUntil = 0;

  /* ---------- data loading and cleaning ---------- */
  async function fetchJson(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function loadData() {
    try {
      return { raw: await fetchJson('items.json'), source: 'items.json' };
    } catch (e) {
      return { raw: await fetchJson('items.sample.json'), source: 'items.sample.json' };
    }
  }

  function str(v, max) {
    return typeof v === 'string' ? v.trim().slice(0, max || 400) : '';
  }

  function normItem(x, i) {
    if (!x || typeof x !== 'object') return null;
    const name_en = str(x.name_en, 160);
    const name_cn = str(x.name_cn, 120);
    if (!name_en && !name_cn) return null;

    const sources = [];
    if (Array.isArray(x.sources)) {
      for (const s of x.sources) {
        if (!s || typeof s.platform !== 'string' || !has(PLATFORMS, s.platform)) continue;
        const url = safeUrl(s.url);
        if (url) sources.push({ platform: s.platform, url, label: str(s.label, 60) });
      }
    }
    const declared = Array.isArray(x.platforms) ? x.platforms.filter((p) => typeof p === 'string' && has(PLATFORMS, p)) : [];
    const platforms = PLATFORM_ORDER.filter((p) => declared.includes(p) || sources.some((s) => s.platform === p));

    const tags = [];
    if (Array.isArray(x.tags)) {
      for (const t of x.tags) if (typeof t === 'string' && has(TAGS, t) && !tags.includes(t)) tags.push(t);
    }
    const review_tags = Array.isArray(x.review_tags)
      ? x.review_tags.map((t) => str(t, 28)).filter(Boolean).slice(0, 6)
      : [];

    return {
      id: str(x.id, 120) || 'item-' + (i + 1),
      n: 0,
      name_en,
      name_cn,
      brand: str(x.brand, 80),
      category: typeof x.category === 'string' && has(CATS, x.category) ? x.category : 'other',
      why: str(x.why, 400),
      review_summary: str(x.review_summary, 400),
      review_tags,
      price_cny: typeof x.price_cny === 'number' && isFinite(x.price_cny) && x.price_cny >= 0 ? x.price_cny : null,
      price_date: /^\d{4}-\d{2}-\d{2}$/.test(x.price_date || '') ? x.price_date : '',
      sales_text: str(x.sales_text, 80),
      review_count_text: str(x.review_count_text, 80),
      store: str(x.store, 100),
      official_store: x.official_store === true,
      taobao_url: x.taobao_url,
      taobao_link_type: x.taobao_link_type === 'search' ? 'search' : 'item',
      image: x.image,
      tags,
      must_buy: x.must_buy === true,
      taobao_check: x.taobao_check === 'verified' ? 'verified' : (x.taobao_check === 'pending' ? 'pending' : ''),
      platforms,
      sources
    };
  }

  function normalize(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const promo = r.promo && typeof r.promo === 'object'
      ? { headline: str(r.promo.headline, 160), detail: str(r.promo.detail, 300) }
      : null;
    const seen = new Set();
    const items = [];
    (Array.isArray(r.items) ? r.items : []).forEach((x, i) => {
      const it = normItem(x, i);
      if (!it) return;
      let id = it.id;
      let k = 2;
      while (seen.has(id)) id = it.id + '-' + k++;
      it.id = id;
      seen.add(id);
      it.n = items.length + 1;
      items.push(it);
    });
    return {
      title: str(r.title, 80) || 'Taobao Finds',
      edition: str(r.edition, 60) || 'October 2026',
      updated: /^\d{4}-\d{2}-\d{2}$/.test(r.updated || '') ? r.updated : '',
      method: str(r.method, 900),
      promo,
      items
    };
  }

  /* ---------- saved list ---------- */
  function loadSaved() {
    let list = [];
    try {
      const parsed = JSON.parse(store.get(KEYS.saved) || '[]');
      if (Array.isArray(parsed)) list = parsed.filter((x) => typeof x === 'string');
    } catch (e) { /* ignore bad storage */ }
    state.saved = Array.from(new Set(list));
    state.savedSet = new Set(state.saved);
  }
  const persistSaved = () => store.set(KEYS.saved, JSON.stringify(state.saved));
  const isSaved = (id) => state.savedSet.has(id);
  const savedItems = () => state.saved.map((id) => state.byId.get(id)).filter(Boolean);

  function addSaved(id) {
    if (state.savedSet.has(id)) return false;
    state.saved.push(id);
    state.savedSet.add(id);
    persistSaved();
    refreshSavedUI();
    return true;
  }
  function removeSaved(id) {
    if (!state.savedSet.has(id)) return false;
    state.saved = state.saved.filter((x) => x !== id);
    state.savedSet.delete(id);
    persistSaved();
    refreshSavedUI();
    return true;
  }
  function toggleSaved(id) {
    if (isSaved(id)) { removeSaved(id); return false; }
    addSaved(id);
    return true;
  }

  function updateListBadge() {
    const n = savedItems().length;
    const badge = $('#list-badge');
    badge.textContent = String(n);
    badge.hidden = n === 0;
    $('#btn-view-list').setAttribute('aria-label', 'My list, ' + n + ' saved');
  }

  function syncHeart(b) {
    const on = state.savedSet.has(b.dataset.id);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', (on ? 'Remove from My list: ' : 'Save to My list: ') + b.dataset.name);
    b.classList.toggle('is-saved', on);
  }

  function refreshSavedUI() {
    updateListBadge();
    $$('.heart').forEach(syncHeart);
    $$('[data-saved-flag]').forEach((el) => { el.hidden = !state.savedSet.has(el.dataset.savedFlag); });
    if (state.view === 'list') renderList();
  }

  /* ---------- filtering ---------- */
  const norm = (s) => String(s || '').toLowerCase();

  function filtered(o) {
    const f = o || state;
    const words = norm(f.q).trim().split(/\s+/).filter(Boolean);
    return state.items.filter((it) => {
      if (f.cat !== 'all' && it.category !== f.cat) return false;
      if (f.must && !it.must_buy) return false;
      if (!words.length) return true;
      const hay = norm(it.name_en + ' ' + it.name_cn + ' ' + it.brand);
      return words.every((w) => hay.includes(w));
    });
  }

  function rebuildDeck(startId) {
    state.deck = filtered();
    state.pos = 0;
    if (startId) {
      const idx = state.deck.findIndex((i) => i.id === startId);
      if (idx > 0) state.pos = idx;
    }
    state.history = [];
  }

  function refilter() {
    rebuildDeck();
    renderAll();
  }

  function syncFilterInputs() {
    $('#search').value = state.q;
    $('#search-clear').hidden = !state.q;
  }

  function clearFilters() {
    state.cat = 'all';
    state.must = false;
    state.q = '';
    syncFilterInputs();
    refilter();
  }

  function buildChips() {
    const box = $('#chips');
    box.replaceChildren();
    state.chipEls.clear();
    const present = CAT_ORDER.filter((c) => state.items.some((i) => i.category === c));
    const make = (key, label) => {
      const count = h('span', { class: 'chip-count' });
      const btn = h('button', { type: 'button', class: 'chip', 'data-cat-filter': key, 'aria-pressed': 'false' },
        h('span', { class: 'chip-label', text: label }), count);
      btn.addEventListener('click', () => {
        state.cat = state.cat === key && key !== 'all' ? 'all' : key;
        refilter();
        if (!reduceMotion()) btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        else btn.scrollIntoView({ inline: 'center', block: 'nearest' });
      });
      box.append(btn);
      state.chipEls.set(key, { btn, count, label });
    };
    make('all', 'All');
    present.forEach((c) => make(c, CATS[c].label));
  }

  function updateChips() {
    const base = filtered({ cat: 'all', must: state.must, q: state.q });
    const counts = {};
    base.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + 1; });
    state.chipEls.forEach((el, key) => {
      const n = key === 'all' ? base.length : counts[key] || 0;
      const on = state.cat === key;
      el.count.textContent = String(n);
      el.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      el.btn.setAttribute('aria-label', el.label + ', ' + n + (n === 1 ? ' find' : ' finds'));
      el.btn.classList.toggle('is-empty', n === 0 && !on);
    });
  }

  /* ---------- card pieces ---------- */
  function mediaEl(item) {
    const wrap = h('div', { class: 'media', 'data-cat': item.category });
    wrap.style.setProperty('--hue', String(CATS[item.category].hue));
    const glyph = () => h('div', { class: 'glyph', 'aria-hidden': 'true' },
      h('span', { class: 'glyph-emoji', text: CATS[item.category].emoji }),
      h('span', { class: 'glyph-label', text: CATS[item.category].label }));
    const url = safeUrl(item.image);
    if (url) {
      const img = h('img', {
        alt: item.name_en || item.name_cn,
        loading: 'lazy',
        decoding: 'async',
        referrerpolicy: 'no-referrer',
        draggable: 'false'
      });
      img.addEventListener('error', () => {
        img.remove();
        wrap.classList.add('is-fallback');
        wrap.prepend(glyph());
      }, { once: true });
      img.src = url;
      wrap.append(img);
    } else {
      wrap.classList.add('is-fallback');
      wrap.append(glyph());
    }
    return wrap;
  }

  const ribbonEl = (small) => h('span', { class: 'ribbon' + (small ? ' ribbon--sm' : '') }, icon('check'), 'Must-buy');

  function priceParts(item) {
    const parts = [];
    if (item.price_cny == null) {
      parts.push(h('span', { class: 'price-na', text: 'Price on Taobao' }));
    } else {
      parts.push(h('span', { class: 'price' },
        h('span', { class: 'yen', text: '¥' }),
        h('span', { class: 'amt', text: fmtNum(item.price_cny) })));
      const d = fmtShort(item.price_date);
      if (d) parts.push(h('span', { class: 'asof', text: 'as of ' + d }));
    }
    return parts;
  }

  function ctaButton(item, small) {
    const url = safeUrl(item.taobao_url);
    const label = item.taobao_link_type === 'search' ? 'Search on Taobao' : 'Open on Taobao';
    if (!url) {
      return h('span', { class: 'btn btn-primary is-disabled' + (small ? ' btn-sm' : ''), 'aria-disabled': 'true', text: 'Link unavailable' });
    }
    return h('a', {
      class: 'btn btn-primary' + (small ? ' btn-sm' : ''),
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
      draggable: 'false'
    }, h('span', { text: label }), icon('external'));
  }

  function sourceBadges(item, withLabels) {
    const lis = [];
    const linked = new Set();
    item.sources.forEach((s) => {
      linked.add(s.platform);
      const name = PLATFORMS[s.platform];
      lis.push(h('li', null, h('a', {
        class: 'badge badge--' + s.platform,
        href: s.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        draggable: 'false',
        title: s.label || name,
        'aria-label': name + (s.label ? ': ' + s.label : '') + ' (opens in a new tab)'
      }, h('span', { class: 'b-name', text: name }),
      withLabels && s.label ? h('span', { class: 'b-label', text: s.label }) : null,
      icon('external'))));
    });
    item.platforms.filter((p) => !linked.has(p)).forEach((p) => {
      lis.push(h('li', null, h('span', { class: 'badge badge--plain' }, h('span', { class: 'b-name', text: PLATFORMS[p] }))));
    });
    return lis.length ? h('ul', { class: 'sources', 'aria-label': 'Seen on' }, lis) : null;
  }

  function heartBtn(item) {
    const b = h('button', {
      type: 'button',
      class: 'round heart',
      'data-id': item.id,
      'data-name': item.name_en || item.name_cn
    }, icon('heart'));
    syncHeart(b);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      toast(toggleSaved(item.id) ? 'Saved to My list' : 'Removed from My list');
    });
    return b;
  }

  function shareBtn(item, cls) {
    const b = h('button', {
      type: 'button',
      class: cls,
      'aria-label': 'Share a link to ' + (item.name_en || item.name_cn)
    }, icon('share'));
    b.addEventListener('click', (e) => { e.stopPropagation(); shareItem(item); });
    return b;
  }

  function kickerEl(item) {
    return h('p', { class: 'kicker' },
      item.brand ? h('span', { class: 'brand-name', text: item.brand }) : null,
      item.brand ? h('span', { 'aria-hidden': 'true', text: '·' }) : null,
      h('span', { class: 'cat', text: CATS[item.category].label }));
  }

  /* ---------- deck card ---------- */
  function buildDeckCard(item, entering) {
    const total = state.deck.length;
    const title = item.name_en || item.name_cn;

    const media = mediaEl(item);
    if (item.must_buy) media.append(ribbonEl(false));
    media.append(
      h('span', { class: 'plate-no', 'aria-hidden': 'true', text: 'No. ' + pad2(item.n) }),
      h('span', { class: 'saved-flag', 'data-saved-flag': item.id, hidden: !isSaved(item.id), text: 'In your list' })
    );

    const stats = [item.sales_text, item.review_count_text].filter(Boolean)
      .map((t) => h('span', { class: 'stat', text: t }));
    if (item.taobao_check === 'pending') stats.push(h('span', { class: 'stat stat--pending', text: 'Taobao sales check pending' }));
    if (item.taobao_check === 'verified') stats.push(h('span', { class: 'stat stat--verified', text: 'Verified on Taobao' }));

    const quote = item.review_summary
      ? h('blockquote', { class: 'quote' },
        h('p', { class: 'quote-label', text: 'What Taobao buyers say' }),
        h('p', { class: 'quote-text', text: item.review_summary }),
        item.review_tags.length
          ? h('ul', { class: 'rtags' }, item.review_tags.map((t) => h('li', { class: 'rtag', lang: hasCJK(t) ? 'zh-Hans' : null, text: t })))
          : null)
      : null;

    const badges = sourceBadges(item, true);
    const note = item.taobao_link_type === 'search'
      ? h('p', { class: 'note' }, h('span', { class: 'note-tag', text: 'search link' }),
        'Opens Taobao search results for this product, not one listing page.')
      : null;

    const body = h('div', { class: 'card-body' },
      kickerEl(item),
      h('h2', { class: 'name-en', text: title }),
      item.name_en && item.name_cn ? h('p', { class: 'name-cn', lang: 'zh-Hans', text: item.name_cn }) : null,
      item.tags.length ? h('ul', { class: 'tags' }, item.tags.map((t) => h('li', { class: 'tag', text: TAGS[t] }))) : null,
      h('div', { class: 'price-row' }, priceParts(item)),
      stats.length ? h('p', { class: 'stats' }, stats) : null,
      item.store
        ? h('p', { class: 'store' + (item.official_store ? ' is-official' : '') },
          item.official_store ? icon('check') : null,
          h('span', { text: (item.official_store ? 'Official store · ' : 'Store · ') + item.store }))
        : null,
      item.why ? h('p', { class: 'why', text: item.why }) : null,
      quote,
      badges ? h('p', { class: 'sources-label', text: 'Seen on' }) : null,
      badges,
      h('div', { class: 'cta-row' }, ctaButton(item, false), shareBtn(item, 'btn-icon')),
      note
    );

    return h('article', {
      class: 'card card--deck' + (entering ? ' is-entering' : ''),
      'data-id': item.id,
      'data-cat': item.category,
      'aria-label': title + ', find ' + Math.min(state.pos + 1, total) + ' of ' + total
    },
    h('div', { class: 'stamp stamp--save', 'aria-hidden': 'true', text: 'Save' }),
    h('div', { class: 'stamp stamp--skip', 'aria-hidden': 'true', text: 'Skip' }),
    media, body);
  }

  /* ---------- grid card and list row ---------- */
  function buildGridCard(item) {
    const media = mediaEl(item);
    media.classList.add('media--sq');
    if (item.must_buy) media.append(ribbonEl(true));
    media.append(h('div', { class: 'media-tools' }, shareBtn(item, 'round'), heartBtn(item)));
    media.style.cursor = 'pointer';
    media.addEventListener('click', (e) => {
      if (e.target.closest('button, a')) return;
      openItem(item.id);
    });

    const nameBtn = h('button', { type: 'button', class: 'linkish', title: 'Open in the swipe deck', text: item.name_en || item.name_cn });
    nameBtn.addEventListener('click', () => openItem(item.id));

    const badges = sourceBadges(item, false);
    const body = h('div', { class: 'gbody' },
      kickerEl(item),
      h('h3', { class: 'name-en' }, nameBtn),
      item.name_en && item.name_cn ? h('p', { class: 'name-cn', lang: 'zh-Hans', text: item.name_cn }) : null,
      h('div', { class: 'gprice' }, priceParts(item)),
      item.sales_text ? h('p', { class: 'gstat', text: item.sales_text }) : null,
      badges,
      h('div', { class: 'gcta' }, ctaButton(item, true))
    );
    return h('li', { class: 'grid-cell' },
      h('article', { class: 'card card--grid', 'data-id': item.id, 'data-cat': item.category }, media, body));
  }

  function buildRow(item) {
    const media = mediaEl(item);
    media.classList.add('media--thumb');
    const nameBtn = h('button', { type: 'button', class: 'linkish', title: 'Open in the swipe deck', text: item.name_en || item.name_cn });
    nameBtn.addEventListener('click', () => openItem(item.id));
    const removeBtn = h('button', {
      type: 'button',
      class: 'btn btn-ghost btn-sm',
      'aria-label': 'Remove ' + (item.name_en || item.name_cn) + ' from My list',
      text: 'Remove'
    });
    removeBtn.addEventListener('click', () => { removeSaved(item.id); toast('Removed from My list'); });

    return h('li', { class: 'row card', 'data-id': item.id },
      media,
      h('div', { class: 'row-info' },
        kickerEl(item),
        h('h3', { class: 'name-en' }, nameBtn),
        item.name_en && item.name_cn ? h('p', { class: 'name-cn', lang: 'zh-Hans', text: item.name_cn }) : null,
        h('div', { class: 'price-line' }, priceParts(item)),
        h('div', { class: 'row-actions' }, ctaButton(item, true), removeBtn)));
  }

  function stateCard(kicker, title, text, actions) {
    return h('div', { class: 'state-card' },
      h('p', { class: 'kicker', text: kicker }),
      h('h2', { class: 'state-title', text: title }),
      h('p', { class: 'state-text', text: text }),
      actions && actions.length ? h('div', { class: 'state-actions' }, actions) : null);
  }

  function textButton(label, cls, onClick) {
    const b = h('button', { type: 'button', class: 'btn ' + cls, text: label });
    b.addEventListener('click', onClick);
    return b;
  }

  /* ---------- rendering ---------- */
  function preload(from, to) {
    for (let i = from; i <= to; i++) {
      const it = state.deck[i];
      const u = it && safeUrl(it.image);
      if (u) {
        const im = new Image();
        im.referrerPolicy = 'no-referrer';
        im.decoding = 'async';
        im.src = u;
      }
    }
  }

  function renderDeck(entering) {
    const deck = $('#deck');
    const n = state.deck.length;
    const item = state.deck[state.pos];
    deck.dataset.remaining = item ? String(n - state.pos) : '0';
    deck.replaceChildren();

    if (!state.items.length) {
      deck.append(stateCard('Nothing yet', 'No finds in this edition', 'Please check back soon.', null));
    } else if (!n) {
      deck.append(stateCard('No matches', 'Nothing fits those filters', 'Try another category, or clear the search.',
        [textButton('Clear filters', 'btn-primary', clearFilters)]));
    } else if (!item) {
      const kept = state.history.filter((x) => x.action === 'save').length;
      deck.append(stateCard('End of the deck', 'You have seen every find',
        'You saved ' + kept + ' this round. Your list holds ' + savedItems().length + ' in total.',
        [
          textButton('Open My list', 'btn-primary', () => setView('list')),
          textButton('Start over', 'btn-ghost', () => { state.pos = 0; state.history = []; renderDeck(true); })
        ]));
    } else {
      const card = buildDeckCard(item, !!entering);
      deck.append(card);
      bindDrag(card);
      preload(state.pos + 1, state.pos + 2);
    }

    const shown = n ? Math.min(state.pos + 1, n) : 0;
    $('#deck-counter').textContent = shown + ' / ' + n;
    $('#deck-progress').style.transform = 'scaleX(' + (n ? Math.min(state.pos, n) / n : 0) + ')';
    $('#btn-undo').disabled = !state.history.length;
    $('#btn-skip').disabled = !item;
    $('#btn-save').disabled = !item;
    $('#deck-announce').textContent = item ? (item.name_en || item.name_cn) + ', ' + shown + ' of ' + n : '';
  }

  function renderGrid() {
    const list = $('#grid');
    const items = filtered();
    const total = state.items.length;
    $('#grid-summary').textContent = items.length === total
      ? total + (total === 1 ? ' find' : ' finds')
      : items.length + ' of ' + total + ' finds';
    list.replaceChildren();
    if (!items.length) {
      list.append(h('li', { class: 'grid-empty' },
        stateCard('No matches', 'Nothing fits those filters', 'Try another category, or clear the search.',
          [textButton('Clear filters', 'btn-primary', clearFilters)])));
      return;
    }
    const frag = document.createDocumentFragment();
    items.forEach((it) => frag.append(buildGridCard(it)));
    list.append(frag);
  }

  function renderList() {
    const items = savedItems();
    const rows = $('#rows');
    $('#list-summary').textContent = items.length + (items.length === 1 ? ' saved find' : ' saved finds');
    $('#share-list').disabled = !items.length;
    $('#clear-list').disabled = !items.length;
    rows.replaceChildren();
    if (!items.length) {
      rows.append(h('li', { class: 'grid-empty' },
        stateCard('Nothing saved yet', 'Your list is empty',
          'Swipe right on a card in the deck, or tap the heart on a grid card.',
          [textButton('Go to the deck', 'btn-primary', () => setView('deck'))])));
      return;
    }
    items.forEach((it) => rows.append(buildRow(it)));
  }

  function renderAll() {
    updateChips();
    $('#must-toggle').setAttribute('aria-pressed', state.must ? 'true' : 'false');
    updateListBadge();
    if (state.view === 'deck') renderDeck(false);
    else if (state.view === 'grid') renderGrid();
    else renderList();
  }

  function setView(v, opts) {
    state.view = v;
    document.body.dataset.view = v;
    ['deck', 'grid', 'list'].forEach((name) => {
      $('#view-' + name).hidden = name !== v;
      $('#btn-view-' + name).setAttribute('aria-pressed', name === v ? 'true' : 'false');
    });
    $('#filters').hidden = v === 'list';
    renderAll();
    if (!(opts && opts.noScroll)) window.scrollTo(0, 0);
  }

  /* open one item in the swipe deck, clearing filters if they hide it */
  function openItem(id) {
    if (!state.byId.has(id)) return false;
    if (!filtered().some((i) => i.id === id)) {
      state.cat = 'all';
      state.must = false;
      state.q = '';
      syncFilterInputs();
    }
    rebuildDeck(id);
    setView('deck');
    return true;
  }

  function openFromHash() {
    const m = /^#item-(.+)$/.exec(window.location.hash);
    if (!m) return false;
    let id;
    try { id = decodeURIComponent(m[1]); } catch (e) { return false; }
    if (!openItem(id)) { toast('That find is not in this edition'); return false; }
    return true;
  }

  /* ---------- decisions: save, skip, undo ---------- */
  function decide(action) {
    const item = state.deck[state.pos];
    if (!item) return;
    const added = action === 'save' ? addSaved(item.id) : false;
    state.history.push({ id: item.id, action, added });
    state.pos += 1;
    renderDeck(true);
  }

  function undo() {
    if (state.busy || state.view !== 'deck') return;
    const last = state.history.pop();
    if (!last) { toast('Nothing to undo'); return; }
    if (last.action === 'save' && last.added) removeSaved(last.id);
    state.pos = Math.max(0, state.pos - 1);
    renderDeck(true);
  }

  function flyOut(card, dir, fromTransform) {
    return new Promise((resolve) => {
      if (!card.animate) { resolve(); return; }
      const stamp = card.querySelector(dir > 0 ? '.stamp--save' : '.stamp--skip');
      if (stamp) stamp.style.opacity = '1';
      const from = fromTransform || 'translate3d(0px, 0px, 0) rotate(0deg)';
      const reduce = reduceMotion();
      const w = Math.max(window.innerWidth, 480);
      const to = reduce ? from : 'translate3d(' + dir * w + 'px, 40px, 0) rotate(' + dir * 24 + 'deg)';
      const anim = card.animate(
        [{ transform: from, opacity: 1 }, { transform: to, opacity: 0 }],
        { duration: reduce ? 140 : 300, easing: 'cubic-bezier(0.3, 0, 0.8, 0.6)', fill: 'forwards' }
      );
      anim.onfinish = () => resolve();
      anim.oncancel = () => resolve();
    });
  }

  async function commit(card, action, fromTransform) {
    if (state.busy) return;
    state.busy = true;
    const id = card.dataset.id;
    await flyOut(card, action === 'save' ? 1 : -1, fromTransform);
    state.busy = false;
    const cur = state.deck[state.pos];
    if (!cur || cur.id !== id) { renderDeck(false); return; }
    decide(action);
  }

  function act(action) {
    if (state.busy || state.view !== 'deck') return;
    const card = $('#deck .card--deck');
    if (card) commit(card, action, null);
  }

  function springBack(card, stampSave, stampSkip) {
    card.classList.add('is-springing');
    card.style.transform = '';
    stampSave.style.opacity = '0';
    stampSkip.style.opacity = '0';
    const done = () => card.classList.remove('is-springing');
    const onEnd = (e) => {
      if (e.target === card && e.propertyName === 'transform') {
        card.removeEventListener('transitionend', onEnd);
        done();
      }
    };
    card.addEventListener('transitionend', onEnd);
    setTimeout(done, 650);
  }

  /* ---------- swipe gesture (pointer events: mouse, touch, pen) ---------- */
  function bindDrag(card) {
    const stampSave = card.querySelector('.stamp--save');
    const stampSkip = card.querySelector('.stamp--skip');
    let pid = null;
    let sx = 0;
    let sy = 0;
    let dx = 0;
    let dy = 0;
    let tracking = false;
    let dragging = false;
    let raf = 0;
    let samples = [];
    let lastTransform = '';

    const paint = () => {
      raf = 0;
      const rot = reduceMotion() ? 0 : clamp(dx / 16, -20, 20);
      lastTransform = 'translate3d(' + dx + 'px, ' + dy * 0.2 + 'px, 0) rotate(' + rot + 'deg)';
      card.style.transform = lastTransform;
      const p = Math.min(1, Math.abs(dx) / SWIPE_PX);
      stampSave.style.opacity = dx > 0 ? p.toFixed(3) : '0';
      stampSkip.style.opacity = dx < 0 ? p.toFixed(3) : '0';
    };

    const velocity = () => {
      if (samples.length < 2) return 0;
      const last = samples[samples.length - 1];
      let first = samples[0];
      for (const s of samples) {
        if (last.t - s.t <= 120) { first = s; break; }
      }
      const dt = last.t - first.t;
      return dt > 0 ? (last.x - first.x) / dt : 0;
    };

    card.addEventListener('pointerdown', (e) => {
      if (state.busy) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('a, button, input, textarea, select, label')) return;
      pid = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      dx = 0;
      dy = 0;
      tracking = true;
      dragging = false;
      samples = [{ x: sx, t: e.timeStamp }];
      card.classList.remove('is-entering', 'is-springing');
      if (e.pointerType === 'mouse') e.preventDefault();
    });

    card.addEventListener('pointermove', (e) => {
      if (!tracking || e.pointerId !== pid) return;
      dx = e.clientX - sx;
      dy = e.clientY - sy;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) return;
        // on touch, a mostly vertical move is the page scrolling, so let it go
        if (e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)) { tracking = false; return; }
        dragging = true;
        card.classList.add('is-dragging');
        try { card.setPointerCapture(pid); } catch (err) { /* ignore */ }
      }
      samples.push({ x: e.clientX, t: e.timeStamp });
      while (samples.length > 6) samples.shift();
      if (!raf) raf = requestAnimationFrame(paint);
    });

    const finish = (e, cancelled) => {
      if (!tracking || e.pointerId !== pid) return;
      tracking = false;
      if (!dragging) return;
      dragging = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!cancelled) {
        dx = e.clientX - sx;
        dy = e.clientY - sy;
      }
      paint();
      card.classList.remove('is-dragging');
      try { card.releasePointerCapture(pid); } catch (err) { /* ignore */ }
      suppressClickUntil = performance.now() + 400;

      let dir = 0;
      if (!cancelled) {
        const v = velocity();
        if (Math.abs(dx) >= SWIPE_PX) dir = dx > 0 ? 1 : -1;
        else if (Math.abs(v) >= FLICK_SPEED && Math.abs(dx) >= FLICK_MIN_PX && Math.sign(v) === Math.sign(dx)) dir = dx > 0 ? 1 : -1;
      }
      if (dir) commit(card, dir > 0 ? 'save' : 'skip', lastTransform);
      else springBack(card, stampSave, stampSkip);
    };
    card.addEventListener('pointerup', (e) => finish(e, false));
    card.addEventListener('pointercancel', (e) => finish(e, true));

    // a drag must never count as a tap on a link or button
    card.addEventListener('click', (e) => {
      if (performance.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    card.addEventListener('dragstart', (e) => e.preventDefault());
  }

  /* ---------- sharing ---------- */
  const pageUrl = () => window.location.href.split('#')[0];
  const itemLink = (item) => pageUrl() + '#item-' + encodeURIComponent(item.id);

  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through to the old way */ }
    try {
      const ta = h('textarea', { class: 'sr-copy', readonly: '', 'aria-hidden': 'true', tabindex: '-1' });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  async function shareOrCopy(payload, copy, okMsg) {
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    const ok = await copyText(copy);
    toast(ok ? okMsg : 'Could not copy. Please copy the link from the address bar.');
  }

  function shareItem(item) {
    const link = itemLink(item);
    const name = item.name_en || item.name_cn;
    return shareOrCopy({ title: name + ' · Taobao Finds', text: name + ' on Taobao Finds', url: link }, link, 'Link to this find copied');
  }

  function listText() {
    const lines = ['My Taobao Finds · ' + state.meta.edition, ''];
    savedItems().forEach((it, i) => {
      const price = it.price_cny == null ? '' : ' · ¥' + fmtNum(it.price_cny);
      lines.push((i + 1) + '. ' + (it.name_en || it.name_cn) + (it.name_en && it.name_cn ? ' (' + it.name_cn + ')' : '') + price);
      const u = safeUrl(it.taobao_url);
      if (u) lines.push('   ' + u + (it.taobao_link_type === 'search' ? ' (search link)' : ''));
    });
    lines.push('', pageUrl());
    return lines.join('\n');
  }

  function shareList() {
    if (!savedItems().length) { toast('Save something first'); return; }
    const text = listText();
    shareOrCopy({ title: 'My Taobao Finds · ' + state.meta.edition, text }, text, 'List copied. Paste it anywhere.');
  }

  function sharePage() {
    const url = pageUrl();
    const desc = ($('meta[name="description"]') || {}).content || '';
    shareOrCopy({ title: document.title, text: desc, url }, url, 'Page link copied');
  }

  /* ---------- theme ---------- */
  function currentTheme() {
    const a = document.documentElement.getAttribute('data-theme');
    if (a === 'dark' || a === 'light') return a;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function syncThemeUI() {
    const t = currentTheme();
    const b = $('#theme-toggle');
    b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    b.replaceChildren(icon(t === 'dark' ? 'sun' : 'moon'));
    const m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', THEME_COLORS[t]);
  }

  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set(KEYS.theme, next);
    syncThemeUI();
  }

  /* ---------- static wiring ---------- */
  function bindStatic() {
    $$('[data-icon]').forEach((n) => n.append(icon(n.dataset.icon)));
    syncThemeUI();
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', syncThemeUI);
    }

    $('#theme-toggle').addEventListener('click', toggleTheme);
    ['deck', 'grid', 'list'].forEach((v) => $('#btn-view-' + v).addEventListener('click', () => setView(v)));

    $('#btn-skip').addEventListener('click', () => act('skip'));
    $('#btn-save').addEventListener('click', () => act('save'));
    $('#btn-undo').addEventListener('click', undo);

    $('#must-toggle').addEventListener('click', () => { state.must = !state.must; refilter(); });

    const search = $('#search');
    let searchTimer = 0;
    const applySearch = () => {
      clearTimeout(searchTimer);
      state.q = search.value;
      refilter();
    };
    search.addEventListener('input', (e) => {
      $('#search-clear').hidden = !search.value;
      if (e.isComposing) return;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applySearch, 140);
    });
    search.addEventListener('compositionend', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applySearch, 60);
    });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && search.value) {
        e.preventDefault();
        search.value = '';
        $('#search-clear').hidden = true;
        applySearch();
      }
    });
    $('#search-clear').addEventListener('click', () => {
      search.value = '';
      $('#search-clear').hidden = true;
      applySearch();
      search.focus();
    });

    $('#promo-close').addEventListener('click', () => {
      $('#promo').hidden = true;
      if (state.meta.promo) store.set(KEYS.promo, state.meta.promo.headline + '|' + state.meta.promo.detail);
    });

    $('#share-list').addEventListener('click', shareList);
    $('#share-page').addEventListener('click', sharePage);

    let clearTimer = 0;
    const disarm = () => {
      clearTimeout(clearTimer);
      clearTimer = 0;
      $('#clear-list').textContent = 'Clear list';
    };
    $('#clear-list').addEventListener('click', () => {
      if (!clearTimer) {
        $('#clear-list').textContent = 'Tap again to clear';
        clearTimer = setTimeout(disarm, 3000);
        return;
      }
      disarm();
      state.saved = [];
      state.savedSet.clear();
      persistSaved();
      refreshSavedUI();
      toast('List cleared');
    });

    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (state.view !== 'deck') return;
      const t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], #chips')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); act('skip'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); act('save'); }
      else if (e.key === 'Backspace' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); undo(); }
    });

    window.addEventListener('hashchange', openFromHash);
  }

  function renderChrome() {
    const meta = state.meta;
    document.title = meta.title + ' · ' + meta.edition;
    $('#edition').textContent = meta.edition;

    const promo = meta.promo;
    const closed = promo ? store.get(KEYS.promo) === promo.headline + '|' + promo.detail : false;
    if (promo && (promo.headline || promo.detail) && !closed) {
      $('#promo-headline').textContent = promo.headline;
      $('#promo-detail').textContent = promo.detail;
      $('#promo').hidden = false;
    }

    if (meta.method) $('#method').textContent = meta.method;
    const when = fmtLong(meta.updated);
    $('#disclaimer').textContent = 'Prices and sales as read on Taobao' + (when ? ' on ' + when : '') +
      '. Not affiliated with Taobao. No affiliate links.';
  }

  /* ---------- start ---------- */
  async function start() {
    try {
      const { raw, source } = await loadData();
      const data = normalize(raw);
      state.meta = { title: data.title, edition: data.edition, updated: data.updated, method: data.method, promo: data.promo };
      state.items = data.items;
      state.byId = new Map(data.items.map((i) => [i.id, i]));
      document.body.dataset.source = source === 'items.json' ? 'live' : 'sample';
      $('#sample-flag').hidden = source === 'items.json';
      loadSaved();
      renderChrome();
      buildChips();
      state.deck = filtered();
      state.pos = 0;
      setView('deck', { noScroll: true });
      if (window.location.hash) openFromHash();
      document.body.dataset.ready = 'true';
    } catch (e) {
      if (window.console) console.error('Taobao Finds failed to start', e);
      document.body.dataset.source = 'error';
      $('#deck').dataset.remaining = '0';
      $('#deck').replaceChildren(stateCard('Could not load', 'The finds did not load',
        'Check your connection and try again. If you opened index.html straight from disk, serve the folder over http instead.',
        [textButton('Try again', 'btn-primary', () => window.location.reload())]));
    }
  }

  bindStatic();
  start();
})();
