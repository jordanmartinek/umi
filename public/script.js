/* ============================================
   UMI UMI ACCESSORIES — Kawaii redesign scripts
   Reuses the existing PayPal checkout backend.
   ============================================ */

let allProducts = [];
let cart = []; // { name, price, quantity }
let paypalLoaded = false;

// Featured hero product (falls back to the mock if API is empty)
const HERO_FALLBACK = { name: 'Serenity Bracelet', price: 32 };

document.addEventListener('DOMContentLoaded', () => {
    initQtyStepper();
    initShippingToggle();
    initCart();
    initHeroAddToCart();
    loadStoreData();
    loadPayPal();
});

// ============================================ Data ============================================
async function loadStoreData() {
    try {
        const [productsRes, settingsRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/settings/public'),
        ]);
        allProducts = await productsRes.json();
        const settings = await settingsRes.json().catch(() => ({}));
        applySettings(settings);
    } catch (e) {
        console.error('Failed to load store data:', e);
        allProducts = [];
    }
    renderCarousel();
}

function applySettings(settings) {
    if (settings && settings.announcementText) {
        const el = document.querySelector('.announce p');
        if (el) el.innerHTML = `<span class="tw">✦</span> ${escapeHtml(settings.announcementText)} <span class="tw">✦</span>`;
    }
}

// The featured product for the hero: first product from API, else fallback
function heroProduct() {
    if (allProducts && allProducts.length) {
        const p = allProducts[0];
        return { name: p.name, price: Number(p.price) };
    }
    return HERO_FALLBACK;
}

// ============================================ Carousel ============================================
function renderCarousel() {
    const track = document.getElementById('carTrack');
    if (!track) return;

    // "You might also like" — everything except the hero product, fall back to mocks
    let items = (allProducts || []).slice(1, 9).map(p => ({
        name: p.name, price: Number(p.price), gradient: p.gradient, emoji: p.emoji,
    }));

    if (items.length === 0) {
        items = [
            { name: 'Ocean Dream Necklace', price: 36, emoji: '🐚' },
            { name: 'Sunflower Earrings',   price: 24, emoji: '🌻' },
            { name: 'Tide Ring',            price: 28, emoji: '💍' },
            { name: 'Blossom Anklet',       price: 26, emoji: '🌸' },
        ];
    }

    const grads = [
        'linear-gradient(160deg,#cfe6ff,#f3b9d4)',
        'linear-gradient(160deg,#ffe0ef,#c3a9ef)',
        'linear-gradient(160deg,#e7dcff,#a9c8ef)',
        'linear-gradient(160deg,#ffd9c4,#f3b9d4)',
    ];

    track.innerHTML = items.map((it, i) => `
        <div class="pcard">
            <div class="pcard-img" style="background:${it.gradient || grads[i % grads.length]};">
                <button class="pcard-add" data-name="${escapeHtml(it.name)}" data-price="${it.price}" aria-label="Add ${escapeHtml(it.name)}">🛍️</button>
            </div>
            <p class="pcard-name">${escapeHtml(it.name)}</p>
            <p class="pcard-price">$${Number(it.price).toFixed(0)}.00</p>
        </div>
    `).join('');

    track.querySelectorAll('.pcard-add').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart(btn.dataset.name, parseFloat(btn.dataset.price), 1);
            showToast(`${btn.dataset.name} added 🛍️`);
        });
    });
}

// ============================================ Qty stepper (hero) ============================================
function initQtyStepper() {
    const val = document.getElementById('qtyVal');
    const minus = document.getElementById('qtyMinus');
    const plus = document.getElementById('qtyPlus');
    if (!val) return;
    let q = 1;
    const render = () => { val.textContent = q; };
    minus.addEventListener('click', () => { q = Math.max(1, q - 1); render(); });
    plus.addEventListener('click', () => { q += 1; render(); });
}

function initHeroAddToCart() {
    const btn = document.getElementById('addToCart');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const qty = parseInt(document.getElementById('qtyVal').textContent, 10) || 1;
        const p = heroProduct();
        addToCart(p.name, p.price, qty);
        btn.classList.add('added');
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Added to Cart';
        setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = orig; }, 1500);
        openCart();
    });
}

function initShippingToggle() {
    const toggle = document.getElementById('shippingToggle');
    const body = document.getElementById('shippingBody');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
        const open = toggle.classList.toggle('open');
        body.hidden = !open;
    });
}

// ============================================ Cart ============================================
function initCart() {
    const cartBtn = document.querySelector('.cart-btn');
    const overlay = document.getElementById('cartOverlay');
    const close = document.getElementById('cartClose');
    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (overlay) overlay.addEventListener('click', closeCart);
    if (close) close.addEventListener('click', closeCart);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
}

function addToCart(name, price, qty = 1) {
    const existing = cart.find(i => i.name === name);
    if (existing) existing.quantity += qty;
    else cart.push({ name, price: Number(price), quantity: qty });
    updateCartUI();
    bumpCart();
}

function setQuantity(name, delta) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(i => i.name !== name);
    updateCartUI();
}
function removeFromCart(index) { cart.splice(index, 1); updateCartUI(); }

function openCart() { document.getElementById('cartOverlay').classList.add('open'); document.getElementById('cartDrawer').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeCart() { const o = document.getElementById('cartOverlay'), d = document.getElementById('cartDrawer'); if (o) o.classList.remove('open'); if (d) d.classList.remove('open'); document.body.style.overflow = ''; }

function bumpCart() {
    const el = document.querySelector('.cart-btn');
    if (!el) return;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'bob 0.45s ease';
}

function updateCartUI() {
    const items = document.getElementById('cartItems');
    const foot = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotal');
    const count = document.querySelector('.cart-count');
    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

    if (cart.length === 0) {
        items.innerHTML = `<div class="cart-empty"><span>🌸</span><p>Your cart is empty</p></div>`;
        foot.style.display = 'none';
        if (count) count.textContent = '0';
        const pp = document.getElementById('paypal-button-container');
        if (pp) pp.innerHTML = '';
        return;
    }

    const colors = [
        'linear-gradient(135deg,#FFC7E1,#C9A7F0)',
        'linear-gradient(135deg,#BFE3FF,#F7A8D8)',
        'linear-gradient(135deg,#E6DAF7,#FFD1E8)',
        'linear-gradient(135deg,#cfe6ff,#c3a9ef)',
    ];

    items.innerHTML = cart.map((it, idx) => `
        <div class="cart-item">
            <div class="cart-item-color" style="background:${colors[idx % colors.length]};"></div>
            <div class="cart-item-details">
                <h4>${escapeHtml(it.name)}</h4>
                <span>$${it.price.toFixed(0)}</span>
                <div class="cart-qc">
                    <button onclick="setQuantity('${jsStr(it.name)}',-1)" aria-label="Decrease">−</button>
                    <span>${it.quantity}</span>
                    <button onclick="setQuantity('${jsStr(it.name)}',1)" aria-label="Increase">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${idx})">✕</button>
        </div>
    `).join('');

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    totalEl.textContent = `$${total.toFixed(0)}`;
    foot.style.display = 'block';
    if (count) count.textContent = totalQty;

    renderPayPalButtons();
}

// ============================================ PayPal (reuses backend) ============================================
async function loadPayPal() {
    try {
        const res = await fetch('/api/paypal/client-id');
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return showFallbackCheckout();
        const data = await res.json();
        if (!data.clientId) return showFallbackCheckout();

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(data.clientId)}&currency=USD&intent=capture`;
        script.onload = () => {
            paypalLoaded = true;
            const fb = document.getElementById('fallbackCheckoutBtn');
            if (fb) fb.style.display = 'none';
            renderPayPalButtons();
        };
        script.onerror = showFallbackCheckout;
        document.head.appendChild(script);
    } catch (e) {
        console.error('PayPal init error:', e);
        showFallbackCheckout();
    }
}

function showFallbackCheckout() {
    const container = document.getElementById('paypal-button-container');
    const fb = document.getElementById('fallbackCheckoutBtn');
    if (container) container.style.display = 'none';
    if (!fb) return;
    fb.style.display = 'block';
    fb.onclick = () => showToast('PayPal checkout is being configured — DM us to order! 🌸');
}

function cartPayload() {
    return cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity }));
}

function renderPayPalButtons() {
    if (!paypalLoaded || !window.paypal) return;
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = '';
    if (cart.length === 0) return;

    window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal', height: 45 },
        createOrder: async () => {
            const res = await fetch('/api/paypal/create-order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cartPayload() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create order');
            return data.id;
        },
        onApprove: async (data) => {
            const res = await fetch('/api/paypal/capture-order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: data.orderID, items: cartPayload() }),
            });
            const result = await res.json();
            if (result.success) {
                cart = []; updateCartUI(); closeCart(); showOrderConfirmation(result.orderId);
            } else {
                showToast('Payment was not completed. Please try again.');
            }
        },
        onError: (err) => { console.error('PayPal error:', err); showToast('Something went wrong with the payment.'); },
        onCancel: () => {},
    }).render('#paypal-button-container');
}

// ============================================ Order confirmation ============================================
function showOrderConfirmation(orderId) {
    const modal = document.getElementById('orderConfirmation');
    document.getElementById('confirmOrderId').textContent = orderId;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeOrderConfirmation() {
    document.getElementById('orderConfirmation').style.display = 'none';
    document.body.style.overflow = '';
}

// ============================================ Toast + utils ============================================
let toastTimer = null;
function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function jsStr(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
