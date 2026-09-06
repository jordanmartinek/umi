/* ============================================
   UMI UMI ACCESSORIES — Kawaii redesign scripts
   Reuses the existing PayPal checkout backend.
   ============================================ */

let allProducts = [];
let cart = []; // { name, price, quantity }
let paypalLoaded = false;

// ============================================ Hero carousel products ============================================
// Each featured product carries EN + ES copy so the whole detail panel can be
// swapped per slide and re-translated by the language toggle. `photo` uses a
// pastel gradient + emoji placeholder for now — swap in a real image via `img`.
const HERO_PRODUCTS = [
    {
        id: 'butterfly-bloom', price: 32, img: 'assets/product.png',
        gradient: 'linear-gradient(160deg,#BFE3FF,#FFE29A)', emoji: '🦋',
        en: {
            badge: 'BEST SELLER', title: 'Butterfly Bloom Pendant', sub: 'Ocean Blue • Sky Cyan • Sunbeam Yellow',
            desc: 'A little burst of joy to carry with you. Hand-strung from vibrant blue, cyan, and yellow beads into a cheerful butterfly, finished on a soft adjustable cord — playful, lightweight, and made to make you smile.',
            feats: [['🦋', 'Hand-Beaded Butterfly', 'Bright blue, cyan & yellow beads'], ['🤍', 'Handmade with Love', 'Each piece is unique'], ['✨', 'Adjustable Cord', 'Comfy, durable & one-size-fits-all']],
            caption: 'Good things<br>take time',
        },
        es: {
            badge: 'MÁS VENDIDO', title: 'Colgante Mariposa en Flor', sub: 'Azul Océano • Cian Cielo • Amarillo Sol',
            desc: 'Una pequeña dosis de alegría para llevar contigo. Tejido a mano con vibrantes cuentas azules, cian y amarillas en forma de una alegre mariposa, rematado con un suave cordón ajustable: divertido, ligero y hecho para sacarte una sonrisa.',
            feats: [['🦋', 'Mariposa de Cuentas', 'Cuentas azules, cian y amarillas'], ['🤍', 'Hecho a Mano con Amor', 'Cada pieza es única'], ['✨', 'Cordón Ajustable', 'Cómodo, resistente y talla única']],
            caption: 'Las cosas buenas<br>toman tiempo',
        },
    },
    {
        id: 'ocean-dream', price: 28, img: null,
        gradient: 'linear-gradient(160deg,#CDE7FF,#C9A7F0)', emoji: '🌊',
        en: {
            badge: 'NEW', title: 'Ocean Dream Bracelet', sub: 'Deep Blue • Seafoam • Silver Shimmer',
            desc: 'Wear a calm little wave on your wrist. Cool blue and seafoam beads flow together with a tiny silver shell, strung on a stretch cord that slips on in a second — your daily dose of seaside serenity.',
            feats: [['🌊', 'Ocean-Toned Beads', 'Deep blue & soft seafoam'], ['🐚', 'Silver Shell Charm', 'A dainty coastal accent'], ['💧', 'Stretch Fit', 'Slips on — no clasp needed']],
            caption: 'Made by<br>the sea',
        },
        es: {
            badge: 'NUEVO', title: 'Pulsera Sueño de Mar', sub: 'Azul Profundo • Espuma de Mar • Brillo Plata',
            desc: 'Lleva una pequeña ola de calma en tu muñeca. Cuentas azules y verde espuma fluyen junto a una diminuta concha plateada, en un cordón elástico que se pone en un segundo: tu dosis diaria de serenidad marina.',
            feats: [['🌊', 'Cuentas Tono Océano', 'Azul profundo y espuma suave'], ['🐚', 'Dije de Concha Plateada', 'Un delicado acento costero'], ['💧', 'Ajuste Elástico', 'Se desliza — sin broche']],
            caption: 'Hecho junto<br>al mar',
        },
    },
    {
        id: 'sunbeam-charm', price: 26, img: null,
        gradient: 'linear-gradient(160deg,#FFECD2,#F7A8D8)', emoji: '☀️',
        en: {
            badge: '', title: 'Sunbeam Charm Bracelet', sub: 'Golden Honey • Warm Coral • Cream',
            desc: 'Sunshine you can wear. Warm honey-gold beads and a tiny sun charm bring a cozy glow to any outfit — the little pick-me-up your wrist has been waiting for.',
            feats: [['☀️', 'Sun Charm', 'Gold-toned & cheerful'], ['🍯', 'Honey-Gold Beads', 'Warm, glowing tones'], ['🤍', 'Handmade with Love', 'Each piece is unique']],
            caption: 'A little<br>sunshine',
        },
        es: {
            badge: '', title: 'Pulsera Rayo de Sol', sub: 'Miel Dorada • Coral Cálido • Crema',
            desc: 'Sol que puedes llevar puesto. Cálidas cuentas color miel y un pequeño dije de sol aportan un brillo acogedor a cualquier atuendo: el pequeño mimo que tu muñeca estaba esperando.',
            feats: [['☀️', 'Dije de Sol', 'Tono dorado y alegre'], ['🍯', 'Cuentas Miel-Oro', 'Tonos cálidos y radiantes'], ['🤍', 'Hecho a Mano con Amor', 'Cada pieza es única']],
            caption: 'Un poquito<br>de sol',
        },
    },
    {
        id: 'seashell-whisper', price: 34, img: null,
        gradient: 'linear-gradient(160deg,#F7D1C4,#BFE3FF)', emoji: '🐚',
        en: {
            badge: '', title: 'Seashell Whisper Pendant', sub: 'Blush Pink • Pearl • Sky',
            desc: 'A soft secret from the shore. A hand-picked shell rests among blush and pearl beads, hung on a delicate chain — quiet, romantic, and endlessly wearable.',
            feats: [['🐚', 'Real Shell Accent', 'Each one naturally unique'], ['🩷', 'Blush & Pearl Beads', 'Soft, romantic tones'], ['✨', 'Delicate Chain', 'Gold-filled & long lasting']],
            caption: 'Whispers<br>of the shore',
        },
        es: {
            badge: '', title: 'Colgante Susurro de Concha', sub: 'Rosa Suave • Perla • Cielo',
            desc: 'Un dulce secreto de la orilla. Una concha elegida a mano descansa entre cuentas rosadas y perladas, colgada de una cadena delicada: discreto, romántico e infinitamente combinable.',
            feats: [['🐚', 'Acento de Concha Real', 'Cada una naturalmente única'], ['🩷', 'Cuentas Rosa y Perla', 'Tonos suaves y románticos'], ['✨', 'Cadena Delicada', 'Chapada en oro y duradera']],
            caption: 'Susurros<br>de la orilla',
        },
    },
    {
        id: 'tide-pool-ring', price: 22, img: null,
        gradient: 'linear-gradient(160deg,#B8E6DC,#C9A7F0)', emoji: '💍',
        en: {
            badge: 'NEW', title: 'Tide Pool Ring', sub: 'Cyan • Lavender • Glass Bead',
            desc: 'Tiny treasures from a tide pool, wrapped around your finger. Cyan and lavender glass beads on a bendy wire band that adjusts to any finger — a playful stack-it-up favorite.',
            feats: [['💍', 'Adjustable Band', 'Fits any finger'], ['🫧', 'Glass Beads', 'Cyan & lavender shimmer'], ['🌿', 'Stackable', 'Mix, match & layer']],
            caption: 'Tiny<br>treasures',
        },
        es: {
            badge: 'NUEVO', title: 'Anillo Poza de Marea', sub: 'Cian • Lavanda • Cuenta de Vidrio',
            desc: 'Pequeños tesoros de una poza de marea, envueltos en tu dedo. Cuentas de vidrio cian y lavanda sobre una banda de alambre flexible que se ajusta a cualquier dedo: un favorito juguetón para apilar.',
            feats: [['💍', 'Banda Ajustable', 'Se adapta a cualquier dedo'], ['🫧', 'Cuentas de Vidrio', 'Brillo cian y lavanda'], ['🌿', 'Apilable', 'Combina y superpone']],
            caption: 'Pequeños<br>tesoros',
        },
    },
];

let heroIndex = 0;
let heroAutoTimer = null;

// Current hero product's copy in the active language
function heroCopy(p) {
    const lang = (window.UmiI18n && window.UmiI18n.getLang) ? window.UmiI18n.getLang() : 'en';
    return p[lang] || p.en;
}

// Placeholder catalog for New Releases + Find Your Piece (used when the API
// has no products). Each item carries category (style) + color for filtering.
const CATALOG = [
    { name: 'Butterfly Bloom Pendant', price: 32, category: 'pendants',  color: 'multi',    badge: 'bestseller', isNew: true,  emoji: '🦋', gradient: 'linear-gradient(160deg,#BFE3FF,#FFE29A)' },
    { name: 'Ocean Dream Bracelet',    price: 28, category: 'bracelets', color: 'blue',     badge: 'new',        isNew: true,  emoji: '🌊', gradient: 'linear-gradient(160deg,#CDE7FF,#C9A7F0)' },
    { name: 'Sunbeam Charm Bracelet',  price: 26, category: 'bracelets', color: 'gold',     badge: '',           isNew: true,  emoji: '☀️', gradient: 'linear-gradient(160deg,#FFECD2,#F7A8D8)' },
    { name: 'Seashell Whisper Pendant',price: 34, category: 'pendants',  color: 'pink',     badge: '',           isNew: true,  emoji: '🐚', gradient: 'linear-gradient(160deg,#F7D1C4,#BFE3FF)' },
    { name: 'Tide Pool Ring',          price: 22, category: 'rings',     color: 'cyan',     badge: 'new',        isNew: true,  emoji: '💍', gradient: 'linear-gradient(160deg,#B8E6DC,#C9A7F0)' },
    { name: 'Blossom Stack Ring Set',  price: 30, category: 'rings',     color: 'pink',     badge: '',           isNew: false, emoji: '🌸', gradient: 'linear-gradient(160deg,#FFD1E8,#F7A8D8)' },
    { name: 'Coral Garden Anklet',     price: 24, category: 'anklets',   color: 'pink',     badge: '',           isNew: true,  emoji: '🪸', gradient: 'linear-gradient(160deg,#F7A8D8,#FFE29A)' },
    { name: 'Moonlit Wave Anklet',     price: 27, category: 'anklets',   color: 'lavender', badge: 'new',        isNew: true,  emoji: '🌙', gradient: 'linear-gradient(160deg,#C9A7F0,#BFE3FF)' },
    { name: 'Daisy Drop Earrings',     price: 21, category: 'earrings',  color: 'gold',     badge: '',           isNew: false, emoji: '🌼', gradient: 'linear-gradient(160deg,#FFECD2,#B8E6DC)' },
    { name: 'Starfish Studs',          price: 19, category: 'earrings',  color: 'cyan',     badge: 'bestseller', isNew: false, emoji: '⭐', gradient: 'linear-gradient(160deg,#BFE3FF,#FFD1E8)' },
    { name: 'Lagoon Layered Necklace', price: 38, category: 'pendants',  color: 'blue',     badge: 'limited',    isNew: true,  emoji: '💧', gradient: 'linear-gradient(160deg,#B8E6DC,#CDE7FF)' },
    { name: 'Petal Beaded Bracelet',   price: 25, category: 'bracelets', color: 'lavender', badge: '',           isNew: false, emoji: '🌷', gradient: 'linear-gradient(160deg,#FFD1E8,#C9A7F0)' },
];

let finderStyle = 'all';
let finderColor = 'all';

document.addEventListener('DOMContentLoaded', () => {
    initHeroCarousel();
    initShippingToggle();
    initCart();
    initNewReleases();
    initFinder();
    loadStoreData();
    loadPayPal();
});

// Re-render dynamic bits + refresh open cart when the language switches
document.addEventListener('umi:langchange', () => {
    renderHeroSlide();       // re-translate the current hero product
    renderNewReleases();
    renderFinder();
    if (cart.length) updateCartUI();
});

// Shorthand for i18n (safe even if i18n.js hasn't defined it yet)
function T(key, fallback) {
    return (window.UmiI18n && window.UmiI18n.t) ? window.UmiI18n.t(key) : (fallback || key);
}

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
    renderNewReleases();
    renderFinder();
}

// The working catalog: normalized API products if present, else placeholders.
function workingCatalog() {
    if (allProducts && allProducts.length) {
        return allProducts.map((p, i) => ({
            name: p.name,
            price: Number(p.price),
            category: (p.category || '').toLowerCase() || 'all',
            color: (p.color || '').toLowerCase() || 'multi',
            badge: p.badge || '',
            isNew: p.badge === 'new' || !!p.isNew,
            emoji: p.emoji || '🌸',
            image: p.image || null,
            gradient: p.gradient || CATALOG[i % CATALOG.length].gradient,
        }));
    }
    return CATALOG.slice();
}

// Shared product-card markup (used by New Releases + Finder)
function productCard(p, i) {
    const badge = p.badge
        ? `<span class="pcard-badge pcard-badge-${p.badge}">${escapeHtml(p.badge)}</span>` : '';
    const media = p.image
        ? `<img class="pcard-photo" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'">`
        : `<span class="pcard-emoji" aria-hidden="true">${p.emoji || '🌸'}</span>`;
    return `
        <article class="pcard" style="--i:${i}">
            <div class="pcard-img" style="background:${p.gradient};">
                ${badge}
                ${media}
                <button class="pcard-add" data-name="${escapeHtml(p.name)}" data-price="${p.price}">
                    <span class="cart-ic">🛍️</span> ${escapeHtml(T('cart.quickAdd', 'Quick Add'))}
                </button>
            </div>
            <div class="pcard-body">
                <h3 class="pcard-name">${escapeHtml(p.name)}</h3>
                <div class="pcard-meta">
                    <span class="pcard-price">$${Number(p.price).toFixed(0)}.00</span>
                    <span class="pcard-stars" aria-label="5 stars"><svg viewBox="0 0 24 24" class="star"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z"/></svg></span>
                </div>
            </div>
        </article>`;
}

function wireAddButtons(container) {
    container.querySelectorAll('.pcard-add').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart(btn.dataset.name, parseFloat(btn.dataset.price), 1);
            const orig = btn.innerHTML;
            btn.classList.add('added');
            btn.innerHTML = '✓';
            setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = orig; }, 1200);
            showToast(`${btn.dataset.name} ${T('toast.added', 'added')} 🛍️`);
        });
    });
}

// ============================================ New Releases carousel ============================================
function initNewReleases() {
    const track = document.getElementById('newReleasesTrack');
    if (!track) return;
    const prev = document.querySelector('.nr-prev');
    const next = document.querySelector('.nr-next');
    const step = () => Math.max(240, track.clientWidth * 0.8);
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
}

function renderNewReleases() {
    const track = document.getElementById('newReleasesTrack');
    if (!track) return;
    const items = workingCatalog().filter(p => p.isNew);
    const list = items.length ? items : workingCatalog().slice(0, 6);
    track.innerHTML = list.map((p, i) => `<div class="nr-cell">${productCard(p, i)}</div>`).join('');
    wireAddButtons(track);
}

// ============================================ Find Your Piece (Style + Color) ============================================
function initFinder() {
    const styleChips = document.getElementById('styleChips');
    const colorSwatches = document.getElementById('colorSwatches');
    if (!styleChips || !colorSwatches) return;

    styleChips.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            styleChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            finderStyle = chip.dataset.style || 'all';
            renderFinder();
        });
    });
    colorSwatches.querySelectorAll('.swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            colorSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
            sw.classList.add('active');
            finderColor = sw.dataset.color || 'all';
            renderFinder();
        });
    });
}

function renderFinder() {
    const grid = document.getElementById('finderGrid');
    if (!grid) return;
    const matches = workingCatalog().filter(p =>
        (finderStyle === 'all' || p.category === finderStyle) &&
        (finderColor === 'all' || p.color === finderColor)
    );

    // update count + label
    const countEl = document.getElementById('finderCount');
    const labelEl = document.getElementById('finderCountLabel');
    if (countEl) countEl.textContent = matches.length;
    if (labelEl) labelEl.textContent = T(matches.length === 1 ? 'find.count' : 'find.countPlural',
                                          matches.length === 1 ? 'match' : 'matches');

    if (!matches.length) {
        grid.innerHTML = `<div class="finder-empty"><span>🌸</span><p>${escapeHtml(T('find.none','No matches yet — try another combo!'))}</p></div>`;
        return;
    }
    grid.innerHTML = matches.slice(0, 8).map((p, i) => productCard(p, i)).join('');
    wireAddButtons(grid);
}

function applySettings(settings) {
    if (settings && settings.announcementText) {
        const el = document.querySelector('.announce p');
        if (el) el.innerHTML = `<span class="tw">✦</span> ${escapeHtml(settings.announcementText)} <span class="tw">✦</span>`;
    }
}

// ============================================ Hero product carousel ============================================
function initHeroCarousel() {
    const stage = document.getElementById('heroStage');
    if (!stage) return; // hero markup not present

    // Build dot indicators
    const dots = document.getElementById('heroDots');
    if (dots) {
        dots.innerHTML = HERO_PRODUCTS.map((_, i) =>
            `<button class="hero-dot${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="Product ${i + 1}"></button>`
        ).join('');
        dots.querySelectorAll('.hero-dot').forEach(d =>
            d.addEventListener('click', () => goHero(parseInt(d.dataset.idx, 10), true)));
    }

    // Arrows
    const prev = document.getElementById('heroPrev');
    const next = document.getElementById('heroNext');
    if (prev) prev.addEventListener('click', () => goHero(heroIndex - 1, true));
    if (next) next.addEventListener('click', () => goHero(heroIndex + 1, true));

    // Qty stepper
    const val = document.getElementById('qtyVal');
    const minus = document.getElementById('qtyMinus');
    const plus = document.getElementById('qtyPlus');
    if (val && minus && plus) {
        const setQ = q => { val.textContent = Math.max(1, q); };
        minus.addEventListener('click', () => setQ((parseInt(val.textContent, 10) || 1) - 1));
        plus.addEventListener('click', () => setQ((parseInt(val.textContent, 10) || 1) + 1));
    }

    // Add current product to cart
    const addBtn = document.getElementById('addToCart');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const p = HERO_PRODUCTS[heroIndex];
            const qty = parseInt(document.getElementById('qtyVal').textContent, 10) || 1;
            addToCart(heroCopy(p).title, p.price, qty);
            addBtn.classList.add('added');
            const orig = addBtn.innerHTML;
            addBtn.innerHTML = T('hero.added', '✓ Added to Cart');
            setTimeout(() => { addBtn.classList.remove('added'); addBtn.innerHTML = orig; }, 1500);
            openCart();
        });
    }

    // Swipe on the polaroid
    let startX = null;
    stage.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) goHero(heroIndex + (dx < 0 ? 1 : -1), true);
        startX = null;
    });

    // Gentle auto-rotate, paused on hover/focus
    const startAuto = () => { stopAuto(); heroAutoTimer = setInterval(() => goHero(heroIndex + 1, false), 6000); };
    const stopAuto = () => { if (heroAutoTimer) { clearInterval(heroAutoTimer); heroAutoTimer = null; } };
    stage.addEventListener('mouseenter', stopAuto);
    stage.addEventListener('mouseleave', startAuto);
    stage.addEventListener('focusin', stopAuto);
    document.querySelector('.hero-details')?.addEventListener('mouseenter', stopAuto);
    document.querySelector('.hero-details')?.addEventListener('mouseleave', startAuto);

    renderHeroSlide();
    startAuto();
}

// Navigate the hero carousel (wraps around). userInitiated resets the timer.
function goHero(idx, userInitiated) {
    const n = HERO_PRODUCTS.length;
    heroIndex = ((idx % n) + n) % n;
    renderHeroSlide(true);
    if (userInitiated && heroAutoTimer) {
        clearInterval(heroAutoTimer);
        heroAutoTimer = setInterval(() => goHero(heroIndex + 1, false), 6000);
    }
}

// Paint the current hero product into the polaroid + detail panel
function renderHeroSlide(animate) {
    const p = HERO_PRODUCTS[heroIndex];
    if (!p) return;
    const c = heroCopy(p);

    // Polaroid photo (real image or gradient+emoji placeholder)
    const photo = document.getElementById('heroPhoto');
    if (photo) {
        photo.style.background = p.gradient;
        photo.innerHTML = p.img
            ? `<img class="polaroid-img" src="${escapeHtml(p.img)}" alt="${escapeHtml(c.title)}" onerror="this.parentNode.innerHTML='<span class=\\'pcard-emoji\\'>${p.emoji}</span>'">`
            : `<span class="pcard-emoji" aria-hidden="true">${p.emoji}</span>`;
    }
    const cap = document.getElementById('heroCaption');
    if (cap) cap.innerHTML = c.caption;

    // Detail panel
    const badge = document.getElementById('heroBadge');
    if (badge) { badge.textContent = c.badge; badge.style.display = c.badge ? '' : 'none'; }
    setText('heroTitle', c.title);
    setText('heroSub', c.sub);
    setText('productPrice', `$${p.price.toFixed(2)}`);
    setHTML('heroDesc', c.desc);

    const feats = document.getElementById('heroFeatures');
    if (feats) {
        feats.innerHTML = c.feats.map(f => `
            <li>
                <span class="feat-icon">${f[0]}</span>
                <div><strong>${escapeHtml(f[1])}</strong><small>${escapeHtml(f[2])}</small></div>
            </li>`).join('');
    }

    // Dots
    document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === heroIndex));

    // Slide/fade animation
    if (animate) {
        const stage = document.getElementById('heroStage');
        const panel = document.querySelector('.hero-details');
        [stage, panel].forEach(el => {
            if (!el) return;
            el.classList.remove('hero-swap');
            void el.offsetWidth;
            el.classList.add('hero-swap');
        });
    }
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function setHTML(id, v) { const el = document.getElementById(id); if (el) el.innerHTML = v; }

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
        items.innerHTML = `<div class="cart-empty"><span>🌸</span><p>${escapeHtml(T('cart.empty','Your cart is empty'))}</p></div>`;
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
