/* ============================================
   UMI UMI ACCESSORIES — Product Detail Page
   Reuses the shared cart drawer + PayPal checkout + wrist-field flow.
   ============================================ */

let cart = [];             // { name, price, quantity, category }
let paypalLoaded = false;
let allProducts = [];      // full catalog from /api/products
let currentProduct = null; // the product this page is showing

document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initNavToggle();
    initShippingToggle();
    initQtyStepper();
    loadProduct();
    loadPayPal();
});

// Re-render the detail panel + refresh cart when the language changes
document.addEventListener('umi:langchange', () => {
    if (currentProduct) renderProduct(currentProduct);
    if (cart.length) updateCartUI();
});

// i18n shorthand
function T(key, fallback) {
    return (window.UmiI18n && window.UmiI18n.t) ? window.UmiI18n.t(key) : (fallback || key);
}
function currentLang() {
    return (window.UmiI18n && window.UmiI18n.getLang) ? window.UmiI18n.getLang() : 'en';
}
function displayName(p) {
    if (currentLang() === 'es' && p.name_es) return p.name_es;
    return p.name;
}
function displayDesc(p) {
    if (currentLang() === 'es' && p.description_es) return p.description_es;
    return p.description || '';
}
function cartDisplayName(item) {
    if (currentLang() === 'es' && allProducts && allProducts.length) {
        const prod = allProducts.find(p => p.name === item.name);
        if (prod && prod.name_es) return prod.name_es;
    }
    return item.name;
}

// ============================================ Load + render the product ============================================
async function loadProduct() {
    const id = new URLSearchParams(location.search).get('id');
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json().catch(() => []);
    } catch (e) {
        console.error('Failed to load products', e);
        allProducts = [];
    }

    const product = (allProducts || []).find(p => p.id === id && p.active !== false);
    const loading = document.getElementById('pdpLoading');
    if (loading) loading.hidden = true;

    if (!product) {
        const missing = document.getElementById('pdpMissing');
        if (missing) missing.hidden = false;
        return;
    }

    currentProduct = product;
    document.getElementById('pdpInner').hidden = false;
    renderProduct(product);
}

function renderProduct(p) {
    const shown = displayName(p);

    // Title / breadcrumb / document title
    setText('pdpTitle', shown);
    setText('pdpCrumbName', shown);
    document.title = `${shown} — Umi Umi Accessories`;

    // Price
    setText('pdpPrice', `$${Number(p.price).toFixed(2)}`);

    // Description
    setText('pdpDesc', displayDesc(p));

    // Badge
    const badge = document.getElementById('pdpBadge');
    if (badge) {
        if (p.badge) {
            badge.textContent = p.badge.toUpperCase();
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    }

    // Media — gallery carousel when multiple photos, else single image/emoji.
    renderGallery(p, shown);

    // Wire Add-to-Cart (re-wire each render; guard against duplicates)
    const addBtn = document.getElementById('pdpAddToCart');
    if (addBtn && !addBtn._bound) {
        addBtn.addEventListener('click', () => {
            if (!currentProduct) return;
            const qtyEl = document.getElementById('qtyVal');
            const qty = parseInt(qtyEl ? qtyEl.textContent : '1', 10) || 1;
            // Add under the canonical English name (server validates by name);
            // pass category so the bracelet-only wrist field is decided reliably.
            addToCart(currentProduct.name, currentProduct.price, qty, { category: currentProduct.category || '' });
            addBtn.classList.add('added');
            const orig = addBtn.innerHTML;
            addBtn.innerHTML = T('hero.added', '✓ Added to Cart');
            setTimeout(() => { addBtn.classList.remove('added'); addBtn.innerHTML = orig; }, 1500);
            openCart();
        });
        addBtn._bound = true;
    }
}

// Render the product media: a swipeable carousel with thumbnails when there's
// more than one photo, else a single image or the gradient+emoji placeholder.
let galleryIndex = 0;
function renderGallery(p, shown) {
    const photo = document.getElementById('pdpPhoto');
    const thumbs = document.getElementById('pdpThumbs');
    if (!photo) return;

    const imgs = Array.isArray(p.images) && p.images.length
        ? p.images
        : (p.image ? [p.image] : []);
    galleryIndex = 0;

    photo.style.background = p.gradient || 'linear-gradient(160deg,#F7F2F5,#F1ECF3)';

    if (!imgs.length) {
        photo.innerHTML = `<span class="pdp-emoji" aria-hidden="true">${p.emoji || '🌸'}</span>`;
        if (thumbs) { thumbs.innerHTML = ''; thumbs.hidden = true; }
        hideGalleryNav();
        return;
    }

    const paint = () => {
        photo.innerHTML = `<img class="pdp-photo-img" src="${escapeHtml(imgs[galleryIndex])}" alt="${escapeHtml(shown)}" onerror="this.parentNode.innerHTML='<span class=\\'pdp-emoji\\'>${p.emoji || '🌸'}</span>'">`;
        if (thumbs) {
            thumbs.querySelectorAll('.pdp-thumb').forEach((t, i) => t.classList.toggle('active', i === galleryIndex));
        }
    };

    // Thumbnails (only when >1 photo)
    if (thumbs) {
        if (imgs.length > 1) {
            thumbs.hidden = false;
            thumbs.innerHTML = imgs.map((u, i) =>
                `<button class="pdp-thumb${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="Photo ${i + 1}"><img src="${escapeHtml(u)}" alt=""></button>`
            ).join('');
            thumbs.querySelectorAll('.pdp-thumb').forEach(btn => {
                btn.addEventListener('click', () => { galleryIndex = parseInt(btn.dataset.idx, 10) || 0; paint(); });
            });
        } else {
            thumbs.innerHTML = '';
            thumbs.hidden = true;
        }
    }

    // Prev/next arrows (only when >1 photo)
    setupGalleryNav(imgs.length, (dir) => {
        galleryIndex = (galleryIndex + dir + imgs.length) % imgs.length;
        paint();
    });

    paint();
}

function setupGalleryNav(count, go) {
    const prev = document.getElementById('pdpPrev');
    const next = document.getElementById('pdpNext');
    if (!prev || !next) return;
    const show = count > 1;
    prev.style.display = show ? '' : 'none';
    next.style.display = show ? '' : 'none';
    if (!show) return;
    if (!prev._bound) { prev.addEventListener('click', () => go(-1)); prev._bound = true; }
    if (!next._bound) { next.addEventListener('click', () => go(1)); next._bound = true; }
}
function hideGalleryNav() {
    const prev = document.getElementById('pdpPrev');
    const next = document.getElementById('pdpNext');
    if (prev) prev.style.display = 'none';
    if (next) next.style.display = 'none';
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

function initQtyStepper() {
    const val = document.getElementById('qtyVal');
    const minus = document.getElementById('qtyMinus');
    const plus = document.getElementById('qtyPlus');
    if (!val || !minus || !plus) return;
    const setQ = q => { val.textContent = Math.max(1, q); };
    minus.addEventListener('click', () => setQ((parseInt(val.textContent, 10) || 1) - 1));
    plus.addEventListener('click', () => setQ((parseInt(val.textContent, 10) || 1) + 1));
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

// Mobile nav
function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    }));
}

// ============================================ Cart (shared machinery) ============================================
function initCart() {
    const cartBtn = document.querySelector('.cart-btn');
    const overlay = document.getElementById('cartOverlay');
    const close = document.getElementById('cartClose');
    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (overlay) overlay.addEventListener('click', closeCart);
    if (close) close.addEventListener('click', closeCart);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
}

function addToCart(name, price, qty = 1, meta = {}) {
    const existing = cart.find(i => i.name === name);
    if (existing) existing.quantity += qty;
    else cart.push({ name, price: Number(price), quantity: qty, category: meta.category || '' });
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
        items.innerHTML = `<div class="cart-empty"><span>🌸</span><p>${escapeHtml(T('cart.empty','Your cart is empty'))}</p></div>`;
        foot.style.display = 'none';
        if (count) count.textContent = '0';
        const pp = document.getElementById('paypal-button-container');
        if (pp) pp.innerHTML = '';
        return;
    }

    const colors = [
        'linear-gradient(135deg,#FFC7E1,#C9A7F0)', 'linear-gradient(135deg,#BFE3FF,#F7A8D8)',
        'linear-gradient(135deg,#E6DAF7,#FFD1E8)', 'linear-gradient(135deg,#cfe6ff,#c3a9ef)',
    ];
    items.innerHTML = cart.map((it, idx) => `
        <div class="cart-item">
            <div class="cart-item-color" style="background:${colors[idx % colors.length]};"></div>
            <div class="cart-item-details">
                <h4>${escapeHtml(cartDisplayName(it))}</h4>
                <span>$${it.price.toFixed(0)}</span>
                <div class="cart-qc">
                    <button onclick="setQuantity('${jsStr(it.name)}',-1)" aria-label="Decrease">−</button>
                    <span>${it.quantity}</span>
                    <button onclick="setQuantity('${jsStr(it.name)}',1)" aria-label="Increase">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${idx})">✕</button>
        </div>`).join('');

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    totalEl.textContent = `$${total.toFixed(0)}`;
    foot.style.display = 'block';
    if (count) count.textContent = totalQty;

    // Wrist size field only shows when the cart has a bracelet.
    const wristField = document.querySelector('.wrist-field');
    if (wristField) {
        const show = cartHasBracelet();
        wristField.style.display = show ? '' : 'none';
        if (!show) showWristError(false);
    }

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

function categoryForCartItem(name) {
    if (Array.isArray(allProducts)) {
        const p = allProducts.find(x => x.name === name);
        if (p && p.category) return String(p.category).toLowerCase();
    }
    return '';
}
function itemIsBracelet(item) {
    const name = typeof item === 'string' ? item : (item && item.name) || '';
    const stored = (typeof item === 'object' && item && item.category) ? String(item.category).toLowerCase() : '';
    if (stored.indexOf('bracelet') !== -1) return true;
    const cat = categoryForCartItem(name);
    if (cat.indexOf('bracelet') !== -1) return true;
    if (String(name).toLowerCase().indexOf('bracelet') !== -1) return true;
    return false;
}
function cartHasBracelet() {
    return cart.some(i => itemIsBracelet(i));
}

function getWristLength() {
    const el = document.getElementById('wristLength');
    if (!el) return '';
    const v = parseFloat(el.value);
    if (!isFinite(v) || v < 10 || v > 25) return '';
    return String(v);
}
function showWristError(show) {
    const el = document.getElementById('wristError');
    const input = document.getElementById('wristLength');
    if (el) {
        el.textContent = show ? T('cart.wristRequired', 'Please enter your wrist size (10–25 cm) so we can fit your bracelet.') : '';
        el.hidden = !show;
    }
    if (input) input.classList.toggle('invalid', !!show);
}

function renderPayPalButtons() {
    if (!paypalLoaded || !window.paypal) return;
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = '';
    if (cart.length === 0) return;

    const wristInput = document.getElementById('wristLength');
    if (wristInput && !wristInput._wristBound) {
        wristInput.addEventListener('input', () => { if (getWristLength()) showWristError(false); });
        wristInput._wristBound = true;
    }

    window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal', height: 45 },
        onClick: (data, actions) => {
            if (cartHasBracelet() && !getWristLength()) {
                showWristError(true);
                const el = document.getElementById('wristLength');
                if (el) el.focus();
                return actions.reject();
            }
            showWristError(false);
            return actions.resolve();
        },
        createOrder: async () => {
            const r = await fetch('/api/paypal/create-order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cartPayload(), wristLength: getWristLength() }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Failed to create order');
            return data.id;
        },
        onApprove: async (data) => {
            const r = await fetch('/api/paypal/capture-order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: data.orderID, items: cartPayload(), wristLength: getWristLength() }),
            });
            const result = await r.json();
            if (result.success) { cart = []; updateCartUI(); closeCart(); showOrderConfirmation(result.orderId); }
            else { showToast('Payment was not completed. Please try again.'); }
        },
        onError: (err) => { console.error('PayPal error:', err); showToast('Something went wrong with the payment.'); },
        onCancel: () => {},
    }).render('#paypal-button-container');
}

// ============================================ Order confirmation + toast + utils ============================================
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
