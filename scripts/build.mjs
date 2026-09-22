#!/usr/bin/env node
/**
 * KONSENXIA multi-page static site generator (Node ESM, zero deps).
 * Reads EN content from ../../_content/en/konsenxia/ and locales from ../locales/,
 * renders Clinical Noir pages into ../public/ + sitemap/robots/llms/manifest.
 * Root / = EN (x-default); /{locale}/ for the other 18 locales (ar = RTL).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WORKSPACE = path.resolve(ROOT, '..');
const CONTENT_DIR = path.join(WORKSPACE, '_content', 'en', 'konsenxia');
const LOCALES_DIR = path.join(ROOT, 'locales');
const PUBLIC_DIR = path.join(ROOT, 'public');
const ASSETS_SRC = __dirname;

const ORIGIN = 'https://konsenxia.com';
const BRAND = 'KONSENXIA';
const GH = {
  org: 'meviza',
  repo: 'konsenxia-landing',
  url: 'https://github.com/meviza/konsenxia-landing'
};

const LOCALE_LIST = [
  { code: 'en', name: 'English', dir: 'ltr', og: 'en_US' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr', og: 'tr_TR' },
  { code: 'ar', name: 'العربية', dir: 'rtl', og: 'ar_SA' },
  { code: 'de', name: 'Deutsch', dir: 'ltr', og: 'de_DE' },
  { code: 'es', name: 'Español', dir: 'ltr', og: 'es_ES' },
  { code: 'fr', name: 'Français', dir: 'ltr', og: 'fr_FR' },
  { code: 'nl', name: 'Nederlands', dir: 'ltr', og: 'nl_NL' },
  { code: 'it', name: 'Italiano', dir: 'ltr', og: 'it_IT' },
  { code: 'pt', name: 'Português', dir: 'ltr', og: 'pt_BR' },
  { code: 'ru', name: 'Русский', dir: 'ltr', og: 'ru_RU' },
  { code: 'zh', name: '中文', dir: 'ltr', og: 'zh_CN' },
  { code: 'ja', name: '日本語', dir: 'ltr', og: 'ja_JP' },
  { code: 'ko', name: '한국어', dir: 'ltr', og: 'ko_KR' },
  { code: 'pl', name: 'Polski', dir: 'ltr', og: 'pl_PL' },
  { code: 'uk', name: 'Українська', dir: 'ltr', og: 'uk_UA' },
  { code: 'vi', name: 'Tiếng Việt', dir: 'ltr', og: 'vi_VN' },
  { code: 'id', name: 'Bahasa Indonesia', dir: 'ltr', og: 'id_ID' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr', og: 'hi_IN' },
  { code: 'th', name: 'ไทย', dir: 'ltr', og: 'th_TH' }
];

const PAGES = [
  { id: 'home', slug: '', content: 'home', navKey: 'home' },
  { id: 'platform', slug: 'platform', content: 'platform', navKey: 'platform' },
  { id: 'metrics', slug: 'metrics', content: 'metrics', navKey: 'metrics' },
  { id: 'community', slug: 'community', content: 'community', navKey: 'community' },
  { id: 'open-source', slug: 'open-source', content: 'open-source', navKey: 'openSource' },
  { id: 'company', slug: 'company', content: 'company', navKey: 'company' },
  { id: 'contact', slug: 'contact', content: 'contact', navKey: 'contact' },
  { id: 'privacy', slug: 'privacy', content: 'privacy', navKey: 'privacy' },
  { id: 'terms', slug: 'terms', content: 'terms', navKey: 'terms' },
  { id: 'cookies', slug: 'cookies', content: 'cookies', navKey: 'cookies' },
  { id: 'security', slug: 'security', content: 'security', navKey: 'security' },
  { id: 'licenses', slug: 'licenses', content: 'licenses', navKey: 'licenses' }
];
const PAGE_BY_ID = Object.fromEntries(PAGES.map((p) => [p.id, p]));

const NAV_ITEMS = [
  { id: 'platform', navKey: 'platform' },
  { id: 'metrics', navKey: 'metrics' },
  { id: 'open-source', navKey: 'openSource' },
  { id: 'community', navKey: 'community' },
  { id: 'company', navKey: 'company' },
  { id: 'contact', navKey: 'contact' }
];

const FOOTER_COLS = [
  {
    key: 'product',
    links: [
      { href: '/platform', lk: 'platform' },
      { href: '/metrics', lk: 'metrics' },
      { href: '/open-source', lk: 'openSource' },
      { href: '/contact', lk: 'getDemo' }
    ]
  },
  {
    key: 'company',
    links: [
      { href: '/company', lk: 'about' },
      { href: '/contact', lk: 'contact' },
      { href: '/company#audiences', lk: 'press' }
    ]
  },
  {
    key: 'legal',
    links: [
      { href: '/privacy', lk: 'privacy' },
      { href: '/terms', lk: 'terms' },
      { href: '/cookies', lk: 'cookies' },
      { href: '/security', lk: 'security' },
      { href: '/licenses', lk: 'licenses' }
    ]
  },
  {
    key: 'community',
    links: [
      { href: GH.url, lk: 'repository' },
      { href: `${GH.url}/issues`, lk: 'issues' },
      { href: `${GH.url}/releases`, lk: 'releases' },
      { href: '/community', lk: 'communityPage' }
    ]
  }
];

const SOCIAL = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/meviza' },
  { id: 'x', label: 'X', href: 'https://x.com/konsenxia' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/konsenxia' }
];

const GLYPHS = ['✚', '⇄', '◈', '◉', '☰', '◇', '⌖', '▤', '⚗', '▣', '⬡', '⊕'];

/* ------------------------------------------------------------------ utils */
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const attr = esc; // attribute-safe

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function deepMerge(base, over) {
  if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
  if (typeof base !== 'object' || base === null || typeof over !== 'object' || over === null) {
    return over !== undefined ? over : base;
  }
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = deepMerge(base[k], over[k]);
  return out;
}

function getPath(obj, dotPath) {
  return dotPath.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function trimDesc(s, max = 160) {
  const str = String(s || '').replace(/\s+/g, ' ').trim();
  if (str.length <= max) return str;
  return str.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

function clamp(s, max) { return trimDesc(s, max); }

/** Resolve a page's entry in locale bundles (pages.* keys; open-source → openSource). */
function locPage(B, page) {
  const key = page.id === 'open-source' ? 'openSource' : page.id;
  return B.pages[key] || {};
}

/* --------------------------------------------------------------- href/url */
function pagePath(page, loc) {
  const base = loc === 'en' ? '' : `/${loc}`;
  if (!page.slug) return loc === 'en' ? '/' : `${base}/`;
  return `${base}/${page.slug}/`;
}
function pageUrl(page, loc) {
  return ORIGIN + pagePath(page, loc);
}
/** Localize a root-internal href ("/platform", "/company#audiences", "/"). */
function hrefFor(href, loc) {
  if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:')) return href;
  const [pRaw, anchor] = href.split('#');
  const p = pRaw || '/';
  const hash = anchor ? `#${anchor}` : '';
  if (p === '/') return (loc === 'en' ? '/' : `/${loc}/`) + hash;
  const clean = p.replace(/\/$/, '');
  const base = loc === 'en' ? '' : `/${loc}`;
  return `${base}${clean}/${hash}`;
}

/* ------------------------------------------------------------- SVG tokens */
const SVG_GH = `<svg class="gh-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
const SVG_X = `<svg class="gh-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
const SVG_LI = `<svg class="gh-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v16h-4V8zm7.5 0h3.8v2.2h.05c.53-1 1.83-2.2 3.77-2.2 4.03 0 4.78 2.65 4.78 6.1V24h-4v-8.5c0-2.03-.04-4.64-2.83-4.64-2.83 0-3.27 2.2-3.27 4.48V24h-4V8z"/></svg>`;
const SOCIAL_SVG = { github: SVG_GH, x: SVG_X, linkedin: SVG_LI };

const ECG_SVG = `<svg class="ecg" viewBox="0 0 720 80" role="img" aria-label="ECG pulse"><defs><linearGradient id="ecgGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00c4b0"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs><path d="M0 40 H120 L136 40 L148 16 L162 66 L176 40 H250 L262 40 L272 28 L284 52 L296 40 H400 L414 40 L426 10 L442 70 L456 40 H560 L572 40 L582 30 L594 50 L606 40 H720"/></svg>`;

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#060a14"/><rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="#1e2c4f" stroke-width="2"/><path d="M8 34h10l4-12 6 24 5-16 4 8h19" fill="none" stroke="#00c4b0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="49" cy="34" r="4" fill="#3b82f6"/></svg>`;

/* ------------------------------------------------------------- fragments */
function pill(status) {
  if (!status) return '';
  return `<span class="status status-${attr(status)}">${esc(status)}</span>`;
}

/** Render a value with count-up when it is a plain number (+suffix). */
function metricValue(v) {
  const s = String(v ?? '');
  const m = s.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (m && m[1] !== '') {
    return `<span data-count="${attr(m[1])}" data-suffix="${attr(m[2])}">${esc(s)}</span>`;
  }
  return esc(s);
}

function kicker(text) {
  return `<div class="kicker">${esc(text)}</div>`;
}

function ctaBand(c, B, loc) {
  if (!c) return '';
  const title = c.title ? `<h2>${esc(c.title)}</h2>` : '';
  const body = c.body ? `<p>${esc(c.body)}</p>` : '';
  const btns = [];
  const mk = (cta, cls) => {
    if (!cta) return;
    let label = cta.label;
    const h = cta.href || '';
    if (h.startsWith('https://github.com')) label = B.cta.viewGithub;
    else if (h.startsWith('/contact')) label = B.cta.getDemo;
    else if (h.startsWith('/metrics')) label = B.cta.readMetrics;
    btns.push(`<a class="btn ${cls}" href="${attr(hrefFor(h, loc))}">${esc(label)}${cls === 'btn-p' ? ' →' : ''}</a>`);
  };
  mk(c.primaryCta, 'btn-p');
  mk(c.secondaryCta, 'btn-s');
  return `<div class="cta-band reveal"><div>${title}${body}</div><div class="cta-row">${btns.join('')}</div></div>`;
}

function relatedLinks(items, B, loc) {
  if (!items || !items.length) return '';
  const map = {
    '/privacy': B.footer.links.privacy,
    '/terms': B.footer.links.terms,
    '/cookies': B.footer.links.cookies,
    '/security': B.footer.links.security,
    '/licenses': B.footer.links.licenses,
    '/open-source': B.footer.links.openSource,
    '/metrics': B.footer.links.metrics,
    '/community': B.footer.links.communityPage
  };
  const links = items
    .map((it) => {
      const label = map[it.href] || it.label;
      return `<a href="${attr(hrefFor(it.href, loc))}">${esc(label)} →</a>`;
    })
    .join('');
  return `<div class="related">${links}</div>`;
}

function proseBlocks(blocks) {
  return blocks
    .map((b) => {
      const bits = [];
      if (b.title) bits.push(`<h2>${esc(b.title)}</h2>`);
      if (b.body) bits.push(`<p>${esc(b.body)}</p>`);
      if (b.body2) bits.push(`<p>${esc(b.body2)}</p>`);
      if (Array.isArray(b.bullets) && b.bullets.length) {
        bits.push(`<ul>${b.bullets.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
      }
      if (Array.isArray(b.steps) && b.steps.length) {
        bits.push(`<ul>${b.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
      }
      if (b.link && b.link.href) {
        bits.push(`<p><a class="btn btn-s" href="${attr(hrefFor(b.link.href, 'en'))}">${esc(b.link.label)} →</a></p>`);
      }
      return `<div class="block">${bits.join('')}</div>`;
    })
    .join('');
}

function table(headers, rows) {
  const thead = `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const tbody = rows
    .map((r) => `<tr>${r.map((c) => `<td>${typeof c === 'string' && c.startsWith('<') ? c : esc(c)}</td>`).join('')}</tr>`)
    .join('');
  return `<div class="table-wrap"><table><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
}

function card(inner, i = 0) {
  return `<div class="card reveal">${inner}</div>`;
}

function sectionHead(c, B, page, loc) {
  const navLabel = page.navKey ? B.nav[page.navKey] : null;
  const k = navLabel || (c.header && c.header.eyebrow) || '';
  const h1 = locPage(B, page).heading || (c.header && c.header.headline) || BRAND;
  const lede = (c.header && (c.header.subhead || c.intro)) || '';
  const dates = [c.effectiveDate ? `${B.struct.effective}: ${c.effectiveDate}` : null, c.lastUpdated && c.lastUpdated !== c.effectiveDate ? `${B.struct.updated}: ${c.lastUpdated}` : null]
    .filter(Boolean)
    .join(' · ');
  return `<header class="page-head wrap reveal">
    ${k ? kicker(k) : ''}
    <h1>${esc(h1)}</h1>
    ${lede ? `<p class="lede">${esc(lede)}</p>` : ''}
    ${dates ? `<div class="dates">${esc(dates)}</div>` : ''}
  </header>`;
}

/* --------------------------------------------------------------- FORM */
function renderForm(B) {
  const f = B.form;
  const opt = (v, label) => `<option value="${attr(v)}">${esc(label)}</option>`;
  return `<form id="contactForm" novalidate>
    <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
    <div class="f-row">
      <div>
        <label for="name">${esc(f.name)} <span class="req">*</span></label>
        <input id="name" name="name" type="text" required maxlength="120" placeholder="${attr(f.namePh)}" autocomplete="name">
      </div>
      <div>
        <label for="email">${esc(f.email)} <span class="req">*</span></label>
        <input id="email" name="email" type="email" required maxlength="200" placeholder="${attr(f.emailPh)}" autocomplete="email">
      </div>
    </div>
    <div class="f-row">
      <div>
        <label for="company">${esc(f.companyLabel)} <span class="opt">${esc(f.optional)}</span></label>
        <input id="company" name="company" type="text" maxlength="160" placeholder="${attr(f.companyPh)}" autocomplete="organization">
      </div>
      <div>
        <label for="phone">${esc(f.phone)} <span class="opt">${esc(f.optional)}</span></label>
        <input id="phone" name="phone" type="tel" maxlength="40" placeholder="${attr(f.phonePh)}" autocomplete="tel">
      </div>
    </div>
    <div>
      <label for="interest">${esc(f.interest)} <span class="req">*</span></label>
      <select id="interest" name="interest" required>
        <option value="" disabled selected>${esc(f.select)}</option>
        ${opt('demo', f.optDemo)}
        ${opt('pilot', f.optPilot)}
        ${opt('kurumsal', f.optEnterprise)}
        ${opt('yatirim', f.optInvestor)}
        ${opt('ortaklik', f.optPartner)}
        ${opt('diger', f.optOther)}
      </select>
    </div>
    <div>
      <label for="message">${esc(f.message)} <span class="req">*</span></label>
      <textarea id="message" name="message" required maxlength="3000" placeholder="${attr(f.messagePh)}"></textarea>
    </div>
    <p class="form-note">${esc(f.note)}</p>
    <div class="form-msg" id="formMsg" role="status" aria-live="polite"></div>
    <button type="submit" class="btn-submit" id="submitBtn">
      <span class="spin" aria-hidden="true"></span>
      <span class="lbl">${esc(f.submit)} →</span>
    </button>
  </form>`;
}

/* ----------------------------------------------------------- RENDERERS */
const renderers = {
  home(c, B, loc) {
    const h = c.hero;
    const ev = c.evidenceStrip;
    const faq = B.faq
      .map(
        (f) => `<details class="reveal"><summary>${esc(f.q)}</summary><div class="a">${esc(f.a)}</div></details>`
      )
      .join('');
    return `<header class="hero wrap">
      <div class="orb orb1" aria-hidden="true"></div>
      <div class="orb orb2" aria-hidden="true"></div>
      <div class="badge"><span class="live"></span>${esc(B.hero.eyebrow)}</div>
      <h1>${esc(B.hero.title)} <span class="grad-text">${esc(B.hero.titleAccent)}</span></h1>
      <p class="lede">${esc(B.hero.subtitle)}</p>
      <div class="cta-row">
        <a class="btn btn-p" href="${attr(hrefFor('/contact', loc))}">${esc(B.hero.primaryCta)} →</a>
        <a class="btn btn-s" href="${attr(GH.url)}">${SVG_GH}${esc(B.hero.secondaryCta)}</a>
      </div>
      ${ECG_SVG}
    </header>

    <section class="wrap reveal">
      ${kicker(ev.title)}
      <h2>${esc(c.problem.title)}<br><span class="grad-text">…</span></h2>
      ${c.problem.body.map((p) => `<p class="lede">${esc(p)}</p>`).join('')}
      <div class="notice"><strong>${esc(B.nav.metrics)}:</strong> ${esc(ev.note)}</div>
      <div class="evidence">
        ${ev.items
          .map(
            (it) => `<div class="evidence-item reveal"><div class="v">${metricValue(it.value)}</div><div class="l">${esc(it.label)}</div><div style="margin-top:.5rem">${pill(it.status)}</div></div>`
          )
          .join('')}
      </div>
      ${c.problem.audienceNote ? `<div class="notice">${esc(c.problem.audienceNote)}</div>` : ''}
      <div class="related" aria-label="${attr(B.nav.platform)}">
        <a href="${attr(hrefFor('/platform', loc))}">${esc(B.nav.platform)} →</a>
        <a href="${attr(hrefFor('/metrics', loc))}">${esc(B.nav.metrics)} →</a>
        <a href="${attr(hrefFor('/community', loc))}">${esc(B.nav.community)} →</a>
        <a href="${attr(hrefFor('/open-source', loc))}">${esc(B.nav.openSource)} →</a>
      </div>
    </section>

    <section class="wrap reveal">
      ${kicker(B.struct.pillars)}
      <h2>${esc(c.solution.title)}</h2>
      <p class="lede">${esc(c.solution.body)}</p>
      <div class="cards">
        ${c.solution.pillars
          .map((p, i) => card(`<div class="icon">${GLYPHS[i % GLYPHS.length]}</div><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p>`, i))
          .join('')}
      </div>
    </section>

    <section class="wrap reveal">
      ${kicker(B.struct.trust)}
      <h2>${esc(c.trust.title)}</h2>
      <div class="cards">
        ${c.trust.items
          .map((it, i) => card(`<div class="icon">${GLYPHS[(i + 4) % GLYPHS.length]}</div><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p>`, i))
          .join('')}
      </div>
      <div style="margin-top:3rem">${ctaBand(c.ctaBand, B, loc)}</div>
    </section>

    <section class="wrap faq reveal">
      ${kicker('FAQ')}
      <h2>${esc(B.struct.faqTitle)}</h2>
      <div style="margin-top:1.4rem">${faq}</div>
    </section>`;
  },

  platform(c, B, loc) {
    const a = c.architecture;
    const f = c.features;
    const om = c.operatingModel;
    return `${sectionHead(c, B, PAGE_BY_ID.platform, loc)}
    <section class="wrap reveal">
      ${kicker(a.title)}
      <h2>${esc(a.title)}</h2>
      <p class="section-note">${esc(a.note)}</p>
      <div class="cards">
        ${a.layers
          .map(
            (l, i) =>
              card(`${pill(l.status)}<div class="icon">${GLYPHS[i % GLYPHS.length]}</div><h3>${esc(l.title)}</h3><p>${esc(l.body)}</p>`, i)
          )
          .join('')}
      </div>
    </section>

    <section class="wrap reveal">
      ${kicker(f.title)}
      <h2>${esc(f.title)}</h2>
      <p class="section-note">${esc(f.note)}</p>
      <div class="cards">
        ${f.items
          .map(
            (it, i) =>
              card(`${pill(it.status)}<div class="icon">${GLYPHS[(i + 3) % GLYPHS.length]}</div><h3>${esc(it.name)}</h3><p>${esc(it.body)}</p>`, i)
          )
          .join('')}
      </div>
      <div class="chips" aria-label="${attr(c.languages.title)}">
        <span class="chip">${esc(c.languages.title)}: ${esc(c.languages.value)}</span>
        ${pill(c.languages.status)}
      </div>
    </section>

    <section class="wrap reveal">
      ${kicker(om.title)}
      <h2>${esc(om.title)}</h2>
      <div class="steps">
        ${om.steps
          .map(
            (s, i) =>
              `<div class="step reveal" data-n="${String(s.step).padStart(2, '0')}"><div><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></div></div>`
          )
          .join('')}
      </div>
      <div style="margin-top:3rem">${ctaBand(c.ctaBand, B, loc)}</div>
    </section>`;
  },

  metrics(c, B, loc) {
    return `${sectionHead(c, B, PAGE_BY_ID.metrics, loc)}
    <section class="wrap reveal">
      <div class="cards">
        ${c.metrics
          .map(
            (m, i) =>
              card(
                `${pill(m.status)}
                 <div class="v" style="font-family:'IBM Plex Mono',monospace;font-size:1.6rem;color:var(--teal-l);margin:.4rem 0 .3rem">${metricValue(m.value)}</div>
                 <h3>${esc(m.label)}</h3>
                 <p>${esc(m.notes || '')}</p>
                 <div class="meta">
                   <span><b>${esc(B.struct.methodology)}:</b> ${esc(m.methodology)}</span>
                   <span><b>${esc(B.struct.source)}:</b> ${esc(m.source)}</span>
                   <span><b>${esc(B.struct.date)}:</b> ${esc(m.date)}</span>
                   <span><b>${esc(B.struct.status)}:</b> ${esc(m.status)}</span>
                 </div>`,
                i
              )
          )
          .join('')}
      </div>
      <div class="notice" style="margin-top:2rem"><strong>${esc(B.struct.disclaimer)}:</strong> ${esc(c.disclaimer)}</div>
    </section>

    <section class="wrap reveal">
      ${kicker(B.nav.company)}
      <h2>${esc(c.investorNarrative.note)}</h2>
      <div class="prose" style="margin-top:1.2rem">
        <div class="block"><h2>${esc(B.struct.problem)}</h2><p>${esc(c.investorNarrative.problem)}</p></div>
        <div class="block"><h2>${esc(B.struct.wedge)}</h2><p>${esc(c.investorNarrative.wedge)}</p></div>
        <div class="block"><h2>${esc(B.struct.moat)}</h2><p>${esc(c.investorNarrative.moat)}</p></div>
        <div class="block"><h2>${esc(B.struct.license)}</h2><p>${esc(c.investorNarrative.license)}</p></div>
        <div class="block"><h2>${esc(B.struct.community)}</h2><p>${esc(c.investorNarrative.community)}</p></div>
      </div>
      <div style="margin-top:2rem">${ctaBand(c.ctaBand, B, loc)}</div>
    </section>`;
  },

  community(c, B, loc) {
    return `${sectionHead(c, B, PAGE_BY_ID.community, loc)}
    <section class="wrap reveal">
      <p class="tone-line">${esc(c.tone)}</p>
      <div class="cards">
        ${c.ctas
          .map(
            (x, i) =>
              card(
                `<div class="icon">${SVG_GH}</div><h3>${esc(
                  x.id === 'star' ? B.cta.star : x.id === 'watch' ? B.cta.watch : x.label
                )}</h3><p>${esc(x.body)}</p><div class="meta"><a href="${attr(x.href)}" style="color:var(--teal-l)">${esc(x.href.replace('https://github.com/', ''))} →</a></div>`,
                i
              )
          )
          .join('')}
      </div>
    </section>

    <section class="wrap reveal">
      ${kicker(c.goodFirstIssues.title)}
      <h2>${esc(c.goodFirstIssues.title)}</h2>
      <p class="section-note">${esc(c.goodFirstIssues.note)}</p>
      <div class="cards">
        ${c.goodFirstIssues.items
          .map((it, i) => card(`<div class="icon">${GLYPHS[(i + 6) % GLYPHS.length]}</div><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p>`, i))
          .join('')}
      </div>
    </section>

    <section class="wrap reveal">
      ${kicker(B.struct.coc)}
      <h2>${esc(c.codeOfConduct.title)}</h2>
      <div class="prose" style="margin-top:1rem">
        <div class="block">
          <p>${esc(c.codeOfConduct.body)}</p>
          <p><a class="btn btn-s" href="${attr(c.codeOfConduct.link.href)}">${SVG_GH}${esc(c.codeOfConduct.link.label)} →</a></p>
        </div>
        <div class="block">
          <h2>${esc(B.struct.rules)}</h2>
          <ul>${c.contributionRules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
        </div>
      </div>
      <div style="margin-top:2rem">${ctaBand(c.ctaBand, B, loc)}</div>
    </section>`;
  },

  'open-source'(c, B, loc) {
    const d = c.dualLicense;
    return `${sectionHead(c, B, PAGE_BY_ID['open-source'], loc)}
    <section class="wrap reveal">
      ${kicker(d.title)}
      <h2>${esc(d.title)}</h2>
      <p class="lede">${esc(d.body)}</p>
      ${table(
        [B.struct.colLicense, B.struct.colGrant, B.struct.colBestFor, B.struct.colConsiderations],
        d.table.map((r) => [`<b>${esc(r.license)}</b>`, r.grant, r.bestFor, r.considerations])
      )}
      <div class="cards" style="margin-top:1.5rem">
        ${d.whichForWhom
          .map((w, i) => card(`<h3>${esc(w.audience)}</h3><p>${esc(w.recommendation)}</p>`, i))
          .join('')}
      </div>
    </section>

    <section class="wrap reveal">
      ${kicker(c.boundary.title)}
      <h2>${esc(c.boundary.title)}</h2>
      ${table(
        [B.struct.colScope, B.struct.colItem, B.struct.colLicense],
        c.boundary.rows.map((r) => [
          `<span class="status ${r.scope === 'Open' ? 'status-architecture' : 'status-roadmap'}">${esc(r.scope)}</span>`,
          r.item,
          r.license
        ])
      )}
    </section>

    <section class="wrap reveal">
      <div class="cards">
        ${card(
          `<h3>${esc(c.commercial.title)}</h3><p>${esc(c.commercial.body)}</p><div class="meta"><a href="${attr(hrefFor(c.commercial.cta.href, loc))}" style="color:var(--teal-l)">${esc(c.commercial.cta.label)} →</a></div>`
        )}
        ${card(
          `${pill(c.earlyAccess.status)}<h3>${esc(c.earlyAccess.title)}</h3><p>${esc(c.earlyAccess.body)}</p>`
        )}
      </div>
      <div style="margin-top:2.5rem">${ctaBand(c.ctaBand, B, loc)}</div>
    </section>`;
  },

  company(c, B, loc) {
    const p = c.profile;
    const aud = c.audiences;
    return `${sectionHead(c, B, PAGE_BY_ID.company, loc)}
    <section class="wrap reveal" id="profile">
      ${kicker(p.title)}
      <h2>${esc(p.title)}</h2>
      <p class="lede">${esc(p.body)}</p>
      ${table([B.struct.colKey, B.struct.colValue], p.facts.map((f) => [`<b>${esc(f.key)}</b>`, f.value]))}
    </section>

    <section class="wrap reveal" id="audiences">
      ${kicker(B.struct.audiencesTitle)}
      <h2>${esc(B.struct.audiencesTitle)}</h2>
      <div class="cards">
        ${[aud.press, aud.investors, aud.developers]
          .map(
            (a, i) =>
              card(`<div class="icon">${GLYPHS[(i + 2) % GLYPHS.length]}</div><h3>${esc(a.title)}</h3><ul style="list-style:none;display:flex;flex-direction:column;gap:.5rem;margin-top:.6rem">${a.bullets.map((b) => `<li style="color:var(--dim);font-size:.88rem">• ${esc(b)}</li>`).join('')}</ul>`, i)
          )
          .join('')}
      </div>
    </section>

    <section class="wrap reveal">
      ${kicker(B.struct.channels)}
      <h2>${esc(B.struct.channels)}</h2>
      <div class="cards">
        ${c.contactChannels
          .map(
            (ch, i) =>
              card(`<h3>${esc(ch.label)}</h3><p>${esc(ch.value)}</p><div class="meta"><a href="${attr(hrefFor(ch.href, loc))}" style="color:var(--teal-l)">${ch.href.startsWith('http') ? esc(ch.href.replace('https://', '')) : esc(B.nav.contact)} →</a></div>`, i)
          )
          .join('')}
      </div>
      <div style="margin-top:2.5rem">${ctaBand(c.ctaBand, B, loc)}</div>
    </section>`;
  },

  contact(c, B, loc) {
    const trackIcons = ['▶', '◎', '◇', '✉'];
    return `${sectionHead(c, B, PAGE_BY_ID.contact, loc)}
    <section class="wrap reveal">
      <p class="lede">${esc(c.intro)}</p>
      <div class="cards">
        ${c.tracks
          .map(
            (t, i) => card(`<div class="icon">${trackIcons[i] || '•'}</div><h3>${esc(t.title)}</h3><p>${esc(t.body)}</p>`, i)
          )
          .join('')}
      </div>
      <div class="notice"><strong>${esc(B.struct.expectations)}:</strong> ${c.expectations.map((e) => esc(e)).join(' · ')}</div>
    </section>

    <section class="wrap form-section reveal">
      <div class="form-shell">
        <div class="form-info">
          ${kicker(B.nav.contact)}
          <h2>${esc(B.form.title)}</h2>
          <ul>
            ${c.expectations.map((e) => `<li><span class="ck">✓</span> ${esc(e)}</li>`).join('')}
          </ul>
          <div class="contact-meta">
            <strong>${esc(B.form.direct)}</strong> <a href="mailto:hello@konsenxia.com">hello@konsenxia.com</a><br>
            <span style="font-size:.78rem;opacity:.75">${esc(B.form.routing)}</span><br><br>
            ${c.alternativeChannels.map((a) => `<a href="${attr(hrefFor(a.href, loc))}">${esc(a.label)} →</a><br>`).join('')}
            <p class="form-note" style="margin-top:.9rem">${esc(c.privacyNote)}</p>
          </div>
        </div>
        ${renderForm(B)}
      </div>
      <div style="margin-top:2.5rem">${ctaBand(c.ctaBand, B, loc)}</div>
    </section>`;
  },

  privacy(c, B, loc) {
    const disclaimer = `<div class="notice"><strong>${esc(B.struct.disclaimer)}:</strong> KONSENXIA is decision support for licensed clinicians. This site is product information only — not medical advice, diagnosis, or treatment, and not a medical device claim unless a sourced regulatory clearance is published.</div>`;
    return `${sectionHead(c, B, PAGE_BY_ID.privacy, loc)}
    <section class="wrap reveal"><div class="prose">${proseBlocks(c.sections)}</div>${disclaimer}${relatedLinks(c.related, B, loc)}</section>`;
  },

  terms(c, B, loc) {
    return `${sectionHead(c, B, PAGE_BY_ID.terms, loc)}
    <section class="wrap reveal"><div class="prose">${proseBlocks(c.sections)}</div>${relatedLinks(c.related, B, loc)}</section>`;
  },

  cookies(c, B, loc) {
    return `${sectionHead(c, B, PAGE_BY_ID.cookies, loc)}
    <section class="wrap reveal">
      <div class="prose">
        <div class="block"><h2>${esc(B.struct.principles)}</h2><ul>${c.principles.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
      </div>
      ${table(
        [B.struct.colName, B.struct.colCategory, B.struct.colPurpose, B.struct.colDuration, B.struct.colConsent],
        c.cookies.map((k) => [`<b>${esc(k.name)}</b>`, k.category, k.purpose, k.duration, k.consent])
      )}
      <div class="prose" style="margin-top:1.5rem">
        <div class="block"><h2>${esc(c.management.title)}</h2><p>${esc(c.management.body)}</p></div>
      </div>
      ${relatedLinks(c.related, B, loc)}
    </section>`;
  },

  security(c, B, loc) {
    const disclaimer = `<div class="notice"><strong>${esc(B.struct.disclaimer)}:</strong> Architecture and “designed for” statements are documentation goals — not certifications, clearances, or medical device claims. Status labels are architecture or roadmap unless a lab source exists.</div>`;
    return `${sectionHead(c, B, PAGE_BY_ID.security, loc)}
    <section class="wrap reveal"><div class="prose">${proseBlocks(c.sections)}</div>${disclaimer}${relatedLinks(c.related, B, loc)}</section>`;
  },

  licenses(c, B, loc) {
    const blocks = c.sections
      .map((s) => {
        const bits = [`<h2>${esc(s.title)}</h2>`];
        if (s.body) bits.push(`<p>${esc(s.body)}</p>`);
        if (Array.isArray(s.table)) {
          bits.push(
            table(
              [B.struct.colComponent, B.struct.colLicense],
              s.table.map((r) => [`<b>${esc(r.component)}</b>`, r.license])
            )
          );
        }
        if (s.body2) bits.push(`<p>${esc(s.body2)}</p>`);
        if (s.link) bits.push(`<p><a class="btn btn-s" href="${attr(hrefFor(s.link.href, loc))}">${esc(s.link.label)} →</a></p>`);
        return `<div class="block">${bits.join('')}</div>`;
      })
      .join('');
    return `${sectionHead(c, B, PAGE_BY_ID.licenses, loc)}
    <section class="wrap reveal"><div class="prose">${blocks}</div>${relatedLinks(c.related, B, loc)}</section>`;
  }
};

/* --------------------------------------------------------------- LAYOUT */
function renderHead({ page, loc, locMeta, B, content }) {
  const title =
    page.id === 'home' ? B.pages.home.title : `${locPage(B, page).title} · ${BRAND}`;
  const desc = trimDesc(locPage(B, page).description);
  const canonical = pageUrl(page, loc);

  const hreflang = LOCALE_LIST.map(
    (l) => `<link rel="alternate" hreflang="${l.code}" href="${attr(pageUrl(page, l.code))}">`
  ).join('');
  const xDefault = `<link rel="alternate" hreflang="x-default" href="${attr(pageUrl(page, 'en'))}">`;

  /* JSON-LD */
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    url: ORIGIN,
    logo: `${ORIGIN}/assets/icon.svg`,
    description: trimDesc(B.footer.description, 300),
    sameAs: SOCIAL.map((s) => s.href),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hello@konsenxia.com',
      availableLanguage: LOCALE_LIST.map((l) => l.code)
    }
  };
  const ld = [org];

  if (page.id === 'home') {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: BRAND,
      url: ORIGIN,
      inLanguage: loc,
      description: trimDesc(B.pages.home.description, 300),
      publisher: { '@type': 'Organization', name: BRAND, url: ORIGIN }
    });
  }

  if (page.id === 'home' || page.id === 'platform') {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: BRAND,
      applicationCategory: 'HealthAndFitness',
      genre: 'Medical software',
      operatingSystem: 'Web',
      url: ORIGIN,
      description: trimDesc(B.pages.home.description, 300),
      inLanguage: loc,
      publisher: { '@type': 'Organization', name: BRAND, url: ORIGIN },
      isAccessibleForFree: true
    });
  }

  if (page.id !== 'home') {
    const items = [
      {
        '@type': 'ListItem',
        position: 1,
        name: B.nav.home,
        item: pageUrl(PAGE_BY_ID.home, loc)
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: (page.navKey && B.nav[page.navKey]) || locPage(B, page).title,
        item: canonical
      }
    ];
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items
    });
  }

  if (page.id === 'home') {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: B.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    });
  }

  const formJson = attr(
    JSON.stringify({
      errRequired: B.form.errRequired,
      errEmail: B.form.errEmail,
      errGeneric: B.form.errGeneric,
      success: B.form.success
    })
  );

  return `<!DOCTYPE html>
<html lang="${attr(loc)}" dir="${attr(locMeta.dir)}" data-form="${formJson}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${attr(desc)}">
<meta name="theme-color" content="#060a14">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="googlebot" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${attr(canonical)}">
${xDefault}
${hreflang}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${attr(BRAND)}">
<meta property="og:locale" content="${attr(locMeta.og)}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${attr(canonical)}">
<meta property="og:image" content="${attr(ORIGIN + '/assets/icon.svg')}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(desc)}">
<meta name="twitter:image" content="${attr(ORIGIN + '/assets/icon.svg')}">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>:root{--void:#060a14;--base:#0a0f1e;--ink:#f0f4ff}body{font-family:'Space Grotesk',system-ui,sans-serif;background:var(--void);color:var(--ink);margin:0}</style>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"></noscript>
<link rel="stylesheet" href="/assets/site.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/assets/site.css"></noscript>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script src="/assets/site.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
<div class="grid-bg" aria-hidden="true"></div>
<div class="pulse-bg" aria-hidden="true"></div>`;
}

function renderNav({ page, loc, B }) {
  const links = NAV_ITEMS.map((it) => {
    const p = PAGE_BY_ID[it.id];
    const current = page.id === it.id ? ' aria-current="page"' : '';
    return `<a class="nlink" href="${attr(pagePath(p, loc))}"${current}>${esc(B.nav[it.navKey])}</a>`;
  }).join('');

  const localeLinks = LOCALE_LIST.map((l) => {
    const cur = l.code === loc ? ' aria-current="true"' : '';
    return `<a href="${attr(pagePath(page, l.code))}" hreflang="${attr(l.code)}"${cur}><span>${esc(l.name)}</span><span class="code">${l.code}</span></a>`;
  }).join('');

  const panelLinks =
    `<a href="${attr(pagePath(PAGE_BY_ID.home, loc))}">${esc(B.nav.home)}</a>` +
    NAV_ITEMS.map((it) => `<a href="${attr(pagePath(PAGE_BY_ID[it.id], loc))}">${esc(B.nav[it.navKey])}</a>`).join('') +
    `<a href="${attr(GH.url)}">${SVG_GH} ${esc(B.nav.github)}</a>` +
    `<a class="nav-cta" href="${attr(pagePath(PAGE_BY_ID.contact, loc))}">${esc(B.nav.demo)}</a>`;

  return `<nav aria-label="${attr(B.nav.menu)}">
  <a class="nav-logo" href="${attr(pagePath(PAGE_BY_ID.home, loc))}"><span class="pulse"></span>${BRAND}</a>
  ${links}
  <a class="nlink nav-gh" href="${attr(GH.url)}" rel="noopener">${SVG_GH}<span>${esc(B.nav.github)}</span></a>
  <a class="nlink nav-cta" href="${attr(pagePath(PAGE_BY_ID.contact, loc))}">${esc(B.nav.demo)}</a>
  <details class="locale">
    <summary aria-label="${attr(B.nav.language)}">🌐 <span>${esc(loc.toUpperCase())}</span></summary>
    <div class="locale-menu">${localeLinks}</div>
  </details>
  <button class="nav-burger" type="button" aria-expanded="false" aria-label="${attr(B.nav.menu)}">☰ ${esc(B.nav.menu)}</button>
</nav>
<div class="nav-panel">${panelLinks}</div>`;
}

function renderFooter({ loc, B }) {
  const cols = FOOTER_COLS.map(
    (col) => `<div class="footer-col">
      <h4>${esc(B.footer.columns[col.key])}</h4>
      <ul>${col.links
        .map(
          (l) =>
            `<li><a href="${attr(hrefFor(l.href, loc))}"${l.href.startsWith('http') ? ' rel="noopener"' : ''}>${esc(
              B.footer.links[l.lk]
            )}</a></li>`
        )
        .join('')}</ul>
    </div>`
  ).join('');

  const social = SOCIAL.map(
    (s) =>
      `<a href="${attr(s.href)}" aria-label="${attr(s.label)}" rel="noopener">${SOCIAL_SVG[s.id]}</a>`
  ).join('');

  return `<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <a class="nav-logo" href="${attr(pagePath(PAGE_BY_ID.home, loc))}"><span class="pulse"></span>${BRAND}</a>
      <p>${esc(B.footer.description)}</p>
      <div class="footer-social">${social}</div>
      <p class="footer-tag">${esc(B.footer.tagline)}</p>
    </div>
    ${cols}
  </div>
  <div class="footer-bottom">
    <span>${esc(B.footer.legalLine.replace('{year}', String(new Date().getFullYear())))}</span>
    <span class="lic">MIT OR Apache-2.0</span>
  </div>
</footer>
</body>
</html>`;
}

function renderPage(page, loc, locMeta, B, content) {
  const renderer = renderers[page.id];
  if (!renderer) throw new Error(`No renderer for page ${page.id}`);
  const body = renderer(content, B, loc === undefined ? 'en' : loc);
  return renderHead({ page, loc, locMeta, B, content }) + renderNav({ page, loc, B }) + `<main id="main">${body}</main>` + renderFooter({ loc, B });
}

/* -------------------------------------------------------- static assets */
function writePublicFile(rel, data) {
  const full = path.join(PUBLIC_DIR, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, data);
}

function buildSitemap() {
  const urls = [];
  for (const page of PAGES) {
    for (const l of LOCALE_LIST) {
      urls.push(`  <url>\n    <loc>${pageUrl(page, l.code)}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${page.id === 'home' ? '1.0' : '0.7'}</priority>\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

function buildRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;
}

function buildLlms(B, content) {
  const lines = [
    `# ${BRAND}`,
    '',
    `> Healthcare AI platform for clinician collaboration, AI-assisted consultation, and anonymized learning. Architecture-first, roadmap-honest.`,
    '',
    `KONSENXIA is decision support for licensed clinicians. This website is product information for professional evaluation.`,
    '',
    '## Healthcare claim boundaries',
    '',
    '- This site does **not** provide medical advice, diagnosis, or treatment recommendations.',
    '- Nothing here is a clinical performance claim. Status labels are `architecture` or `roadmap` unless a lab source exists (see /metrics).',
    '- "Designed for" anonymization / KVKK / GDPR / HIPAA-aligned posture means design goals documented in architecture and legal records — **not certifications or regulatory clearances**.',
    '- The landing site code is MIT OR Apache-2.0; the clinical application, models, and datasets are proprietary under agreement.',
    '- Never submit patient data through website forms or GitHub issues.',
    '',
    '## License',
    '',
    `Landing site source is dual-licensed **MIT OR Apache-2.0**. The clinical application, models, and datasets are proprietary and provided under commercial agreement only.`,
    '',
    `Repository: ${GH.url}`,
    '',
    '## Pages',
    '',
    ...PAGES.map((p) => {
      const desc = trimDesc(locPage(B, p).description, 200);
      return `- [${locPage(B, p).title}](${pageUrl(p, 'en')}): ${desc}`;
    }),
    '',
    '## Contact',
    '',
    '- Demo / pilot / investor / partner: https://konsenxia.com/contact/',
    '- Repository: ' + GH.url,
    '- Security disclosure: https://konsenxia.com/security/',
    '',
    `Last updated: ${new Date().toISOString().slice(0, 10)}`,
    ''
  ];
  return lines.join('\n');
}

function collectText(obj, out = [], key = '') {
  if (obj == null) return out;
  if (typeof obj === 'string') {
    out.push(`${key}: ${obj}`);
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => collectText(v, out, key ? `${key}[${i}]` : `[${i}]`));
    return out;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (['site', 'locale', 'designLanguage', 'page', 'policyRef'].includes(k)) continue;
      collectText(v, out, key ? `${key}.${k}` : k);
    }
  }
  return out;
}

function buildLlmsFull(enBundle, content) {
  const parts = [
    `${BRAND} — full site content (EN, source of truth)`,
    `Source: _content/en/konsenxia/ · Generated ${new Date().toISOString().slice(0, 10)}`,
    '',
    'HEALTHCARE CLAIM BOUNDARIES: not medical advice; not certification claims; status labels are architecture/roadmap unless a lab source exists; "designed for" ≠ "certified".',
    ''
  ];
  parts.push('=== nav.json ===', ...collectText(content.nav));
  parts.push('', '=== footer.json ===', ...collectText(content.footer));
  for (const page of PAGES) {
    parts.push('', `=== pages/${page.content}.json ===`, ...collectText(content.pages[page.content]));
  }
  parts.push('', '=== locale strings (EN) ===', ...collectText(enBundle));
  return parts.join('\n') + '\n';
}

function buildManifest(B) {
  return JSON.stringify(
    {
      name: `${BRAND} — Healthcare AI for clinician collaboration`,
      short_name: BRAND,
      description: trimDesc(B.pages.home.description, 200),
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#060a14',
      theme_color: '#060a14',
      lang: 'en',
      icons: [{ src: '/assets/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
    },
    null,
    2
  );
}

function build404(B) {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 — ${BRAND}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet"></noscript>
<link rel="stylesheet" href="/assets/site.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/assets/site.css"></noscript>
<style>body{display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center}.nf{position:relative;z-index:1;padding:2rem}.nf h1{font-size:clamp(3rem,10vw,6rem);background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}.nf p{color:var(--dim);margin:.8rem 0 1.6rem}</style>
</head>
<body>
<div class="grid-bg" aria-hidden="true"></div>
<div class="pulse-bg" aria-hidden="true"></div>
<div class="nf">
  <div class="badge" style="margin-inline:auto"><span class="live"></span>${BRAND}</div>
  <h1>404</h1>
  <p>${esc(B.notFound.title)} — ${esc(B.notFound.body)}</p>
  <a class="btn btn-p" href="/">${esc(B.notFound.home)} →</a>
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ main */
function main() {
  const started = Date.now();

  /* load content (EN source of truth) */
  const content = {
    nav: readJSON(path.join(CONTENT_DIR, 'nav.json')),
    footer: readJSON(path.join(CONTENT_DIR, 'footer.json')),
    github: readJSON(path.join(CONTENT_DIR, 'github.json')),
    pages: {}
  };
  for (const p of PAGES) {
    content.pages[p.content] = readJSON(path.join(CONTENT_DIR, 'pages', `${p.content}.json`));
  }

  /* load locales */
  const locales = {};
  for (const l of LOCALE_LIST) {
    const file = path.join(LOCALES_DIR, `${l.code}.json`);
    if (!fs.existsSync(file)) throw new Error(`Missing locale file: ${file}`);
    locales[l.code] = readJSON(file);
  }
  const enBase = locales.en;

  /* orphan-key guard: no locale may contain keys absent from en.json */
  function keySet(obj, prefix = '', set = new Set()) {
    if (Array.isArray(obj)) {
      // arrays are replaced wholesale; only record the path itself
      if (prefix) set.add(prefix);
      return set;
    }
    if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        const p = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) keySet(v, p, set);
        else set.add(p);
      }
    }
    return set;
  }
  const enKeys = keySet(enBase);
  for (const l of LOCALE_LIST) {
    if (l.code === 'en') continue;
    for (const k of keySet(locales[l.code])) {
      if (!enKeys.has(k)) throw new Error(`Orphan key in ${l.code}.json: ${k}`);
    }
  }

  /* merged bundles (locale over EN — missing keys fall back to EN) */
  const bundles = {};
  for (const l of LOCALE_LIST) bundles[l.code] = deepMerge(enBase, locales[l.code]);

  /* fresh public/ */
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  /* copy design assets */
  fs.mkdirSync(path.join(PUBLIC_DIR, 'assets'), { recursive: true });
  fs.copyFileSync(path.join(ASSETS_SRC, 'site.css'), path.join(PUBLIC_DIR, 'assets', 'site.css'));
  fs.copyFileSync(path.join(ASSETS_SRC, 'site.js'), path.join(PUBLIC_DIR, 'assets', 'site.js'));
  fs.writeFileSync(path.join(PUBLIC_DIR, 'assets', 'icon.svg'), ICON_SVG);

  /* render pages: 19 locales × 12 pages */
  let pageCount = 0;
  for (const l of LOCALE_LIST) {
    for (const page of PAGES) {
      const html = renderPage(page, l.code, l, bundles[l.code], content.pages[page.content]);
      writePublicFile(path.join(pagePath(page, l.code), 'index.html').replace(/^\//, ''), html);
      pageCount++;
    }
  }

  /* static SEO files */
  writePublicFile('sitemap.xml', buildSitemap());
  writePublicFile('robots.txt', buildRobots());
  writePublicFile('llms.txt', buildLlms(bundles.en, content));
  writePublicFile('llms-full.txt', buildLlmsFull(bundles.en, content));
  writePublicFile('manifest.webmanifest', buildManifest(bundles.en));
  writePublicFile('404.html', build404(bundles.en));
  writePublicFile('.nojekyll', '');

  /* summary */
  const countDir = (dir) => {
    let n = 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) n += countDir(path.join(dir, e.name));
      else n++;
    }
    return n;
  };
  const files = countDir(PUBLIC_DIR);
  const sample = pageUrl(PAGE_BY_ID.platform, 'tr');
  console.log(`✔ KONSENXIA build OK — ${pageCount} HTML pages (${LOCALE_LIST.length} locales × ${PAGES.length} pages), ${files} files total in public/`);
  console.log(`  sample hreflang: <link rel="alternate" hreflang="tr" href="${sample}">`);
  console.log(`  x-default: ${pageUrl(PAGE_BY_ID.platform, 'en')}`);
  console.log(`  done in ${Date.now() - started}ms`);
}

main();
