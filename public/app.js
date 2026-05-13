/**
 * AGMATIX AI PRO – Main Application Script
 * Handles: Pi Wallet connection UI, marketplace listings,
 *          portfolio tracker, export (CSV/JSON), and animations.
 */

'use strict';

/* =====================================================
   SAMPLE DATA
   ===================================================== */

const LISTINGS = [
  { id: 1, name: 'Wheat',       emoji: '🌾', category: 'grain',     price: 12.50, qty: '50 tons',  seller: 'FarmCo_NG',  trend: +2.3 },
  { id: 2, name: 'Maize',       emoji: '🌽', category: 'grain',     price:  8.75, qty: '80 tons',  seller: 'AgriHub_KE', trend: -0.8 },
  { id: 3, name: 'Soybeans',    emoji: '🫘', category: 'grain',     price: 15.00, qty: '30 tons',  seller: 'PiFarm_BR',  trend: +4.1 },
  { id: 4, name: 'Tomatoes',    emoji: '🍅', category: 'vegetable', price:  3.20, qty: '5 tons',   seller: 'FreshVeg_IN', trend: -1.2 },
  { id: 5, name: 'Potatoes',    emoji: '🥔', category: 'vegetable', price:  2.40, qty: '20 tons',  seller: 'SpudKing_PL', trend: +0.5 },
  { id: 6, name: 'Mangoes',     emoji: '🥭', category: 'fruit',     price:  6.80, qty: '10 tons',  seller: 'TropiFarm_MX', trend: +1.9 },
  { id: 7, name: 'Apples',      emoji: '🍎', category: 'fruit',     price:  4.50, qty: '15 tons',  seller: 'OrchardPi_US', trend: -0.3 },
  { id: 8, name: 'Cattle',      emoji: '🐄', category: 'livestock', price: 250.0, qty: '5 head',   seller: 'RanchPi_AR', trend: +3.0 },
  { id: 9, name: 'Chickens',    emoji: '🐓', category: 'livestock', price: 18.00, qty: '100 birds', seller: 'PoultryPi_NG', trend: +0.7 },
];

const PORTFOLIO = [
  { commodity: '🌾 Wheat',    qty: 10, avgBuy: 11.20, current: 12.50 },
  { commodity: '🌽 Maize',    qty:  5, avgBuy:  9.00, current:  8.75 },
  { commodity: '🍅 Tomatoes', qty: 20, avgBuy:  2.90, current:  3.20 },
  { commodity: '🥭 Mangoes',  qty:  8, avgBuy:  5.50, current:  6.80 },
];

/* =====================================================
   HERO STATS — ANIMATED COUNTERS
   ===================================================== */

function animateCounter(el, target, duration = 1800, suffix = '') {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = Math.floor(eased * target);
    el.textContent = value.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      animateCounter(document.getElementById('statFarmers'), 4_820);
      animateCounter(document.getElementById('statListings'), 1_230);
      animateCounter(document.getElementById('statVolume'), 98_500, 1800, '+');
    });
  }, { threshold: 0.4 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) observer.observe(heroStats);
}

/* =====================================================
   NAVBAR — MOBILE TOGGLE
   ===================================================== */

function initNavbar() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });

  // Close on link click (mobile)
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

/* =====================================================
   PI WALLET CONNECTION (STUB)
   ===================================================== */

let walletConnected = false;

function initWalletConnect() {
  const btn = document.getElementById('connectBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (walletConnected) {
      walletConnected = false;
      btn.textContent = 'Connect Pi Wallet';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-outline');
      showToast('Pi Wallet disconnected.');
    } else {
      // In a real deployment this would call Pi SDK authenticate()
      walletConnected = true;
      btn.textContent = '✔ Pi Wallet Connected';
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');
      showToast('🎉 Pi Wallet connected! (demo mode)');
      document.getElementById('portfolioNotice').style.display = 'none';
    }
  });

  const getStartedBtn = document.getElementById('getStartedBtn');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      document.getElementById('marketplace').scrollIntoView({ behavior: 'smooth' });
    });
  }
}

/* =====================================================
   MARKETPLACE LISTINGS
   ===================================================== */

function renderListings(items) {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;

  grid.innerHTML = items.length
    ? items.map(item => `
      <div class="listing-card" data-category="${item.category}">
        <div class="listing-header">
          <span class="listing-emoji">${item.emoji}</span>
          <div>
            <div class="listing-name">${escapeHtml(item.name)}</div>
            <div class="listing-category">${escapeHtml(item.category)}</div>
          </div>
        </div>
        <div class="listing-price">${item.price.toFixed(2)} π</div>
        <div class="listing-meta">
          <span>Qty: ${escapeHtml(item.qty)}</span>
          <span class="listing-trend ${item.trend >= 0 ? 'trend-up' : 'trend-down'}">
            ${item.trend >= 0 ? '▲' : '▼'} ${Math.abs(item.trend).toFixed(1)}%
          </span>
        </div>
        <div class="listing-meta">
          <span>Seller: ${escapeHtml(item.seller)}</span>
        </div>
        <button class="btn btn-primary" onclick="handleBuy(${item.id})">Buy Now</button>
      </div>
    `).join('')
    : '<p style="color:var(--color-text-muted);grid-column:1/-1;text-align:center;padding:3rem 0">No listings found.</p>';
}

function initMarketplace() {
  renderListings(LISTINGS);

  const searchInput  = document.getElementById('marketSearch');
  const filterSelect = document.getElementById('marketFilter');
  if (!searchInput || !filterSelect) return;

  function applyFilters() {
    const query    = searchInput.value.trim().toLowerCase();
    const category = filterSelect.value;
    const filtered = LISTINGS.filter(item => {
      const matchesSearch   = !query    || item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
      const matchesCategory = !category || item.category === category;
      return matchesSearch && matchesCategory;
    });
    renderListings(filtered);
  }

  searchInput.addEventListener('input',  applyFilters);
  filterSelect.addEventListener('change', applyFilters);
}

window.handleBuy = function handleBuy(id) {
  const listing = LISTINGS.find(l => l.id === id);
  if (!listing) return;
  if (!walletConnected) {
    showToast('⚠️ Please connect your Pi Wallet first.');
    return;
  }
  showToast(`Purchase of ${listing.name} at ${listing.price.toFixed(2)} π initiated! (demo)`);
};

/* =====================================================
   PORTFOLIO TRACKER
   ===================================================== */

function initPortfolio() {
  renderPortfolio();

  document.getElementById('exportCsvBtn')?.addEventListener('click',  () => exportPortfolio('csv'));
  document.getElementById('exportJsonBtn')?.addEventListener('click', () => exportPortfolio('json'));
}

function renderPortfolio() {
  const tbody       = document.getElementById('portfolioBody');
  const valueEl     = document.getElementById('portfolioValue');
  if (!tbody || !valueEl) return;

  let totalValue = 0;

  tbody.innerHTML = PORTFOLIO.map(row => {
    const currentValue = row.qty * row.current;
    const cost         = row.qty * row.avgBuy;
    const pl           = currentValue - cost;
    const plPct        = ((pl / cost) * 100).toFixed(2);
    const cls          = pl >= 0 ? 'positive' : 'negative';
    const sign         = pl >= 0 ? '+' : '';
    totalValue        += currentValue;

    return `
      <tr>
        <td>${row.commodity}</td>
        <td>${row.qty}</td>
        <td>${row.avgBuy.toFixed(2)}</td>
        <td>${row.current.toFixed(2)}</td>
        <td class="${cls}">${sign}${pl.toFixed(2)} π</td>
        <td class="${cls}">${sign}${plPct}%</td>
      </tr>
    `;
  }).join('');

  valueEl.textContent = `${totalValue.toFixed(2)} π`;
}

/* =====================================================
   EXPORT PORTFOLIO
   ===================================================== */

/**
 * Export portfolio data as CSV or JSON.
 * Security: only exports display-level data; no keys or credentials.
 *
 * @param {'csv'|'json'} format
 */
function exportPortfolio(format) {
  const rows = PORTFOLIO.map(row => {
    const pl    = (row.qty * row.current) - (row.qty * row.avgBuy);
    const plPct = ((pl / (row.qty * row.avgBuy)) * 100).toFixed(2);
    return {
      commodity:   row.commodity,
      quantity:    row.qty,
      avg_buy_pi:  row.avgBuy,
      current_pi:  row.current,
      pl_pi:       parseFloat(pl.toFixed(2)),
      pl_pct:      parseFloat(plPct),
    };
  });

  let content, mimeType, filename;

  if (format === 'json') {
    content  = JSON.stringify({ exported_at: new Date().toISOString(), portfolio: rows }, null, 2);
    mimeType = 'application/json';
    filename = 'agmatix-portfolio.json';
  } else {
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map(r => headers.map(h => JSON.stringify(String(r[h]))).join(',')),
    ];
    content  = csvRows.join('\n');
    mimeType = 'text/csv';
    filename = 'agmatix-portfolio.csv';
  }

  triggerDownload(content, mimeType, filename);
  showToast(`✅ Portfolio exported as ${filename}`);
}

function triggerDownload(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* =====================================================
   TOAST NOTIFICATION
   ===================================================== */

let toastTimer = null;

function showToast(message, duration = 3500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');

  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* =====================================================
   SECURITY HELPERS
   ===================================================== */

/**
 * Escapes HTML special characters to prevent XSS when
 * injecting user-visible strings into innerHTML.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =====================================================
   BOOTSTRAP
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCounters();
  initWalletConnect();
  initMarketplace();
  initPortfolio();
});
