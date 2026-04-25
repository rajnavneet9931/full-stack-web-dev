// frontend/js/app.js — Jeecom Information Technology
// Features: Products, Cart, OTP, Checkout (COD + Razorpay), GST Invoice, Admin Panel

const API_BASE = 'http://localhost:5000/api';

// ─── App State ────────────────────────────────────────────────────────────────
const state = {
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  adminToken: localStorage.getItem('adminToken') || null,
  adminUser: JSON.parse(localStorage.getItem('adminUser') || 'null'),
  products: [],
  activeCategory: 'All',
  currentPage: 1,
};

// ─── API Fetch Wrapper ────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.adminToken) headers['Authorization'] = `Bearer ${state.adminToken}`;
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (err) {
    throw err;
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

// ─── Page Navigation ──────────────────────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageId}`)?.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === pageId));
  if (pageId === 'home') loadFeaturedProducts();
  if (pageId === 'products') loadProducts();
  if (pageId === 'admin') initAdmin();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Modal Helpers ────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}
function stockBadge(qty) {
  if (qty === 0) return '<span class="stock-badge stock-out">Out of Stock</span>';
  if (qty <= 5) return `<span class="stock-badge stock-low">Low Stock (${qty})</span>`;
  return '<span class="stock-badge stock-in">In Stock</span>';
}
function catIcon(cat) {
  const icons = { Laptops: '💻', Motherboards: '🖥️', Accessories: '🖱️', Components: '🔩', Networking: '🌐', Storage: '💾' };
  return icons[cat] || '📦';
}
function parseSpecs(text) {
  const specs = {};
  if (!text) return specs;
  text.split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) specs[key.trim()] = rest.join(':').trim();
  });
  return specs;
}
function specsToText(specs) {
  if (!specs) return '';
  return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join('\n');
}

/* ══════════════════════════════════════════════════════════════════════════════
   PRODUCTS
══════════════════════════════════════════════════════════════════════════════ */
async function loadFeaturedProducts() {
  const el = document.getElementById('featuredProducts');
  if (!el) return;
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await apiFetch('/products?limit=6');
    document.getElementById('heroProducts').textContent = data.total || data.count;
    el.innerHTML = data.products.length
      ? data.products.map(p => productCardHTML(p)).join('')
      : '<div class="empty-state"><p>No products available</p></div>';
  } catch (e) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Could not load products</h3><p>Make sure the server is running</p></div>`;
  }
}

async function loadProducts() {
  const el = document.getElementById('productsGrid');
  if (!el) return;
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const search = document.getElementById('productSearch')?.value || '';
  const sort = document.getElementById('sortSelect')?.value || '';
  const cat = state.activeCategory;
  const page = state.currentPage;
  let query = `?page=${page}&limit=12`;
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (sort) query += `&sort=${sort}`;
  if (cat !== 'All') query += `&category=${encodeURIComponent(cat)}`;
  try {
    const data = await apiFetch(`/products${query}`);
    state.products = data.products;
    el.innerHTML = data.products.length
      ? data.products.map(p => productCardHTML(p)).join('')
      : '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No products found</h3></div>';
    renderPagination(data.pages, data.currentPage);
  } catch (e) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error loading products</h3><p>${e.message}</p></div>`;
  }
}

function productCardHTML(p) {
  const isOut = p.quantity === 0;
  return `
    <div class="product-card">
      <div class="product-card-img-placeholder" style="position:relative;overflow:hidden">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;padding:12px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <span style="font-size:3rem;${p.image ? 'display:none' : 'display:flex'};align-items:center;justify-content:center;width:100%;height:100%;position:absolute;top:0;left:0">${catIcon(p.category)}</span>
      </div>
      <div class="product-card-body">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || ''}</div>
        <div class="product-footer">
          <div class="product-price">${formatINR(p.price)}</div>
          ${stockBadge(p.quantity)}
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="viewProduct('${p._id}')">Details</button>
          ${isOut
      ? '<button class="btn btn-sm" style="background:var(--red-dim);color:var(--red);border:1px solid var(--red);cursor:not-allowed" disabled>Out of Stock</button>'
      : `<button class="btn btn-primary btn-sm" onclick="addToCart('${p._id}','${p.name.replace(/'/g, "\\'")}',${p.price},${p.quantity})">Add to Cart</button>`}
        </div>
      </div>
    </div>`;
}

function filterProducts() {
  state.currentPage = 1;
  clearTimeout(window._searchTimer);
  window._searchTimer = setTimeout(loadProducts, 350);
}
function setCategoryFilter(cat, btn) {
  state.activeCategory = cat;
  state.currentPage = 1;
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadProducts();
}
function renderPagination(pages, current) {
  const el = document.getElementById('productsPagination');
  if (!el || pages <= 1) { if (el) el.innerHTML = ''; return; }
  el.innerHTML = Array.from({ length: pages }, (_, i) =>
    `<button class="page-btn ${i + 1 === current ? 'active' : ''}" onclick="goToPage(${i + 1})">${i + 1}</button>`
  ).join('');
}
function goToPage(page) { state.currentPage = page; loadProducts(); window.scrollTo({ top: 200, behavior: 'smooth' }); }

async function viewProduct(id) {
  try {
    const data = await apiFetch(`/products/${id}`);
    const p = data.product;
    document.getElementById('productModalTitle').textContent = p.name;
    const specsHtml = p.specs && Object.keys(p.specs).length
      ? `<div style="margin-top:1rem"><h4 style="font-size:0.9rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-secondary)">SPECIFICATIONS</h4>
          <div class="product-specs-grid">${Object.entries(p.specs).map(([k, v]) => `<div class="spec-item"><strong>${k}:</strong> ${v}</div>`).join('')}</div></div>`
      : '';
    document.getElementById('productModalBody').innerHTML = `
      <div style="display:flex;gap:1.5rem;flex-wrap:wrap">
        <div style="flex:0 0 200px;background:var(--bg-elevated);border-radius:var(--radius);height:200px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:4rem">
          ${p.image
            ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;padding:12px;" onerror="this.style.display='none';this.parentElement.innerHTML='${catIcon(p.category)}';">`
            : catIcon(p.category)}
        </div>
        <div style="flex:1;min-width:220px">
          <div class="product-category">${p.category}</div>
          <h2 style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;margin-bottom:0.5rem">${p.name}</h2>
          <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;margin-bottom:1rem">${p.description || ''}</p>
          <div style="font-family:var(--font-display);font-size:2rem;font-weight:700;margin-bottom:0.75rem">${formatINR(p.price)}</div>
          ${stockBadge(p.quantity)}${specsHtml}
          <div style="margin-top:1.5rem;display:flex;gap:0.75rem;flex-wrap:wrap">
            ${p.quantity > 0
        ? `<button class="btn btn-primary" onclick="addToCart('${p._id}','${p.name.replace(/'/g, "\\'")}',${p.price},${p.quantity});closeProductModal()">Add to Cart</button>`
        : '<button class="btn btn-danger" disabled>Out of Stock</button>'}
          </div>
        </div>
      </div>`;
    openModal('productModal');
  } catch (e) { showToast('Could not load product details', 'error'); }
}
function closeProductModal() { closeModal('productModal'); }

/* ══════════════════════════════════════════════════════════════════════════════
   CART
══════════════════════════════════════════════════════════════════════════════ */
function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
  renderCart();
}
function addToCart(id, name, price, maxQty) {
  const existing = state.cart.find(i => i.id === id);
  if (existing) {
    if (existing.qty >= maxQty) { showToast('Cannot add more — stock limit reached', 'warning'); return; }
    existing.qty++;
  } else {
    state.cart.push({ id, name, price, qty: 1, maxQty });
  }
  saveCart(); updateCartCount(); showToast(`${name} added to cart!`);
}
function removeFromCart(id) { state.cart = state.cart.filter(i => i.id !== id); saveCart(); updateCartCount(); renderCart(); }
function changeQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, Math.min(item.maxQty || 999, item.qty + delta));
  saveCart(); updateCartCount(); renderCart();
}
function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); }
function updateCartCount() {
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cartCount');
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}
function cartTotal() { return state.cart.reduce((s, i) => s + i.price * i.qty, 0); }
function renderCart() {
  const el = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  if (state.cart.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🛒</div><h3>Cart is empty</h3><p>Browse products and add items</p></div>`;
    footer.style.display = 'none';
    return;
  }
  el.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatINR(item.price)} each</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
          <span style="font-size:0.8rem;color:var(--text-secondary);margin-left:4px">= ${formatINR(item.price * item.qty)}</span>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">🗑️</button>
    </div>`).join('');
  footer.style.display = 'block';
  totalEl.textContent = formatINR(cartTotal());
}

/* ══════════════════════════════════════════════════════════════════════════════
   OTP VERIFICATION
══════════════════════════════════════════════════════════════════════════════ */
const otpState = { verified: false, timer: null };

async function sendCheckoutOTP(isResend = false) {
  const email = document.getElementById('coEmail').value.trim();
  const name = document.getElementById('coName').value.trim();
  if (!email) { showToast('Enter your email address first', 'warning'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email address', 'warning'); return; }

  const btn = document.getElementById('sendOtpBtn');
  const statusEl = document.getElementById('otpSendStatus');
  btn.disabled = true; btn.textContent = 'Sending...'; statusEl.innerHTML = '';

  try {
    await apiFetch('/otp/send', { method: 'POST', body: JSON.stringify({ email, name }) });
    document.getElementById('otpInputRow').style.display = 'block';
    document.getElementById('otpCodeInput').value = '';
    document.getElementById('otpCodeInput').disabled = false;
    document.getElementById('otpCodeInput').focus();
    document.getElementById('otpVerifyStatus').innerHTML = '';
    statusEl.innerHTML = `<span style="color:var(--green);font-weight:500">✅ OTP sent to <strong>${email}</strong> — check your inbox</span>`;
    document.getElementById('coEmail').readOnly = true;
    if (isResend) showToast('New OTP sent to your email!');
    startOtpCountdown();
    btn.textContent = 'OTP Sent ✓';
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Resend OTP'; }, 30000);
  } catch (err) {
    statusEl.innerHTML = `<span style="color:var(--red)">❌ ${err.message}</span>`;
    btn.disabled = false; btn.textContent = 'Send OTP';
    showToast(err.message, 'error');
  }
}

function startOtpCountdown() {
  clearInterval(otpState.timer);
  let secs = 60;
  const countEl = document.getElementById('otpCountdown');
  const resendBtn = document.getElementById('resendOtpBtn');
  resendBtn.style.display = 'none';
  countEl.style.color = 'var(--text-muted)';
  countEl.textContent = `OTP valid for ${secs}s`;
  otpState.timer = setInterval(() => {
    secs--;
    if (secs <= 0) {
      clearInterval(otpState.timer);
      countEl.style.color = 'var(--red)';
      countEl.textContent = 'OTP expired — request a new one.';
      resendBtn.style.display = 'inline-flex';
      document.getElementById('otpCodeInput').disabled = true;
    } else {
      countEl.textContent = `OTP valid for ${secs}s`;
    }
  }, 1000);
}

async function verifyCheckoutOTP() {
  const email = document.getElementById('coEmail').value.trim();
  const code = document.getElementById('otpCodeInput').value.trim();
  const statusEl = document.getElementById('otpVerifyStatus');
  if (!code || code.length !== 6) { statusEl.innerHTML = `<span style="color:var(--red)">Please enter the full 6-digit OTP.</span>`; return; }
  statusEl.innerHTML = `<span style="color:var(--text-secondary)">Verifying...</span>`;
  const verifyBtn = document.querySelector('[onclick="verifyCheckoutOTP()"]');
  if (verifyBtn) verifyBtn.disabled = true;

  try {
    await apiFetch('/otp/verify', { method: 'POST', body: JSON.stringify({ email, code }) });
    otpState.verified = true;
    clearInterval(otpState.timer);
    document.getElementById('otpInputRow').style.display = 'none';
    document.getElementById('otpSendStatus').innerHTML = '';
    document.getElementById('otpCountdown').textContent = '';
    const badge = document.getElementById('emailVerifiedBadge');
    badge.style.display = 'flex';
    document.getElementById('coEmail').readOnly = true;
    document.getElementById('sendOtpBtn').style.display = 'none';
    const placeBtn = document.getElementById('placeOrderBtn');
    placeBtn.disabled = false; placeBtn.style.opacity = '1'; placeBtn.style.cursor = 'pointer';
    placeBtn.textContent = 'Place Order →';
    showToast('Email verified! You can now place your order.');
  } catch (err) {
    statusEl.innerHTML = `<span style="color:var(--red)">❌ ${err.message}</span>`;
    if (verifyBtn) verifyBtn.disabled = false;
    showToast(err.message, 'error');
  }
}

function resetOtpUI() {
  otpState.verified = false;
  clearInterval(otpState.timer);
  document.getElementById('otpInputRow').style.display = 'none';
  document.getElementById('emailVerifiedBadge').style.display = 'none';
  document.getElementById('otpSendStatus').innerHTML = '';
  document.getElementById('otpVerifyStatus').innerHTML = '';
  document.getElementById('otpCountdown').textContent = '';
  document.getElementById('otpCodeInput').value = '';
  document.getElementById('otpCodeInput').disabled = false;
  document.getElementById('coEmail').readOnly = false;
  document.getElementById('sendOtpBtn').style.display = 'inline-flex';
  document.getElementById('sendOtpBtn').textContent = 'Send OTP';
  document.getElementById('sendOtpBtn').disabled = false;
  document.getElementById('resendOtpBtn').style.display = 'none';
  // Reset GST fields
  const gstCb = document.getElementById('gstCheckbox');
  if (gstCb) gstCb.checked = false;
  document.getElementById('gstinField').style.display = 'none';
  document.getElementById('coGSTIN').value = '';
  const placeBtn = document.getElementById('placeOrderBtn');
  placeBtn.disabled = true; placeBtn.style.opacity = '0.45';
  placeBtn.style.cursor = 'not-allowed'; placeBtn.textContent = '🔒 Verify Email First';
}

/* ══════════════════════════════════════════════════════════════════════════════
   GST INVOICE TOGGLE
══════════════════════════════════════════════════════════════════════════════ */
function toggleGSTField() {
  const checkbox = document.getElementById('gstCheckbox');
  const field = document.getElementById('gstinField');

  field.style.display = checkbox.checked ? 'block' : 'none';
}

/* ══════════════════════════════════════════════════════════════════════════════
   CHECKOUT
══════════════════════════════════════════════════════════════════════════════ */
function openCheckout() {
  if (state.cart.length === 0) { showToast('Cart is empty', 'warning'); return; }
  document.getElementById('checkoutItems').innerHTML = state.cart.map(i => `
    <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border);font-size:0.88rem">
      <span>${i.name} × ${i.qty}</span>
      <strong>${formatINR(i.price * i.qty)}</strong>
    </div>`).join('');
  document.getElementById('checkoutTotal').textContent = formatINR(cartTotal());
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  openModal('checkoutModal');
}

function closeCheckout() {
  closeModal('checkoutModal');
  document.getElementById('checkoutForm').reset();
  resetOtpUI();
}

async function placeOrder(e) {
  e.preventDefault();
  if (!otpState.verified) { showToast('Please verify your email with OTP first.', 'warning'); return; }
  const paymentMethod = document.getElementById('coPayment').value;
  const customerInfo = {
    name:    document.getElementById('coName').value.trim(),
    email:   document.getElementById('coEmail').value.trim(),
    phone:   document.getElementById('coPhone').value.trim(),
    address: document.getElementById('coAddress').value.trim(),
  };
  const requestGST = document.getElementById('gstCheckbox')?.checked || false;
  const gstin = document.getElementById('coGSTIN')?.value?.trim() || '';

  if (paymentMethod === 'Razorpay') {
    await handleRazorpayPayment(customerInfo, requestGST, gstin);
  } else {
    await handleCODOrder(customerInfo, paymentMethod, requestGST, gstin);
  }
}

// ── Cash on Delivery ──────────────────────────────────────────────────────────
async function handleCODOrder(customerInfo, paymentMethod, requestGST, gstin) {
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true; btn.textContent = 'Placing order...';
  try {
    const data = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerInfo,
        items: state.cart.map(i => ({ product: i.id, quantity: i.qty })),
        paymentMethod,
        requestGST,
        gstin,
      }),
    });
    onOrderSuccess(data.order.orderNumber);
  } catch (err) {
    showToast(err.message || 'Order failed. Please try again.', 'error');
    btn.disabled = false; btn.textContent = 'Place Order →';
  }
}

// ── Razorpay Payment ──────────────────────────────────────────────────────────
async function handleRazorpayPayment(customerInfo, requestGST, gstin) {
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true; btn.textContent = 'Opening payment...';
  try {
    const orderData = await apiFetch('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount: cartTotal(),
        cartItems: state.cart.map(i => ({ product: i.id, quantity: i.qty })),
        customerInfo,
      }),
    });

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Jeecom Information Technology',
      description: 'IT Hardware Purchase',
      order_id: orderData.razorpayOrderId,
      prefill: { name: customerInfo.name, email: customerInfo.email, contact: customerInfo.phone },
      theme: { color: '#1a3a5c' },
      handler: async function (response) {
        try {
          btn.textContent = 'Verifying payment...';
          const result = await apiFetch('/payment/verify', {
            method: 'POST',
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              customer: customerInfo,
              cartItems: state.cart.map(i => ({ product: i.id, quantity: i.qty })),
              requestGST,
              gstin,
            }),
          });
          onOrderSuccess(result.orderNumber, response.razorpay_payment_id);
        } catch (verifyErr) {
          showToast('Payment received but verification failed: ' + verifyErr.message, 'error');
          btn.disabled = false; btn.textContent = 'Place Order →';
        }
      },
      modal: {
        ondismiss: function () {
          showToast('Payment cancelled.', 'warning');
          btn.disabled = false; btn.textContent = 'Place Order →';
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
      showToast('Payment failed: ' + response.error.description, 'error');
      btn.disabled = false; btn.textContent = 'Place Order →';
    });
    rzp.open();
  } catch (err) {
    showToast(err.message || 'Could not initiate payment. Try again.', 'error');
    btn.disabled = false; btn.textContent = 'Place Order →';
  }
}

// ── Shared success handler ────────────────────────────────────────────────────
function onOrderSuccess(orderNumber, paymentId) {
  closeCheckout();
  state.cart = []; saveCart(); updateCartCount(); renderCart();
  const msg = paymentId
    ? `🎉 Payment successful! Order #${orderNumber}`
    : `✅ Order placed! Order #${orderNumber}`;
  showToast(msg);
}

/* ══════════════════════════════════════════════════════════════════════════════
   SERVICES
══════════════════════════════════════════════════════════════════════════════ */
async function submitServiceRequest(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true; btn.textContent = 'Submitting...';
  const fd = new FormData(e.target);
  const payload = {
    customer: { name: fd.get('customerName'), email: fd.get('customerEmail'), phone: fd.get('customerPhone') },
    serviceType: fd.get('serviceType'),
    deviceInfo: { type: fd.get('deviceType'), brand: fd.get('deviceBrand') },
    issueDescription: fd.get('issueDescription'),
  };
  try {
    const data = await apiFetch('/services', { method: 'POST', body: JSON.stringify(payload) });
    showToast(`Request submitted! Ticket: ${data.ticketNumber}`);
    e.target.reset();
    const result = document.createElement('div');
    result.className = 'card';
    result.style.cssText = 'padding:1.5rem;margin-top:1rem;border-color:var(--green);text-align:center';
    result.innerHTML = `
      <div style="font-size:2rem;margin-bottom:0.5rem">✅</div>
      <h3 style="font-family:var(--font-display);margin-bottom:0.5rem">Request Submitted!</h3>
      <p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:0.75rem">Your ticket number:</p>
      <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--accent)">${data.ticketNumber}</div>
      <p style="color:var(--text-secondary);font-size:0.82rem;margin-top:0.5rem">Save this number to track your request</p>`;
    e.target.parentElement.insertAdjacentElement('afterend', result);
    setTimeout(() => result.remove(), 10000);
  } catch (err) {
    showToast(err.message || 'Submission failed', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Submit Request →';
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   TICKET TRACKING
══════════════════════════════════════════════════════════════════════════════ */
async function trackTicket() {
  const ticketNum = document.getElementById('trackInput').value.trim();
  if (!ticketNum) { showToast('Please enter a ticket number', 'warning'); return; }
  const el = document.getElementById('trackResult');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await apiFetch(`/services/track/${ticketNum}`);
    const r = data.request;
    const statusColors = {
      'Received': 'badge-blue', 'Diagnosing': 'badge-orange', 'In Progress': 'badge-purple',
      'Waiting for Parts': 'badge-orange', 'Ready for Pickup': 'badge-green',
      'Completed': 'badge-green', 'Cancelled': 'badge-red'
    };
    el.innerHTML = `
      <div class="card" style="padding:1.5rem;border-left:4px solid var(--gold)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1rem">
          <div>
            <div style="font-size:0.78rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.07em">Ticket Number</div>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--accent)">${r.ticketNumber}</div>
          </div>
          <span class="badge ${statusColors[r.status] || 'badge-gray'}">${r.status}</span>
        </div>
        <div class="form-grid" style="margin-bottom:1rem">
          <div><div style="font-size:0.78rem;color:var(--text-secondary)">Customer</div><div style="font-weight:500">${r.customer.name}</div></div>
          <div><div style="font-size:0.78rem;color:var(--text-secondary)">Service Type</div><div style="font-weight:500">${r.serviceType}</div></div>
          <div><div style="font-size:0.78rem;color:var(--text-secondary)">Device</div><div style="font-weight:500">${r.deviceInfo?.brand || '—'} ${r.deviceInfo?.type || ''}</div></div>
          <div><div style="font-size:0.78rem;color:var(--text-secondary)">Priority</div><div style="font-weight:500">${r.priority}</div></div>
          <div><div style="font-size:0.78rem;color:var(--text-secondary)">Submitted</div><div style="font-weight:500">${new Date(r.createdAt).toLocaleDateString('en-IN')}</div></div>
          ${r.estimatedCost ? `<div><div style="font-size:0.78rem;color:var(--text-secondary)">Estimated Cost</div><div style="font-weight:500;color:var(--accent)">${formatINR(r.estimatedCost)}</div></div>` : ''}
        </div>
        <div><div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:0.3rem">Issue Description</div><p style="font-size:0.88rem;line-height:1.6">${r.issueDescription}</p></div>
        ${r.adminNotes ? `<div style="margin-top:1rem;padding:1rem;background:var(--bg-elevated);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:0.3rem">Tech Notes</div><p style="font-size:0.88rem">${r.adminNotes}</p></div>` : ''}
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Ticket not found</h3><p>${err.message}</p></div>`;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   ADMIN
══════════════════════════════════════════════════════════════════════════════ */
function initAdmin() {
  if (state.adminToken) showAdminDashboard();
  else {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
  }
}

async function adminLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value })
    });
    state.adminToken = data.token; state.adminUser = data.admin;
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.admin));
    showToast(`Welcome back, ${data.admin.name}!`);
    showAdminDashboard();
  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
  } finally { btn.disabled = false; btn.textContent = 'Sign In →'; }
}

function showAdminDashboard() {
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';
  if (state.adminUser) document.getElementById('adminName').textContent = state.adminUser.name;
  loadAdminOverview();
}

function adminLogout() {
  state.adminToken = null; state.adminUser = null;
  localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser');
  document.getElementById('adminLogin').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  showToast('Logged out successfully');
}

function switchAdminSection(section, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`admin-${section}`)?.classList.add('active');
  btn.classList.add('active');
  if (section === 'overview') loadAdminOverview();
  if (section === 'products') loadAdminProducts();
  if (section === 'orders') loadAdminOrders();
  if (section === 'services') loadAdminServices();
}

// ── Overview ──────────────────────────────────────────────────────────────────
async function loadAdminOverview() {
  try {
    const [prodStats, orderStats, svcStats] = await Promise.all([
      apiFetch('/products/stats/overview'),
      apiFetch('/orders/stats/overview'),
      apiFetch('/services/stats/overview'),
    ]);
    document.getElementById('adminStats').innerHTML = `
      <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-label">Total Products</div><div class="stat-value">${prodStats.stats.totalProducts}</div></div>
      <div class="stat-card"><div class="stat-icon">❌</div><div class="stat-label">Out of Stock</div><div class="stat-value" style="color:var(--red)">${prodStats.stats.outOfStock}</div></div>
      <div class="stat-card"><div class="stat-icon">🧾</div><div class="stat-label">Total Orders</div><div class="stat-value">${orderStats.stats.totalOrders}</div></div>
      <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Total Revenue</div><div class="stat-value" style="font-size:1.4rem">${formatINR(orderStats.stats.totalRevenue)}</div></div>
      <div class="stat-card"><div class="stat-icon">🔧</div><div class="stat-label">Service Requests</div><div class="stat-value">${svcStats.stats.total}</div></div>
      <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-label">Pending Services</div><div class="stat-value" style="color:var(--orange)">${svcStats.stats.pending}</div></div>
      <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-label">Inventory Value</div><div class="stat-value" style="font-size:1.4rem">${formatINR(prodStats.stats.inventoryValue)}</div></div>
      <div class="stat-card"><div class="stat-icon">⚠️</div><div class="stat-label">Low Stock Items</div><div class="stat-value" style="color:var(--orange)">${prodStats.stats.lowStock}</div></div>`;

    const recents = orderStats.stats.recentOrders;
    document.getElementById('recentOrdersTable').innerHTML = recents.length ? `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${recents.map(o => `
              <tr>
                <td><code style="font-size:0.78rem;color:var(--accent)">${o.orderNumber}</code></td>
                <td>${o.customer.name}</td>
                <td>${formatINR(o.totalAmount)}</td>
                <td><span class="badge ${orderStatusBadge(o.status)}">${o.status}</span></td>
                <td style="color:var(--text-secondary)">${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '<p style="color:var(--text-secondary)">No orders yet</p>';
  } catch (e) {
    document.getElementById('adminStats').innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error loading stats</h3><p>${e.message}</p></div>`;
  }
}

// ── Admin Products ────────────────────────────────────────────────────────────
async function loadAdminProducts() {
  const el = document.getElementById('adminProductsTable');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await apiFetch('/products?limit=100');
    if (!data.products.length) { el.innerHTML = '<div class="empty-state"><p>No products found</p></div>'; return; }
    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Qty</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${data.products.map(p => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td><span class="badge badge-blue">${p.category}</span></td>
                <td>${formatINR(p.price)}</td>
                <td><strong style="color:${p.quantity === 0 ? 'var(--red)' : p.quantity <= 5 ? 'var(--orange)' : 'var(--green)'}">${p.quantity}</strong></td>
                <td>${stockBadge(p.quantity)}</td>
                <td>
                  <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
                    <button class="btn btn-secondary btn-sm" onclick="editProduct('${p._id}')">Edit</button>
                    <button class="btn btn-secondary btn-sm" onclick="openStockModal('${p._id}','${p.name.replace(/'/g, "\\'")}',${p.quantity})">Stock</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p._id}','${p.name.replace(/'/g, "\\'")}')">Delete</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { el.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>`; }
}

async function editProduct(id) {
  try {
    const data = await apiFetch(`/products/${id}`);
    const p = data.product;
    document.getElementById('editProductId').value = p._id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pQuantity').value = p.quantity;
    document.getElementById('pDescription').value = p.description || '';
    document.getElementById('pImage').value = p.image || '';
    document.getElementById('pSpecs').value = specsToText(p.specs);
    document.getElementById('addProductTitle').textContent = 'Edit Product';
    document.getElementById('saveProductBtn').textContent = 'Update Product';
    switchAdminSection('addProduct', document.querySelector('[onclick*="addProduct"]'));
  } catch (e) { showToast('Could not load product', 'error'); }
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProductId').value;
  const payload = {
    name: document.getElementById('pName').value,
    category: document.getElementById('pCategory').value,
    price: Number(document.getElementById('pPrice').value),
    quantity: Number(document.getElementById('pQuantity').value),
    description: document.getElementById('pDescription').value,
    image: document.getElementById('pImage').value,
    specs: parseSpecs(document.getElementById('pSpecs').value),
  };
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true; btn.textContent = id ? 'Updating...' : 'Saving...';
  try {
    if (id) {
      await apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Product updated successfully!');
    } else {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Product added successfully!');
    }
    resetProductForm();
    switchAdminSection('products', document.querySelector('[onclick*="\'products\'"]'));
    loadAdminProducts();
  } catch (err) { showToast(err.message || 'Save failed', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Save Product'; }
}

function resetProductForm() {
  document.getElementById('addProductForm').reset();
  document.getElementById('editProductId').value = '';
  document.getElementById('addProductTitle').textContent = 'Add New Product';
  document.getElementById('saveProductBtn').textContent = 'Save Product';
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    showToast(`"${name}" deleted`);
    loadAdminProducts();
  } catch (e) { showToast(e.message, 'error'); }
}

function openStockModal(id, name, currentQty) {
  document.getElementById('stockProductId').value = id;
  document.getElementById('stockProductName').textContent = `Product: ${name} | Current qty: ${currentQty}`;
  document.getElementById('stockQtyInput').value = currentQty;
  openModal('stockModal');
}

async function confirmStockUpdate() {
  const id = document.getElementById('stockProductId').value;
  const qty = Number(document.getElementById('stockQtyInput').value);
  if (isNaN(qty) || qty < 0) { showToast('Enter a valid quantity', 'warning'); return; }
  try {
    await apiFetch(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ quantity: qty }) });
    showToast('Stock updated!');
    closeModal('stockModal');
    loadAdminProducts();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── Admin Orders ──────────────────────────────────────────────────────────────
async function loadAdminOrders() {
  const el = document.getElementById('adminOrdersTable');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await apiFetch('/orders?limit=50');
    if (!data.orders.length) { el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🧾</div><h3>No orders yet</h3></div>'; return; }
    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Order #</th><th>Customer</th><th>Email</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${data.orders.map(o => `
              <tr>
                <td><code style="font-size:0.78rem;color:var(--accent)">${o.orderNumber}</code></td>
                <td><strong>${o.customer.name}</strong></td>
                <td style="color:var(--text-secondary);font-size:0.82rem">${o.customer.email}</td>
                <td>${o.items.length} item(s)</td>
                <td><strong>${formatINR(o.totalAmount)}</strong></td>
                <td>
                  <select class="form-select" style="font-size:0.78rem;padding:0.3rem 0.6rem" onchange="updateOrderStatus('${o._id}',this.value)">
                    ${['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled'].map(s =>
        `<option ${o.status === s ? 'selected' : ''} value="${s}">${s}</option>`
      ).join('')}
                  </select>
                </td>
                <td style="color:var(--text-secondary);font-size:0.82rem">${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
                    <button class="btn btn-secondary btn-sm" onclick="viewOrderDetail('${o._id}')">View</button>
                    <button class="btn btn-secondary btn-sm" onclick="adminSendGSTInvoice('${o._id}','${o.orderNumber}')">🧾 GST</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteOrder('${o._id}','${o.orderNumber}')">Delete</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { el.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>`; }
}

async function updateOrderStatus(id, status) {
  try {
    await apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    showToast(`Order status updated to "${status}". Customer notified.`);
  } catch (e) { showToast(e.message, 'error'); }
}

async function viewOrderDetail(id) {
  try {
    const data = await apiFetch(`/orders/${id}`);
    const o = data.order;
    document.getElementById('orderDetailBody').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
        <div><div style="font-size:0.78rem;color:var(--text-secondary)">Order Number</div><div style="font-weight:700;color:var(--accent)">${o.orderNumber}</div></div>
        <div><div style="font-size:0.78rem;color:var(--text-secondary)">Date</div><div>${new Date(o.createdAt).toLocaleString('en-IN')}</div></div>
        <div><div style="font-size:0.78rem;color:var(--text-secondary)">Customer</div><div>${o.customer.name}</div></div>
        <div><div style="font-size:0.78rem;color:var(--text-secondary)">Email</div><div>${o.customer.email}</div></div>
        <div><div style="font-size:0.78rem;color:var(--text-secondary)">Phone</div><div>${o.customer.phone || '—'}</div></div>
        <div><div style="font-size:0.78rem;color:var(--text-secondary)">Payment</div><div>${o.paymentMethod}</div></div>
        ${o.customer.gstin ? `<div><div style="font-size:0.78rem;color:var(--text-secondary)">GSTIN</div><div style="color:var(--gold)">${o.customer.gstin}</div></div>` : ''}
        <div style="grid-column:1/-1"><div style="font-size:0.78rem;color:var(--text-secondary)">Address</div><div>${o.customer.address || '—'}</div></div>
      </div>
      <h4 style="font-family:var(--font-display);margin-bottom:0.75rem">Order Items</h4>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
          <tbody>${o.items.map(i => `<tr><td>${i.name}</td><td>${formatINR(i.price)}</td><td>${i.quantity}</td><td><strong>${formatINR(i.price * i.quantity)}</strong></td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div style="text-align:right;margin-top:1rem;font-family:var(--font-display);font-size:1.4rem;font-weight:700">Total: ${formatINR(o.totalAmount)}</div>`;
    openModal('orderDetailModal');
  } catch (e) { showToast('Could not load order', 'error'); }
}

async function deleteOrder(id, orderNumber) {
  if (!confirm(`Delete order #${orderNumber}?\n\nThis will permanently remove it and cannot be undone.`)) return;
  try {
    await apiFetch(`/orders/${id}`, { method: 'DELETE' });
    showToast(`Order #${orderNumber} deleted successfully.`);
    loadAdminOrders();
  } catch (e) { showToast(e.message, 'error'); }
}

async function adminSendGSTInvoice(id, orderNumber) {
  const gstin = prompt(`Send GST Invoice for Order #${orderNumber}\n\nEnter customer GSTIN (leave blank if already on file):`);
  if (gstin === null) return;
  try {
    await apiFetch(`/orders/${id}/gst-invoice`, { method: 'POST', body: JSON.stringify({ gstin: gstin.trim() }) });
    showToast(`🧾 GST Invoice sent for Order #${orderNumber}`);
  } catch (e) { showToast(e.message, 'error'); }
}

// ── Admin Services ────────────────────────────────────────────────────────────
async function loadAdminServices() {
  const el = document.getElementById('adminServicesTable');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await apiFetch('/services?limit=50');
    if (!data.requests.length) { el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔧</div><h3>No service requests yet</h3></div>'; return; }
    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Ticket</th><th>Customer</th><th>Service</th><th>Device</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${data.requests.map(r => `
              <tr>
                <td><code style="font-size:0.78rem;color:var(--accent)">${r.ticketNumber}</code></td>
                <td><strong>${r.customer.name}</strong><br><span style="font-size:0.78rem;color:var(--text-secondary)">${r.customer.phone}</span></td>
                <td>${r.serviceType}</td>
                <td style="font-size:0.82rem">${r.deviceInfo?.brand || ''} ${r.deviceInfo?.type || '—'}</td>
                <td><span class="badge ${r.priority === 'Critical' ? 'badge-red' : r.priority === 'High' ? 'badge-orange' : 'badge-gray'}">${r.priority}</span></td>
                <td>
                  <select class="form-select" style="font-size:0.78rem;padding:0.3rem 0.6rem" onchange="updateServiceStatus('${r._id}',this.value)">
                    ${['Received','Diagnosing','In Progress','Waiting for Parts','Ready for Pickup','Completed','Cancelled'].map(s =>
        `<option ${r.status === s ? 'selected' : ''} value="${s}">${s}</option>`
      ).join('')}
                  </select>
                </td>
                <td style="color:var(--text-secondary);font-size:0.82rem">${new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="updateServiceCost('${r._id}',${r.estimatedCost || 0})">💰 Cost</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { el.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>`; }
}

async function updateServiceStatus(id, status) {
  try {
    await apiFetch(`/services/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    showToast(`Ticket status updated to "${status}". Customer notified.`);
  } catch (e) { showToast(e.message, 'error'); }
}

async function updateServiceCost(id, currentCost) {
  const cost = prompt('Enter estimated cost (₹):', currentCost);
  if (cost === null) return;
  const notes = prompt('Add technician notes (optional):');
  const payload = { estimatedCost: Number(cost) };
  if (notes) payload.adminNotes = notes;
  try {
    await apiFetch(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    showToast('Service updated! Customer notified.');
    loadAdminServices();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function orderStatusBadge(status) {
  const map = { 'Confirmed': 'badge-blue', 'Processing': 'badge-purple', 'Shipped': 'badge-orange', 'Delivered': 'badge-green', 'Cancelled': 'badge-red', 'Pending': 'badge-gray' };
  return map[status] || 'badge-gray';
}

/* ══════════════════════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  loadFeaturedProducts();
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      document.getElementById('cartSidebar').classList.remove('open');
      document.getElementById('cartOverlay').classList.remove('open');
    }
  });
});