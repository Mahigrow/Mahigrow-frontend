// ─────────────────────────────────────────────
//  js/auth.js  —  Login / Register / Forgot PW
// ─────────────────────────────────────────────

// ── Tab switch ────────────────────────────────
function showTab(tab) {
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('registerTab').classList.toggle('active', tab === 'register');
  document.getElementById('loginPanel').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('registerPanel').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('forgotPanel').style.display   = 'none';
}

// ── Error helpers ─────────────────────────────
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function clearErr(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// ═══════════════════════════════════════════════
//  SIGN IN
// ═══════════════════════════════════════════════
async function doLogin(e) {
  e.preventDefault();
  clearErr('loginErr');
  const phone    = val('loginPhone');
  const password = val('loginPw');
  if (!phone || !password) return showErr('loginErr', 'Phone and password required');

  const btn = document.getElementById('loginBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

  try {
    const data = await Auth.login({ phone, password });
    localStorage.setItem('mg_token',    data.token);
    localStorage.setItem('mg_retailer', JSON.stringify(data.retailer));

    // Redirect to pending cart or homepage
    const redirect = localStorage.getItem('rs_redirect') || 'index.html';
    localStorage.removeItem('rs_redirect');
    window.location.href = redirect;
  } catch (err) {
    showErr('loginErr', err.error || 'Login failed. Please check your internet connection.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
  }
}

// ═══════════════════════════════════════════════
//  REGISTER — 3 steps
// ═══════════════════════════════════════════════
let regStep = 1;
let regData = {};

function goStep(n) {
  regStep = n;
  [1, 2, 3].forEach(i => {
    const p = document.getElementById('regStep' + i);
    if (p) p.style.display = i === n ? '' : 'none';
  });
  // update step indicators
  document.querySelectorAll('.step-dot').forEach((d, i) => {
    d.classList.toggle('active',    i < n);
    d.classList.toggle('complete',  i < n - 1);
  });
}

async function regNext1(e) {
  e.preventDefault();
  clearErr('reg1Err');
  const phone = val('regPhone');
  const pw    = val('regPw');
  const cpw   = val('regCpw');
  if (!phone || phone.length < 10) return showErr('reg1Err', 'Enter a valid 10-digit phone number');
  if (!pw || pw.length < 8)        return showErr('reg1Err', 'Password must be at least 8 characters');
  if (pw !== cpw)                  return showErr('reg1Err', 'Passwords do not match');
  regData = { phone, password: pw };
  goStep(2);
}

async function regNext2(e) {
  e.preventDefault();
  clearErr('reg2Err');
  const gstin    = val('regGstin').toUpperCase();
  const shopName = val('regShop');
  const owner    = val('regOwner');
  const district = val('regDistrict');
  const pincode  = val('regPincode');

  if (!gstin)    return showErr('reg2Err', 'GSTIN required');
  if (!shopName) return showErr('reg2Err', 'Shop name required');
  if (!owner)    return showErr('reg2Err', 'Owner name required');

  // Show loading
  const btn = document.getElementById('reg2Btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Verifying…'; }

  let state = '';
  let gstVerified = false;
  try {
    const gstRes = await GST.verify(gstin);
    state       = gstRes.state || '';
    gstVerified = gstRes.verified || false;
    if (gstRes.legalName) {
      document.getElementById('regShop').value  = gstRes.legalName || shopName;
    }
    // Auto-fill state field
    const stateEl = document.getElementById('regState');
    if (stateEl) stateEl.value = state;
  } catch {
    // Soft fail — derive state from GSTIN prefix
    const codes = {
      '36':'Telangana','37':'Andhra Pradesh','28':'Andhra Pradesh','29':'Karnataka',
      '27':'Maharashtra','07':'Delhi','09':'Uttar Pradesh','06':'Haryana',
    };
    state = codes[gstin.slice(0,2)] || '';
    const stateEl = document.getElementById('regState');
    if (stateEl) stateEl.value = state;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Continue →'; }
  }

  regData = { ...regData, gstin, shopName: val('regShop') || shopName, ownerName: owner, district, pincode, state, gstVerified };
  goStep(3);
}

async function regSubmit(e) {
  e.preventDefault();
  clearErr('reg3Err');
  const btn = document.getElementById('reg3Btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Registering…'; }

  try {
    await Auth.register(regData);
    // Show success, switch to login
    goStep(1);
    showTab('login');
    showErr('loginErr', ''); // clear
    const successEl = document.getElementById('regSuccess');
    if (successEl) { successEl.style.display = 'block'; successEl.textContent = 'Registration successful! Our team will activate your account shortly.'; }
  } catch (err) {
    showErr('reg3Err', err.error || 'Registration failed. Please try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Register →'; }
  }
}

// ═══════════════════════════════════════════════
//  FORGOT PASSWORD
// ═══════════════════════════════════════════════
let fgPhone = '';
let fgStep  = 1; // 1=phone, 2=otp, 3=newpw

function showForgot() {
  document.getElementById('loginPanel').style.display  = 'none';
  document.getElementById('forgotPanel').style.display = '';
  fgStep = 1;
  showFgStep(1);
}
function hideForgot() {
  document.getElementById('forgotPanel').style.display = 'none';
  document.getElementById('loginPanel').style.display  = '';
}

function showFgStep(n) {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('fgStep' + i);
    if (el) el.style.display = i === n ? '' : 'none';
  });
}

async function fgSendOTP(e) {
  e.preventDefault();
  clearErr('fgErr1');
  fgPhone = val('fgPhone');
  if (!fgPhone || fgPhone.length < 10) return showErr('fgErr1', 'Enter a valid phone number');

  const btn = document.getElementById('fgSendBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

  try {
    const res = await Auth.forgotPassword(fgPhone);
    const dest = res.destination || fgPhone;
    const via  = res.via || 'sms';
    const destEl = document.getElementById('fgOtpDest');
    if (destEl) destEl.textContent = `OTP sent to ${via === 'email' ? dest : dest.replace(/(\d{2})\d+(\d{2})/, '$1****$2')} via ${via}`;
    fgStep = 2;
    showFgStep(2);
  } catch (err) {
    showErr('fgErr1', err.error || 'Could not send OTP. Check phone number.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Send OTP'; }
  }
}

async function fgVerifyOTP(e) {
  e.preventDefault();
  clearErr('fgErr2');
  const otp = val('fgOtp');
  if (!otp || otp.length !== 6) return showErr('fgErr2', 'Enter the 6-digit OTP');

  const btn = document.getElementById('fgVerifyBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Verifying…'; }

  try {
    await Auth.verifyOTP({ phone: fgPhone, otp, purpose: 'RESET_PASSWORD' });
    fgStep = 3;
    showFgStep(3);
  } catch (err) {
    showErr('fgErr2', err.error || 'Invalid or expired OTP');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Verify OTP'; }
  }
}

async function fgResetPw(e) {
  e.preventDefault();
  clearErr('fgErr3');

  // ── Field IDs must match exactly what's in login.html ──
  const newPw  = val('fgNewPw');   // id="fgNewPw"
  const cfmPw  = val('fgCfmPw');   // id="fgCfmPw"  ← exact match required

  if (!newPw || newPw.length < 8) return showErr('fgErr3', 'Password must be at least 8 characters');
  if (newPw !== cfmPw)            return showErr('fgErr3', 'Passwords do not match');

  const btn = document.getElementById('fgResetBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    // We already verified OTP in step 2, but reset-password endpoint re-verifies
    // So we need the OTP value — get from field or store it
    const otp = val('fgOtp') || document.getElementById('fgOtp')?.value || '';
    await Auth.resetPassword({ phone: fgPhone, otp, newPassword: newPw });
    showFgStep(1);
    hideForgot();
    const el = document.getElementById('loginSuccess');
    if (el) { el.style.display = 'block'; el.textContent = 'Password reset successful. Please sign in.'; }
  } catch (err) {
    showErr('fgErr3', err.error || 'Reset failed. Please start over.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Set New Password'; }
  }
}

// ── Init ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  if (isLoggedIn()) {
    const redirect = localStorage.getItem('rs_redirect') || 'index.html';
    localStorage.removeItem('rs_redirect');
    window.location.href = redirect;
    return;
  }
  showTab('login');
  goStep(1);
});