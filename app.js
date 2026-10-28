/* VA Wine Passport — personal, on-device Virginia winery guide. No server: everything you add lives in this phone's IndexedDB. */
'use strict';
const G = window.GUIDE;
const VERSION = '1.0.0';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const enc = encodeURIComponent;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const todayISO = () => { const d = new Date(); return iso(d); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0); };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtDate = (s, long) => { if (!s) return ''; const d = fromISO(s); return long ? `${DAYN[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };

/* ---------------- icons ---------------- */
const P = {
  dog: '<circle cx="6.5" cy="10" r="1.7"/><circle cx="10" cy="6.2" r="1.7"/><circle cx="14.5" cy="6.2" r="1.7"/><circle cx="18" cy="10" r="1.7"/><path d="M12 12c-3 0-5.5 3.4-5.5 5.4 0 1.6 1.3 2.5 2.7 2.2 1-.2 1.8-.6 2.8-.6s1.8.4 2.8.6c1.4.3 2.7-.6 2.7-2.2 0-2-2.5-5.4-5.5-5.4z"/>',
  fork: '<path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11M17 3c-2 1-3 3.5-3 6.5V13h3v8"/>',
  basket: '<path d="M4 10h16l-1.5 9a2 2 0 0 1-2 1.7h-9a2 2 0 0 1-2-1.7z"/><path d="M8 10l3-6M16 10l-3-6"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="M10 21l2-6 3 3v3M8 12l3-4 3 2 3 1M12 15l-1-5"/>',
  glass: '<path d="M8 3h8l-.5 5a3.5 3.5 0 0 1-7 0z"/><path d="M12 12.5V20M8.5 20.5h7"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor" stroke="none"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  heartf: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  nav: '<path d="M3 11l18-8-8 18-2-8z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
  locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  bottle: '<path d="M10 2h4v4l1.5 3v12a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V9L10 6z"/><path d="M8.5 13h7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
  mountain: '<path d="M3 20l6-10 4 6 3-4 5 8z"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 9.3 4.4 4.4 0 0 0 7 18z"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'
};
const svg = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n] || ''}</svg>`;

/* ---------------- storage ---------------- */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('vawine', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('kv');
        d.createObjectStore('state');
        d.createObjectStore('visits', { keyPath: 'id' });
        d.createObjectStore('photos', { keyPath: 'id' });
        d.createObjectStore('fulls');
        d.createObjectStore('trips', { keyPath: 'id' });
        d.createObjectStore('custom', { keyPath: 'id' });
      };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  req(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(store, mode); const q = fn(t.objectStore(store));
      t.oncomplete = () => res(q ? q.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  },
  get(s, k) { return this.req(s, 'readonly', o => o.get(k)); },
  putRaw(s, v, k) { return this.req(s, 'readwrite', o => (k === undefined ? o.put(v) : o.put(v, k))); },
  delRaw(s, k) { return this.req(s, 'readwrite', o => o.delete(k)); },
  // synced stores get a last-write timestamp (_u), last editor (_by) and creator (_cb), then go to the family journal
  put(s, v, k, opts = {}) {
    const synced = SYNCED.includes(s) && v && typeof v === 'object';
    if (synced) { v._u = opts.seed ? 1 : Date.now(); if (!opts.seed) { v._by = Sync.me(); if (!v._cb) v._cb = Sync.me(); } }
    return this.putRaw(s, v, k).then(r => { if (synced && !opts.seed) Sync.local(s, k !== undefined ? k : v.id, v); return r; });
  },
  del(s, k) { return this.delRaw(s, k).then(r => { if (SYNCED.includes(s)) Sync.localDel(s, k); return r; }); },
  all(s) { return this.req(s, 'readonly', o => o.getAll()); },
  keys(s) { return this.req(s, 'readonly', o => o.getAllKeys()); },
  clear(s) { return this.req(s, 'readwrite', o => o.clear()); }
};

const S = { state: {}, visits: [], photos: [], trips: [], custom: [], kv: {} };
const KV_KEYS = ['settings', 'coords', 'seeded', 'refine', 'badges', 'stampSeen'];

async function loadAll() {
  await DB.open();
  const [keys, vals] = await Promise.all([DB.keys('state'), DB.all('state')]);
  keys.forEach((k, i) => (S.state[k] = vals[i]));
  [S.visits, S.photos, S.trips, S.custom] = await Promise.all([DB.all('visits'), DB.all('photos'), DB.all('trips'), DB.all('custom')]);
  for (const k of KV_KEYS) S.kv[k] = await DB.get('kv', k);
  S.kv.settings = Object.assign({ base: G.defaultBase, myMaps: 'https://maps.app.goo.gl/4qUU4Dng4q5XTpmm7', theme: 'system' }, S.kv.settings || {});
  if (/1k3bSB_lTC7yy6nDtguaLcLDxvJUnBhg/.test(S.kv.settings.myMaps || '')) { S.kv.settings.myMaps = 'https://maps.app.goo.gl/4qUU4Dng4q5XTpmm7'; await saveKV('settings'); }
  S.kv.coords = S.kv.coords || {};
  S.kv.refine = S.kv.refine || {};
  if (!S.kv.seeded) await seed();
  // records saved before family sync existed get _u = 2: newer than untouched seeds (1), older than any real edit
  for (const [k, v] of Object.entries(S.state)) if (v && v._u == null) { v._u = 2; await DB.putRaw('state', v, k); }
  for (const [st, arr] of [['visits', S.visits], ['photos', S.photos], ['trips', S.trips], ['custom', S.custom]]) for (const v of arr) if (v._u == null) { v._u = 2; await DB.putRaw(st, v); }
}
const saveKV = k => DB.put('kv', S.kv[k], k);

async function seed() {
  for (const w of G.wineries) {
    if (w.visited) {
      S.state[w.id] = { status: 'visited', fav: true, notes: w.mine || '' };
      await DB.put('state', S.state[w.id], w.id, { seed: true });
    }
  }
  const tf = G.wineries.find(w => w.id === 'three-fox');
  const v = { id: 'v-seed-three-fox', wid: tf.id, date: tf.visitDate, who: '', fav: 'Wood-fired pizza with a Cabernet Franc', notes: tf.mine, seeded: true };
  S.visits.push(v); await DB.put('visits', v, undefined, { seed: true });
  const days = {}; ['2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'].forEach(d => (days[d] = []));
  const t = { id: 't-flint-hill', name: 'Flint Hill New Year', start: '2026-12-29', end: '2027-01-02', base: { ...G.defaultBase }, days, notes: 'Winter getaway with Bravo. Confirm holiday hours on Dec 31 and Jan 1.' };
  S.trips.push(t); await DB.put('trips', t, undefined, { seed: true });
  S.kv.seeded = true; await saveKV('seeded');
}

const st = id => S.state[id] || {};
async function setSt(id, patch) { S.state[id] = Object.assign({}, st(id), patch); await DB.put('state', S.state[id], id); }

/* ---------------- winery helpers ---------------- */
const ALL = () => G.wineries.concat(S.custom);
const W = id => ALL().find(w => w.id === id);
const pos = w => { const c = S.kv.coords[w.id]; return c && c[0] ? [c[0], c[1]] : [w.lat, w.lng]; };
const regionColor = r => getComputedStyle(document.documentElement).getPropertyValue('--r-' + (r || 'shen')).trim() || '#3F5A7A';
const gR = id => (G.gRatings && G.gRatings.r[id]) || null;
const regionName = r => (G.regions[r] || {}).short || 'Virginia';
const placeQ = w => `${w.n}, ${w.town}, VA`;
const navURL = w => `https://www.google.com/maps/dir/?api=1&destination=${enc(placeQ(w))}&travelmode=driving`;
const gEmbed = w => `https://maps.google.com/maps?q=${enc(placeQ(w))}&z=14&ie=UTF8&iwloc=&output=embed`;
const base = () => S.kv.settings.base || G.defaultBase;
function miles(a, b) { const R = 3958.8, t = x => (x * Math.PI) / 180; const dLa = t(b[0] - a[0]), dLo = t(b[1] - a[1]); const h = Math.sin(dLa / 2) ** 2 + Math.cos(t(a[0])) * Math.cos(t(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
const roadMi = (a, b) => miles(a, b) * 1.3;
const driveMin = mi => Math.round((mi / 40) * 60);
const fmtDrive = m => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`);
const distFromBase = w => roadMi([base().lat, base().lng], pos(w));
function score(id) {
  const s = st(id).score; if (!s || !s.scenery || !s.wine || !s.experience) return null;
  return Math.round((s.scenery * G.rubric.scenery + s.wine * G.rubric.wine + s.experience * G.rubric.experience) / 10);
}
const visitsOf = id => S.visits.filter(v => v.wid === id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const photosOf = id => S.photos.filter(p => p.wid === id && p.kind !== 'menu').sort((a, b) => (b.date || 0) - (a.date || 0));
const isVisited = id => st(id).status === 'visited' || S.visits.some(v => v.wid === id);
const inPick = (key, id) => (G.picks[key] ? G.picks[key].ids.includes(id) : false);

/* ---------------- hours ---------------- */
function parseHours(str) {
  if (!str) return null; const wk = [[], [], [], [], [], [], []];
  str.split('|').forEach(seg => {
    const m = seg.trim().match(/^([A-Za-z,\-]+)\s+(\d{1,2})(?::(\d\d))?-(\d{1,2})(?::(\d\d))?$/); if (!m) return;
    const o = +m[2] * 60 + +(m[3] || 0), c = +m[4] * 60 + +(m[5] || 0);
    m[1].split(',').forEach(part => {
      const [a, b] = part.split('-'); const ia = DAYS.indexOf(a); if (ia < 0) return;
      if (!b) { wk[ia].push([o, c]); return; }
      const ib = DAYS.indexOf(b); let i = ia;
      for (let k = 0; k < 7; k++) { wk[i].push([o, c]); if (i === ib) break; i = (i + 1) % 7; }
    });
  });
  return wk;
}
function schedule(w, d) { const mo = d.getMonth() + 1; let h = w.h; (w.seasons || []).forEach(s => { if (s.m.includes(mo)) h = s.h; }); return parseHours(h); }
function fmtT(min) { let h = Math.floor(min / 60); const m = min % 60, ap = h >= 12 && h < 24 ? 'PM' : 'AM'; h = h % 12 || 12; return m ? `${h}:${String(m).padStart(2, '0')} ${ap}` : `${h} ${ap}`; }
const fmtRange = r => r.map(([o, c]) => `${fmtT(o)}–${fmtT(c)}`).join(', ');
function hoursOn(w, d) { const s = schedule(w, d); if (!s) return null; if ((w.closed || []).includes(`${d.getMonth() + 1}-${d.getDate()}`)) return []; return s[d.getDay()]; }
function openStatus(w, now = new Date()) {
  if (!w.h) return { code: 'vary', label: w.irregular ? 'Limited days · check calendar' : 'Check calendar' };
  const t = now.getHours() * 60 + now.getMinutes(); const today = hoursOn(w, now);
  for (const [o, c] of today) if (t >= o && t < c) return { code: 'open', label: `Open · until ${fmtT(c)}` };
  for (const [o] of today) if (t < o) return { code: 'later', label: `Opens ${fmtT(o)} today` };
  for (let k = 1; k <= 7; k++) {
    const d = new Date(now); d.setDate(now.getDate() + k); const s = hoursOn(w, d);
    if (s.length) return { code: 'closed', label: `Closed · opens ${k === 1 ? 'tomorrow' : DAYS3[d.getDay()]} ${fmtT(s[0][0])}` };
  }
  return { code: 'closed', label: 'Closed' };
}
const statusChip = w => { const s = openStatus(w); const cls = s.code === 'open' ? 'open' : s.code === 'vary' ? 'warn' : 'closed'; return `<span class="chip ${cls}">${svg('clock')}${esc(s.label)}</span>`; };
function holiday(d) {
  const md = `${d.getMonth() + 1}-${d.getDate()}`;
  const fixed = { '12-24': 'Christmas Eve', '12-25': 'Christmas Day', '12-31': "New Year's Eve", '1-1': "New Year's Day", '7-4': 'Independence Day' };
  if (fixed[md]) return fixed[md];
  if (d.getMonth() === 10 && d.getDay() === 4 && d.getDate() >= 22 && d.getDate() <= 28) return 'Thanksgiving';
  return null;
}

/* ---------------- UI primitives ---------------- */
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2300); }
let sheetStack = [];
function openSheet(html, mount) {
  const bg = document.createElement('div'); bg.className = 'sheet-bg';
  bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) closeSheet(); });
  document.body.appendChild(bg); sheetStack.push(bg); if (mount) mount(bg.firstElementChild); return bg.firstElementChild;
}
function closeSheet() { const s = sheetStack.pop(); if (s) s.remove(); }
function closeAllSheets() { while (sheetStack.length) closeSheet(); $$('.viewer').forEach(v => v.remove()); }
function confirmSheet(title, body, okLabel = 'Delete') {
  return new Promise(res => {
    const el = openSheet(`<div class="confirm"><h2>${esc(title)}</h2><p class="muted" style="margin:0">${esc(body)}</p><div class="foot"><button class="btn" data-x="no">Cancel</button><button class="btn primary" data-x="yes">${esc(okLabel)}</button></div></div>`);
    el.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (!b) return; closeSheet(); res(b.dataset.x === 'yes'); });
  });
}
function starsHTML(n, act, data, lg) { let h = `<span class="stars${lg ? ' lg' : ''}" role="radiogroup">`; for (let i = 1; i <= 5; i++) h += `<button type="button" class="${i <= (n || 0) ? 'on' : ''}" data-act="${act}" data-v="${i}" ${data} aria-label="${i} star${i > 1 ? 's' : ''}">${svg('star')}</button>`; return h + '</span>'; }

/* generative label art: layered Blue Ridge silhouettes in the region colour */
function drawRidges(cv, color, seedStr) {
  const r = cv.getBoundingClientRect(); if (!r.width) return; const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = r.width * dpr; cv.height = r.height * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const Wd = r.width, H = r.height, sd = hash(seedStr || 'x');
  c.fillStyle = color; c.fillRect(0, 0, Wd, H);
  const g = c.createRadialGradient(Wd * 0.78, H * 0.28, 4, Wd * 0.78, H * 0.28, H * 0.5); g.addColorStop(0, 'rgba(255,236,200,.38)'); g.addColorStop(1, 'rgba(255,236,200,0)');
  c.fillStyle = g; c.fillRect(0, 0, Wd, H);
  for (let L = 0; L < 4; L++) {
    const baseY = H * (0.42 + L * 0.15), amp = H * (0.16 - L * 0.025), p1 = ((sd >> (L * 3)) % 100) / 15, p2 = ((sd >> (L * 5)) % 100) / 9;
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= Wd + 4; x += 4) {
      const u = x / Wd; const y = baseY - amp * (0.55 * Math.sin(u * Math.PI * (1.2 + L * 0.5) + p1) + 0.3 * Math.sin(u * Math.PI * (3.1 + L) + p2) + 0.15 * Math.sin(u * Math.PI * 9 + p1 * 2));
      c.lineTo(x, y);
    }
    c.lineTo(Wd, H); c.closePath(); c.fillStyle = `rgba(12,8,18,${0.13 + L * 0.08})`; c.fill();
  }
  c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1;
  for (let i = 0; i < 9; i++) { const y = H * 0.86 + i * 4; c.beginPath(); c.moveTo(0, y); c.lineTo(Wd, y - 10); c.stroke(); }
}

/* ---------------- photos ---------------- */
const urlCache = new Map();
function thumbURL(p) { if (!urlCache.has(p.id)) urlCache.set(p.id, URL.createObjectURL(p.thumb)); return urlCache.get(p.id); }
async function fullURL(id) { let b = await DB.get('fulls', id); if (!b) b = await Sync.fetchFull(id); return b ? URL.createObjectURL(b) : null; }
function canvasBlob(img, max, q) {
  const w = img.width || img.naturalWidth, h = img.height || img.naturalHeight; const s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return new Promise(r => c.toBlob(r, 'image/jpeg', q));
}
async function decode(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* fallback below */ }
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
}
async function addPhotos(files, wid, visitId, kind) {
  let n = 0;
  for (const f of files) {
    try {
      const img = await decode(f); const [full, thumb] = await Promise.all([canvasBlob(img, 1800, 0.84), canvasBlob(img, 440, 0.76)]);
      const p = { id: uid('p'), wid, visitId: visitId || null, kind: kind || 'photo', date: f.lastModified || Date.now(), caption: kind === 'menu' ? 'Menu' : '', thumb };
      await DB.put('fulls', full, p.id); await DB.put('photos', p); S.photos.push(p); n++;
    } catch (e) { console.warn('photo failed', e); }
  }
  if (n && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  return n;
}
let pickCtx = null;
function pickPhotos(wid, visitId, camera, after, kind) { pickCtx = { wid, visitId, after, kind }; (camera ? $('#camPick') : $('#filePick')).click(); }
async function onPicked(e) {
  const files = [...e.target.files]; e.target.value = ''; if (!files.length || !pickCtx) return;
  toast(`Saving ${files.length} photo${files.length > 1 ? 's' : ''}…`);
  const n = await addPhotos(files, pickCtx.wid, pickCtx.visitId, pickCtx.kind);
  toast(`${n} photo${n === 1 ? '' : 's'} saved`); const a = pickCtx.after; pickCtx = null; if (a) a(); else route();
}
async function openViewer(pid) {
  const p = S.photos.find(x => x.id === pid); if (!p) return; const url = await fullURL(pid); const w = W(p.wid);
  const v = document.createElement('div'); v.className = 'viewer';
  v.innerHTML = `<div class="vbar"><button data-v="close">Close</button><span class="row"><button data-v="cover">Set as cover</button><button data-v="del">Delete</button></span></div>
    <img src="${url || thumbURL(p)}" alt="${esc(p.caption || (w ? w.n : 'Photo'))}">
    <div class="cap"><input type="text" id="capIn" placeholder="Add a caption" value="${esc(p.caption)}" style="background:rgba(255,255,255,.1);color:#fff;border-color:transparent"><div class="small" style="margin-top:6px;opacity:.7">${w ? esc(w.n) + ' · ' : ''}${new Date(p.date).toLocaleDateString()}${Sync.enabled && p._cb ? ' · added by ' + esc(p._cb) : ''}</div></div>`;
  document.body.appendChild(v);
  v.addEventListener('click', async e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    if (b.dataset.v === 'close') { v.remove(); if (url) URL.revokeObjectURL(url); route(); }
    if (b.dataset.v === 'cover') { await setSt(p.wid, { cover: p.id }); toast('Cover photo set'); }
    if (b.dataset.v === 'del') { if (await confirmSheet('Delete this photo?', 'It will be removed from this phone. This cannot be undone.')) { await DB.del('photos', p.id); await DB.del('fulls', p.id); S.photos = S.photos.filter(x => x.id !== p.id); if (st(p.wid).cover === p.id) await setSt(p.wid, { cover: null }); v.remove(); route(); } }
  });
  $('#capIn', v).addEventListener('change', async e => { p.caption = e.target.value; await DB.put('photos', p); toast('Caption saved'); });
}

/* ---------------- router ---------------- */
const view = $('#view');
let mapInst = null;
function setTop(title, { back = false, actions = '', logo = false } = {}) { $('#logo').hidden = !logo; $('#title').textContent = title; $('#backBtn').hidden = !back; $('#topActions').innerHTML = actions; }
/* remembered UI: scroll per screen, last screen per tab, filters, journal tab, map view — survives back, tab switches, and relaunch */
const UI = (() => { try { return JSON.parse(localStorage.getItem('vawine-ui') || '{}'); } catch (e) { return {}; } })();
const scrollMem = UI.scrollMem || {}; const tabMem = UI.tabMem || {}; const xMem = UI.xMem || {}; const openMem = UI.openMem || {};
try { history.scrollRestoration = 'manual'; } catch (e) { /* older browsers */ }
let curHash = null;
const skey = h => (h === 'journal' ? 'journal:' + jTab : h);
const tabOf = h => (h.startsWith('w-') ? 'wineries' : h.startsWith('trip-') ? 'plan' : h === 'prefs' ? 'home' : h);
function saveUI() {
  try {
    if (curHash) { scrollMem[skey(curHash)] = scrollY; saveX(); }
    const keys = Object.keys(scrollMem); if (keys.length > 120) keys.slice(0, keys.length - 120).forEach(k => delete scrollMem[k]);
    localStorage.setItem('vawine-ui', JSON.stringify({ F: { ...F, on: [...F.on] }, jTab, MF: { mode: MF.mode, on: [...MF.on], view: MF.view, peek: MF.peek || null }, tabMem, scrollMem, xMem, openMem, last: curHash, t: Date.now() }));
  } catch (e) { /* storage unavailable: nothing to remember */ }
}
const X_SEL = '.hcards, .badges, .scroller, .actions, .strip';
function saveX() { if (!curHash) return; const xs = $$(X_SEL, view).map(e => e.scrollLeft); if (xs.some(Boolean)) xMem[skey(curHash)] = xs; else delete xMem[skey(curHash)]; }
function restoreX(h) { const xs = xMem[skey(h)]; if (!xs) return; $$(X_SEL, view).forEach((e, i) => { if (xs[i]) e.scrollLeft = xs[i]; }); }
function restoreUI() {
  if (UI.F) { Object.assign(F, UI.F); F.on = new Set(UI.F.on || []); }
  if (UI.jTab) jTab = UI.jTab;
  if (UI.MF) { MF.mode = UI.MF.mode || 'guide'; MF.on = new Set(UI.MF.on || []); MF.view = UI.MF.view || null; MF.peek = UI.MF.peek || null; }
  if (UI.last && UI.last !== 'home' && (!location.hash || location.hash === '#home') && Date.now() - (UI.t || 0) < 24 * 3600e3) history.replaceState(null, '', '#' + UI.last);
}
function route() {
  if (curHash !== null && !keepScroll) { scrollMem[skey(curHash)] = scrollY; saveX(); }
  closeAllSheets();
  if (mapInst) { mapInst.remove(); mapInst = null; }
  const h = decodeURIComponent(location.hash.slice(1)) || 'home';
  const tab = tabOf(h); curHash = h; tabMem[tab] = h;
  $$('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  view.classList.toggle('full', h === 'map');
  const r = h.startsWith('w-') ? renderWinery(h.slice(2)) : h.startsWith('trip-') ? renderTrip(h.slice(5))
    : ({ home: renderHome, wineries: renderList, map: renderMap, journal: renderJournal, plan: renderPlan, prefs: renderPrefs }[h] || renderHome)();
  Promise.resolve(r).then(() => { restoreX(h); if (keepScroll) return; const y = scrollMem[skey(h)] || 0; window.scrollTo(0, y); requestAnimationFrame(() => { window.scrollTo(0, y); restoreX(h); }); saveUI(); });
  return r;
}
$('#tabs').addEventListener('click', e => {
  const a = e.target.closest('a[data-tab]'); if (!a) return; e.preventDefault();
  const t = a.dataset.tab; const cur = tabOf(curHash || 'home');
  if (cur !== t) return go(tabMem[t] || t);
  if (curHash !== t) return go(t);                       // second tap: back to the tab's main screen
  scrollMem[skey(t)] = 0; window.scrollTo({ top: 0, behavior: 'smooth' });  // third tap: top
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveUI(); });
document.addEventListener('toggle', e => { const d = e.target; if (d.dataset && d.dataset.mk) { openMem[d.dataset.mk] = d.open; saveUI(); } }, true);
window.addEventListener('pagehide', saveUI);
function go(h) { if (location.hash === '#' + h) route(); else location.hash = h; }
try { new ResizeObserver(() => document.documentElement.style.setProperty('--tb', $('#topbar').offsetHeight + 'px')).observe($('#topbar')); } catch (e) { /* fallback height */ }
window.addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', scrollY > 4), { passive: true });
$('#backBtn').addEventListener('click', () => { if (history.length > 1) history.back(); else go('home'); });

/* ---------------- HOME ---------------- */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if ((location.hash || '#home') === '#home') renderHome(); });
function renderHome() {
  setTop('VA Wine Passport', { logo: true, actions: `${Sync.enabled ? `<span id="syncBadge">${syncBadge()}</span>` : ''}<button class="iconbtn" data-act="go" data-to="prefs" aria-label="Settings">${svg('gear')}</button>` });
  const all = ALL(); const visited = all.filter(w => isVisited(w.id)).length;
  const winesRated = Object.values(S.state).reduce((n, s) => n + Object.values(s.wines || {}).filter(x => x.s).length, 0);
  const bottles = Object.values(S.state).reduce((n, s) => n + (s.bottles || []).reduce((m, b) => m + (+b.qty || 1), 0), 0);
  const today = todayISO();
  const trip = S.trips.filter(t => t.end >= today).sort((a, b) => a.start.localeCompare(b.start))[0];
  let tripHTML = '';
  if (trip) {
    const days = Math.ceil((fromISO(trip.start) - fromISO(today)) / 864e5); const stops = Object.values(trip.days).flat().length;
    tripHTML = `<a class="trip" href="#trip-${trip.id}"><canvas data-ridge="${esc(trip.id)}" data-color="var(--claret)"></canvas>
      <div class="eyebrow">${days > 0 ? 'Next trip' : 'Trip underway'}</div><div class="big">${esc(trip.name)}</div>
      <div class="sub">${fmtDate(trip.start).replace(/, \d{4}$/, '')} – ${fmtDate(trip.end)} · from ${esc(trip.base.name)}</div>
      <div class="sub">${stops ? `${stops} stop${stops > 1 ? 's' : ''} planned` : 'No stops yet — tap to plan the days'}</div>
      ${days > 0 ? `<div class="count"><b>${days}</b><span>day${days > 1 ? 's' : ''} to go</span></div>` : ''}</a>`;
  }
  const b = base(); const openNear = all.filter(w => openStatus(w).code === 'open').sort((x, y) => distFromBase(x) - distFromBase(y)).slice(0, 3);
  const recent = [...S.visits].sort((a, c) => (c.date || '').localeCompare(a.date || '')).slice(0, 3);
  view.innerHTML = `
    ${installEvt ? `<div class="card row" style="justify-content:space-between;margin-top:8px"><span class="small"><b>Install on your phone</b><br><span class="muted">Opens full-screen and works offline.</span></span><button class="btn primary" data-act="install">Install</button></div>` : ''}
    <div class="section" style="margin-top:8px">${tripHTML || `<a class="card" href="#plan"><b>Plan a wine trip</b><div class="muted small">Group wineries into days and check who's open.</div></a>`}</div>
    <div class="stats section">
      <div class="stat"><b class="mono">${visited}<span class="muted" style="font-size:14px">/${all.length}</span></b><span>Visited</span></div>
      <div class="stat"><b class="mono">${S.visits.length}</b><span>Visits</span></div>
      <div class="stat"><b class="mono">${winesRated}</b><span>Wines</span></div>
      <div class="stat"><b class="mono">${bottles}</b><span>Bottles</span></div>
    </div>
    <div class="section"><div class="section-head"><h3>Open now near ${esc(b.name.split(',')[0])}</h3><a href="#wineries" data-act="filter" data-f="open">See all</a></div>
      ${openNear.length ? `<div class="wlist">${openNear.map(wCard).join('')}</div>` : `<div class="empty">Nothing on the list is open right now. ${nextOpening(all)}</div>`}</div>
    ${recoSection()}
    <div class="section"><h3>Collections</h3><div class="collections">
      ${['added', 'glist', 'scenery', 'food', 'gems', 'bravo', 'plan'].map(k => `<a class="coll" href="#wineries" data-act="coll" data-k="${k}"><b>${esc(G.picks[k].title)}</b><span>${G.picks[k].ids.length} wineries</span></a>`).join('')}
      <a class="coll" href="#wineries" data-act="filter" data-f="want"><b>Our want-to-go list</b><span>${all.filter(w => st(w.id).status === 'want').length} saved</span></a>
    </div></div>
    <div class="section"><div class="section-head"><h3>Latest from the journal</h3><a href="#journal">Journal</a></div>
      ${recent.length ? recent.map(visitCard).join('') : '<div class="empty">Log a visit from any winery page.</div>'}</div>
    <p class="small muted" style="margin-top:28px">Guide data: ${esc(G.edition)}. Hours are published schedules, not guarantees — confirm before you drive.</p>`;
  paintRidges();
}
/* ---------------- smart "next five" ---------------- */
const TAG_RX = {
  views: /view|panoram|vista|overlook|elevat|blue ridge|mountain(?!-facing architecture)|sunset/i,
  intimate: /intimate|small|tiny|family-run|family-owned|owner|winemaker|personal/i,
  historic: /historic|17\d\d|18\d\d|1903|jefferson|manor|farmhouse|heritage/i,
  vines: /among the (grape)?vines|vine terrace|vineyard tables|over the vines|vineyard-facing|vineyard seating|in the vineyard/i,
  water: /river|creek|pond|lake/i,
  romantic: /romantic|elegant|refined|sophisticated/i,
  architecture: /architect|barn|villa|tuscan|cave|pavilion/i,
  firepit: /fire ?pit/i, music: /live music/i, brewery: /brew|beer|cider/i,
  serious: /serious|thoughtful|craftsmanship|essential|wine-focused|terroir/i, relaxed: /relaxed|casual|unpretentious|laid-back|lively/i
};
const WINE_RX = ['cabernet franc', 'petit verdot', 'pinot noir', 'chardonnay', 'viognier', 'petit manseng', 'norton', 'nebbiolo', 'merlot', 'sparkling', 'rosé', 'albariño', 'tannat', 'meritage', 'bordeaux', 'gamay', 'riesling', 'roussanne', 'sauvignon blanc', 'cabernet sauvignon'];
const tagCache = new Map();
function tagsOf(w) {
  if (tagCache.has(w.id)) return tagCache.get(w.id);
  const text = [w.n, w.status, w.why, w.mine, w.food, (w.features || []).join(' '), (w.wines || []).join(' ')].join(' ');
  const t = new Set(['r:' + w.region]);
  for (const [k, rx] of Object.entries(TAG_RX)) if (rx.test(text)) t.add(k);
  const wt = (w.wines || []).join(' ').toLowerCase(); WINE_RX.forEach(x => { if (wt.includes(x)) t.add('w:' + x); });
  if (['kitchen'].includes(w.foodLevel)) t.add('food'); if (w.foodLevel === 'bring' || w.picnic) t.add('picnic');
  if (w.resLevel === 'walkin') t.add('walkin'); if (w.adults) t.add('adults');
  ['scenery', 'food', 'gems'].forEach(k => { if (inPick(k, w.id)) t.add('p:' + k); });
  tagCache.set(w.id, t); return t;
}
const golds = w => (w.wines || []).filter(x => /gold|governor's cup|monticello cup|best in show/i.test(x)).length;
function upcomingTrip() { const today = todayISO(); const t = S.trips.filter(x => x.end >= today).sort((a, b) => a.start.localeCompare(b.start))[0]; if (!t) return null; const days = (fromISO(t.start) - fromISO(today)) / 864e5; return days <= 75 ? t : null; }
function recommend(n = 5) {
  const all = ALL(); const visited = all.filter(w => isVisited(w.id));
  // taste profile from what we've been to and how we scored it
  let liked = visited.map(w => { const sc = score(w.id); const wt = sc != null ? Math.max(0.1, (sc - 55) / 40) : st(w.id).fav ? 0.9 : 0.65; return { w, wt }; });
  if (!liked.length) liked = G.picks.next5.ids.map(id => ({ w: W(id), wt: 0.5 }));
  const P = {}; liked.forEach(({ w, wt }) => tagsOf(w).forEach(t => (P[t] = (P[t] || 0) + wt)));
  Object.entries(S.state).forEach(([id, s]) => Object.entries(s.wines || {}).forEach(([nm, x]) => { if (x.s >= 4) { const l = nm.toLowerCase(); WINE_RX.forEach(k => { if (l.includes(k)) P['w:' + k] = (P['w:' + k] || 0) + 0.4; }); } }));
  const pNorm = Math.sqrt(Object.values(P).reduce((a, v) => a + v * v, 0)) || 1;
  // context: upcoming trip (days + base) or the next seven days from home base
  const trip = upcomingTrip(); const bp = trip ? [trip.base.lat, trip.base.lng] : [base().lat, base().lng];
  const days = trip ? Object.keys(trip.days).sort().map(fromISO) : [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(12); d.setDate(d.getDate() + i); return d; });
  const cand = all.filter(w => !isVisited(w.id)).map(w => {
    const tg = tagsOf(w); let dot = 0; tg.forEach(t => (dot += P[t] || 0)); const sim = dot / (Math.sqrt(tg.size) * pNorm);
    let best = null, bestJ = 0; liked.forEach(({ w: l }) => { const lt = tagsOf(l); let inter = 0; tg.forEach(t => lt.has(t) && inter++); const j = inter / (tg.size + lt.size - inter); if (j > bestJ) { bestJ = j; best = l; } });
    const openDays = w.h ? days.filter(d => hoursOn(w, d).length) : null; const nOpen = openDays ? openDays.length : null;
    const mi = roadMi(bp, pos(w)); const near = Math.max(0, 1 - mi / 90);
    const g = golds(w); const gr = gR(w.id); const want = st(w.id).status === 'want';
    const quality = Math.min(0.15, g * 0.035) + (gr ? Math.min(0.08, Math.max(0, gr[0] - 4.4) * 0.2) : 0) + (inPick('gems', w.id) ? 0.04 : 0) + (inPick('next5', w.id) ? 0.05 : 0);
    const openScore = nOpen == null ? -0.05 : nOpen === 0 ? -0.4 : 0.22 * (nOpen / days.length) - (nOpen === 1 && days.length > 2 ? 0.1 : 0);
    const total = 0.45 * sim + (want ? 0.25 : 0) + 0.25 * near + quality + openScore;
    const reasons = [];
    if (want) reasons.push('On our want list');
    if (best && bestJ > 0.18) reasons.push('Like ' + best.n.replace(/ (Vineyards?|Winery|Cellars|Farm & Vineyards?|Vineyard & Winery|Vineyards & Winery|Family Wine|Estate Winery)\b.*$/, '').replace(/^The /, ''));
    if (nOpen != null) { if (trip) reasons.push(nOpen === days.length ? 'Open every trip day' : nOpen ? `Open ${nOpen} of ${days.length} trip days` : 'Closed on our trip'); else if (nOpen) { const first = openDays[0]; const di = Math.round((first - days[0]) / 864e5); reasons.push(di === 0 ? 'Open today' : di === 1 ? 'Open tomorrow' : 'Open ' + DAYS3[first.getDay()]); } }
    else reasons.push('Limited hours — check');
    reasons.push(`${Math.round(mi)} mi`);
    if (g >= 2) reasons.push(`${g} golds`); else if (gr && gr[0] >= 4.7) reasons.push(`Google ${gr[0]}`);
    return { w, total, reasons, region: w.region };
  });
  // greedy pick with a variety penalty for repeating a region
  const picked = [], used = {};
  while (picked.length < n && cand.length) {
    cand.forEach(c => (c.adj = c.total - (used[c.region] || 0) * 0.12));
    cand.sort((a, b) => b.adj - a.adj); const c = cand.shift(); picked.push(c); used[c.region] = (used[c.region] || 0) + 1;
  }
  return { picked, trip };
}
const firstSentence = t => (t || '').split(/(?<=[.!?])\s/)[0];
function recoSection() {
  const { picked, trip } = recommend(5);
  if (!picked.length) return '';
  return `<div class="section"><div class="section-head"><h3>Up next for us</h3><span class="small muted">${trip ? 'For ' + esc(trip.name) : 'Next 7 days'}</span></div>
    <span class="small muted" style="margin-top:-6px">Re-ranked from our visits, scores, want list, hours, and distance.</span>
    <div class="hcards">${picked.map(({ w, reasons }, i) => `<a class="card pick" href="#w-${w.id}"><span class="rank">${String(i + 1).padStart(2, '0')} · ${esc(w.town)}</span><h4>${esc(w.n)}</h4>
      <div class="chips">${reasons.slice(0, 4).map((r, k) => `<span class="chip ${k === 0 ? 'claret' : ''}">${esc(r)}</span>`).join('')}</div>
      <p>${esc((G.picks.next5.notes || {})[w.id] || firstSentence(w.why) || '')}</p></a>`).join('')}</div></div>`;
}
function nextOpening(all) {
  const soon = all.map(w => ({ w, s: openStatus(w) })).filter(x => x.s.code === 'later');
  return soon.length ? `${esc(soon[0].w.n)} ${esc(soon[0].s.label.toLowerCase())}.` : '';
}
function paintRidges(root = document) { $$('canvas[data-ridge]', root).forEach(cv => { let col = cv.dataset.color; if (col.startsWith('var(')) col = getComputedStyle(document.documentElement).getPropertyValue(col.slice(4, -1)).trim(); drawRidges(cv, col, cv.dataset.ridge); }); }

/* ---------------- LIST ---------------- */
const F = { q: '', on: new Set(), region: '', coll: '', sort: 'az' };
const sortName = w => w.n.replace(/^The\s+/i, '');
const FILTERS = [
  ['open', 'Open now', 'clock'], ['want', 'Want to go', 'heart'], ['visited', 'Visited', 'check'], ['unvisited', 'Not yet visited', 'mountain'],
  ['dog', 'Bravo welcome', 'dog'], ['kitchen', 'Food on site', 'fork'], ['picnic', 'Picnic OK', 'basket'], ['walkin', 'Walk-ins OK', 'walk']
];
function passes(w) {
  const s = st(w.id);
  if (F.q) { const hay = [w.n, w.town, regionName(w.region), (w.wines || []).join(' '), (w.features || []).join(' '), s.notes || '', w.menu ? JSON.stringify(w.menu) : ''].join(' ').toLowerCase(); if (!F.q.toLowerCase().split(/\s+/).every(t => hay.includes(t))) return false; }
  if (F.region && w.region !== F.region) return false;
  if (F.coll && !inPick(F.coll, w.id)) return false;
  for (const f of F.on) {
    if (f === 'open' && openStatus(w).code !== 'open') return false;
    if (f === 'want' && s.status !== 'want') return false;
    if (f === 'visited' && !isVisited(w.id)) return false;
    if (f === 'unvisited' && isVisited(w.id)) return false;
    if (f === 'dog' && w.dog !== 'yes') return false;
    if (f === 'kitchen' && !['kitchen', 'trucks'].includes(w.foodLevel)) return false;
    if (f === 'picnic' && w.picnic !== true) return false;
    if (f === 'walkin' && w.resLevel !== 'walkin') return false;
  }
  return true;
}
function sorted(list) {
  const idx = id => ALL().findIndex(w => w.id === id);
  const by = { guide: (a, b) => idx(a.id) - idx(b.id), near: (a, b) => distFromBase(a) - distFromBase(b), score: (a, b) => (score(b.id) ?? -1) - (score(a.id) ?? -1) || idx(a.id) - idx(b.id), az: (a, b) => sortName(a).localeCompare(sortName(b), 'en', { numeric: true, sensitivity: 'base' }) };
  return [...list].sort(by[F.sort] || by.guide);
}
function wIcons(w) {
  const dogC = w.dog === 'yes' ? 'ok' : w.dog === 'no' ? 'no' : '';
  const foodC = ['kitchen', 'trucks'].includes(w.foodLevel) ? 'ok' : w.foodLevel === 'bring' ? 'no' : '';
  return `<span class="icons"><span class="${dogC}" title="Dogs: ${esc(w.dog || 'unknown')}">${svg('dog')}</span><span class="${foodC}" title="Food">${svg('fork')}</span>${w.picnic ? `<span class="ok" title="Picnic OK">${svg('basket')}</span>` : ''}${w.resLevel === 'required' ? `<span title="Reservation required" style="color:var(--claret)">${svg('cal')}</span>` : ''}${w.adults ? '<span class="mono small" title="Adults only">21+</span>' : ''}</span>`;
}
function wCard(w) {
  const s = st(w.id); const sc = score(w.id); const ph = s.cover ? S.photos.find(p => p.id === s.cover) : photosOf(w.id)[0];
  const d = distFromBase(w);
  return `<a class="wcard" href="#w-${w.id}" style="--rc:${regionColor(w.region)}"><span class="band"></span>
    <span class="body"><h4 class="name">${esc(w.n)}</h4><span class="meta">${esc(w.town)} · ${esc(regionName(w.region))} · ${Math.round(d)} mi${gR(w.id) ? ` · <span style="color:var(--gold)">★</span> ${gR(w.id)[0]}` : ''}</span>
      <span class="row">${statusChip(w)}</span>${wIcons(w)}</span>
    <span class="side">${ph ? `<img class="thumb" src="${thumbURL(ph)}" alt="">` : isVisited(w.id) ? `<span class="stamp-mini" title="Visited">${svg('check')}</span>` : s.status === 'want' ? `<span style="color:var(--claret)">${svg('heartf', 'width="20" height="20"')}</span>` : '<span></span>'}
      ${sc != null ? `<span class="score">${sc}</span>` : s.fav ? `<span style="color:var(--gold)">${svg('star', 'width="16" height="16"')}</span>` : ''}</span></a>`;
}
function renderList() {
  setTop('Wineries', { actions: `<button class="iconbtn" data-act="addWinery" aria-label="Add a winery">${svg('plus')}</button>` });
  view.innerHTML = `
    <div class="stack" style="margin-top:6px">
      <div class="search">${svg('search')}<input type="search" id="q" placeholder="Search wineries, wines, towns, notes" value="${esc(F.q)}" autocomplete="off"></div>
      <div class="scroller" id="fchips">${FILTERS.map(([k, l, i]) => `<button class="fchip ${F.on.has(k) ? 'on' : ''}" data-act="toggleF" data-f="${k}">${svg(i)}${l}</button>`).join('')}</div>
      <div class="scroller">
        <button class="fchip ${!F.region ? 'on' : ''}" data-act="region" data-r="">All regions</button>
        ${Object.entries(G.regions).map(([k, r]) => `<button class="fchip ${F.region === k ? 'on' : ''}" data-act="region" data-r="${k}"><span style="width:10px;height:10px;border-radius:50%;background:${regionColor(k)}"></span>${esc(r.short)}</button>`).join('')}
      </div>
      ${F.coll ? `<div class="row"><span class="chip claret">${esc(G.picks[F.coll].title)}</span><button class="linkbtn" data-act="coll" data-k="">Clear</button></div>` : ''}
      <div class="resultbar"><span id="count"></span>
        <select id="sort" aria-label="Sort"><option value="az">A–Z</option><option value="near">Nearest to ${esc(base().name.split(',')[0])}</option><option value="score">Our score</option><option value="guide">Guide order</option></select></div>
      <div class="wlist" id="wl"></div>
    </div>`;
  $('#sort').value = F.sort;
  $('#q').addEventListener('input', e => { F.q = e.target.value; fillList(); saveUI(); });
  $('#sort').addEventListener('change', e => { F.sort = e.target.value; fillList(); saveUI(); });
  fillList();
}
function fillList() {
  const list = sorted(ALL().filter(passes));
  $('#count').textContent = `${list.length} of ${ALL().length} wineries`;
  if (!list.length) { $('#wl').innerHTML = '<div class="empty">No wineries match these filters.</div>'; return; }
  if (F.sort !== 'az') { $('#wl').innerHTML = list.map(wCard).join(''); return; }
  let last = ''; $('#wl').innerHTML = list.map(w => { const c = sortName(w).charAt(0).toUpperCase(); const L = /[A-Z]/.test(c) ? c : '#'; const head = L !== last ? `<div class="letter">${L}</div>` : ''; last = L; return head + wCard(w); }).join('');
}

/* ---------------- WINERY DETAIL ---------------- */
const DOG = { yes: ['good', 'Bravo welcome'], limited: ['mid', 'Dogs in some areas'], no: ['bad', 'No dogs'], unknown: ['mid', 'Dog policy unclear'] };
const FOOD = { kitchen: ['good', 'Kitchen on site'], trucks: ['good', 'Food trucks & snacks'], snacks: ['mid', 'Snacks & boards'], bring: ['bad', 'Bring a picnic'] };
const RES = { walkin: ['good', 'Walk-ins welcome'], recommended: ['mid', 'Reserve ahead'], required: ['bad', 'Reservation required'] };
let wxCache = {};
async function renderWinery(id) {
  const w = W(id); if (!w) { view.innerHTML = '<div class="empty" style="margin-top:20px">That winery isn’t in the guide.</div>'; setTop('Not found', { back: true }); return; }
  const s = st(id); setTop(w.n, { back: true });
  const rc = regionColor(w.region); const sc = score(id);
  const cover = s.cover ? S.photos.find(p => p.id === s.cover) : null;
  const coverURL = cover ? await fullURL(cover.id) : null;
  const sched = w.h ? schedule(w, new Date()) : null; const td = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const wineNames = (w.wines || []).concat(s.extraWines || []);
  const visits = visitsOf(id); const photos = photosOf(id);
  const d = distFromBase(w);
  const sco = s.score || {};
  const rv = s.review || {};
  const glance = [
    w.dog && DOG[w.dog] ? [DOG[w.dog][0], 'dog', DOG[w.dog][1], w.dogs] : null,
    w.foodLevel ? [FOOD[w.foodLevel][0], 'fork', FOOD[w.foodLevel][1], w.picnic === true ? 'Outside picnics allowed' : w.picnic === false ? 'No outside food' : 'Picnic policy: ask'] : null,
    w.resLevel ? [RES[w.resLevel][0], 'cal', RES[w.resLevel][1], w.adults ? 'Adults 21+ only' : ''] : null,
    ['good', 'route', `${Math.round(d)} mi · ~${fmtDrive(driveMin(d))}`, `Estimated drive from ${base().name.split(',')[0]}`]
  ].filter(Boolean);

  view.innerHTML = `
  <div class="hero" style="--rc:${rc}">
    ${coverURL ? `<img src="${coverURL}" alt="">` : `<canvas data-ridge="${esc(id)}" data-color="${rc}"></canvas>`}<div class="shade"></div>
    <div class="heroctl"><button data-act="addPhoto" data-id="${id}">${svg('image')}Photo</button><button data-act="camPhoto" data-id="${id}">${svg('camera')}Camera</button></div>
    <div class="inner"><div class="tier">${esc(regionName(w.region))}${w.tier ? ' · ' + esc(w.tier) : ''}</div><h2>${esc(w.n)}</h2><div class="town">${esc(w.town)}${/,\s*[A-Z]{2}$/.test(w.town) ? '' : ', Virginia'}${w.aka ? ' · ' + esc(w.aka) : ''}</div></div>
  </div>
  <div class="actions">
    <button class="btn vine ${isVisited(id) ? 'on' : ''}" data-act="status" data-id="${id}" data-s="visited">${svg('check')}${isVisited(id) ? 'Visited' : 'Mark visited'}</button>
    <button class="btn ${s.status === 'want' ? 'on' : ''}" data-act="status" data-id="${id}" data-s="want">${svg(s.status === 'want' ? 'heartf' : 'heart')}Want to go</button>
    <button class="btn gold ${s.fav ? 'on' : ''}" data-act="fav" data-id="${id}">${svg('star')}Favorite</button>
    <button class="btn primary" data-act="logVisit" data-id="${id}">${svg('plus')}Log a visit</button>
  </div>
  <div class="section" style="margin-top:16px">
    <div class="quick">
      <a href="${navURL(w)}" target="_blank" rel="noopener">${svg('nav')}Directions</a>
      ${w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener">${svg('globe')}Website</a>` : `<button data-act="editCustom" data-id="${id}">${svg('edit')}Edit</button>`}
      ${w.menuUrl ? `<a href="${esc(w.menuUrl)}" target="_blank" rel="noopener">${svg('fork')}Menu</a>` : w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener">${svg('fork')}Food info</a>` : `<a href="https://www.google.com/search?q=${enc(w.n + ' ' + w.town + ' VA menu')}" target="_blank" rel="noopener">${svg('fork')}Menu</a>`}
      <button data-act="addToTrip" data-id="${id}">${svg('cal')}Add to trip</button>
    </div>
  </div>
  <div class="section">
    <div class="section-head"><h3>Hours</h3>${statusChip(w)}</div>
    ${sched ? `<div class="card" style="padding:4px 14px"><table class="hours">${order.map(i => `<tr class="${i === td ? 'today' : ''}"><td>${DAYN[i]}</td><td>${sched[i].length ? fmtRange(sched[i]) : 'Closed'}</td></tr>`).join('')}</table></div>` : ''}
    <p class="small muted" style="margin:0">${esc(w.hoursText || 'No hours on file.')}</p>
  </div>
  <div class="section"><div class="glance">${glance.map(([c, i, b, t]) => `<div class="g ${c}">${svg(i)}<div><b>${esc(b)}</b><span>${esc(t || '')}</span></div></div>`).join('')}</div></div>
  ${w.status || w.why || w.mine || s.notes ? `<div class="section">
    ${w.status ? `<p class="small" style="margin:0"><span class="chip ridge">${esc(w.status)}</span></p>` : ''}
    ${w.why ? `<div class="take"><div class="who">Guide view</div><p>${esc(w.why)}</p></div>` : ''}
    ${w.mine ? `<div class="take" style="border-color:var(--gold)"><div class="who">Our assessment</div><p>${esc(w.mine)}</p></div>` : ''}
  </div>` : ''}
  <div class="section"><div class="section-head"><h3>On the map</h3><a href="https://www.google.com/maps/search/?api=1&query=${enc(placeQ(w))}" target="_blank" rel="noopener">Open in Google Maps</a></div>
    <div id="gmap">${navigator.onLine ? `<iframe class="mapframe" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${gEmbed(w)}" title="Google map of ${esc(w.n)}"></iframe>` : `<div class="mapholder">The Google map appears when you're online.<br>${Math.round(d)} miles from ${esc(base().name)}.</div>`}</div>
  </div>
  ${(w.flights || []).length || (w.experiences || []).length ? `<div class="section"><h3>Tastings & flights</h3><div class="card" style="padding:2px 14px"><ul class="plain">${(w.flights || []).map(f => `<li>${esc(f)}</li>`).join('')}${(w.experiences || []).map(f => `<li><span class="chip gold" style="margin-right:6px">Experience</span>${esc(f)}</li>`).join('')}</ul></div></div>` : ''}
  ${w.food ? `<div class="section"><div class="section-head"><h3>Food</h3>${w.menuUrl ? `<a href="${esc(w.menuUrl)}" target="_blank" rel="noopener">Current menu</a>` : ''}</div><p class="prose" style="margin:0">${esc(w.food)}</p></div>` : ''}
  ${menuSection(w)}
  <div class="section"><div class="section-head"><h3>Wines to try</h3><span class="small muted">${wineNames.filter(n => (s.wines || {})[n]?.t).length}/${wineNames.length} tasted</span></div>
    <div class="card" style="padding:2px 14px">${wineNames.map(n => wineRow(id, n)).join('') || '<p class="muted small">No wines yet.</p>'}
      <div class="row" style="padding:10px 0;flex-wrap:nowrap"><input type="text" id="newWine" placeholder="Add a wine you tasted"><button class="btn" data-act="addWine" data-id="${id}">${svg('plus')}Add</button></div></div>
    <a class="small" href="https://www.vivino.com/search/wines?q=${enc(w.n)}" target="_blank" rel="noopener">Look up ${esc(w.n)} wines on Vivino</a>
  </div>
  ${(w.features || []).length ? `<div class="section"><h3>What makes it special</h3><div class="chips">${w.features.map(f => `<span class="chip">${esc(f)}</span>`).join('')}</div></div>` : ''}
  ${w.dogs || w.res ? `<div class="section"><h3>Policies</h3><div class="card" style="padding:2px 14px"><ul class="plain">${w.dogs ? `<li><b>Dogs.</b> ${esc(w.dogs)}</li>` : ''}${w.res ? `<li><b>Reservations.</b> ${esc(w.res)}</li>` : ''}${w.url ? `<li><a href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.urlLabel || 'Official site')}</a></li>` : ''}</ul></div></div>` : ''}
  <div class="section"><h3>Weather</h3><div id="wx"><div class="mapholder" style="aspect-ratio:auto;padding:14px">Loading forecast…</div></div></div>
  <div class="section"><h3>Our scorecard</h3>
    <div class="card scorecard">
      <div class="total"><b class="mono" id="scTotal">${sc ?? '—'}</b><span class="muted small"><span id="scHint">${sc == null ? 'Move all three sliders to score it. ' : ''}</span>out of 100 · scenery ${G.rubric.scenery}% · wine ${G.rubric.wine}% · experience ${G.rubric.experience}%</span></div>
      ${['scenery', 'wine', 'experience'].map(k => `<div class="slider"><label for="sc-${k}">${k[0].toUpperCase() + k.slice(1)}</label><input type="range" min="1" max="10" step="1" id="sc-${k}" value="${sco[k] || 5}" data-sc="${k}" data-id="${id}" ${sco[k] ? '' : 'style="opacity:.45"'}><output id="o-${k}">${sco[k] || '–'}</output></div>`).join('')}
    </div></div>
  <div class="section"><div class="section-head"><h3>Our visits</h3><button class="linkbtn" data-act="logVisit" data-id="${id}">Log a visit</button></div>
    ${visits.length ? visits.map(visitCard).join('') : '<div class="empty">No visits logged yet. After you go, log the date, who came, your favorite pour, and photos.</div>'}</div>
  <div class="section"><div class="section-head"><h3>Photos</h3><span class="row"><button class="linkbtn" data-act="camPhoto" data-id="${id}">Camera</button><span class="muted">·</span><button class="linkbtn" data-act="addPhoto" data-id="${id}">From gallery</button></span></div>
    ${photos.length ? `<div class="photos">${photos.map(p => `<button data-act="viewPhoto" data-pid="${p.id}"><img src="${thumbURL(p)}" alt="${esc(p.caption)}" loading="lazy"></button>`).join('')}</div>` : '<div class="empty">Your photos from this winery will collect here.</div>'}</div>
  <div class="section"><div class="section-head"><h3>Bottles we bought</h3><button class="linkbtn" data-act="addBottle" data-id="${id}">Add bottle</button></div>
    ${(s.bottles || []).length ? `<div class="card" style="padding:2px 14px"><ul class="plain">${s.bottles.map((b, i) => `<li class="row" style="justify-content:space-between;flex-wrap:nowrap"><span>${svg('bottle', 'width="16" height="16" style="vertical-align:-3px;color:var(--claret)"')} <b>${esc(b.wine)}</b>${b.vintage ? ' ' + esc(b.vintage) : ''} <span class="muted small">× ${esc(b.qty || 1)}${b.price ? ' · $' + esc(b.price) : ''}${b.date ? ' · ' + fmtDate(b.date) : ''}</span></span><button class="iconbtn" style="width:32px;height:32px" data-act="delBottle" data-id="${id}" data-i="${i}" aria-label="Remove">${svg('x')}</button></li>`).join('')}</ul></div>` : '<div class="empty">Track what came home with you, and when to open it.</div>'}</div>
  <div class="section"><h3>Public reviews</h3>
    <div class="card">${gR(id) ? `<div class="row" style="padding-bottom:6px"><b class="mono" style="font-size:22px">${gR(id)[0]}</b><span style="color:var(--gold)">★</span><span class="small muted">Google · ${gR(id)[1].toLocaleString()} reviews · as of ${fmtDate(G.gRatings.asOf)}</span></div>` : ''}<div class="links">
      <a href="https://www.google.com/maps/search/?api=1&query=${enc(placeQ(w))}" target="_blank" rel="noopener">Google reviews <span>${svg('ext')}</span></a>
      <a href="https://www.tripadvisor.com/Search?q=${enc(w.n + ' ' + w.town)}" target="_blank" rel="noopener">Tripadvisor <span>${svg('ext')}</span></a>
      <a href="https://www.yelp.com/search?find_desc=${enc(w.n)}&find_loc=${enc(w.town + ', VA')}" target="_blank" rel="noopener">Yelp <span>${svg('ext')}</span></a>
    </div>
    <div class="stack" style="margin-top:12px">
      <span class="small muted">Save a snapshot so it's here offline:</span>
      <div class="row" style="flex-wrap:nowrap"><label class="fld" style="flex:1">Google rating<input type="number" step="0.1" min="1" max="5" id="rvR" value="${esc(rv.rating || '')}" data-rv="rating" data-id="${id}" placeholder="4.7"></label><label class="fld" style="flex:1">Reviews<input type="number" min="0" id="rvC" value="${esc(rv.count || '')}" data-rv="count" data-id="${id}" placeholder="1200"></label></div>
      <label class="fld">What reviewers say<textarea id="rvN" data-rv="notes" data-id="${id}" placeholder="Common praise and complaints">${esc(rv.notes || '')}</textarea></label>
      ${rv.asOf ? `<span class="small muted">Snapshot saved ${fmtDate(rv.asOf)}</span>` : ''}
    </div></div></div>
  <div class="section"><h3>Our notes</h3><textarea id="notes" data-notes="${id}" placeholder="Seating we liked, staff names, what to order next time…">${esc(s.notes || '')}</textarea></div>
  <div class="section"><h3>Fix the map pin</h3><div class="card stack"><span class="small muted">Standing at the tasting room? Pin it to your current GPS position for exact distances.</span>
    <div class="row"><button class="btn" data-act="pinHere" data-id="${id}">${svg('locate')}Pin to my location</button>${S.kv.coords[id] ? `<span class="small muted">Pin source: ${S.kv.coords[id][2] === 'gps' ? 'your GPS' : 'OpenStreetMap'}</span>` : ''}</div>
    ${w.custom ? `<button class="btn" data-act="delCustom" data-id="${id}">${svg('trash')}Remove this winery</button>` : ''}</div></div>`;
  paintRidges(view);
  loadWeather(w);
}
function menuSection(w) {
  const m = w.menu; const mp = S.photos.filter(p => p.wid === w.id && p.kind === 'menu').sort((a, b) => b.date - a.date);
  const ratings = st(w.id).wines || {};
  const item = (x, wine) => `<div class="mi${wine ? ' tap' : ''}" ${wine ? `data-act="wineNote" data-id="${w.id}" data-n="${esc(x.n)}" role="button" tabindex="0"` : ''}><div class="mi-h"><b>${esc(x.n)}</b><span class="mono">${wine ? esc([x.g, x.b].filter(Boolean).join(' | ')) : esc(x.p)}</span></div>${x.d ? `<div class="small muted">${esc(x.d)}</div>` : ''}${wine && ratings[x.n] && ratings[x.n].s ? `<div class="small" style="color:var(--gold)">${'★'.repeat(ratings[x.n].s)}${ratings[x.n].note ? ` <span class="muted">· ${esc(ratings[x.n].note)}</span>` : ''}</div>` : ''}</div>`;
  const block = (secs, wine) => secs.map(sc => `<div class="mi-sec">${esc(sc.sec)}</div>${sc.items.map(x => item(x, wine)).join('')}`).join('');
  return `<div class="section"><div class="section-head"><h3>Menu</h3><button class="linkbtn" data-act="menuPhoto" data-id="${w.id}">Add menu photo</button></div>
    ${m ? `<span class="small muted">${esc(m.source || 'Menu')}${m.asOf ? ' · ' + fmtDate(m.asOf) : ''}</span>
      ${m.food ? `<details class="card menu" data-mk="${w.id}:food" ${openMem[w.id + ':food'] === false ? '' : 'open'}><summary>Food${m.food.reduce((n, sc) => n + sc.items.length, 0) ? ` · ${m.food.reduce((n, sc) => n + sc.items.length, 0)} items` : ''}</summary>${block(m.food, false)}</details>` : ''}
      ${m.wine ? `<details class="card menu" data-mk="${w.id}:wine" ${openMem[w.id + ':wine'] ? 'open' : ''}><summary>Wine list · ${m.wine.reduce((n, sc) => n + sc.items.length, 0)} wines <span class="small muted">· ${m.wine.some(sc => sc.items.some(x => x.g || x.b)) ? 'glass | bottle · ' : ''}tap to rate</span></summary>${block(m.wine, true)}</details>` : ''}
      ${m.note ? `<span class="small muted">${esc(m.note)}</span>` : ''}` : ''}
    ${mp.length ? `<div class="strip">${mp.map(p => `<img src="${thumbURL(p)}" alt="Menu photo" data-act="viewPhoto" data-pid="${p.id}">`).join('')}</div>` : m ? '' : '<div class="empty">No menu yet. Photograph the menu on your visit, then send the photos to Claude to have it typed into the guide.</div>'}
  </div>`;
}
function wineRow(id, n) {
  const x = (st(id).wines || {})[n] || {};
  return `<div class="wine"><input type="checkbox" class="check" ${x.t ? 'checked' : ''} data-wine-t="${esc(n)}" data-id="${id}" aria-label="Tasted ${esc(n)}">
    <button class="wn linkbtn" style="color:var(--ink);text-align:left" data-act="wineNote" data-id="${id}" data-n="${esc(n)}">${esc(n)}${x.v ? ` <span class="muted mono small">${esc(x.v)}</span>` : ''}</button>
    ${starsHTML(x.s, 'wineStar', `data-id="${id}" data-n="${esc(n)}"`)}
    ${x.note ? `<div class="wnote">${esc(x.note)}</div>` : ''}</div>`;
}
function visitCard(v) {
  const w = W(v.wid); const d = v.date ? fromISO(v.date) : null; const ph = S.photos.filter(p => p.visitId === v.id);
  return `<div class="card visit"><div class="date">${d ? `<b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}</span>` : '<b>?</b><span>date</span>'}</div>
    <div class="vbody"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><a href="#w-${v.wid}" style="font:17px var(--f-display);text-decoration:none;color:var(--ink)">${esc(w ? w.n : 'Winery')}</a>
      <button class="iconbtn" style="width:32px;height:32px" data-act="editVisit" data-vid="${v.id}" aria-label="Edit visit">${svg('edit')}</button></div>
      ${v.who || (Sync.enabled && v._cb) ? `<span class="small muted">${v.who ? 'With ' + esc(v.who) : ''}${v.who && Sync.enabled && v._cb ? ' · ' : ''}${Sync.enabled && v._cb ? 'Logged by ' + esc(v._cb) : ''}</span>` : ''}
      ${v.fav ? `<span class="small"><b style="color:var(--claret)">Favorite pour:</b> ${esc(v.fav)}</span>` : ''}
      ${v.notes ? `<p>${esc(v.notes)}</p>` : ''}
      ${ph.length ? `<div class="strip">${ph.map(p => `<img src="${thumbURL(p)}" alt="" data-act="viewPhoto" data-pid="${p.id}">`).join('')}</div>` : ''}</div></div>`;
}
const WX = c => (c === 0 ? ['☀️', 'Clear'] : c <= 2 ? ['🌤️', 'Partly cloudy'] : c === 3 ? ['☁️', 'Cloudy'] : c <= 48 ? ['🌫️', 'Fog'] : c <= 57 ? ['🌦️', 'Drizzle'] : c <= 67 ? ['🌧️', 'Rain'] : c <= 77 ? ['❄️', 'Snow'] : c <= 82 ? ['🌧️', 'Showers'] : c <= 86 ? ['🌨️', 'Snow showers'] : ['⛈️', 'Storms']);
async function loadWeather(w) {
  const box = $('#wx'); if (!box) return;
  const [la, lo] = pos(w); const key = la.toFixed(2) + lo.toFixed(2);
  try {
    if (!wxCache[key]) {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=5`);
      wxCache[key] = await r.json();
    }
    const dly = wxCache[key].daily; if (!$('#wx')) return;
    $('#wx').innerHTML = `<div class="weather">${dly.time.map((t, i) => { const [ic, lbl] = WX(dly.weather_code[i]); const d = fromISO(t); const open = w.h ? hoursOn(w, d).length > 0 : null; return `<div title="${lbl}"><span class="small muted">${i === 0 ? 'Today' : DAYS3[d.getDay()]}</span><div class="ic">${ic}</div><b>${Math.round(dly.temperature_2m_max[i])}°/${Math.round(dly.temperature_2m_min[i])}°</b><span class="small muted">${dly.precipitation_probability_max[i] ?? 0}% rain</span>${open === null ? '' : `<div class="small" style="color:var(${open ? '--vine' : '--muted'});font-weight:600">${open ? 'Open' : 'Closed'}</div>`}</div>`; }).join('')}</div>`;
  } catch (e) { box.innerHTML = '<div class="empty">Forecast needs a connection.</div>'; }
}

/* ---------------- sheets: visit, wine, bottle, trip pick ---------------- */
function visitSheet(wid, vid) {
  const v = vid ? S.visits.find(x => x.id === vid) : { date: todayISO(), who: '', fav: '', notes: '' };
  const w = W(wid || v.wid); let pending = [];
  const el = openSheet(`<h2>${vid ? 'Edit visit' : 'Log a visit'}</h2><p class="muted small" style="margin:-8px 0 14px">${esc(w.n)}</p>
    <form class="stack" id="vf">
      <label class="fld">Date<input type="date" id="vDate" value="${esc(v.date || '')}" required></label>
      <label class="fld">Who came along<input type="text" id="vWho" value="${esc(v.who || '')}" placeholder="e.g. the two of us and Bravo"></label>
      <label class="fld">Favorite pour<input type="text" id="vFav" value="${esc(v.fav || '')}" placeholder="Wine and vintage"></label>
      <label class="fld">Notes<textarea id="vNotes" placeholder="Where we sat, what we ate, the view, the staff…">${esc(v.notes || '')}</textarea></label>
      <div class="row"><button type="button" class="btn" id="vCam">${svg('camera')}Camera</button><button type="button" class="btn" id="vGal">${svg('image')}Gallery</button><span class="small muted" id="vPh">${vid ? S.photos.filter(p => p.visitId === vid).length + ' photos attached' : ''}</span></div>
      <div class="foot">${vid ? `<button type="button" class="btn" id="vDel">${svg('trash')}Delete</button>` : '<button type="button" class="btn" id="vCancel">Cancel</button>'}<button type="submit" class="btn primary">${svg('check')}Save visit</button></div>
    </form>`);
  const pickInto = cam => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (cam) inp.capture = 'environment'; else inp.multiple = true; inp.onchange = () => { pending.push(...inp.files); $('#vPh', el).textContent = `${pending.length} new photo${pending.length > 1 ? 's' : ''} ready`; }; inp.click(); };
  $('#vCam', el).onclick = () => pickInto(true); $('#vGal', el).onclick = () => pickInto(false);
  if ($('#vCancel', el)) $('#vCancel', el).onclick = closeSheet;
  if ($('#vDel', el)) $('#vDel', el).onclick = async () => { if (await confirmSheet('Delete this visit?', 'The visit entry is removed; its photos stay in the winery gallery.')) { await DB.del('visits', vid); S.visits = S.visits.filter(x => x.id !== vid); S.photos.filter(p => p.visitId === vid).forEach(async p => { p.visitId = null; await DB.put('photos', p); }); route(); } };
  $('#vf', el).addEventListener('submit', async e => {
    e.preventDefault();
    const rec = Object.assign({}, v, { id: vid || uid('v'), wid: w.id, date: $('#vDate', el).value, who: $('#vWho', el).value.trim(), fav: $('#vFav', el).value.trim(), notes: $('#vNotes', el).value.trim() });
    await DB.put('visits', rec); S.visits = S.visits.filter(x => x.id !== rec.id).concat(rec);
    if (st(w.id).status !== 'visited') await setSt(w.id, { status: 'visited' });
    if (pending.length) { toast('Saving photos…'); await addPhotos(pending, w.id, rec.id); }
    toast('Visit saved'); route(); checkBadges();
  });
}
function wineSheet(id, n) {
  const x = (st(id).wines || {})[n] || {};
  const el = openSheet(`<h2>${esc(n)}</h2><form class="stack" id="wf">
    <div>${starsHTML(x.s, 'sheetStar', '', true)}</div>
    <label class="fld">Vintage<input type="text" id="wV" value="${esc(x.v || '')}" placeholder="2022" inputmode="numeric"></label>
    <label class="fld">Tasting note<textarea id="wN" placeholder="Nose, palate, would we buy it?">${esc(x.note || '')}</textarea></label>
    <a class="small" href="https://www.vivino.com/search/wines?q=${enc(W(id).n + ' ' + n)}" target="_blank" rel="noopener">Find this wine on Vivino</a>
    <div class="foot">${(st(id).extraWines || []).includes(n) ? `<button type="button" class="btn" id="wDel">${svg('trash')}Remove</button>` : ''}<button type="submit" class="btn primary">Save</button></div></form>`);
  let stars = x.s || 0;
  el.addEventListener('click', e => { const b = e.target.closest('[data-act="sheetStar"]'); if (!b) return; e.stopPropagation(); stars = +b.dataset.v === stars ? 0 : +b.dataset.v; $$('.stars button', el).forEach((s, i) => s.classList.toggle('on', i < stars)); });
  if ($('#wDel', el)) $('#wDel', el).onclick = async () => { const s = st(id); const wines = Object.assign({}, s.wines); delete wines[n]; await setSt(id, { wines, extraWines: (s.extraWines || []).filter(z => z !== n) }); route(); };
  $('#wf', el).addEventListener('submit', async e => { e.preventDefault(); await saveWine(id, n, { s: stars, v: $('#wV', el).value.trim(), note: $('#wN', el).value.trim(), t: true }); route(); });
}
async function saveWine(id, n, patch) { const s = st(id); const wines = Object.assign({}, s.wines); wines[n] = Object.assign({}, wines[n], patch); const extra = s.extraWines || []; const listed = (W(id).wines || []).concat(extra).includes(n); await setSt(id, listed ? { wines } : { wines, extraWines: extra.concat(n) }); }
function bottleSheet(id) {
  const el = openSheet(`<h2>Add a bottle</h2><form class="stack" id="bf">
    <label class="fld">Wine<input type="text" id="bW" list="bwl" required placeholder="Cabernet Franc Reserve"><datalist id="bwl">${(W(id).wines || []).concat(st(id).extraWines || []).map(n => `<option value="${esc(n)}">`).join('')}</datalist></label>
    <div class="row" style="flex-wrap:nowrap"><label class="fld" style="flex:1">Vintage<input type="text" id="bV" inputmode="numeric"></label><label class="fld" style="flex:1">Qty<input type="number" id="bQ" value="1" min="1"></label><label class="fld" style="flex:1">Price $<input type="number" id="bP" step="0.01"></label></div>
    <label class="fld">Date<input type="date" id="bD" value="${todayISO()}"></label>
    <div class="foot"><button type="button" class="btn" onclick="closeSheet()">Cancel</button><button type="submit" class="btn primary">Add bottle</button></div></form>`);
  $('#bf', el).addEventListener('submit', async e => { e.preventDefault(); const b = { wine: $('#bW', el).value.trim(), vintage: $('#bV', el).value.trim(), qty: +$('#bQ', el).value || 1, price: $('#bP', el).value, date: $('#bD', el).value }; await setSt(id, { bottles: (st(id).bottles || []).concat(b) }); toast('Bottle added'); route(); });
}
function tripPickSheet(wid) {
  const today = todayISO(); const trips = S.trips.filter(t => t.end >= today).sort((a, b) => a.start.localeCompare(b.start)); const w = W(wid);
  const el = openSheet(`<h2>Add to a trip</h2><p class="muted small" style="margin:-8px 0 12px">${esc(w.n)}</p>
    ${trips.length ? trips.map(t => `<div class="card stack" style="margin-bottom:10px"><b>${esc(t.name)}</b>${Object.keys(t.days).sort().map(d => { const hrs = hoursOn(w, fromISO(d)); const already = t.days[d].includes(wid); return `<div class="sugg"><span>${fmtDate(d, true).replace(/, \d{4}$/, '')}<br><span class="small ${hrs && hrs.length ? '' : 'muted'}">${hrs ? (hrs.length ? fmtRange(hrs) : 'Closed that day') : 'Hours vary'}${holiday(fromISO(d)) ? ' · ' + holiday(fromISO(d)) : ''}</span></span><button class="btn ${already ? 'on' : ''}" data-x="${t.id}|${d}" ${already ? 'disabled' : ''}>${already ? 'Added' : 'Add'}</button></div>`; }).join('')}</div>`).join('') : '<div class="empty">No upcoming trips. Create one in the Plan tab.</div>'}
    <div class="foot"><button class="btn" data-x="new">New trip</button><button class="btn primary" data-x="close">Done</button></div>`);
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-x]'); if (!b) return; const x = b.dataset.x;
    if (x === 'close') return closeSheet(); if (x === 'new') { closeSheet(); return tripSheet(); }
    const [tid, d] = x.split('|'); const t = S.trips.find(z => z.id === tid); t.days[d].push(wid); await DB.put('trips', t); b.textContent = 'Added'; b.disabled = true; b.classList.add('on'); toast(`Added to ${fmtDate(d).replace(/, \d{4}$/, '')}`);
  });
}

/* ---------------- MAP ---------------- */
const MF = { mode: 'guide', on: new Set(), view: null };
function pinColor(w) { const s = st(w.id); if (isVisited(w.id)) return 'var(--vine)'; if (s.status === 'want') return 'var(--claret)'; return regionColor(w.region); }
function renderMap() {
  setTop('Map');
  view.innerHTML = `<div class="mapwrap" id="mw">
    ${MF.mode === 'guide' ? '<div id="leaf"></div>' : googleTab()}
    <div class="mapctl">
      <div class="seg"><button class="${MF.mode === 'guide' ? 'on' : ''}" data-act="mapMode" data-m="guide">Guide map</button><button class="${MF.mode === 'google' ? 'on' : ''}" data-act="mapMode" data-m="google">Google Maps</button></div>
      ${MF.mode === 'guide' ? `<div class="scroller">${[['want', 'Want to go', 'heart'], ['visited', 'Visited', 'check'], ['unvisited', 'Not visited', 'mountain'], ['dog', 'Bravo welcome', 'dog'], ['open', 'Open now', 'clock']].map(([k, l, i]) => `<button class="fchip ${MF.on.has(k) ? 'on' : ''}" data-act="mapF" data-f="${k}">${svg(i)}${l}</button>`).join('')}</div>` : ''}
    </div>
    ${MF.mode === 'guide' ? `<button class="locbtn" data-act="locate" aria-label="Show my location">${svg('locate')}</button><div class="peek" id="peek" hidden></div>` : ''}
  </div>`;
  if (MF.mode === 'guide') initLeaflet();
}
function googleTab() {
  const link = (S.kv.settings.myMaps || '').trim(); const mid = link.match(/mid=([\w-]+)/); const b = base();
  if (!navigator.onLine) return '<div class="mapholder" style="position:absolute;inset:0;aspect-ratio:auto;border-radius:0">Google Maps needs a connection. The Guide map works offline.</div>';
  const src = mid ? `https://www.google.com/maps/d/embed?mid=${mid[1]}` : `https://maps.google.com/maps?q=${enc('wineries near ' + b.name)}&ll=${b.lat},${b.lng}&z=9&output=embed`;
  const listBtn = link && !mid ? `<a class="btn primary" href="${esc(link)}" target="_blank" rel="noopener">${svg('ext')}Open our list in Google Maps</a>` : '';
  return `<iframe src="${src}" title="Google Maps" allowfullscreen loading="lazy"></iframe><div class="gmnote stack" style="gap:8px">${mid ? 'Our Google My Maps map.' : `Google's live map of wineries around ${esc(b.name.split(',')[0])}. Our saved list opens in the Google Maps app, where you see its pins, ratings and photos.`}${listBtn ? `<div>${listBtn}</div>` : '<div class="small muted">Add your saved-list link in <a href="#prefs">Settings</a>.</div>'}</div>`;
}
function initLeaflet() {
  if (typeof L === 'undefined') { $('#leaf').innerHTML = '<div class="mapholder" style="height:100%">Map library failed to load.</div>'; return; }
  const dark = document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  mapInst = L.map('leaf', { zoomControl: false, attributionControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(mapInst);
  $('#leaf').classList.toggle('darktiles', dark);
  const b = base();
  L.marker([b.lat, b.lng], { icon: L.divIcon({ className: '', html: `<div class="pin base"><i>${svg('mountain', 'width="14" height="14" style="color:#fff"')}</i></div>`, iconSize: [26, 26], iconAnchor: [13, 13] }), title: b.name, zIndexOffset: -100 }).addTo(mapInst).bindTooltip(`Base: ${b.name}`);
  const shown = ALL().filter(w => [...MF.on].every(f => (f === 'want' ? st(w.id).status === 'want' : f === 'visited' ? isVisited(w.id) : f === 'unvisited' ? !isVisited(w.id) : f === 'dog' ? w.dog === 'yes' : f === 'open' ? openStatus(w).code === 'open' : true)));
  const pts = [];
  shown.forEach(w => {
    const p = pos(w); pts.push(p); const glyph = isVisited(w.id) ? '✓' : st(w.id).status === 'want' ? '♥' : '';
    L.marker(p, { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${pinColor(w)}"><i>${glyph}</i></div>`, iconSize: [26, 26], iconAnchor: [13, 26] }), title: w.n }).addTo(mapInst).on('click', () => peek(w));
  });
  if (MF.view) mapInst.setView(MF.view.c, MF.view.z);
  else if (pts.length) mapInst.fitBounds(L.latLngBounds(pts).pad(0.12)); else mapInst.setView([b.lat, b.lng], 9);
  mapInst.on('moveend', () => { const c = mapInst.getCenter(); MF.view = { c: { lat: c.lat, lng: c.lng }, z: mapInst.getZoom() }; saveUI(); });
  mapInst.on('click', () => { const pk = $('#peek'); if (pk) pk.hidden = true; MF.peek = null; saveUI(); });
  if (MF.peek && W(MF.peek)) peek(W(MF.peek));
}
function peek(w) {
  MF.peek = w.id; saveUI();
  const pk = $('#peek'); const d = distFromBase(w);
  pk.innerHTML = `<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div style="min-width:0"><div style="font:18px var(--f-display)">${esc(w.n)}</div><div class="small muted">${esc(w.town)} · ${Math.round(d)} mi · ~${fmtDrive(driveMin(d))}</div></div><button class="iconbtn" data-act="closePeek" aria-label="Close">${svg('x')}</button></div>
    <div class="row">${statusChip(w)}${wIcons(w)}</div>
    <div class="row" style="flex-wrap:nowrap"><a class="btn primary block" href="#w-${w.id}">Open guide</a><a class="btn block" href="${navURL(w)}" target="_blank" rel="noopener">${svg('nav')}Directions</a></div>`;
  pk.hidden = false;
}

/* ---------------- JOURNAL ---------------- */
let jTab = 'timeline';
function renderJournal() {
  setTop('Journal');
  const tabs = [['timeline', 'Timeline'], ['passport', 'Passport'], ['rank', 'Rankings'], ['cellar', 'Cellar']];
  let body = '';
  if (jTab === 'timeline') {
    const vs = [...S.visits].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const byYear = {}; vs.forEach(v => { const y = (v.date || '????').slice(0, 4); (byYear[y] = byYear[y] || []).push(v); });
    body = vs.length ? Object.keys(byYear).sort().reverse().map(y => `<div class="section"><h3>${y}</h3>${byYear[y].map(visitCard).join('')}</div>`).join('') : '<div class="empty" style="margin-top:16px">No visits yet. Open a winery and tap “Log a visit”.</div>';
    const loose = S.photos.filter(p => !p.visitId).sort((a, b) => b.date - a.date);
    if (loose.length) body += `<div class="section"><h3>Other photos</h3><div class="photos">${loose.map(p => `<button data-act="viewPhoto" data-pid="${p.id}"><img src="${thumbURL(p)}" alt="" loading="lazy"></button>`).join('')}</div></div>`;
  } else if (jTab === 'passport') {
    body = renderPassport();
  } else if (jTab === 'rank') {
    const scored = ALL().map(w => ({ w, sc: score(w.id) })).filter(x => x.sc != null).sort((a, b) => b.sc - a.sc);
    const wines = []; Object.entries(S.state).forEach(([id, s]) => Object.entries(s.wines || {}).forEach(([n, x]) => { if (x.s) wines.push({ id, n, ...x }); }));
    wines.sort((a, b) => b.s - a.s);
    body = `<div class="section"><h3>Our winery leaderboard</h3>${scored.length ? scored.map((x, i) => `<a class="rankrow" href="#w-${x.w.id}"><span class="n">${i + 1}</span><span><b>${esc(x.w.n)}</b><div class="bar"><i style="width:${x.sc}%"></i></div></span><span class="score" style="font-size:16px">${x.sc}</span></a>`).join('') : '<div class="empty">Score a winery on its page (scenery, wine, experience) to build the leaderboard.</div>'}</div>
      <div class="section"><h3>Best wines we've tasted</h3>${wines.length ? wines.slice(0, 25).map(x => `<a class="rankrow" href="#w-${x.id}"><span class="n" style="color:var(--gold);font-size:15px">${x.s}★</span><span><b>${esc(x.n)}</b>${x.v ? ' <span class="mono small muted">' + esc(x.v) + '</span>' : ''}<div class="small muted">${esc(W(x.id)?.n || '')}</div></span><span></span></a>`).join('') : '<div class="empty">Rate wines on a winery page and they rank here.</div>'}</div>`;
  } else {
    const rows = []; Object.entries(S.state).forEach(([id, s]) => (s.bottles || []).forEach(b => rows.push({ id, ...b })));
    rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const total = rows.reduce((n, b) => n + (+b.qty || 1), 0); const spend = rows.reduce((n, b) => n + (+b.price || 0) * (+b.qty || 1), 0);
    body = `<div class="section"><div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><b class="mono">${total}</b><span>Bottles brought home</span></div><div class="stat"><b class="mono">$${spend.toFixed(0)}</b><span>Spent</span></div></div></div>
      <div class="section">${rows.length ? `<div class="card" style="padding:2px 14px"><ul class="plain">${rows.map(b => `<li><b>${esc(b.wine)}</b>${b.vintage ? ' ' + esc(b.vintage) : ''} <span class="muted small">× ${esc(b.qty || 1)}</span><div class="small muted"><a href="#w-${b.id}">${esc(W(b.id)?.n || '')}</a>${b.date ? ' · ' + fmtDate(b.date) : ''}${b.price ? ' · $' + esc(b.price) : ''}</div></li>`).join('')}</ul></div>` : '<div class="empty">Add bottles from a winery page.</div>'}</div>`;
  }
  view.innerHTML = `<div class="seg sticky" style="margin-top:8px">${tabs.map(([k, l]) => `<button class="${jTab === k ? 'on' : ''}" data-act="jtab" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}

/* ---------------- passport stamps & region badges ---------------- */
const BADGES = {
  shen:   { name: 'Gateway Keeper', blurb: 'Every Shenandoah Gateway & Fauquier winery stamped' },
  loud:   { name: 'Loudoun Explorer', blurb: 'Every Loudoun Valley winery stamped' },
  hunt:   { name: 'Hunt Country Rider', blurb: 'Every Middleburg & Hunt Country winery stamped' },
  r231:   { name: 'Route 231 Rambler', blurb: 'Every Madison, Culpeper & Route 231 winery stamped' },
  cville: { name: 'Monticello Master', blurb: 'Every Charlottesville & Monticello winery stamped' },
  valley: { name: 'Valley Voyager', blurb: 'Every Shenandoah Valley winery stamped' },
  ridge:  { name: 'Parkway Summiteer', blurb: 'Every Blue Ridge Parkway & Amherst winery stamped' },
  md:     { name: 'Sugarloaf Sojourner', blurb: 'Our Maryland outpost stamped' },
  all:    { name: 'Grand Cru Passport', blurb: 'Every winery in the guide stamped' }
};
const shortName = n => n.replace(/ (Vineyards?|Winery|Cellars|Estate Winery|Farm & Vineyards?|Vineyard & Winery|Vineyards & Winery|Family Wine|Wines)\b.*$/, '').replace(/^The Winery at /, '');
function badgeProgress() {
  const all = ALL(); const out = {};
  for (const r of Object.keys(G.regions)) { const ws = all.filter(w => w.region === r); if (!ws.length) continue; out[r] = { got: ws.filter(w => isVisited(w.id)).length, total: ws.length, color: regionColor(r), label: G.regions[r].short }; }
  out.all = { got: all.filter(w => isVisited(w.id)).length, total: all.length, color: 'var(--gold)', label: 'All Virginia' };
  Object.values(out).forEach(b => (b.earned = b.got >= b.total));
  return out;
}
function firstStampDate(id) { const v = visitsOf(id).filter(x => x.date).slice(-1)[0]; return v ? v.date : null; }
const INK_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${[1, 2, 3].map(i => `
  <filter id="ink${i}" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="${0.07 + i * 0.02}" numOctaves="4" seed="${i * 7}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -6 4.1" result="speckle"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${i * 3}" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="rough"/>
    <feComposite in="rough" in2="speckle" operator="in"/>
  </filter>`).join('')}</defs></svg>`;
function stampSVG(w) {
  const id = w.id.replace(/[^a-z0-9]/gi, ''); const h = hash(w.id); const nm = shortName(w.n).toUpperCase();
  const fs = Math.max(11, Math.min(19, 250 / Math.max(6, nm.length)));
  const d = firstStampDate(w.id); const band = d ? (() => { const x = fromISO(d); return `${String(x.getDate()).padStart(2, '0')} ${MONTHS[x.getMonth()].toUpperCase()} ${x.getFullYear()}`; })() : 'VISITED';
  const bottom = `${w.town.toUpperCase()} · ${(G.regions[w.region] || {}).short ? G.regions[w.region].short.toUpperCase() : 'VIRGINIA'}`;
  const fsB = Math.max(9, Math.min(12.5, 200 / Math.max(10, bottom.length)));
  return `<svg viewBox="0 0 200 200" class="stampsvg" role="img" aria-label="${esc(w.n)} stamp${d ? ', ' + band : ''}">
    <defs><path id="t${id}" d="M 27,100 A 73,73 0 0 1 173,100"/><path id="b${id}" d="M 33,100 A 67,67 0 0 0 167,100"/></defs>
    <g filter="url(#ink${(h % 3) + 1})" fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="94" stroke-width="6"/><circle cx="100" cy="100" r="86" stroke-width="1.6"/><circle cx="100" cy="100" r="56" stroke-width="2"/>
      <g fill="currentColor" stroke="none">
        <text font-family="Young Serif, Georgia, serif" font-size="${fs}" letter-spacing="1.5"><textPath href="#t${id}" startOffset="50%" text-anchor="middle">${esc(nm)}</textPath></text>
        <text font-family="IBM Plex Mono, monospace" font-size="${fsB}" font-weight="500" letter-spacing="1.2"><textPath href="#b${id}" startOffset="50%" text-anchor="middle">${esc(bottom)}</textPath></text>
        <circle cx="31" cy="100" r="3"/><circle cx="169" cy="100" r="3"/>
        <path d="M91 62h18l-1.3 11.5a7.7 7.7 0 0 1-15.4 0z"/><rect x="99" y="80" width="2.2" height="9"/><rect x="93.5" y="88.5" width="13" height="2.4" rx="1.2"/>
        <rect x="40" y="94" width="120" height="22" rx="2"/>
        <text x="100" y="110" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="${band === 'VISITED' ? 14 : 13}" font-weight="700" letter-spacing="1.5" fill="var(--stamp-paper)">${band}</text>
        <path d="M78 132l6-10 4 6 3-4 6 8z M103 132l6-10 4 6 3-4 6 8z" opacity=".9"/>
      </g>
    </g></svg>`;
}
function sealPoints(n, R, r, cx = 60, cy = 60) { const pts = []; for (let i = 0; i < n * 2; i++) { const a = (Math.PI * i) / n - Math.PI / 2; const rad = i % 2 ? r : R; pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`); } return pts.join(' '); }
function badgeSVG(key, b, big) {
  const info = BADGES[key] || { name: b.label }; const id = 'bd' + key + (big ? 'L' : '');
  if (!b.earned) {
    const frac = b.got / b.total; const C = 2 * Math.PI * 46;
    return `<svg viewBox="0 0 120 120" class="badgesvg locked" role="img" aria-label="${esc(info.name)}: ${b.got} of ${b.total}">
      <circle cx="60" cy="60" r="46" fill="var(--sunk)" stroke="var(--line)" stroke-width="7"/>
      <circle cx="60" cy="60" r="46" fill="none" stroke="${b.color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)"/>
      <text x="60" y="58" text-anchor="middle" font-family="Young Serif, Georgia, serif" font-size="22" fill="var(--ink)">${b.got}/${b.total}</text>
      <text x="60" y="76" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" fill="var(--muted)" letter-spacing="1">${esc(b.label.toUpperCase())}</text></svg>`;
  }
  return `<svg viewBox="0 0 120 120" class="badgesvg" role="img" aria-label="Badge earned: ${esc(info.name)}">
    <defs><path id="${id}" d="M 33,62 A 27,27 0 0 1 87,62"/></defs>
    <polygon points="${sealPoints(16, 58, 51)}" fill="${b.color}"/>
    <circle cx="60" cy="60" r="44" fill="none" stroke="var(--stamp-paper)" stroke-width="1.5" stroke-dasharray="2 3"/>
    <circle cx="60" cy="60" r="38" fill="var(--stamp-paper)"/>
    <text font-family="IBM Plex Mono, monospace" font-size="8.5" font-weight="700" letter-spacing="1.3" fill="${b.color}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(b.label.toUpperCase())}</textPath></text>
    <path d="M53 52h14l-1 8.5a6 6 0 0 1-12 0z M59 66h2v6h-2z M55 71.5h10v2H55z" fill="${b.color}"/>
    <text x="60" y="88" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="8.5" font-weight="700" fill="${b.color}" letter-spacing="1">${b.total}/${b.total} ★</text></svg>`;
}
function renderPassport() {
  const all = ALL(); const prog = badgeProgress(); const got = all.filter(w => isVisited(w.id));
  const seen = new Set(S.kv.stampSeen || []); const fresh = new Set(got.map(w => w.id).filter(id => !seen.has(id) && S.kv.stampSeen));
  const earnedN = Object.entries(prog).filter(([, b]) => b.earned).length;
  const order = Object.keys(G.regions).filter(r => prog[r]);
  const html = `${INK_DEFS}
    <div class="section"><div class="section-head"><h3>Badges</h3><span class="small muted">${earnedN} of ${Object.keys(prog).length} earned</span></div>
      <div class="badges">${['all', ...order].map(k => `<button class="badge ${prog[k].earned ? 'earned' : ''}" data-act="badgeInfo" data-k="${k}">${badgeSVG(k, prog[k])}<span>${esc((BADGES[k] || {}).name || prog[k].label)}</span></button>`).join('')}</div></div>
    <p class="muted small" style="margin:18px 0 0">${got.length} of ${all.length} stamps collected. Stamp every winery in an area to earn its badge.</p>
    ${order.map(r => { const ws = all.filter(w => w.region === r).sort((a, b) => (isVisited(b.id) - isVisited(a.id)) || shortName(a.n).localeCompare(shortName(b.n))); return `
      <div class="section"><div class="section-head"><h3 style="color:${prog[r].color}">${esc(G.regions[r].name)}</h3><span class="small mono ${prog[r].earned ? '' : 'muted'}" style="${prog[r].earned ? 'color:' + prog[r].color + ';font-weight:600' : ''}">${prog[r].got}/${prog[r].total}${prog[r].earned ? ' ★' : ''}</span></div>
        <div class="passport">${ws.map(w => isVisited(w.id)
          ? `<a href="#w-${w.id}" class="stamp got${fresh.has(w.id) ? ' fresh' : ''}" style="--rc:${regionColor(w.region)};--rot:${(hash(w.id) % 28) - 14}deg;--dx:${(hash(w.id + 'x') % 7) - 3}px;--dy:${(hash(w.id + 'y') % 7) - 3}px">${stampSVG(w)}</a>`
          : `<a href="#w-${w.id}" class="stamp"><b>${esc(shortName(w.n))}</b><span class="d">${esc(w.town)}</span></a>`).join('')}</div></div>`; }).join('')}`;
  S.kv.stampSeen = got.map(w => w.id); saveKV('stampSeen');
  return html;
}
async function checkBadges() {
  const prog = badgeProgress(); const now = Object.keys(prog).filter(k => prog[k].earned);
  if (!S.kv.badges) { S.kv.badges = now; await saveKV('badges'); return; }
  const fresh = now.filter(k => !S.kv.badges.includes(k));
  S.kv.badges = now; await saveKV('badges');
  if (fresh.length) setTimeout(() => { $$('.toast').forEach(t => t.remove()); badgeSheet(fresh[0], prog, true); }, 450);
}
function badgeSheet(k, prog = badgeProgress(), celebrate) {
  const b = prog[k]; const info = BADGES[k] || { name: b.label, blurb: '' };
  const ws = (k === 'all' ? ALL() : ALL().filter(w => w.region === k));
  const left = ws.filter(w => !isVisited(w.id));
  openSheet(`<div class="badgesheet${celebrate ? ' celebrate' : ''}">${badgeSVG(k, b, true)}
    ${celebrate ? '<div class="eyebrow">Badge earned</div>' : ''}<h2>${esc(info.name)}</h2>
    <p class="muted" style="margin:0">${b.earned ? esc(info.blurb) + '.' : `${b.got} of ${b.total} stamped. ${left.length} to go:`}</p>
    ${!b.earned ? `<div class="chips" style="justify-content:center">${left.slice(0, 14).map(w => `<a class="chip" href="#w-${w.id}" style="text-decoration:none">${esc(shortName(w.n))}</a>`).join('')}${left.length > 14 ? `<span class="chip">+${left.length - 14} more</span>` : ''}</div>` : ''}
    <div class="foot"><button class="btn primary" onclick="closeSheet()">${celebrate ? 'Cheers!' : 'Close'}</button></div></div>`);
}

/* ---------------- PLAN ---------------- */
function renderPlan() {
  setTop('Plan', { actions: `<button class="iconbtn" data-act="newTrip" aria-label="New trip">${svg('plus')}</button>` });
  const today = todayISO(); const up = S.trips.filter(t => t.end >= today).sort((a, b) => a.start.localeCompare(b.start)); const past = S.trips.filter(t => t.end < today).sort((a, b) => b.start.localeCompare(a.start));
  const card = t => { const n = Object.values(t.days).flat().length; return `<a class="card stack" href="#trip-${t.id}" style="text-decoration:none;color:inherit;gap:4px"><span style="font:19px var(--f-display)">${esc(t.name)}</span><span class="small muted">${fmtDate(t.start)} – ${fmtDate(t.end)} · from ${esc(t.base.name)}</span><span class="small">${n} stop${n === 1 ? '' : 's'} across ${Object.keys(t.days).length} days</span></a>`; };
  view.innerHTML = `<div class="section" style="margin-top:8px"><h3>Upcoming</h3>${up.length ? up.map(card).join('') : '<div class="empty">No upcoming trips.</div>'}<button class="btn primary block" data-act="newTrip">${svg('plus')}New trip</button></div>
    ${past.length ? `<div class="section"><h3>Past trips</h3>${past.map(card).join('')}</div>` : ''}
    <div class="section"><h3>How planning works</h3><p class="small muted prose" style="margin:0">Each day shows who's open on that weekday (seasonal hours included), estimated drives from your base, and a Google route you can open for turn-by-turn navigation. Holidays are flagged because published hours often don't apply.</p></div>`;
}
function tripSheet(tid) {
  const t = tid ? S.trips.find(x => x.id === tid) : { name: '', start: todayISO(), end: todayISO(), base: { ...base() }, notes: '' };
  const el = openSheet(`<h2>${tid ? 'Edit trip' : 'New trip'}</h2><form class="stack" id="tf">
    <label class="fld">Name<input type="text" id="tN" value="${esc(t.name)}" required placeholder="Loudoun weekend"></label>
    <div class="row" style="flex-wrap:nowrap"><label class="fld" style="flex:1">First day<input type="date" id="tS" value="${t.start}" required></label><label class="fld" style="flex:1">Last day<input type="date" id="tE" value="${t.end}" required></label></div>
    <label class="fld">Staying in<select id="tB"><option value="cur">${esc(base().name)} (current base)</option><option value="flint">Flint Hill, VA</option>${t.base && t.base.name !== base().name && t.base.name !== 'Flint Hill, VA' ? `<option value="keep" selected>${esc(t.base.name)}</option>` : ''}</select></label>
    <label class="fld">Notes<textarea id="tNo">${esc(t.notes || '')}</textarea></label>
    <div class="foot">${tid ? `<button type="button" class="btn" id="tDel">${svg('trash')}Delete trip</button>` : '<button type="button" class="btn" onclick="closeSheet()">Cancel</button>'}<button type="submit" class="btn primary">Save</button></div></form>`);
  if (tid && t.base.name === 'Flint Hill, VA') $('#tB', el).value = 'flint';
  if ($('#tDel', el)) $('#tDel', el).onclick = async () => { if (await confirmSheet('Delete this trip?', 'The day plans are removed. Wineries and journal entries are not affected.')) { await DB.del('trips', tid); S.trips = S.trips.filter(x => x.id !== tid); go('plan'); } };
  $('#tf', el).addEventListener('submit', async e => {
    e.preventDefault(); const s = $('#tS', el).value, en = $('#tE', el).value; if (en < s) { toast('Last day must be after the first day'); return; }
    const days = {}; for (let d = fromISO(s); iso(d) <= en; d.setDate(d.getDate() + 1)) days[iso(d)] = (t.days && t.days[iso(d)]) || [];
    if (Object.keys(days).length > 21) { toast('Keep trips to three weeks or less'); return; }
    const bsel = $('#tB', el).value; const b = bsel === 'flint' ? { ...G.defaultBase } : bsel === 'keep' ? t.base : { ...base() };
    const rec = { id: tid || uid('t'), name: $('#tN', el).value.trim(), start: s, end: en, base: b, days, notes: $('#tNo', el).value.trim() };
    await DB.put('trips', rec); S.trips = S.trips.filter(x => x.id !== rec.id).concat(rec); closeSheet(); go('trip-' + rec.id);
  });
}
const stopQ = w => { const c = S.kv.coords[w.id]; return c && c[2] === 'gps' ? `${c[0]},${c[1]}` : placeQ(w); };
function renderTrip(tid) {
  const t = S.trips.find(x => x.id === tid); if (!t) { go('plan'); return; }
  setTop(t.name, { back: true, actions: `<button class="iconbtn" data-act="shareTrip" data-tid="${tid}" aria-label="Share trip">${svg('share')}</button><button class="iconbtn" data-act="editTrip" data-tid="${tid}" aria-label="Edit trip">${svg('edit')}</button>` });
  const bp = [t.base.lat, t.base.lng]; const used = new Set(Object.values(t.days).flat());
  const days = Object.keys(t.days).sort().map(d => {
    const dt = fromISO(d); const stops = t.days[d].map(W).filter(Boolean); const hol = holiday(dt);
    let prev = bp, total = 0;
    const rows = stops.map((w, i) => {
      const p = pos(w); const mi = roadMi(prev, p); total += mi; prev = p; const hrs = hoursOn(w, dt);
      const hTxt = hrs ? (hrs.length ? fmtRange(hrs) : 'Closed this day') : (w.irregular ? 'Limited days — check calendar' : 'By reservation — check');
      const bad = hrs && !hrs.length;
      return `<div class="leg">↓ ${Math.round(mi)} mi · ~${fmtDrive(driveMin(mi))}</div>
        <div class="stop"><span class="num">${i + 1}</span><div class="sb"><a href="#w-${w.id}">${esc(w.n)}</a><div class="small" style="color:var(${bad ? '--claret' : '--muted'})">${bad ? svg('warn', 'width="13" height="13" style="vertical-align:-2px"') + ' ' : ''}${esc(hTxt)}${w.resLevel === 'required' ? ' · reservation required' : ''}${w.dog === 'no' ? ' · no dogs' : ''}</div></div>
        <div class="ctl"><button data-act="mvStop" data-tid="${tid}" data-d="${d}" data-i="${i}" data-dir="-1" aria-label="Move up">${svg('up')}</button><button data-act="mvStop" data-tid="${tid}" data-d="${d}" data-i="${i}" data-dir="1" aria-label="Move down">${svg('down')}</button><button data-act="rmStop" data-tid="${tid}" data-d="${d}" data-i="${i}" aria-label="Remove">${svg('x')}</button></div></div>`;
    }).join('');
    const back = stops.length ? roadMi(prev, bp) : 0; total += back;
    const openList = ALL().filter(w => !used.has(w.id) && (w.h ? hoursOn(w, dt).length : false) && roadMi(bp, pos(w)) < 60)
      .map(w => ({ w, pr: (st(w.id).status === 'want' ? 0 : 3) + (inPick('next5', w.id) ? 0 : 1) + (isVisited(w.id) ? 2 : 0) + roadMi(bp, pos(w)) / 40 }))
      .sort((a, b) => a.pr - b.pr).slice(0, 4);
    const stopsQ = stops.map(stopQ); const baseQ = `${t.base.lat},${t.base.lng}`;
    const navDay = stops.length ? `https://www.google.com/maps/dir/?api=1&origin=${enc(baseQ)}&destination=${enc(baseQ)}&waypoints=${stopsQ.map(enc).join('%7C')}&travelmode=driving` : '';
    const embed = stops.length ? `https://maps.google.com/maps?saddr=${enc(baseQ)}&daddr=${stopsQ.map(enc).join('+to:')}+to:${enc(baseQ)}&output=embed` : '';
    return `<div class="section day"><div class="dayhead"><b>${DAYN[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}</b>${hol ? `<span class="chip warn">${svg('warn')}${hol} · confirm hours</span>` : ''}</div>
      <div class="card">${stops.length ? `<div class="small muted">From ${esc(t.base.name)}</div>${rows}<div class="leg">↓ ${Math.round(back)} mi back · day total ~${Math.round(total)} mi, ${fmtDrive(driveMin(total))} driving</div>` : '<div class="small muted">No stops yet.</div>'}
        <div class="row" style="margin-top:12px"><button class="btn" data-act="addStop" data-tid="${tid}" data-d="${d}">${svg('plus')}Add stop</button>${stops.length ? `<a class="btn primary" href="${navDay}" target="_blank" rel="noopener">${svg('nav')}Navigate day</a><button class="btn" data-act="showRoute" data-src="${esc(embed)}">${svg('route')}Route map</button><button class="btn" data-act="shareTrip" data-tid="${tid}" data-d="${d}">${svg('share')}Share day</button>` : ''}</div>
        <div class="routebox" data-rk="${tid}:${d}">${openMem['route:' + tid + ':' + d] && stops.length ? (navigator.onLine ? `<iframe class="mapframe" style="margin-top:12px" src="${esc(embed)}" title="Google route map" loading="lazy"></iframe>` : '<div class="mapholder" style="margin-top:12px">Route map needs a connection.</div>') : ''}</div>
        ${openList.length ? `<div style="margin-top:12px"><h3 style="margin-bottom:4px">Open this day nearby</h3>${openList.map(({ w }) => `<div class="sugg"><span><a href="#w-${w.id}" style="color:var(--ink);font-weight:600;text-decoration:none">${esc(w.n)}</a><br><span class="small muted">${fmtRange(hoursOn(w, dt))} · ${Math.round(roadMi(bp, pos(w)))} mi${st(w.id).status === 'want' ? ' · on our list' : ''}${isVisited(w.id) ? ' · visited' : ''}</span></span><button class="btn" data-act="quickAdd" data-tid="${tid}" data-d="${d}" data-id="${w.id}">${svg('plus')}Add</button></div>`).join('')}</div>` : ''}
      </div></div>`;
  }).join('');
  view.innerHTML = `<div class="section" style="margin-top:8px"><div class="small muted">${fmtDate(t.start, true)} – ${fmtDate(t.end, true)}</div><div class="row"><span class="chip ridge">${svg('pin')}Base: ${esc(t.base.name)}</span></div>${t.notes ? `<p class="prose" style="margin:0">${esc(t.notes)}</p>` : ''}</div>${days}
    <div class="section"><button class="btn primary block" data-act="shareTrip" data-tid="${tid}">${svg('share')}Share this trip</button></div>
    <p class="small muted" style="margin-top:22px">Drive times are straight-line estimates. Tap “Navigate day” for real routes in Google Maps.</p>`;
}
function tripText(t, onlyDay) {
  const baseQ = `${t.base.lat},${t.base.lng}`; const out = [];
  out.push(onlyDay ? `${t.name} · ${fmtDate(onlyDay, true)}` : t.name);
  if (!onlyDay) out.push(`${fmtDate(t.start, true).replace(/, \d{4}$/, '')} – ${fmtDate(t.end, true)}`);
  out.push(`Staying in ${t.base.name}`);
  if (t.notes && !onlyDay) out.push(t.notes);
  Object.keys(t.days).sort().filter(d => !onlyDay || d === onlyDay).forEach(d => {
    const dt = fromISO(d); const stops = t.days[d].map(W).filter(Boolean); if (!stops.length && !onlyDay) return;
    out.push(''); if (!onlyDay) out.push(`${DAYN[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}${holiday(dt) ? ' (' + holiday(dt) + ')' : ''}`);
    if (!stops.length) { out.push('No stops planned yet.'); return; }
    let prev = [t.base.lat, t.base.lng];
    stops.forEach((w, i) => {
      const hrs = hoursOn(w, dt); const mi = roadMi(prev, pos(w)); prev = pos(w);
      out.push(`${i + 1}. ${w.n} (${w.town}) · ${hrs ? (hrs.length ? fmtRange(hrs) : 'closed that day') : 'check hours'} · ~${fmtDrive(driveMin(mi))} drive`);
      out.push(`   https://www.google.com/maps/search/?api=1&query=${enc(placeQ(w))}`);
    });
    out.push(`Full route: https://www.google.com/maps/dir/?api=1&origin=${enc(baseQ)}&destination=${enc(baseQ)}&waypoints=${stops.map(stopQ).map(enc).join('%7C')}&travelmode=driving`);
  });
  if (!Object.values(t.days).some(a => a.length)) out.push('', 'No stops planned yet.');
  out.push('', 'Hours are published schedules; confirm before you go.');
  return out.join('\n');
}
async function shareTrip(tid, day) {
  const t = S.trips.find(x => x.id === tid); if (!t) return; const text = tripText(t, day || null);
  const title = day ? `${t.name} · ${fmtDate(day)}` : t.name;
  if (navigator.share) { try { await navigator.share({ title, text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text); toast('Itinerary copied — paste it anywhere'); }
  catch (e) { openSheet(`<h2>Share ${esc(title)}</h2><p class="small muted" style="margin:-6px 0 10px">Copy the text below.</p><textarea style="min-height:320px" readonly>${esc(text)}</textarea><div class="foot"><button class="btn primary" onclick="closeSheet()">Done</button></div>`); }
}
function stopSheet(tid, d) {
  const t = S.trips.find(x => x.id === tid); const dt = fromISO(d); const bp = [t.base.lat, t.base.lng];
  const list = ALL().map(w => ({ w, hrs: hoursOn(w, dt), mi: roadMi(bp, pos(w)) })).sort((a, b) => a.mi - b.mi);
  const el = openSheet(`<h2>Add a stop · ${DAYS3[dt.getDay()]} ${MONTHS[dt.getMonth()]} ${dt.getDate()}</h2><div class="search" style="margin-bottom:8px">${svg('search')}<input type="search" id="sq" placeholder="Filter"></div><div id="sl"></div>`);
  const fill = q => { $('#sl', el).innerHTML = list.filter(x => !q || (x.w.n + ' ' + x.w.town).toLowerCase().includes(q.toLowerCase())).map(({ w, hrs, mi }) => `<div class="sugg"><span><b>${esc(w.n)}</b><br><span class="small" style="color:var(${hrs && !hrs.length ? '--claret' : '--muted'})">${hrs ? (hrs.length ? fmtRange(hrs) : 'Closed this day') : 'Hours vary'} · ${Math.round(mi)} mi</span></span><button class="btn" data-x="${w.id}">${t.days[d].includes(w.id) ? 'Added' : 'Add'}</button></div>`).join(''); };
  fill(''); $('#sq', el).addEventListener('input', e => fill(e.target.value));
  el.addEventListener('click', async e => { const b = e.target.closest('[data-x]'); if (!b || t.days[d].includes(b.dataset.x)) return; t.days[d].push(b.dataset.x); await DB.put('trips', t); closeSheet(); renderTrip(tid); });
}

/* ---------------- PREFS ---------------- */
async function renderPrefs() {
  setTop('Settings', { back: true });
  const s = S.kv.settings; const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate().catch(() => null) : null;
  const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted().catch(() => false) : false;
  const refined = Object.values(S.kv.coords).filter(c => c && c[2] === 'osm').length; const gps = Object.values(S.kv.coords).filter(c => c && c[2] === 'gps').length;
  view.innerHTML = `
  ${familySection()}
  <div class="section"><h3>Home base</h3><div class="card stack">
    <span>Distances and “near me” use <b>${esc(base().name)}</b>.</span>
    <div class="row"><button class="btn" data-act="baseFlint">Flint Hill, VA</button><button class="btn" data-act="baseGPS">${svg('locate')}Use my location</button></div>
    <label class="fld">Or a winery as base<select id="baseW"><option value="">Choose…</option>${ALL().map(w => `<option value="${w.id}">${esc(w.n)}</option>`).join('')}</select></label></div></div>
  <div class="section"><h3>Our Google Maps list</h3><div class="card stack">
    <label class="fld">Map link<input type="url" id="mm" value="${esc(s.myMaps || '')}" placeholder="https://maps.app.goo.gl/…" autocapitalize="off" autocorrect="off" spellcheck="false"></label>
    <span class="small muted">In Google Maps, open the saved list, tap Share, copy the link and paste it here. The Map tab's Google view gets a button that opens it. A My Maps link (one containing mid=) is embedded in the tab instead.</span>
    <div><button class="btn" data-act="saveMM">Save link</button></div></div></div>
  <div class="section"><h3>Map pins</h3><div class="card stack">
    <span class="small">${refined} pins refined from OpenStreetMap, ${gps} pinned by GPS, the rest are guide estimates.</span>
    <div><button class="btn" data-act="refine">${svg('pin')}Refine pins now</button></div></div></div>
  <div class="section"><h3>Backup</h3><div class="card stack">
    <span class="small muted">Everything lives on this phone only. Save a backup file now and then (to Google Drive, for example) so a lost phone doesn't mean lost memories.</span>
    <div class="row"><button class="btn primary" data-act="export">${svg('download')}Save backup</button><button class="btn" data-act="import">${svg('upload')}Restore from file</button></div>
    <span class="small muted">${est ? `Using ${(est.usage / 1048576).toFixed(1)} MB` : ''}${persisted ? ' · protected from automatic cleanup' : ' · <button class="linkbtn" data-act="persist">Protect storage from cleanup</button>'}</span></div></div>
  <div class="section"><h3>Appearance</h3><div class="seg">${['system', 'light', 'dark'].map(k => `<button class="${s.theme === k ? 'on' : ''}" data-act="theme" data-k="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div></div>
  <div class="section"><h3>Wineries</h3><div class="card stack"><span class="small muted">Found a new favorite? Add it and it gets the same journal, scorecard, and trip features.</span><div><button class="btn" data-act="addWinery">${svg('plus')}Add a winery</button></div></div></div>
  <div class="section"><h3>About</h3><p class="small muted prose" style="margin:0">VA Wine Passport ${VERSION}. Guide data from “The Virginia Wine Guide — Complete Text Edition”, ${esc(G.edition)}. Hours, flights, prices, and policies change; confirm with each winery. Weather by Open-Meteo. Map tiles © OpenStreetMap contributors and CARTO. Google maps load from Google when online.</p>
    <div><button class="btn" data-act="reset">${svg('trash')}Erase all my data</button></div></div>`;
  $('#baseW').addEventListener('change', async e => { const w = W(e.target.value); if (!w) return; const p = pos(w); S.kv.settings.base = { name: `${w.n}, ${w.town}`, lat: p[0], lng: p[1] }; await saveKV('settings'); toast('Base updated'); renderPrefs(); });
}
async function exportData() {
  toast('Preparing backup…');
  const b2d = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  const photos = []; for (const p of S.photos) { const full = await DB.get('fulls', p.id); photos.push({ ...p, thumb: await b2d(p.thumb), full: full ? await b2d(full) : null }); }
  const data = { app: 'vawine', version: VERSION, exported: new Date().toISOString(), kv: S.kv, state: S.state, visits: S.visits, trips: S.trips, custom: S.custom, photos };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }); const name = `va-wine-passport-${todayISO()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'VA Wine Passport backup' }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Backup saved to Downloads');
}
async function importData(file) {
  let data; try { data = JSON.parse(await file.text()); } catch (e) { toast('That file isn’t a VA Wine Passport backup'); return; }
  if (data.app !== 'vawine') { toast('That file isn’t a VA Wine Passport backup'); return; }
  if (!(await confirmSheet('Restore this backup?', `It replaces everything on this phone with the backup from ${new Date(data.exported).toLocaleDateString()}.`, 'Restore'))) return;
  const d2b = async u => (await fetch(u)).blob();
  for (const s of ['state', 'visits', 'photos', 'fulls', 'trips', 'custom', 'kv']) await DB.clear(s);
  for (const [k, v] of Object.entries(data.state || {})) await DB.put('state', v, k);
  for (const v of data.visits || []) await DB.put('visits', v);
  for (const t of data.trips || []) await DB.put('trips', t);
  for (const c of data.custom || []) await DB.put('custom', c);
  for (const p of data.photos || []) { const full = p.full ? await d2b(p.full) : null; const rec = { ...p, thumb: await d2b(p.thumb) }; delete rec.full; await DB.put('photos', rec); if (full) await DB.put('fulls', full, p.id); }
  for (const [k, v] of Object.entries(data.kv || {})) if (v !== undefined) await DB.put('kv', v, k);
  location.reload();
}
async function refinePins(force) {
  if (!navigator.onLine) { if (force) toast('Needs a connection'); return; }
  let n = 0;
  for (const w of G.wineries) {
    const c = S.kv.coords[w.id]; if (c && c[2] === 'gps') continue; if (!force && (c || S.kv.refine[w.id])) continue;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=us&q=${enc(w.n.replace(/ & Brewery| & Winery/, '') + ', ' + w.town + ', Virginia')}`, { headers: { 'Accept-Language': 'en' } });
      const js = await r.json(); const hit = js.find(x => miles([+x.lat, +x.lon], [w.lat, w.lng]) < 15);
      if (hit) { S.kv.coords[w.id] = [+hit.lat, +hit.lon, 'osm']; n++; }
      S.kv.refine[w.id] = true;
    } catch (e) { break; }
    await sleep(1100);
  }
  await saveKV('coords'); await saveKV('refine');
  if (force) { toast(`${n} pins refined`); if (location.hash === '#prefs') renderPrefs(); }
}
function getGPS() { return new Promise((res, rej) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => res([p.coords.latitude, p.coords.longitude]), rej, { enableHighAccuracy: true, timeout: 15000 }) : rej(new Error('No GPS'))); }
function applyTheme() { const t = S.kv.settings.theme; if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; const m = document.querySelector('meta[name=theme-color]'); m.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(); }
function customSheet(id) {
  const w = id ? S.custom.find(x => x.id === id) : { n: '', town: '', region: 'shen', url: '', hoursText: '', dog: 'unknown', foodLevel: 'snacks', resLevel: 'walkin' };
  const el = openSheet(`<h2>${id ? 'Edit winery' : 'Add a winery'}</h2><form class="stack" id="cf">
    <label class="fld">Name<input type="text" id="cN" required value="${esc(w.n)}"></label>
    <label class="fld">Town<input type="text" id="cT" required value="${esc(w.town)}"></label>
    <label class="fld">Region<select id="cR">${Object.entries(G.regions).map(([k, r]) => `<option value="${k}" ${w.region === k ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></label>
    <label class="fld">Website<input type="url" id="cU" value="${esc(w.url || '')}"></label>
    <label class="fld">Hours (as text)<input type="text" id="cH" value="${esc(w.hoursText || '')}" placeholder="Thu–Sun 11–5"></label>
    <div class="row" style="flex-wrap:nowrap"><label class="fld" style="flex:1">Dogs<select id="cD">${['yes', 'limited', 'no', 'unknown'].map(k => `<option ${w.dog === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label><label class="fld" style="flex:1">Food<select id="cF">${['kitchen', 'trucks', 'snacks', 'bring'].map(k => `<option ${w.foodLevel === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
    <span class="small muted">The pin is placed from OpenStreetMap when you're online; you can also pin it by GPS on its page.</span>
    <div class="foot"><button type="button" class="btn" onclick="closeSheet()">Cancel</button><button type="submit" class="btn primary">Save</button></div></form>`);
  $('#cf', el).addEventListener('submit', async e => {
    e.preventDefault();
    const rec = Object.assign({}, w, { id: id || uid('c-'), custom: true, n: $('#cN', el).value.trim(), town: $('#cT', el).value.trim(), region: $('#cR', el).value, url: $('#cU', el).value.trim(), hoursText: $('#cH', el).value.trim(), dog: $('#cD', el).value, foodLevel: $('#cF', el).value, h: '', wines: w.wines || [], features: w.features || [], flights: w.flights || [] });
    if (!rec.lat) { const b = base(); rec.lat = b.lat; rec.lng = b.lng; try { const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${enc(rec.n + ', ' + rec.town + ', Virginia')}`); const js = await r.json(); if (js[0]) { rec.lat = +js[0].lat; rec.lng = +js[0].lon; } else { const r2 = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${enc(rec.town + ', Virginia')}`); const j2 = await r2.json(); if (j2[0]) { rec.lat = +j2[0].lat; rec.lng = +j2[0].lon; } } } catch (er) { /* offline: base position */ } }
    await DB.put('custom', rec); S.custom = S.custom.filter(x => x.id !== rec.id).concat(rec); closeSheet(); go('w-' + rec.id);
  });
}

/* ---------------- family journal sync (Firebase Auth + Firestore) ----------------
   Local IndexedDB stays the working copy (offline-first). Every synced record carries _u (last write, ms).
   Conflicts resolve last-write-wins per record; deletions leave tombstones so offline phones don't resurrect them. */
const SYNCED = ['state', 'visits', 'photos', 'trips', 'custom'];
const FB_VER = '10.12.2';
let keepScroll = false;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); }); }
const blobToDataURL = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
function dataURLtoBlob(u) { const [h, d] = u.split(','); const mime = (h.match(/data:([^;]+)/) || [])[1] || 'image/jpeg'; const bin = atob(d); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime }); }
async function shrinkForCloud(blob) {
  const img = await decode(blob);
  for (const [max, q] of [[1400, 0.78], [1200, 0.7], [1000, 0.62], [800, 0.55]]) { const b = await canvasBlob(img, max, q); const u = await blobToDataURL(b); if (u.length < 900000) return u; }
  return blobToDataURL(await canvasBlob(img, 640, 0.5));
}
const clean = o => JSON.parse(JSON.stringify(o));
function localGet(c, id) { return c === 'state' ? S.state[id] : (S[c] || []).find(x => x.id === id); }
function localMap(c) { if (c === 'state') return { ...S.state }; const m = {}; (S[c] || []).forEach(x => (m[x.id] = x)); return m; }
const AUTH_MSG = { 'auth/invalid-credential': 'Email or password is incorrect.', 'auth/wrong-password': 'Email or password is incorrect.', 'auth/user-not-found': 'No account with that email yet — tap Create account.', 'auth/email-already-in-use': 'That email already has an account — tap Sign in.', 'auth/weak-password': 'Use a password of at least 6 characters.', 'auth/invalid-email': 'That email address looks incomplete.', 'auth/network-request-failed': 'No connection. Try again when you are online.', 'auth/popup-closed-by-user': 'Sign-in was cancelled.', 'auth/unauthorized-domain': 'This site is not on Firebase’s authorized domains yet (setup step 3).', 'auth/operation-not-allowed': 'This sign-in method is not turned on in Firebase (setup step 2).' };
const authMsg = e => AUTH_MSG[e && e.code] || (e && e.message) || 'Something went wrong.';

const Sync = {
  enabled: !!window.FIREBASE_CONFIG, user: null, db: null, auth: null, status: 'off', msg: '', ready: {}, unsub: [], tombs: {}, joining: false,
  me() { const u = this.user; return u ? (u.displayName || (u.email || '').split('@')[0]) : ''; },
  live() { return !!(this.user && this.user.emailVerified && this.db && this.status !== 'denied'); },
  async init() {
    if (!this.enabled) return;
    try { if (!window.firebase) for (const m of ['app', 'auth', 'firestore']) await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${m}-compat.js`); }
    catch (e) { this.set('error', 'Sync could not load — check your connection.'); return; }
    try {
      if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
      this.auth = firebase.auth(); this.db = firebase.firestore();
      try { await this.db.enablePersistence({ synchronizeTabs: true }); } catch (e) { /* another tab or unsupported: still works online */ }
      this.auth.getRedirectResult().catch(e => toast(authMsg(e)));
      this.auth.onAuthStateChanged(u => this.onUser(u));
    } catch (e) { this.set('error', e.message); return; }
    window.addEventListener('online', () => this.user && this.set(this.allReady() ? 'synced' : 'connecting'));
    window.addEventListener('offline', () => this.user && this.set('offline'));
  },
  set(st, msg) { this.status = st; this.msg = msg || ''; updateSyncBadge(); if (location.hash === '#prefs' && !sheetStack.length) renderPrefs(); },
  allReady() { return SYNCED.every(c => this.ready[c]); },
  fail(e) { console.warn('sync', e); if (e && e.code === 'permission-denied') this.set('denied'); else this.set('error', e && e.message); },
  async onUser(u) {
    this.unsub.forEach(f => f()); this.unsub = []; this.ready = {}; this.user = u;
    if (!u) return this.set('signedout');
    if (!u.emailVerified) return this.set('unverified');
    this.set(navigator.onLine ? 'connecting' : 'offline');
    try {
      const meta = this.db.doc('meta/journal'); const m = await meta.get({ source: 'server' });
      this.joining = m.exists; if (!m.exists) meta.set({ created: Date.now(), by: this.me() });
      const ts = await this.db.collection('tombs').get({ source: 'server' }); this.tombs = {}; ts.forEach(d => (this.tombs[d.id] = d.data().t));
    } catch (e) { if (e && e.code === 'permission-denied') return this.fail(e); if (!navigator.onLine || (e && e.code === 'unavailable')) { this.set('offline'); setTimeout(() => this.user === u && this.onUser(u), 15000); return; } return this.fail(e); }
    this.unsub.push(this.db.collection('tombs').onSnapshot(sn => sn.docChanges().forEach(ch => { if (ch.type !== 'removed') this.tombs[ch.doc.id] = ch.doc.data().t; }), () => {}));
    SYNCED.forEach(c => this.listen(c));
  },
  listen(c) {
    const off = this.db.collection(c).onSnapshot({ includeMetadataChanges: true }, async snap => {
      if (!this.ready[c]) {
        if (snap.metadata.fromCache) return;               // only merge against the real server state
        this.ready[c] = true; await this.initialMerge(c, snap); if (this.allReady()) this.set('synced');
        return;
      }
      let changed = false;
      for (const ch of snap.docChanges()) { if (ch.doc.metadata.hasPendingWrites) continue; changed = (await this.applyRemote(c, ch.doc.id, ch.type === 'removed' ? null : ch.doc.data())) || changed; }
      if (changed) softRefresh();
    }, e => this.fail(e));
    this.unsub.push(off);
  },
  async initialMerge(c, snap) {
    const remote = {}; snap.forEach(d => (remote[d.id] = d.data()));
    const local = localMap(c); let changed = false; const pushes = [];
    for (const [id, r] of Object.entries(remote)) {
      const l = local[id]; const ru = r._u || 0, lu = l ? l._u || 0 : -1;
      if (!l || ru > lu || (this.joining && ru === lu)) changed = (await this.applyRemote(c, id, r, true)) || changed;
      else if (lu > ru) pushes.push([id, l]);
    }
    for (const [id, l] of Object.entries(local)) {
      if (remote[id]) continue;
      const tomb = this.tombs[c + '__' + id];
      const seedOnly = (l._u || 0) <= 1;
      const dupSeedVisit = c === 'visits' && l.seeded && Object.values(remote).some(v => v.seeded && v.wid === l.wid);
      if ((tomb && tomb >= (l._u || 0)) || (this.joining && seedOnly) || dupSeedVisit) { await this.removeLocal(c, id); changed = true; continue; }
      pushes.push([id, l]);
    }
    for (const [id, l] of pushes) await this.push(c, id, l);
    if (changed) softRefresh();
  },
  async applyRemote(c, id, data, force) {
    if (data === null) return this.removeLocal(c, id);
    const l = localGet(c, id);
    if (l && !force && (l._u || 0) >= (data._u || 0)) return false;
    let rec = data;
    if (c === 'photos') { rec = { ...data, thumb: data.thumb ? dataURLtoBlob(data.thumb) : new Blob(), _cloud: true }; if (urlCache.has(id)) { URL.revokeObjectURL(urlCache.get(id)); urlCache.delete(id); } }
    if (c === 'state') { await DB.putRaw('state', rec, id); S.state[id] = rec; }
    else { await DB.putRaw(c, rec); S[c] = (S[c] || []).filter(x => x.id !== id).concat(rec); }
    if (c === 'custom') tagCache.delete(id);
    return true;
  },
  async removeLocal(c, id) {
    if (!localGet(c, id)) return false;
    await DB.delRaw(c, id);
    if (c === 'state') delete S.state[id]; else S[c] = (S[c] || []).filter(x => x.id !== id);
    if (c === 'photos') { await DB.delRaw('fulls', id); if (urlCache.has(id)) { URL.revokeObjectURL(urlCache.get(id)); urlCache.delete(id); } }
    return true;
  },
  async push(c, id, rec) {
    if (!this.live()) return;
    try {
      if (c !== 'state' && !rec._cb) { rec._cb = this.me(); DB.putRaw(c, rec); }
      let data = rec;
      if (c === 'photos') {
        data = { ...rec, thumb: rec.thumb instanceof Blob ? await blobToDataURL(rec.thumb) : rec.thumb }; delete data._cloud;
        if (!rec._cloud) { const full = await DB.get('fulls', id); if (full) this.db.collection('photoData').doc(String(id)).set({ d: await shrinkForCloud(full), _u: rec._u }).catch(e => this.fail(e)); rec._cloud = true; DB.putRaw('photos', rec); }
      }
      this.db.collection(c).doc(String(id)).set(clean(data)).catch(e => this.fail(e));
    } catch (e) { this.fail(e); }
  },
  local(c, id, rec) { if (this.live()) this.push(c, id, rec); },
  localDel(c, id) {
    if (!this.live()) return;
    const t = Date.now(); this.tombs[c + '__' + id] = t;
    this.db.collection('tombs').doc(c + '__' + id).set({ t }).catch(() => {});
    this.db.collection(c).doc(String(id)).delete().catch(e => this.fail(e));
    if (c === 'photos') this.db.collection('photoData').doc(String(id)).delete().catch(() => {});
  },
  async fetchFull(id) {
    if (!this.live()) return null;
    try { const d = await this.db.collection('photoData').doc(String(id)).get(); if (!d.exists) return null; const b = dataURLtoBlob(d.data().d); await DB.putRaw('fulls', b, id); return b; } catch (e) { return null; }
  },
  async google() {
    const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    try { await this.auth.signInWithPopup(p); }
    catch (e) { if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) return this.auth.signInWithRedirect(p); toast(authMsg(e)); }
  },
  async emailSignIn(email, pw) { await this.auth.signInWithEmailAndPassword(email, pw); },
  async emailCreate(name, email, pw) { const cr = await this.auth.createUserWithEmailAndPassword(email, pw); if (name) await cr.user.updateProfile({ displayName: name }); await cr.user.sendEmailVerification(); },
  async refresh() { if (!this.user) return; await this.user.reload(); this.onUser(this.auth.currentUser); },
  async signOut() { await this.auth.signOut(); }
};
let _srT = null;
function softRefresh() { clearTimeout(_srT); _srT = setTimeout(doSoftRefresh, 700); }
function doSoftRefresh() {
  if (sheetStack.length || document.querySelector('.viewer') || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) { softRefresh(); return; }
  if ((location.hash || '#home') === '#map') return;
  const y = scrollY; keepScroll = true;
  Promise.resolve(route()).then(() => { keepScroll = false; window.scrollTo(0, y); checkBadges(); });
}
const SYNC_LABEL = { off: 'Not set up', signedout: 'Signed out', unverified: 'Verify your email', connecting: 'Syncing…', synced: 'Synced', offline: 'Offline — will sync later', denied: 'Not on the family list', error: 'Sync problem' };
function syncBadge() {
  const s = Sync.status; const col = s === 'synced' ? 'var(--vine)' : s === 'connecting' || s === 'offline' ? 'var(--gold)' : s === 'off' ? 'var(--muted)' : 'var(--claret)';
  return `<button class="iconbtn" data-act="go" data-to="prefs" aria-label="Family journal: ${esc(SYNC_LABEL[s] || s)}" title="${esc(SYNC_LABEL[s] || s)}" style="color:${col}">${svg('cloud')}</button>`;
}
function updateSyncBadge() { const b = document.getElementById('syncBadge'); if (b) b.innerHTML = syncBadge(); }
function familySection() {
  if (!Sync.enabled) return `<div class="section"><h3>Family journal</h3><div class="card stack"><span class="small muted">Not set up yet. Once the Firebase settings file (firebase-config.js) is in your GitHub repo, family members can sign in here and share one live journal.</span></div></div>`;
  const s = Sync.status; const u = Sync.user;
  let body = '';
  if (s === 'error' && !Sync.auth) body = `<span class="small" style="color:var(--claret)">${esc(Sync.msg || 'Sync could not start.')}</span>`;
  else if (!u) body = `<span class="small muted">Sign in to share visits, photos, notes, scores, and trips with the family. Everything still works offline.</span>
      <div class="row"><button class="btn primary" data-act="fbGoogle">Continue with Google</button><button class="btn" data-act="fbEmail">Use email &amp; password</button></div>`;
  else {
    const col = s === 'synced' ? 'var(--vine)' : s === 'connecting' || s === 'offline' ? 'var(--gold)' : 'var(--claret)';
    body = `<div class="row" style="justify-content:space-between"><span><b>${esc(Sync.me())}</b><br><span class="small muted">${esc(u.email || '')}</span></span><span class="chip" style="color:${col}">${svg('cloud')}${esc(SYNC_LABEL[s] || s)}</span></div>
      ${s === 'unverified' ? `<span class="small">We sent a verification link to ${esc(u.email)}. Open it, then tap <b>I’ve verified</b>.</span><div class="row"><button class="btn primary" data-act="fbRefresh">I’ve verified</button><button class="btn" data-act="fbResend">Resend link</button></div>` : ''}
      ${s === 'denied' ? `<span class="small">This account isn’t on the family list yet. Ask Claudio to add <b>${esc(u.email)}</b> to the journal’s sharing rules, then tap Try again.</span><div><button class="btn" data-act="fbRefresh">Try again</button></div>` : ''}
      ${s === 'error' ? `<span class="small" style="color:var(--claret)">${esc(Sync.msg)}</span><div><button class="btn" data-act="fbRefresh">Try again</button></div>` : ''}
      ${s === 'synced' || s === 'connecting' || s === 'offline' ? `<span class="small muted">Visits, photos, notes, scores, wine ratings, bottles, and trips are shared with everyone on the family list. Home base, theme, and map pins stay per phone.</span>` : ''}
      <div class="row"><label class="fld" style="flex:1">Name on your entries<input type="text" id="fbName" value="${esc(u.displayName || '')}" placeholder="e.g. Claudio"></label><button class="btn" data-act="fbSaveName" style="align-self:flex-end">Save</button></div>
      <div><button class="btn" data-act="fbSignOut">Sign out</button></div>`;
  }
  return `<div class="section"><h3>Family journal</h3><div class="card stack">${body}</div></div>`;
}
function emailSheet() {
  const el = openSheet(`<h2>Sign in with email</h2><form class="stack" id="ef">
    <label class="fld">Your name (for new accounts)<input type="text" id="eN" placeholder="e.g. Ana" autocomplete="name"></label>
    <label class="fld">Email<input type="email" id="eE" required autocomplete="email" autocapitalize="off" style="width:100%;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:15px"></label>
    <label class="fld">Password<input type="password" id="eP" required minlength="6" autocomplete="current-password" style="width:100%;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:15px"></label>
    <span class="small muted" id="eMsg">Use an email address that’s on the family list.</span>
    <div class="foot"><button type="button" class="btn" id="eCreate">Create account</button><button type="submit" class="btn primary">Sign in</button></div>
    <button type="button" class="linkbtn" id="eForgot" style="align-self:flex-start">Forgot password?</button></form>`);
  const msg = t => ($('#eMsg', el).textContent = t);
  $('#ef', el).addEventListener('submit', async e => { e.preventDefault(); try { await Sync.emailSignIn($('#eE', el).value.trim(), $('#eP', el).value); closeSheet(); toast('Signed in'); } catch (er) { msg(authMsg(er)); } });
  $('#eCreate', el).onclick = async () => { if (!$('#eE', el).reportValidity() || !$('#eP', el).reportValidity()) return; try { await Sync.emailCreate($('#eN', el).value.trim(), $('#eE', el).value.trim(), $('#eP', el).value); closeSheet(); toast('Account created — check your email for the verification link'); } catch (er) { msg(authMsg(er)); } };
  $('#eForgot', el).onclick = async () => { const em = $('#eE', el).value.trim(); if (!em) return msg('Type your email first.'); try { await Sync.auth.sendPasswordResetEmail(em); msg('Reset link sent to ' + em + '.'); } catch (er) { msg(authMsg(er)); } };
}

/* ---------------- actions ---------------- */
const ACT = {
  go: el => go(el.dataset.to),
  install: async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; renderHome(); },
  filter: (el, e) => { e.preventDefault(); F.on = new Set([el.dataset.f]); F.coll = ''; F.region = ''; go('wineries'); },
  coll: (el, e) => { e.preventDefault(); F.coll = el.dataset.k; if (el.dataset.k) { F.on.clear(); F.region = ''; } go('wineries'); },
  toggleF: el => { const f = el.dataset.f; F.on.has(f) ? F.on.delete(f) : F.on.add(f); if (f === 'visited') F.on.delete('unvisited'); if (f === 'unvisited') F.on.delete('visited'); $$('#fchips .fchip').forEach(b => b.classList.toggle('on', F.on.has(b.dataset.f))); fillList(); saveUI(); },
  region: el => { F.region = el.dataset.r; renderList(); },
  status: async el => { const id = el.dataset.id, s = el.dataset.s; const cur = st(id).status; if (s === 'visited' && cur === 'visited' && visitsOf(id).length) { toast('Has logged visits — delete them to unmark'); return; } await setSt(id, { status: cur === s ? '' : s }); toast(cur === s ? 'Removed' : s === 'visited' ? 'Marked visited — stamp collected' : 'Added to want-to-go'); renderWinery(id); checkBadges(); },
  fav: async el => { const id = el.dataset.id; await setSt(id, { fav: !st(id).fav }); renderWinery(id); },
  logVisit: el => visitSheet(el.dataset.id),
  editVisit: el => visitSheet(null, el.dataset.vid),
  addPhoto: el => pickPhotos(el.dataset.id, null, false),
  camPhoto: el => pickPhotos(el.dataset.id, null, true),
  menuPhoto: el => pickPhotos(el.dataset.id, null, false, null, 'menu'),
  viewPhoto: el => openViewer(el.dataset.pid),
  wineStar: async el => { const { id, n } = el.dataset; const cur = ((st(id).wines || {})[n] || {}).s; const v = +el.dataset.v === cur ? 0 : +el.dataset.v; await saveWine(id, n, { s: v, t: true }); const row = el.closest('.wine'); row.outerHTML = wineRow(id, n); },
  wineNote: el => wineSheet(el.dataset.id, el.dataset.n),
  addWine: async el => { const id = el.dataset.id; const n = $('#newWine').value.trim(); if (!n) return; const s = st(id); if ((W(id).wines || []).concat(s.extraWines || []).includes(n)) { toast('Already listed'); return; } await setSt(id, { extraWines: (s.extraWines || []).concat(n) }); await saveWine(id, n, { t: true }); renderWinery(id); },
  addBottle: el => bottleSheet(el.dataset.id),
  delBottle: async el => { const id = el.dataset.id; const b = [...(st(id).bottles || [])]; b.splice(+el.dataset.i, 1); await setSt(id, { bottles: b }); renderWinery(id); },
  addToTrip: el => tripPickSheet(el.dataset.id),
  pinHere: async el => { try { toast('Finding you…'); const p = await getGPS(); const w = W(el.dataset.id); if (miles(p, [w.lat, w.lng]) > 25 && !(await confirmSheet('You seem far from this winery', `You're about ${Math.round(miles(p, [w.lat, w.lng]))} miles from its guide location. Pin it here anyway?`, 'Pin here'))) return; S.kv.coords[w.id] = [p[0], p[1], 'gps']; await saveKV('coords'); toast('Pinned to your location'); renderWinery(w.id); } catch (e) { toast('Location unavailable — allow location access'); } },
  editCustom: el => customSheet(el.dataset.id),
  delCustom: async el => { if (await confirmSheet('Remove this winery?', 'Its page is removed. Visits and photos stay in the journal.')) { await DB.del('custom', el.dataset.id); S.custom = S.custom.filter(x => x.id !== el.dataset.id); go('wineries'); } },
  addWinery: () => customSheet(),
  mapMode: el => { MF.mode = el.dataset.m; renderMap(); },
  mapF: el => { const f = el.dataset.f; MF.on.has(f) ? MF.on.delete(f) : MF.on.add(f); if (f === 'visited') MF.on.delete('unvisited'); if (f === 'unvisited') MF.on.delete('visited'); renderMap(); },
  closePeek: () => { $('#peek').hidden = true; MF.peek = null; saveUI(); },
  locate: async () => { try { const p = await getGPS(); if (!mapInst) return; L.circleMarker(p, { radius: 8, color: '#fff', weight: 3, fillColor: '#2F7BEA', fillOpacity: 1 }).addTo(mapInst); mapInst.setView(p, 11); } catch (e) { toast('Location unavailable — allow location access'); } },
  jtab: el => { scrollMem[skey('journal')] = scrollY; saveX(); jTab = el.dataset.k; renderJournal(); restoreX('journal'); window.scrollTo(0, scrollMem[skey('journal')] || 0); saveUI(); },
  newTrip: () => tripSheet(),
  editTrip: el => tripSheet(el.dataset.tid),
  shareTrip: el => shareTrip(el.dataset.tid, el.dataset.d),
  badgeInfo: el => badgeSheet(el.dataset.k),
  fbGoogle: () => Sync.google(),
  fbEmail: () => emailSheet(),
  fbSignOut: async () => { await Sync.signOut(); toast('Signed out — this phone keeps its copy'); },
  fbRefresh: () => Sync.refresh(),
  fbResend: async () => { try { await Sync.user.sendEmailVerification(); toast('Verification link sent'); } catch (e) { toast(authMsg(e)); } },
  fbSaveName: async () => { const n = $('#fbName').value.trim(); if (!n || !Sync.user) return; await Sync.user.updateProfile({ displayName: n }); toast('Name saved'); renderPrefs(); },
  addStop: el => stopSheet(el.dataset.tid, el.dataset.d),
  quickAdd: async el => { const t = S.trips.find(x => x.id === el.dataset.tid); t.days[el.dataset.d].push(el.dataset.id); await DB.put('trips', t); renderTrip(t.id); },
  rmStop: async el => { const t = S.trips.find(x => x.id === el.dataset.tid); t.days[el.dataset.d].splice(+el.dataset.i, 1); await DB.put('trips', t); renderTrip(t.id); },
  mvStop: async el => { const t = S.trips.find(x => x.id === el.dataset.tid); const a = t.days[el.dataset.d], i = +el.dataset.i, j = i + +el.dataset.dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; await DB.put('trips', t); renderTrip(t.id); },
  showRoute: el => { const box = el.closest('.card').querySelector('.routebox'); const rk = 'route:' + box.dataset.rk; if (box.innerHTML) { box.innerHTML = ''; delete openMem[rk]; saveUI(); return; } openMem[rk] = true; saveUI(); box.innerHTML = navigator.onLine ? `<iframe class="mapframe" style="margin-top:12px" src="${el.dataset.src}" title="Google route map" loading="lazy"></iframe>` : '<div class="mapholder" style="margin-top:12px">Route map needs a connection.</div>'; },
  baseFlint: async () => { S.kv.settings.base = { ...G.defaultBase }; await saveKV('settings'); toast('Base set to Flint Hill'); renderPrefs(); },
  baseGPS: async () => { try { const p = await getGPS(); S.kv.settings.base = { name: 'My location', lat: p[0], lng: p[1] }; await saveKV('settings'); toast('Base set to your location'); renderPrefs(); } catch (e) { toast('Location unavailable — allow location access'); } },
  saveMM: async () => { let v = $('#mm').value.trim().replace(/^https?:/i, m => m.toLowerCase()); if (v && !/^https?:\/\//.test(v)) { toast('Paste a full link starting with https://'); return; } S.kv.settings.myMaps = v; await saveKV('settings'); toast('Map link saved'); },
  refine: () => { toast('Refining pins — about a minute'); refinePins(true); },
  export: () => exportData(),
  import: () => $('#importPick').click(),
  persist: async () => { const ok = navigator.storage && (await navigator.storage.persist()); toast(ok ? 'Storage protected' : 'Install the app first, then try again'); renderPrefs(); },
  theme: async el => { S.kv.settings.theme = el.dataset.k; await saveKV('settings'); applyTheme(); renderPrefs(); },
  reset: async () => { if (await confirmSheet('Erase everything?', Sync.live() ? 'This phone’s copy is cleared and then re-downloaded from the family journal. The shared journal is not affected.' : 'All visits, photos, notes, scores, and trips on this phone are deleted. Save a backup first if you might want them.', 'Erase')) { for (const s of ['state', 'visits', 'photos', 'fulls', 'trips', 'custom', 'kv']) await DB.clear(s); location.hash = ''; location.reload(); } }
};
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el || !ACT[el.dataset.act]) return; ACT[el.dataset.act](el, e); });

/* autosave inputs */
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const saveNotes = debounce(async (id, v) => { await setSt(id, { notes: v }); }, 500);
const saveRv = debounce(async (id, k, v) => { await setSt(id, { review: Object.assign({}, st(id).review, { [k]: v, asOf: todayISO() }) }); }, 600);
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.notes) saveNotes(t.dataset.notes, t.value);
  if (t.dataset.rv) saveRv(t.dataset.id, t.dataset.rv, t.value);
  if (t.dataset.sc) { $('#o-' + t.dataset.sc).textContent = t.value; t.style.opacity = 1; }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.sc) {
    const id = t.dataset.id; const sc = Object.assign({}, st(id).score); ['scenery', 'wine', 'experience'].forEach(k => { const inp = $('#sc-' + k); if (k === t.dataset.sc || sc[k]) sc[k] = +inp.value; });
    await setSt(id, { score: sc }); const v = score(id); $('#scTotal').textContent = v ?? '—'; if ($('#scHint')) $('#scHint').textContent = v == null ? 'Move all three sliders to score it. ' : '';
  }
  if (t.dataset.wineT !== undefined) await saveWine(t.dataset.id, t.dataset.wineT, { t: t.checked });
});
$('#filePick').addEventListener('change', onPicked);
$('#camPick').addEventListener('change', onPicked);
$('#importPick').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importData(f); });
window.addEventListener('hashchange', route);
window.addEventListener('resize', debounce(() => paintRidges(), 200));

/* ---------------- boot ---------------- */
(async function boot() {
  try { await loadAll(); } catch (e) { view.innerHTML = `<div class="empty" style="margin-top:24px">This browser blocked on-device storage, so nothing can be saved. Open the app in Chrome (not a private tab). <br><span class="small">${esc(e.message || e)}</span></div>`; return; }
  applyTheme();
  restoreUI();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyTheme(); route(); });
  route();
  checkBadges();
  Sync.init();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  setTimeout(() => refinePins(false), 4000);
})();
