// ─────────────────────────────────────────────
//  js/api.js  —  MahiGrow API client
// ─────────────────────────────────────────────

const API_BASE = 'https://mahigrow-production.up.railway.app';

// ── Auth helpers ──────────────────────────────
function getToken()    { return localStorage.getItem('mg_token'); }
function getRetailer() {
  try { return JSON.parse(localStorage.getItem('mg_retailer')); } catch { return null; }
}
function isLoggedIn()  { return !!getToken(); }

function authHeaders(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  const t = getToken();
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: authHeaders(opts.headers),
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

// ─────────────────────────────────────────────
//  Auth API
// ─────────────────────────────────────────────
const Auth = {
  register: (body)  => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body)  => apiFetch('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (phone) => apiFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOTP: (body) => apiFetch('/api/auth/verify-otp',  { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  adminLogin: (body) => apiFetch('/api/auth/admin/login', { method: 'POST', body: JSON.stringify(body) }),

  logout() {
    localStorage.removeItem('mg_token');
    localStorage.removeItem('mg_retailer');
    localStorage.removeItem('mg_admin_token');
    localStorage.removeItem('mg_admin');
  },
};

// ─────────────────────────────────────────────
//  Products API
// ─────────────────────────────────────────────
const Products = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch('/api/products' + (qs ? '?' + qs : ''));
  },
  getOne: (id) => apiFetch('/api/products/' + id),
  create: (body) => apiFetch('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch('/api/products/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => apiFetch('/api/products/' + id, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────
//  Orders API  (COD only — no Razorpay)
// ─────────────────────────────────────────────
const Orders = {
  // Place a COD order — items = [{ productId, qty }]
  create: (items) => apiFetch('/api/orders', { method: 'POST', body: JSON.stringify({ items }) }),

  // Retailer's own orders
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch('/api/orders' + (qs ? '?' + qs : ''));
  },
  getOne: (id) => apiFetch('/api/orders/' + id),

  // Admin
  adminGetAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch('/api/orders/admin/all' + (qs ? '?' + qs : ''));
  },
  updateStatus: (id, status) => apiFetch('/api/orders/' + id + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};

// ─────────────────────────────────────────────
//  GST API
// ─────────────────────────────────────────────
const GST = {
  verify: (gstin) => apiFetch('/api/gst/verify', { method: 'POST', body: JSON.stringify({ gstin }) }),
};

// ─────────────────────────────────────────────
//  Admin Retailers API
// ─────────────────────────────────────────────
const AdminRetailers = {
  getAll: () => apiFetch('/api/auth/admin/retailers'),
  update: (id, body) => apiFetch('/api/auth/admin/retailers/' + id, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
};

// ─────────────────────────────────────────────
//  Admin token helpers
// ─────────────────────────────────────────────
function getAdminToken()    { return localStorage.getItem('mg_admin_token'); }
function getAdminRetailer() {
  try { return JSON.parse(localStorage.getItem('mg_admin')); } catch { return null; }
}
function isAdminLoggedIn()  { return !!getAdminToken(); }

// Admin pages use a different token key — override authHeaders for admin calls
function adminFetch(path, opts = {}) {
  const h = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const t = getAdminToken();
  if (t) h['Authorization'] = 'Bearer ' + t;
  return fetch(API_BASE + path, { ...opts, headers: h })
    .then(async r => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw d;
      return d;
    });
}