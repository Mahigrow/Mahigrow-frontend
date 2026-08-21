// ─────────────────────────────────────────────
//  js/catalogue.js
//  Loads products from API, cart, Razorpay
//  Requires: api.js loaded before this
// ─────────────────────────────────────────────

let allProducts  = [];
let cart         = {};
let activeCat    = null;

// ── SVG icons per category ───────────────────
function getCatSVG(cat, size = 48) {
  const s = size;
  const icons = {
    seeds:        `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="12" rx="5" ry="10" fill="#0a7a30" opacity=".85"/><path d="M24 22 Q18 30 18 42" stroke="#086826" stroke-width="3" stroke-linecap="round"/><path d="M24 30 Q32 26 33 18" stroke="#0a7a30" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="24" cy="42" r="4" fill="#e8a020"/></svg>`,
    pesticides:   `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none"><rect x="16" y="18" width="16" height="24" rx="4" fill="#FDF3DC" stroke="#e8a020" stroke-width="2"/><rect x="19" y="10" width="10" height="10" rx="2.5" fill="#e8a020" opacity=".65"/><rect x="17" y="7" width="14" height="5" rx="2" fill="#e8a020"/><line x1="20" y1="27" x2="28" y2="27" stroke="#e8a020" stroke-width="1.8" stroke-linecap="round"/><circle cx="36" cy="16" r="8" fill="#c0321a" opacity=".9"/><line x1="36" y1="12" x2="36" y2="17.5" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="36" cy="19.5" r="1.5" fill="white"/></svg>`,
    insecticides: `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none"><ellipse cx="22" cy="32" rx="7" ry="9" fill="#c0321a" opacity=".75"/><circle cx="22" cy="18" r="7" fill="#c0321a" opacity=".85"/><line x1="19" y1="13" x2="15" y2="9" stroke="#c0321a" stroke-width="2" stroke-linecap="round"/><line x1="25" y1="13" x2="29" y2="9" stroke="#c0321a" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="27" x2="9" y2="25" stroke="#c0321a" stroke-width="1.8" stroke-linecap="round"/><line x1="29" y1="27" x2="35" y2="25" stroke="#c0321a" stroke-width="1.8" stroke-linecap="round"/><circle cx="36" cy="13" r="9" fill="white" stroke="#0a7a30" stroke-width="2.2"/><line x1="32" y1="9" x2="40" y2="17" stroke="#0a7a30" stroke-width="2.8" stroke-linecap="round"/><line x1="40" y1="9" x2="32" y2="17" stroke="#0a7a30" stroke-width="2.8" stroke-linecap="round"/></svg>`,
    fertilisers:  `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none"><rect x="10" y="28" width="28" height="16" rx="4" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="2"/><path d="M15 28 L19 14 L29 14 L33 28" stroke="#1D4ED8" stroke-width="2.2" stroke-linejoin="round" fill="none"/><path d="M19.5 14 Q24 10 28.5 14" stroke="#1D4ED8" stroke-width="2" fill="none" stroke-linecap="round"/><text x="24" y="40" text-anchor="middle" font-size="7" fill="#1D4ED8" font-weight="800" font-family="sans-serif" opacity=".75">NPK</text></svg>`,
    fungicides:   `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none"><path d="M24 4L40 10V22C40 34 24 44 24 44C24 44 8 34 8 22V10L24 4Z" fill="#EDE9FE" stroke="#6D28D9" stroke-width="2.2" stroke-linejoin="round"/><path d="M16 24L21 29L32 18" stroke="#6D28D9" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    herbicides:   `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none"><path d="M24 44 L24 22" stroke="#0a7a30" stroke-width="3" stroke-linecap="round"/><path d="M24 32 Q16 26 16 14 Q24 15 24 24" fill="#0a7a30" opacity=".6"/><path d="M24 26 Q32 20 33 10 Q24 11 24 20" fill="#0a7a30" opacity=".45"/><path d="M18 18 L24 12 L30 18" stroke="#0a7a30" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  return icons[cat] || icons.seeds;
}

const CAT_BG = {
  seeds:'#E8F5E9', pesticides:'#FFF8E1', insecticides:'#FFEBEE',
  fertilisers:'#EFF6FF', fungicides:'#F3E8FF', herbicides:'#E8F5E9',
};

// ── Get tier rate for a given qty ────────────
function getRate(tiers, qty) {
  for (let i = tiers.length - 1; i >= 0; i--)
    if (qty >= tiers[i][0]) return tiers[i][2];
  return tiers[0][2];
}

// ── Build product card HTML ───────────────────
function buildCard(p) {
  const el   = document.createElement('div');
  el.className = 'pcard';

  const base = p.tiers[0][2];
  const disc = p.mrp > base ? Math.round((p.mrp - base) / p.mrp * 100) : 0;

  el.innerHTML = `
    <div class="pcard-img" style="background:${CAT_BG[p.category]||'#f0f0ec'}">
      ${p.imageUrl
        ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;padding:12px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
           <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;">${getCatSVG(p.category, 48)}</div>`
        : getCatSVG(p.category, 48)
      }
      ${disc > 0 ? `<div class="disc-badge">${disc}% OFF</div>` : ''}
      <div class="bulk-badge">BULK</div>
      <div class="cert-flag">${p.cert} Certified · ${p.inStock ? '✓ ' + p.stockQty + ' in stock' : '⚠ Out of stock'}</div>
    </div>
    <div class="pcard-body">
      <div class="pcat-label">${p.category}</div>
      <div class="pname">${p.name}</div>
      <div class="psize">${p.brand} · ${p.size}</div>
      <div class="price-row">
        <div class="price-now">₹${base.toLocaleString('en-IN')}</div>
        ${p.mrp > base ? `<div class="price-mrp">₹${p.mrp.toLocaleString('en-IN')}</div>` : ''}
        ${disc > 0 ? `<div class="price-save">Save ${disc}%</div>` : ''}
      </div>
      <div class="tier-chip">
        <svg viewBox="0 0 10 10" fill="none"><path d="M1 5H9M6 2.5L9 5L6 7.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${p.tiers[0][0]}–${p.tiers[0][1]}: ₹${p.tiers[0][2]} → ${p.tiers[2][0]}+: ₹${p.tiers[2][2]}
      </div>
    </div>
    <div class="pcard-foot">
      <div class="qty-row">
        <div class="qty-ctl">
          <button class="qb" onclick="qAdj('${p.id}',-${p.step})">−</button>
          <input class="qi" id="q-${p.id}" type="number" value="${p.moq}" min="${p.moq}" step="${p.step}"/>
          <button class="qb" onclick="qAdj('${p.id}',${p.step})">+</button>
        </div>
        <div class="qty-unit">${p.unit}s</div>
        <div class="moq-txt">Min ${p.moq}</div>
      </div>
      <button class="add-btn" id="ab-${p.id}" onclick="tryAddToCart('${p.id}')" ${!p.inStock?'disabled style="background:var(--ink3)"':''}>
        <svg viewBox="0 0 12 12" fill="none"><path d="M1 1H2.5L4 8.5H9.5L11 4H4" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="10.5" r="1" fill="white"/><circle cx="8.5" cy="10.5" r="1" fill="white"/></svg>
        ${p.inStock ? 'Add to order' : 'Out of stock'}
      </button>
    </div>`;
  return el;
}

// ── Render sections ───────────────────────────
const CATS = ['seeds','pesticides','insecticides','fertilisers','fungicides','herbicides'];

function renderProducts(catFilter) {
  const wrap = document.getElementById('productSections');
  if (!wrap) return;
  wrap.innerHTML = '';

  const catsToShow = catFilter ? [catFilter] : CATS;
  catsToShow.forEach(cat => {
    const items = allProducts.filter(p => p.category === cat);
    if (!items.length) return;

    const sec = document.createElement('div');
    sec.className  = 'section';
    sec.dataset.cat = cat;
    sec.innerHTML = `
      <div class="sec-head">
        <div class="sec-title">
          ${getCatSVG(cat, 18)}
          ${cat.charAt(0).toUpperCase() + cat.slice(1)}
          <span class="sec-sub">Bulk pricing · MOQ applies</span>
        </div>
        <button class="view-all" onclick="filterCat('${cat}',null)">View All →</button>
      </div>
      <div class="prod-grid" id="grid-${cat}"></div>`;
    wrap.appendChild(sec);

    const grid = document.getElementById('grid-' + cat);
    items.forEach(p => grid.appendChild(buildCard(p)));
  });
}

// ── Quantity adjust ───────────────────────────
function qAdj(pid, delta) {
  const p   = allProducts.find(x => x.id === pid);
  const inp = document.getElementById('q-' + pid);
  if (!p || !inp) return;
  inp.value = Math.max(p.moq, (parseInt(inp.value) || p.moq) + delta);
}

// ── Add to cart with login gate ───────────────
function tryAddToCart(pid) {
  if (!isLoggedIn()) {
    localStorage.setItem('rs_pending_add', pid);
    localStorage.setItem('rs_redirect', window.location.href);
    window.location.href = '/login.html';
    return;
  }
  addToCart(pid);
}

function addToCart(pid) {
  const p   = allProducts.find(x => x.id === pid);
  const inp = document.getElementById('q-' + pid);
  if (!p || !inp) return;

  const qty  = Math.max(p.moq, parseInt(inp.value) || p.moq);
  const rate = getRate(p.tiers, qty);
  cart[pid]  = { p, qty, rate, total: rate * qty };

  updateCartBadge();
  renderDrawer();

  const btn = document.getElementById('ab-' + pid);
  if (!btn) return;
  btn.classList.add('done');
  btn.innerHTML = '<svg viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Added ✓';
  setTimeout(() => {
    btn.classList.remove('done');
    btn.innerHTML = '<svg viewBox="0 0 12 12" fill="none"><path d="M1 1H2.5L4 8.5H9.5L11 4H4" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="10.5" r="1" fill="white"/><circle cx="8.5" cy="10.5" r="1" fill="white"/></svg> Add to order';
  }, 1800);

  showToast(p.name.split(' ').slice(0, 3).join(' ') + ' added');
}

function removeCart(pid) {
  delete cart[pid];
  updateCartBadge();
  renderDrawer();
}

function updateCartBadge() {
  const n = Object.keys(cart).length;
  const el = document.getElementById('cn');
  if (el) el.textContent = n;
  const mn = document.getElementById('mn-cn');
  if (mn) mn.textContent = n;
}

// ── Render cart drawer ────────────────────────
function renderDrawer() {
  const items = Object.entries(cart);
  const body  = document.getElementById('drawerBody');
  const foot  = document.getElementById('drawerFoot');
  if (!body || !foot) return;

  if (!items.length) {
    body.innerHTML = `<div class="drawer-empty">
      <svg viewBox="0 0 44 44" fill="none"><path d="M5 5H9.5L13 28H34L37.5 12H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="34" r="3" fill="currentColor" opacity=".3"/><circle cx="29" cy="34" r="3" fill="currentColor" opacity=".3"/></svg>
      Add products to build your bulk order.</div>`;
    foot.style.display = 'none';
    return;
  }

  let sub = 0;
  body.innerHTML = items.map(([pid, { p, qty, rate, total }]) => {
    sub += total;
    return `<div class="di">
      <div class="di-ico">${getCatSVG(p.category, 28)}</div>
      <div class="di-info">
        <div class="di-name">${p.name}</div>
        <div class="di-meta">${qty} ${p.unit}(s) × ₹${rate.toLocaleString('en-IN')}</div>
        <div class="di-row">
          <span class="di-price">₹${total.toLocaleString('en-IN')}</span>
          <button class="di-rm" onclick="removeCart('${pid}')">Remove</button>
        </div>
      </div>
    </div>`;
  }).join('');

  const gst   = Math.round(sub * 0.12);
  const grand = sub + gst;
  const dSub   = document.getElementById('dfSub');
  const dGst   = document.getElementById('dfGst');
  const dTotal = document.getElementById('dfTotal');
  if (dSub)   dSub.textContent   = '₹' + sub.toLocaleString('en-IN');
  if (dGst)   dGst.textContent   = '₹' + gst.toLocaleString('en-IN');
  if (dTotal) dTotal.textContent = '₹' + grand.toLocaleString('en-IN');
  foot.style.display = 'block';
}

// ── Razorpay checkout ─────────────────────────
async function checkoutRazorpay() {
  const items = Object.values(cart).map(({ p, qty }) => ({
    productId: p.id,
    qty,
  }));

  if (!items.length) return;

  try {
    const data = await Orders.create(items);

    const options = {
      key:         data.keyId,
      amount:      data.amount,
      currency:    'INR',
      order_id:    data.razorpayOrderId,
      name:        'MahiGrow',
      description: 'Bulk Agri Inputs',
      prefill:     data.prefill,
      theme:       { color: '#0a7a30' },
      handler: async function (response) {
        try {
          await Orders.verifyPayment({
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          cart = {};
          updateCartBadge();
          renderDrawer();
          closeDrawer();
          showToast('Payment confirmed! GST invoice will be emailed shortly.');
        } catch {
          showToast('Payment recorded but verification pending. Contact support if needed.', true);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    showToast(err.error || 'Could not create order. Please try again.', true);
  }
}

// ── WhatsApp order fallback ───────────────────
function orderViaWhatsApp() {
  const items = Object.values(cart);
  if (!items.length) return;
  const lines = items.map(({ p, qty, rate, total }) =>
    `${p.name} — ${qty} ${p.unit}(s) @ ₹${rate} = ₹${total.toLocaleString('en-IN')}`
  ).join('%0A');
  window.open(`https://wa.me/919876543210?text=Hello MahiGrow, bulk order:%0A%0A${lines}%0A%0APlease confirm and send payment link.`, '_blank');
}

// ── Drawer open/close ─────────────────────────
function openDrawer()  {
  document.getElementById('drawer')?.classList.add('open');
  document.getElementById('drawerMask')?.classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawerMask')?.classList.remove('open');
}

// ── Category filter ───────────────────────────
function filterAll(btn) {
  activeCat = null;
  document.querySelectorAll('.cnav-btn').forEach(b => b.classList.remove('on'));
  btn?.classList.add('on');
  renderProducts(null);
}
function filterCat(cat, btn) {
  activeCat = cat;
  document.querySelectorAll('.cnav-btn').forEach(b => b.classList.remove('on'));
  btn?.classList.add('on');
  renderProducts(cat);
  setTimeout(() => document.getElementById('cat-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
}

// ── Toast ─────────────────────────────────────
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = isError ? '#dc2626' : '#111827';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Nav: show user info if logged in ─────────
function updateNav() {
  const retailer = getRetailer();
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;
  if (retailer) {
    loginBtn.textContent = retailer.shopName || 'My Account';
    loginBtn.onclick = () => window.location.href = '/orders.html';
  } else {
    loginBtn.textContent = 'Sign In';
    loginBtn.onclick = () => window.location.href = '/login.html';
  }
}

// ── Init ──────────────────────────────────────
async function init() {
  updateNav();

  // Show loading skeleton
  const wrap = document.getElementById('productSections');
  if (wrap) wrap.innerHTML = '<div style="text-align:center;padding:48px;color:#6b7280;">Loading products…</div>';

  try {
    const data  = await Products.getAll();
    allProducts = data.products;
    renderProducts(null);
  } catch {
    if (wrap) wrap.innerHTML = '<div style="text-align:center;padding:48px;color:#dc2626;">Could not load products. Please refresh.</div>';
  }

  renderDrawer();

  // If user just came back from login after clicking "Add to order"
  const pendingPid = localStorage.getItem('rs_pending_add');
  if (pendingPid && isLoggedIn()) {
    localStorage.removeItem('rs_pending_add');
    setTimeout(() => addToCart(pendingPid), 800);
  }
}

window.addEventListener('DOMContentLoaded', init);