/* ============================================
   UMI UMI ACCESSORIES — Collection / Shop page
   Reuses the existing PayPal checkout + cart drawer.
   ============================================ */

let cart = [];             // { name, price, quantity }
let paypalLoaded = false;
let allProducts = [];      // normalized collection items
let currentFilter = 'all';

/* Placeholder collection — used when /api/products is empty or unavailable.
   Each item: name, price, category (matches the filter chips), and a pastel
   gradient + emoji stand-in for the product photo. Swap `image` in later. */
const PLACEHOLDER_COLLECTION = [
    { name: 'Butterfly Bloom Pendant', price: 32, category: 'pendants', badge: 'bestseller', emoji: '🦋', gradient: 'linear-gradient(160deg,#BFE3FF,#FFE29A)' },
    { name: 'Ocean Dream Bracelet',    price: 28, category: 'bracelets', badge: 'new',        emoji: '🌊', gradient: 'linear-gradient(160deg,#CDE7FF,#C9A7F0)' },
    { name: 'Sunbeam Charm Bracelet',  price: 26, category: 'bracelets', badge: '',           emoji: '☀️', gradient: 'linear-gradient(160deg,#FFECD2,#F7A8D8)' },
    { name: 'Seashell Whisper Pendant',price: 34, category: 'pendants',  badge: '',           emoji: '🐚', gradient: 'linear-gradient(160deg,#F7D1C4,#BFE3FF)' },
    { name: 'Tide Pool Ring',          price: 22, category: 'rings',     badge: 'new',        emoji: '💍', gradient: 'linear-gradient(160deg,#B8E6DC,#C9A7F0)' },
    { name: 'Blossom Stack Ring Set',  price: 30, category: 'rings',     badge: '',           emoji: '🌸', gradient: 'linear-gradient(160deg,#FFD1E8,#F7A8D8)' },
    { name: 'Coral Garden Anklet',     price: 24, category: 'anklets',   badge: '',           emoji: '🪸', gradient: 'linear-gradient(160deg,#F7A8D8,#FFE29A)' },
    { name: 'Moonlit Wave Anklet',     price: 27, category: 'anklets',   badge: 'new',        emoji: '🌙', gradient: 'linear-gradient(160deg,#C9A7F0,#BFE3FF)' },
    { name: 'Daisy Drop Earrings',     price: 21, category: 'earrings',  badge: '',           emoji: '🌼', gradient: 'linear-gradient(160deg,#FFECD2,#B8E6DC)' },
    { name: 'Starfish Studs',          price: 19, category: 'earrings',  badge: 'bestseller', emoji: '⭐', gradient: 'linear-gradient(160deg,#BFE3FF,#FFD1E8)' },
    { name: 'Lagoon Layered Necklace', price: 38, category: 'pendants',  badge: 'limited',    emoji: '💧', gradient: 'linear-gradient(160deg,#B8E6DC,#CDE7FF)' },
    { name: 'Petal Beaded Bracelet',   price: 25, category: 'bracelets', badge: '',           emoji: '🌷', gradient: 'linear-gradient(160deg,#FFD1E8,#C9A7F0)' },
];

document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initFilters();
    initNavToggle();
    loadCollection();
    loadPayPal();
});

// Mobile nav: hamburger toggles the links dropdown; tapping a link closes it.
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

// Re-render the grid + refresh cart when language changes
document.addEventListener('umi:langchange', () => {
    renderCollection();
    if (cart.length) updateCartUI();
});

// i18n shorthand (safe if i18n.js loads after this file's parse)
function T(key, fallback) {
    return (window.UmiI18n && window.UmiI18n.t) ? window.UmiI18n.t(key) : (fallback || key);
}

// Current language ('en' | 'es')
function currentLang() {
    return (window.UmiI18n && window.UmiI18n.getLang) ? window.UmiI18n.getLang() : 'en';
}

// Product name to DISPLAY in the active language; falls back to the English
// name. The English `name` stays the canonical cart/checkout key.
function displayName(p) {
    if (currentLang() === 'es' && p.name_es) return p.name_es;
    return p.name;
}

// Resolve a cart line's display name by matching its canonical English name
// against the loaded collection, so cart items re-translate on language change.
function cartDisplayName(item) {
    if (currentLang() === 'es' && allProducts && allProducts.length) {
        const prod = allProducts.find(p => p.name === item.name);
        if (prod && prod.name_es) return prod.name_es;
    }
    return item.name;
}

// ============================================ Data ============================================
async function loadCollection() {
    try {
        const [productsRes, settingsRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/settings/public'),
        ]);
        const products = await productsRes.json().catch(() => []);
        const settings = await settingsRes.json().catch(() => ({}));
        applySettings(settings);

        if (Array.isArray(products) && products.length) {
            const grads = [
                'linear-gradient(160deg,#BFE3FF,#FFE29A)', 'linear-gradient(160deg,#CDE7FF,#C9A7F0)',
                'linear-gradient(160deg,#FFECD2,#F7A8D8)', 'linear-gradient(160deg,#F7D1C4,#BFE3FF)',
                'linear-gradient(160deg,#B8E6DC,#C9A7F0)', 'linear-gradient(160deg,#FFD1E8,#F7A8D8)',
            ];
            allProducts = products.map((p, i) => ({
                name: p.name,
                name_es: p.name_es || '',
                description: p.description || '',
                description_es: p.description_es || '',
                price: Number(p.price),
                category: (p.category || '').toLowerCase() || 'all',
                badge: p.badge || '',
                emoji: p.emoji || '🌸',
                image: p.image || null,
                gradient: p.gradient || grads[i % grads.length],
            }));
        } else {
            allProducts = PLACEHOLDER_COLLECTION.slice();
        }
    } catch (e) {
        console.error('Failed to load collection, using placeholders:', e);
        allProducts = PLACEHOLDER_COLLECTION.slice();
    }
    renderCollection();
}

function applySettings(settings) {
    if (settings && settings.announcementText) {
        const el = document.querySelector('.announce p');
        if (el) el.innerHTML = `<span class="tw">✦</span> ${escapeHtml(settings.announcementText)} <span class="tw">✦</span>`;
    }
}

// ============================================ Grid render ============================================
function renderCollection() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;

    const items = currentFilter === 'all'
        ? allProducts
        : allProducts.filter(p => p.category === currentFilter);

    if (!items.length) {
        grid.innerHTML = `<div class="collection-empty"><span>🌸</span><p>Nothing here yet — check back soon!</p></div>`;
        return;
    }

    grid.innerHTML = items.map((p, i) => {
        const shown = displayName(p);
        const badge = p.badge
            ? `<span class="pcard-badge pcard-badge-${p.badge}">${escapeHtml(p.badge)}</span>`
            : '';
        const media = p.image
            ? `<img class="pcard-photo" src="${escapeHtml(p.image)}" alt="${escapeHtml(shown)}" onerror="this.style.display='none'">`
            : `<span class="pcard-emoji" aria-hidden="true">${p.emoji || '🌸'}</span>`;
        return `
            <article class="pcard reveal" style="--i:${i}">
                <div class="pcard-img" style="background:${p.gradient};">
                    ${badge}
                    ${media}
                    <button class="pcard-add" data-name="${escapeHtml(p.name)}" data-display="${escapeHtml(shown)}" data-price="${p.price}">
                        <span class="cart-ic">🛍️</span> ${escapeHtml(T('cart.quickAdd', 'Quick Add'))}
                    </button>
                </div>
                <div class="pcard-body">
                    <h3 class="pcard-name">${escapeHtml(shown)}</h3>
                    <div class="pcard-meta">
                        <span class="pcard-price">$${Number(p.price).toFixed(0)}.00</span>
                        <span class="pcard-stars" aria-label="5 out of 5 stars">
                            <svg viewBox="0 0 24 24" class="star"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
                        </span>
                    </div>
                </div>
            </article>`;
    }).join('');

    grid.querySelectorAll('.pcard-add').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart(btn.dataset.name, parseFloat(btn.dataset.price), 1);
            const original = btn.innerHTML;
            btn.classList.add('added');
            btn.innerHTML = '✓ Added';
            setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = original; }, 1400);
            showToast(`${btn.dataset.display || btn.dataset.name} ${T('toast.added', 'added')} 🛍️`);
        });
    });

    // gentle staggered reveal
    requestAnimationFrame(() => {
        grid.querySelectorAll('.pcard.reveal').forEach(el => el.classList.add('in'));
    });
}

// ============================================ Filters ============================================
function initFilters() {
    const row = document.getElementById('filtersRow');
    if (!row) return;
    row.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter || 'all';
            renderCollection();
        });
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

// Resolve a cart item's category (lowercased) from the loaded collection,
// falling back to the placeholder list. Used to decide if the wrist field
// applies (bracelets only).
function categoryForCartItem(name) {
    if (Array.isArray(allProducts)) {
        const p = allProducts.find(x => x.name === name);
        if (p && p.category) return String(p.category).toLowerCase();
    }
    const c = PLACEHOLDER_COLLECTION.find(x => x.name === name);
    if (c && c.category) return String(c.category).toLowerCase();
    return '';
}

// True when a cart line is a bracelet. Robust to how the category is stored
// and also falls back to the product name containing "bracelet".
function itemIsBracelet(name) {
    const cat = categoryForCartItem(name);
    if (cat.indexOf('bracelet') !== -1) return true;
    if (String(name).toLowerCase().indexOf('bracelet') !== -1) return true;
    return false;
}

// The wrist measurement is only relevant for bracelets.
function cartHasBracelet() {
    return cart.some(i => itemIsBracelet(i.name));
}

// Required wrist measurement (cm), 10–25 range. '' when empty/invalid.
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
        // Require a valid wrist length before checkout — bracelets only.
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
