// ─────────────────────────────────────────────
//  js/auth.js  — Login / Register / Forgot PW
//  Requires: api.js loaded before this file
// ─────────────────────────────────────────────

// ── Validators ───────────────────────────────
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATE_CODES = {
  '01':'Jammu & Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh',
  '05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh',
  '10':'Bihar','27':'Maharashtra','29':'Karnataka','32':'Kerala',
  '33':'Tamil Nadu','36':'Telangana','37':'Andhra Pradesh',
};

// ── Shorthand helpers ────────────────────────
function $(id)           { return document.getElementById(id); }
function val(id)         { return ($( id)?.value || '').trim(); }
function setErr(id, msg) { const e=$(id); if(e){ e.textContent=msg; e.style.color='var(--red)'; } }
function clearErr(id)    { const e=$(id); if(e){ e.textContent=''; } }
function setHelp(id, msg, color='') { const e=$(id); if(e){ e.textContent=msg; e.style.color=color; } }

// ── Toast ─────────────────────────────────────
function toast(msg, isError=false) {
  const t = $('toast');
  if (!t) return;
  t.textContent      = msg;
  t.style.background = isError ? '#dc2626' : '#111827';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Loading state on button ───────────────────
function setLoading(btnId, loading) {
  const btn = $(btnId);
  if (!btn) return;
  btn.disabled = loading;
  const text    = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  if (text)    text.style.display    = loading ? 'none'  : '';
  if (spinner) spinner.style.display = loading ? 'block' : 'none';
}

// ── Show/hide screens ─────────────────────────
function showScreen(id) {
  document.querySelectorAll('.auth-panel > .screen')
    .forEach(s => s.classList.remove('active'));
  $(id)?.classList.add('active');
}

// ── Tab switcher ──────────────────────────────
function switchTab(tab) {
  $('tabLogin')?.classList.toggle('active',    tab === 'login');
  $('tabRegister')?.classList.toggle('active', tab === 'register');

  if (tab === 'login')    { showScreen('screenLogin'); }
  if (tab === 'register') { showScreen('screenRegister'); goRegStep(1); }
  if (tab === 'forgot')   { showScreen('screenForgot');   showFgStep(1); }
}

// ── Register step nav ─────────────────────────
function goRegStep(n) {
  ['regStep1','regStep2','regStep3'].forEach((id, i) =>
    $(id)?.classList.toggle('active', i + 1 === n)
  );
  ['rp1','rp2','rp3'].forEach((id, i) => {
    const el = $(id);
    if (!el) return;
    el.className = 'pdot' + (i+1 < n ? ' done' : i+1 === n ? ' active' : '');
  });
  if (n === 3) buildReviewCard();
}

// ── Forgot password step nav ──────────────────
function showFgStep(n) {
  ['fgStep1','fgStep2','fgStep3'].forEach((id, i) =>
    $(id)?.classList.toggle('active', i + 1 === n)
  );
}

// ── Password show / hide ──────────────────────
// HTML calls togglePw('fieldId', this) — second arg ignored
function togglePw(id) {
  const inp = $(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ── Password strength meter ───────────────────
function pwStrength(inp) {
  const pw    = inp.value;
  const fill  = $('strengthFill');
  const label = $('strengthLabel');
  if (!fill || !label) return;

  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = [
    { w:'0%',   bg:'var(--border)', txt:'' },
    { w:'25%',  bg:'var(--red)',    txt:'Weak — add uppercase & numbers' },
    { w:'50%',  bg:'var(--or)',     txt:'Fair — add a special character' },
    { w:'75%',  bg:'#eab308',       txt:'Good — almost there' },
    { w:'100%', bg:'var(--g)',      txt:'Strong ✓' },
  ];
  fill.style.width      = levels[score].w;
  fill.style.background = levels[score].bg;
  label.textContent     = levels[score].txt;
}

// ─────────────────────────────────────────────
//  GST VERIFICATION
// ─────────────────────────────────────────────
let gstVerified = false;
let gstApiData  = null;

function onGSTInput(inp) {
  const raw = inp.value.toUpperCase().replace(/\s/g, '');
  inp.value = raw;
  resetGSTVerify();
  clearErr('regGSTErr');

  const btn = $('gstVerifyBtn');
  if (!btn) return;

  if (raw.length === 0) {
    setHelp('regGSTHelper', '15-character GSTIN — used only for invoices');
    btn.disabled = true; return;
  }
  if (raw.length < 15) {
    setHelp('regGSTHelper', raw.length + '/15 characters');
    btn.disabled = true; return;
  }
  if (raw.length > 15) {
    setErr('regGSTErr', 'GSTIN must be exactly 15 characters');
    btn.disabled = true; return;
  }
  if (!GSTIN_REGEX.test(raw)) {
    setErr('regGSTErr', 'Invalid format. Example: 37AABCU9603R1ZX');
    btn.disabled = true; return;
  }

  const stateName = STATE_CODES[raw.substring(0, 2)] || '';
  setHelp('regGSTHelper',
    '✓ Format valid' + (stateName ? ' · ' + stateName : '') + ' · Click "Verify GST" to confirm',
    'var(--g)'
  );
  btn.disabled = false;
}

async function verifyGST() {
  const gstin = val('regGST').toUpperCase();
  const btn   = $('gstVerifyBtn');
  if (!btn) return;

  btn.textContent = 'Verifying…';
  btn.disabled    = true;
  clearErr('regGSTErr');

  try {
    const data = await GST.verify(gstin);

    gstVerified       = true;
    gstApiData        = data;
    btn.textContent   = '✓ Verified';
    btn.classList.add('verified');
    btn.disabled      = true;

    const name  = data.tradeName || data.legalName || '';
    const state = data.stateName || '';
    setHelp('regGSTHelper',
      '✓ Verified · ' + (name ? name + ' · ' : '') + state + (data.status ? ' · ' + data.status : ''),
      'var(--g)'
    );

    // Auto-fill shop name and state if empty
    const shopInp  = $('regShopName');
    const stateInp = $('regState');
    if (shopInp  && !shopInp.value.trim()  && name)  shopInp.value  = name;
    if (stateInp && !stateInp.value.trim() && state) stateInp.value = state;

    toast('GST verified: ' + (name || gstin));

  } catch (err) {
    if (err.softFail) {
      // API down — allow registration, team verifies manually
      gstVerified     = true;
      gstApiData      = { gstin, softVerified: true, stateName: err.stateName || '' };
      btn.textContent = '⚠ Verify Later';
      btn.classList.add('soft');
      setHelp('regGSTHelper',
        '⚠ Service unavailable — format is valid. Our team will verify manually.',
        'var(--or)'
      );
      const s = $('regState');
      if (s && !s.value && err.stateName) s.value = err.stateName;
    } else {
      setErr('regGSTErr', err.error || 'GST verification failed');
      btn.textContent = 'Retry';
      btn.disabled    = false;
    }
  }
}

function resetGSTVerify() {
  gstVerified = false;
  gstApiData  = null;
  const btn   = $('gstVerifyBtn');
  if (!btn) return;
  btn.textContent = 'Verify GST';
  btn.classList.remove('verified', 'soft');
  btn.disabled = true;
}

// ─────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────
function regStep1Next() {
  clearErr('regEmailErr'); clearErr('regPhoneErr');
  clearErr('regPwErr');    clearErr('regPwConfirmErr');

  const email = val('regEmail');
  const phone = val('regPhone');
  const pw    = $('regPw')?.value        || '';
  const pwc   = $('regPwConfirm')?.value || '';
  let ok = true;

  if (!EMAIL_REGEX.test(email))   { setErr('regEmailErr',      'Valid email required'); ok = false; }
  if (!PHONE_REGEX.test(phone))   { setErr('regPhoneErr',      'Valid 10-digit mobile required'); ok = false; }
  if (pw.length < 8)              { setErr('regPwErr',         'Minimum 8 characters'); ok = false; }
  if (pw !== pwc)                 { setErr('regPwConfirmErr',  'Passwords do not match'); ok = false; }

  if (ok) goRegStep(2);
}

function regStep2Next() {
  clearErr('regGSTErr');  clearErr('regShopErr');
  clearErr('regOwnerErr'); clearErr('regDistrictErr'); clearErr('regPincodeErr');

  const gstin   = val('regGST').toUpperCase();
  const shop    = val('regShopName');
  const owner   = val('regOwner');
  const district= val('regDistrict');
  const pincode = val('regPincode');
  let ok = true;

  if (!GSTIN_REGEX.test(gstin))  { setErr('regGSTErr',      'Valid 15-character GSTIN required'); ok = false; }
  else if (!gstVerified)          { setErr('regGSTErr',      'Please verify your GST number first'); ok = false; }
  if (!shop)                      { setErr('regShopErr',     'Shop name is required'); ok = false; }
  if (!owner)                     { setErr('regOwnerErr',    'Owner name is required'); ok = false; }
  if (!district)                  { setErr('regDistrictErr', 'District is required'); ok = false; }
  if (pincode.length !== 6)       { setErr('regPincodeErr',  'Valid 6-digit pincode required'); ok = false; }

  if (ok) goRegStep(3);
}

function buildReviewCard() {
  const rows = [
    ['Email',    val('regEmail')],
    ['Phone',    '+91 ' + val('regPhone')],
    ['GST',      val('regGST').toUpperCase()],
    ['Shop',     val('regShopName')],
    ['Owner',    val('regOwner')],
    ['District', val('regDistrict')],
    ['Pincode',  val('regPincode')],
    ['State',    val('regState') || 'Andhra Pradesh'],
  ];
  const card = $('reviewCard');
  if (!card) return;
  card.innerHTML = rows.map(([k, v]) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;
      border-bottom:1px solid var(--border);font-size:.8rem;">
      <span style="color:var(--ink3);font-weight:500;">${k}</span>
      <span style="color:var(--ink);font-weight:600;text-align:right;max-width:60%;">${v}</span>
    </div>`
  ).join('');
}

async function doRegister() {
  setLoading('submitBtn', true);
  try {
    await Auth.register({
      email:       val('regEmail').toLowerCase(),
      phone:       val('regPhone'),
      password:    $('regPw')?.value || '',
      shopName:    val('regShopName'),
      ownerName:   val('regOwner'),
      gstNumber:   val('regGST').toUpperCase(),
      gstVerified: gstVerified && !(gstApiData?.softVerified),
      district:    val('regDistrict'),
      pincode:     val('regPincode'),
      state:       val('regState') || 'Andhra Pradesh',
    });

    showSuccess(
      'Account Created!',
      'Your retailer account is under review. Our team will call you on +91 ' +
      val('regPhone') + ' within 1 business day to activate it.'
    );

  } catch (err) {
    toast(err.error || 'Registration failed. Please try again.', true);
    // Show field-specific errors from server
    if (err.fields) {
      Object.entries(err.fields).forEach(([field, msg]) => {
        const errId = 'reg' + field.charAt(0).toUpperCase() + field.slice(1) + 'Err';
        setErr(errId, msg);
      });
      if (err.fields.email || err.fields.phone || err.fields.password) goRegStep(1);
      else goRegStep(2);
    }
  } finally {
    setLoading('submitBtn', false);
  }
}

// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────
async function doLogin() {
  clearErr('loginPhoneErr');
  clearErr('loginPwErr');

  const phone = val('loginPhone');
  const pw    = $('loginPw')?.value || '';
  let ok = true;

  if (!PHONE_REGEX.test(phone)) { setErr('loginPhoneErr', 'Enter a valid 10-digit mobile number'); ok = false; }
  if (!pw)                      { setErr('loginPwErr',    'Password is required'); ok = false; }
  if (!ok) return;

  setLoading('loginBtn', true);
  try {
    const data = await Auth.login({ phone, password: pw });
    saveSession(data.token, data.retailer);

    // Redirect back to where they came from, or catalogue
    const redirect = localStorage.getItem('rs_redirect') || 'index.html';
    localStorage.removeItem('rs_redirect');
    window.location.href = redirect;

  } catch (err) {
    if (err.status === 403) {
      // Account created but not yet activated by admin
      toast('Account pending activation. Our team will call you soon.', true);
    } else if (err.status === 401) {
      const msg = err.error || 'Incorrect phone or password';
      if (msg.toLowerCase().includes('password')) setErr('loginPwErr', msg);
      else setErr('loginPhoneErr', msg);
    } else {
      toast(err.error || 'Login failed. Check your internet connection.', true);
    }
  } finally {
    setLoading('loginBtn', false);
  }
}

// ─────────────────────────────────────────────
//  FORGOT PASSWORD
// ─────────────────────────────────────────────
let fgTimerInt;

async function fgSendOTP() {
  const phone = val('fgPhone') || $('fgPhone')?.value.trim();
  if (!PHONE_REGEX.test(phone)) {
    toast('Enter a valid 10-digit mobile number', true);
    return;
  }

  setLoading('fgSendBtn', true);
  try {
    await Auth.forgotPassword({ phone });
    const sentTo = $('fgSentTo');
    if (sentTo) sentTo.textContent = '+91 ' + phone;
    showFgStep(2);
    startFgTimer();

    // Dev: auto-fill OTP for testing
    if (location.hostname === 'localhost') {
      setTimeout(() =>
        document.querySelectorAll('.obox').forEach((b, i) => b.value = '123456'[i])
      , 600);
    }
  } catch (err) {
    toast(err.error || 'Could not send OTP. Try again.', true);
  } finally {
    setLoading('fgSendBtn', false);
  }
}

function startFgTimer() {
  let s = 30;
  const rbtn   = $('fgResendBtn');
  const rtimer = $('fgTimer');
  if (rbtn)   rbtn.disabled = true;
  if (rtimer) rtimer.textContent = 'Resend in 30s';
  clearInterval(fgTimerInt);
  fgTimerInt = setInterval(() => {
    s--;
    if (rtimer) rtimer.textContent = s > 0 ? 'Resend in ' + s + 's' : '';
    if (s <= 0) { clearInterval(fgTimerInt); if (rbtn) rbtn.disabled = false; }
  }, 1000);
}

function fgVerifyOTP() {
  const otp = [...document.querySelectorAll('.obox')].map(b => b.value).join('');
  if (otp.length !== 6) { toast('Enter the complete 6-digit OTP', true); return; }
  showFgStep(3);
}

async function fgSetPassword() {
  const phone = $('fgPhone')?.value.trim() || '';
  const otp   = [...document.querySelectorAll('.obox')].map(b => b.value).join('');
  const pw    = $('fgNewPw')?.value    || '';
  const pwc   = $('fgConfirmPw')?.value || '';

  if (pw.length < 8) { toast('Password must be at least 8 characters', true); return; }
  if (pw !== pwc)     { toast('Passwords do not match', true); return; }

  try {
    await Auth.resetPassword({ phone, otp, newPassword: pw });
    showSuccess('Password Reset!', 'Your password has been updated. You can now sign in.');
  } catch (err) {
    toast(err.error || 'Could not reset password. Try again.', true);
    if ((err.error || '').toLowerCase().includes('otp')) showFgStep(2);
  }
}

// ── OTP box helpers ───────────────────────────
function oNext(el, i) {
  el.value = el.value.replace(/\D/, '');
  if (el.value) {
    const boxes = document.querySelectorAll('.obox');
    if (i < 5) boxes[i + 1].focus();
  }
}
function oBack(e, el, i) {
  if (e.key === 'Backspace' && !el.value && i > 0)
    document.querySelectorAll('.obox')[i - 1].focus();
}

// ── Success screen ────────────────────────────
function showSuccess(title, sub) {
  const t = $('successTitle');
  const s = $('successSub');
  if (t) t.textContent = title;
  if (s) s.textContent = sub;
  showScreen('screenSuccess');
}

function goToPortal() {
  window.location.href = 'index.html';
}

// ── On page load ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, skip the login page
  if (isLoggedIn()) {
    const redirect = localStorage.getItem('rs_redirect') || 'index.html';
    localStorage.removeItem('rs_redirect');
    window.location.href = redirect;
    return;
  }
  // Start on login tab
  switchTab('login');
});