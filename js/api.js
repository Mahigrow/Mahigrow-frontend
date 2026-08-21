// ─────────────────────────────────────────────
//  js/api.js  —  All backend calls in one place
//  Change API_BASE to your Railway URL in production
// ─────────────────────────────────────────────

const API_BASE = 'https://mahigrow-production.up.railway.app';  // production: 'https://your-api.up.railway.app'

// ── HTTP helper ──────────────────────────────
async function http(method, path, body = null) {
  const token = localStorage.getItem('rs_token');

  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);

  const res  = await fetch(API_BASE + path, opts);
  const data = await res.json();

  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ── Auth ─────────────────────────────────────
const Auth = {
  register:      (body) => http('POST', '/api/auth/register', body),
  login:         (body) => http('POST', '/api/auth/login', body),
  forgotPassword:(body) => http('POST', '/api/auth/forgot-password', body),
  resetPassword: (body) => http('POST', '/api/auth/reset-password', body),
  me:            ()     => http('GET',  '/api/auth/me'),
};

// ── GST ──────────────────────────────────────
const GST = {
  validateFormat: (gstin) => http('GET', `/api/gst/validate-format?gstin=${gstin}`),
  verify:         (gstin) => http('POST', '/api/gst/verify', { gstin }),
};

// ── Products ─────────────────────────────────
const Products = {
  getAll:    (category) => http('GET', '/api/products' + (category ? `?category=${category}` : '')),
  getOne:    (id)       => http('GET', `/api/products/${id}`),
};

// ── Orders ───────────────────────────────────
const Orders = {
  create:        (items)  => http('POST', '/api/orders', { items }),
  verifyPayment: (body)   => http('POST', '/api/orders/verify-payment', body),
  getAll:        ()       => http('GET',  '/api/orders'),
  getOne:        (id)     => http('GET',  `/api/orders/${id}`),
};

// ── Session helpers ──────────────────────────
function saveSession(token, retailer) {
  localStorage.setItem('rs_token',    token);
  localStorage.setItem('rs_retailer', JSON.stringify(retailer));
}

function clearSession() {
  localStorage.removeItem('rs_token');
  localStorage.removeItem('rs_retailer');
}

function getRetailer() {
  try { return JSON.parse(localStorage.getItem('rs_retailer')); }
  catch { return null; }
}

function isLoggedIn() {
  return !!localStorage.getItem('rs_token');
}

// Redirect to login if not authenticated
function requireLogin() {
  if (!isLoggedIn()) {
    localStorage.setItem('rs_redirect', window.location.href);
    window.location.href = '/login.html';
  }
}