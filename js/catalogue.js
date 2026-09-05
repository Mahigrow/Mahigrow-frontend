// ─────────────────────────────────────────────
//  js/catalogue.js  —  MahiGrow Bulk Portal
// ─────────────────────────────────────────────

// ── CATEGORY SVG ICONS ───────────────────────
const CAT_SVG = {
  seeds:`<svg viewBox="0 0 64 64" fill="none" width="64" height="64"><ellipse cx="32" cy="15" rx="7" ry="13" fill="#0a7a30" opacity=".85"/><path d="M32 28 Q24 40 24 58" stroke="#086826" stroke-width="3.5" stroke-linecap="round"/><path d="M32 42 Q44 36 45 22" stroke="#0a7a30" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="24" cy="40" rx="6" ry="11" fill="#0a7a30" opacity=".55" transform="rotate(-28 24 40)"/><ellipse cx="42" cy="44" rx="6" ry="11" fill="#0a7a30" opacity=".55" transform="rotate(28 42 44)"/><circle cx="32" cy="58" r="6" fill="#e8a020"/></svg>`,
  pesticides:`<svg viewBox="0 0 64 64" fill="none" width="64" height="64"><rect x="20" y="22" width="24" height="36" rx="6" fill="#FDF3DC" stroke="#e8a020" stroke-width="2.5"/><rect x="24" y="12" width="16" height="13" rx="3.5" fill="#e8a020" opacity=".65"/><rect x="22" y="8" width="20" height="7" rx="3" fill="#e8a020"/><line x1="26" y1="33" x2="38" y2="33" stroke="#e8a020" stroke-width="2" stroke-linecap="round"/><line x1="26" y1="41" x2="38" y2="41" stroke="#e8a020" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="20" r="12" fill="#c0321a" opacity=".9"/><line x1="50" y1="14" x2="50" y2="21" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="25" r="2" fill="white"/></svg>`,
  insecticides:`<svg viewBox="0 0 64 64" fill="none" width="64" height="64"><ellipse cx="29" cy="46" rx="9" ry="13" fill="#c0321a" opacity=".75"/><circle cx="29" cy="23" r="10" fill="#c0321a" opacity=".85"/><line x1="24" y1="16" x2="18" y2="10" stroke="#c0321a" stroke-width="2.5" stroke-linecap="round"/><line x1="34" y1="16" x2="40" y2="10" stroke="#c0321a" stroke-width="2.5" stroke-linecap="round"/><line x1="20" y1="38" x2="12" y2="35" stroke="#c0321a" stroke-width="2.2" stroke-linecap="round"/><line x1="20" y1="46" x2="12" y2="46" stroke="#c0321a" stroke-width="2.2" stroke-linecap="round"/><line x1="38" y1="38" x2="46" y2="35" stroke="#c0321a" stroke-width="2.2" stroke-linecap="round"/><line x1="38" y1="46" x2="46" y2="46" stroke="#c0321a" stroke-width="2.2" stroke-linecap="round"/><circle cx="50" cy="18" r="12" fill="white" stroke="#0a7a30" stroke-width="3"/><line x1="44" y1="12" x2="56" y2="24" stroke="#0a7a30" stroke-width="4" stroke-linecap="round"/><line x1="56" y1="12" x2="44" y2="24" stroke="#0a7a30" stroke-width="4" stroke-linecap="round"/></svg>`,
  fertilisers:`<svg viewBox="0 0 64 64" fill="none" width="64" height="64"><rect x="12" y="38" width="40" height="22" rx="6" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="2.5"/><path d="M19 38 L25 18 L39 18 L45 38" stroke="#1D4ED8" stroke-width="2.8" stroke-linejoin="round" fill="none"/><path d="M25.5 18 Q32 12 38.5 18" stroke="#1D4ED8" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="32" y="54" text-anchor="middle" font-size="10" fill="#1D4ED8" font-weight="800" font-family="sans-serif" opacity=".75">NPK</text></svg>`,
  fungicides:`<svg viewBox="0 0 64 64" fill="none" width="64" height="64"><path d="M32 4L54 12V28C54 46 32 60 32 60C32 60 10 46 10 28V12L32 4Z" fill="#EDE9FE" stroke="#6D28D9" stroke-width="3" stroke-linejoin="round"/><path d="M20 30L27 37L44 22" stroke="#6D28D9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  herbicides:`<svg viewBox="0 0 64 64" fill="none" width="64" height="64"><path d="M32 60 L32 28" stroke="#0a7a30" stroke-width="4" stroke-linecap="round"/><path d="M32 44 Q20 36 20 18 Q32 20 32 32" fill="#0a7a30" opacity=".6"/><path d="M32 36 Q44 28 46 12 Q32 14 32 28" fill="#0a7a30" opacity=".45"/><path d="M22 24 L32 14 L42 24" stroke="#0a7a30" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const CAT_BG = {
  seeds:'#E8F5E9', pesticides:'#FFF8E1',
  insecticides:'#FFEBEE', fertilisers:'#E3F2FD',
  fungicides:'#F3E8FF', herbicides:'#E8F5E9',
};

const CATS = ['seeds','pesticides','insecticides','fertilisers','fungicides','herbicides'];

// ── STATE ─────────────────────────────────────
let allProducts = [];
let cart        = {};
let activeCat   = null;

// ── HELPERS ───────────────────────────────────
function getRate(tiers, qty) {
  let rate = tiers[0][2];
  for (const [min, max, price] of tiers) {
    if (qty >= min && qty <= max) { rate = price; break; }
    if (qty >= min) rate = price;
  }
  return rate;
}

// ── BUILD CARD ────────────────────────────────
function buildCard(p, gridMode = false) {
  const el       = document.createElement('div');
  el.className   = 'pcard' + (gridMode ? ' grid-card' : '');
  el.style.cursor = 'pointer';

  const base     = p.tiers[0][2];
  const lastTier = p.tiers[p.tiers.length - 1];
  const disc     = p.mrp > base ? Math.round((p.mrp - base) / p.mrp * 100) : 0;

  // Click → product detail (but not on footer controls)
  el.onclick = (e) => {
    if (e.target.closest('.pcard-foot')) return;
    window.location.href = 'product.html?id=' + p.id;
  };

  const imgHtml = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy"
         onerror="this.parentNode.innerHTML='<div class=icon-wrap>${CAT_SVG[p.category] || CAT_SVG.seeds}</div>'"
       />`
    : `<div class="icon-wrap">${CAT_SVG[p.category] || CAT_SVG.seeds}</div>`;

  el.innerHTML = `
    <div class="pcard-img" style="background:${CAT_BG[p.category] || '#f5f5f5'}">
      ${imgHtml}
      ${disc > 0 ? `<span class="disc-tag">${disc}% OFF</span>` : ''}
      <span class="stock-tag ${p.inStock ? 'in' : 'out'}">${p.inStock ? 'In Stock' : 'Out of Stock'}</span>
      <span class="cert-tag">${p.cert}</span>
    </div>
    <div class="pcard-body">
      <div class="pcat">${p.category}</div>
      <div class="pname">${p.name}</div>
      <div class="pbrand">${p.brand} · ${p.size}</div>
      <div class="price-row">
        <span class="p-now">₹${base.toLocaleString('en-IN')}</span>
        ${p.mrp > base ? `<span class="p-mrp">₹${p.mrp.toLocaleString('en-IN')}</span>` : ''}
        ${disc > 0 ? `<span class="p-save">${disc}% off</span>` : ''}
      </div>
      <div class="tier-row">
        <span class="t1">${p.tiers[0][0]}–${p.tiers[0][1] >= 9999 ? '∞' : p.tiers[0][1]}: ₹${p.tiers[0][2]}</span>
        <span class="tarr">→</span>
        <span class="t2">${lastTier[0]}+: ₹${lastTier[2]}</span>
        <span class="bulk-lbl">BULK</span>
      </div>
    </div>
    <div class="pcard-foot">
      <div class="qty-row">
        <div class="qty-ctl">
          <button class="qb" onclick="qAdj('${p.id}',-${p.step})">−</button>
          <input class="qi" id="q-${p.id}" type="number"
                 value="${p.moq}" min="${p.moq}" step="${p.step}" inputmode="numeric"/>
          <button class="qb" onclick="qAdj('${p.id}',${p.step})">+</button>
        </div>
        <span class="qty-lbl">${p.unit}s<br/>min ${p.moq}</span>
      </div>
      <button class="add-btn" id="ab-${p.id}"
              onclick="tryAddToCart('${p.id}')"
              ${!p.inStock ? 'disabled' : ''}>
        <svg viewBox="0 0 14 14" fill="none">
          <path d="M1 1H2.5L4.5 9.5H11L12.5 4.5H4.5" stroke="currentColor"
                stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="5.5" cy="12" r="1.3" fill="currentColor"/>
          <circle cx="9.5" cy="12" r="1.3" fill="currentColor"/>
        </svg>
        ${p.inStock ? 'Add to order' : 'Out of stock'}
      </button>
    </div>`;
  return el;
}

// ── RENDER SECTIONS ───────────────────────────
function renderProducts(catFilter) {
  const wrap = document.getElementById('productSections');
  if (!wrap) return;
  wrap.innerHTML = '';

  if (catFilter) {
    // Grid mode for filtered single category
    const items = allProducts.filter(p => p.category === catFilter);
    if (!items.length) {
      wrap.innerHTML = '<div style="text-align:center;padding:40px;color:#9e9e9e;">No products found.</div>';
      return;
    }
    const sec    = document.createElement('div');
    sec.className = 'section';
    const head   = document.createElement('div');
    head.className = 'sec-hd';
    const cat = catFilter.charAt(0).toUpperCase() + catFilter.slice(1);
    head.innerHTML = `
      <div class="sec-title">${cat}</div>
      <button class="view-all" onclick="filterAll(null)">← All Products</button>`;
    sec.appendChild(head);
    const grid = document.createElement('div');
    grid.className = 'prod-grid';
    items.forEach(p => grid.appendChild(buildCard(p, true)));
    sec.appendChild(grid);
    wrap.appendChild(sec);
  } else {
    // Horizontal scroll rows per category (BigHaat style)
    const q = (document.getElementById('searchInp')?.value || '').toLowerCase();
    CATS.forEach(cat => {
      let items = allProducts.filter(p => p.category === cat);
      if (q) items = items.filter(p =>
        p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
      if (!items.length) return;

      const sec = document.createElement('div');
      sec.className = 'section';

      const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
      const head = document.createElement('div');
      head.className = 'sec-hd';
      head.innerHTML = `
        <div class="sec-title">
          <span style="font-size:1rem;">${getCatEmoji(cat)}</span>
          ${catLabel}
          <span style="font-size:.68rem;color:#9e9e9e;font-weight:400;margin-left:4px;">${items.length} products</span>
        </div>
        <button class="view-all" onclick="filterCat('${cat}',null)">View All →</button>`;
      sec.appendChild(head);

      // Horizontal scroll row
      const row = document.createElement('div');
      row.className = 'h-scroll';
      items.forEach(p => row.appendChild(buildCard(p, false)));
      sec.appendChild(row);
      wrap.appendChild(sec);
    });
  }
}

function getCatEmoji(cat) {
  return {seeds:'🌱',pesticides:'🧪',insecticides:'🐛',fertilisers:'💧',fungicides:'🛡️',herbicides:'🌿'}[cat] || '📦';
}

// ── FILTER ────────────────────────────────────
function filterAll(btn) {
  activeCat = null;
  document.querySelectorAll('.cnav-btn').forEach(b => b.classList.remove('on'));
  document.querySelector('.cnav-btn').classList.add('on');
  renderProducts(null);
  window.scrollTo({top:0, behavior:'smooth'});
}

function filterCat(cat, btn) {
  activeCat = cat;
  document.querySelectorAll('.cnav-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderProducts(cat);
  setTimeout(() => document.getElementById('cat-section')?.scrollIntoView({behavior:'smooth'}), 50);
}

function applyFilters() {
  renderProducts(activeCat);
}

// ── QTY ───────────────────────────────────────
function qAdj(pid, delta) {
  const p   = allProducts.find(x => x.id === pid);
  const inp = document.getElementById('q-' + pid);
  if (!p || !inp) return;
  inp.value = Math.max(p.moq, (parseInt(inp.value) || p.moq) + delta);
}

// ── CART ──────────────────────────────────────
function tryAddToCart(pid) {
  if (!isLoggedIn()) {
    localStorage.setItem('rs_pending_add', pid);
    localStorage.setItem('rs_redirect', window.location.href);
    window.location.href = 'login.html';
    return;
  }
  addToCart(pid);
}

function addToCart(pid) {
  const p   = allProducts.find(x => x.id === pid);
  const inp = document.getElementById('q-' + pid);
  if (!p) return;
  const qty  = Math.max(p.moq, parseInt(inp?.value) || p.moq);
  const rate = getRate(p.tiers, qty);
  cart[pid]  = { p, qty, rate, total: rate * qty };
  updateCartBadge();
  renderDrawer();

  const btn = document.getElementById('ab-' + pid);
  if (btn) {
    btn.classList.add('done');
    btn.innerHTML = '✓ Added';
    setTimeout(() => {
      btn.classList.remove('done');
      btn.innerHTML = `<svg viewBox="0 0 14 14" fill="none"><path d="M1 1H2.5L4.5 9.5H11L12.5 4.5H4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.5" cy="12" r="1.3" fill="currentColor"/><circle cx="9.5" cy="12" r="1.3" fill="currentColor"/></svg> Add to order`;
    }, 1800);
  }
  showToast(p.name.split(' ').slice(0,3).join(' ') + ' added');
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
  if (mn) { mn.textContent = n; mn.style.display = n > 0 ? 'block' : 'none'; }
}

// ── DRAWER ────────────────────────────────────
function openDrawer()  { document.getElementById('drawer')?.classList.add('open'); document.getElementById('drawerMask')?.classList.add('open'); }
function closeDrawer() { document.getElementById('drawer')?.classList.remove('open'); document.getElementById('drawerMask')?.classList.remove('open'); }

function renderDrawer() {
  const items = Object.entries(cart);
  const body  = document.getElementById('drawerBody');
  const foot  = document.getElementById('drawerFoot');
  if (!body || !foot) return;

  if (!items.length) {
    body.innerHTML = `<div class="drw-empty">
      <svg viewBox="0 0 44 44" fill="none"><path d="M5 5H9L13 28H34L37 12H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="34" r="3" fill="currentColor" opacity=".3"/><circle cx="29" cy="34" r="3" fill="currentColor" opacity=".3"/></svg>
      Add products to build your bulk order.</div>`;
    foot.style.display = 'none';
    return;
  }

  let sub = 0;
  body.innerHTML = items.map(([pid, {p, qty, rate, total}]) => {
    sub += total;
    return `<div class="di">
      <div class="di-ico">${CAT_SVG[p.category] ? `<svg viewBox="0 0 64 64" width="28" height="28">${CAT_SVG[p.category].replace(/<svg[^>]*>/,'').replace('</svg>','')}</svg>` : '📦'}</div>
      <div style="flex:1">
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
  document.getElementById('dfSub').textContent   = '₹' + sub.toLocaleString('en-IN');
  document.getElementById('dfGst').textContent   = '₹' + gst.toLocaleString('en-IN');
  document.getElementById('dfTotal').textContent = '₹' + grand.toLocaleString('en-IN');
  foot.style.display = 'block';
}

// ── CHECKOUT ──────────────────────────────────
async function checkoutRazorpay() {
  const items = Object.values(cart).map(({p, qty}) => ({productId: p.id, qty}));
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
      handler: async (response) => {
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
          showToast('Payment confirmed! Invoice will be emailed shortly.');
        } catch { showToast('Payment pending verification. Contact support if needed.', true); }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    showToast(err.error || 'Could not create order. Please try again.', true);
  }
}

function orderViaWhatsApp() {
  const lines = Object.values(cart).map(({p, qty, rate, total}) =>
    `${p.name} — ${qty} ${p.unit}(s) @ ₹${rate} = ₹${total.toLocaleString('en-IN')}`
  ).join('%0A');
  window.open(`https://wa.me/919876543210?text=Hello MahiGrow, bulk order:%0A%0A${lines}%0A%0APlease confirm.`, '_blank');
}

// ── NAV ───────────────────────────────────────
function updateNav() {
  const retailer = getRetailer();
  ['tb-loginBtn', 'loginBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (retailer) {
      btn.textContent = retailer.shopName?.split(' ')[0] || 'Account';
      btn.onclick = () => window.location.href = 'orders.html';
    } else {
      btn.onclick = () => window.location.href = 'login.html';
    }
  });
}

// ── TOAST ─────────────────────────────────────
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = isError ? '#d32f2f' : '#212121';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── INIT ──────────────────────────────────────
async function init() {
  updateNav();
  updateCartBadge();

  const wrap = document.getElementById('productSections');
  if (wrap) wrap.innerHTML = '<div style="text-align:center;padding:40px;color:#9e9e9e;font-size:.85rem;">Loading products…</div>';

  try {
    const data  = await Products.getAll();
    allProducts = data.products;
    renderProducts(null);
  } catch {
    if (wrap) wrap.innerHTML = '<div style="text-align:center;padding:40px;color:#d32f2f;font-size:.82rem;">Could not load products. Please refresh.</div>';
  }

  renderDrawer();

  // Handle pending add after login
  const pendingPid = localStorage.getItem('rs_pending_add');
  if (pendingPid && isLoggedIn()) {
    localStorage.removeItem('rs_pending_add');
    setTimeout(() => addToCart(pendingPid), 600);
  }
}

window.addEventListener('DOMContentLoaded', init);