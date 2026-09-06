/* ============================================
   UMI UMI — Storefront Scripts
   With PayPal Checkout Integration
   ============================================ */

let allProducts = [];
let allSets = [];
// Cart is a list of line items: { name, price, quantity }
let cart = [];
let paypalLoaded = false;
let paypalButtonsInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initCart();
    initSmoothScroll();
    initScrollReveal();
    initTiltCards();
    loadStoreData();
    loadPayPal();
});

// ============================================
// Load PayPal SDK
// ============================================

async function loadPayPal() {
    try {
        // Get PayPal client ID from our API
        const res = await fetch('/api/paypal/client-id');

        // Check if we actually got JSON back (not an HTML error page)
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            console.error('PayPal API returned non-JSON response');
            showFallbackCheckout();
            return;
        }

        const data = await res.json();
        const clientId = data.clientId;

        if (!clientId) {
            console.warn('PayPal client ID not configured — showing fallback button');
            showFallbackCheckout();
            return;
        }

        // Load PayPal JS SDK dynamically
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
        script.onload = () => {
            paypalLoaded = true;
            // Hide fallback, show PayPal
            const fallbackBtn = document.getElementById('fallbackCheckoutBtn');
            if (fallbackBtn) fallbackBtn.style.display = 'none';
            const container = document.getElementById('paypal-button-container');
            if (container) container.style.display = 'block';
            renderPayPalButtons();
        };
        script.onerror = () => {
            console.error('Failed to load PayPal SDK — showing fallback');
            showFallbackCheckout();
        };
        document.head.appendChild(script);
    } catch (e) {
        console.error('PayPal init error:', e);
        showFallbackCheckout();
    }
}

function showFallbackCheckout() {
    const container = document.getElementById('paypal-button-container');
    const fallbackBtn = document.getElementById('fallbackCheckoutBtn');
    if (container) container.style.display = 'none';
    if (!fallbackBtn) return;
    fallbackBtn.style.display = 'block';

    fallbackBtn.onclick = () => {
        showToast('PayPal checkout is being configured — DM us on Instagram to order! 🌊');
    };
}

// Build the line items payload sent to our API. Prices are re-validated
// server-side, so this only needs name + quantity to be correct.
function buildCartPayload() {
    return cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
    }));
}

function renderPayPalButtons() {
    if (!paypalLoaded || !window.paypal) return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    // Make sure container is visible
    container.style.display = 'block';
    container.innerHTML = '';

    // Don't render if cart is empty
    if (cart.length === 0) return;

    paypalButtonsInstance = window.paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'pill',
            label: 'paypal',
            height: 45,
        },

        // Create order on PayPal
        createOrder: async () => {
            const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: buildCartPayload() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            return data.id;
        },

        // Capture order after buyer approves
        onApprove: async (data) => {
            const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderID: data.orderID,
                    items: buildCartPayload(),
                }),
            });

            const result = await res.json();

            if (result.success) {
                // Clear cart and show confirmation
                cart = [];
                updateCartUI();
                closeCart();
                showOrderConfirmation(result.orderId);
            } else {
                showToast('Payment was not completed. Please try again.');
            }
        },

        // Handle errors
        onError: (err) => {
            console.error('PayPal error:', err);
            showToast('Something went wrong with the payment. Please try again.');
        },

        // Handle cancel
        onCancel: () => {
            // User closed PayPal window — do nothing, they stay on the cart
        },
    });

    paypalButtonsInstance.render('#paypal-button-container');
}

// ============================================
// Order Confirmation
// ============================================

function showOrderConfirmation(orderId) {
    const modal = document.getElementById('orderConfirmation');
    document.getElementById('confirmOrderId').textContent = orderId;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    launchConfetti();
}

function closeOrderConfirmation() {
    const modal = document.getElementById('orderConfirmation');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// ============================================
// Load data from API
// ============================================

async function loadStoreData() {
    try {
        const [productsRes, settingsRes, setsRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/settings/public'),
            fetch('/api/sets'),
        ]);

        allProducts = await productsRes.json();
        const settings = await settingsRes.json();
        try { allSets = await setsRes.json(); } catch (e) { allSets = []; }

        renderProducts(allProducts);
        renderSets(allSets);
        initFilters();
        applySettings(settings);
    } catch (e) {
        console.error('Failed to load store data:', e);
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML =
                '<div class="loading-state">Unable to load products. Please refresh.</div>';
        }
    }
}

function applySettings(settings) {
    if (settings.announcementText) {
        const el = document.getElementById('announcementText');
        if (el) {
            // Keep the evil-eye charm motif around the announcement text.
            const charm = '<span class="announce-charm" aria-hidden="true">🧿</span>';
            const safe = settings.announcementText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            el.innerHTML = `${charm} ${safe} ${charm}`;
        }
    }
}

// ============================================
// Render Products
// ============================================

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<div class="loading-state">No products found</div>';
        return;
    }

    grid.innerHTML = products.map((product, i) => {
        const badgeHTML = product.badge ?
            `<div class="product-badge ${product.badge === 'bestseller' ? 'bestseller-badge' : ''} ${product.badge === 'limited' ? 'limited-badge' : ''}">${product.badge}</div>` : '';

        const imageStyle = product.image ?
            `background-image: url('${product.image}'); background-size: cover; background-position: center;` :
            `background: ${product.gradient || 'linear-gradient(160deg, #E0F5F0, #C8E6E0, #E8B4B8)'};`;

        return `
            <div class="product-card reveal" data-category="${product.badge || ''}" style="--stagger:${i * 60}ms">
                <div class="product-image" style="${imageStyle}">
                    ${badgeHTML}
                    ${!product.image ? `<div class="product-visual"><span>${product.emoji || '✿'}</span></div>` : ''}
                    <div class="product-shine"></div>
                    <div class="product-actions">
                        <button class="quick-add" data-name="${product.name}" data-price="${product.price}">+ Quick Add</button>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-desc">${product.description || ''}</p>
                    <span class="product-price">$${product.price}</span>
                </div>
            </div>
        `;
    }).join('');

    // Re-attach quick add listeners + effects
    initQuickAdd();
    initScrollReveal();
    initTiltCards();
}

// ============================================
// Render Sets / Bundles (data-driven)
// ============================================

function renderSets(sets) {
    const grid = document.getElementById('setsGrid');
    if (!grid || !Array.isArray(sets) || sets.length === 0) return;

    const visuals = ['🌊 + ✿ + 🌿', '🌺 + 🐚 + 🦋', '🌙 + 🪸 + ✿'];
    const gradients = [
        'linear-gradient(135deg, #E0F5F0, #C8B8DB)',
        'linear-gradient(135deg, #F7D1C4, #FFECD2)',
        'linear-gradient(135deg, #B8E6DC, #E8B4B8)',
    ];

    grid.innerHTML = sets.map((set, i) => {
        const save = set.originalPrice ? set.originalPrice - set.price : 0;
        return `
            <div class="set-card reveal" style="--stagger:${i * 100}ms">
                <div class="set-image" style="background: ${gradients[i % gradients.length]};">
                    <div class="set-visual">${visuals[i % visuals.length]}</div>
                    ${save > 0 ? `<div class="set-save">Save $${save}</div>` : ''}
                </div>
                <div class="set-info">
                    <h3>${set.name}</h3>
                    <p>${set.description || ''}</p>
                    <div class="set-pricing">
                        <span class="set-price">$${set.price}</span>
                        ${set.originalPrice ? `<span class="set-original">$${set.originalPrice}</span>` : ''}
                    </div>
                    <button class="btn btn-primary btn-full set-add-btn" data-name="${set.name}" data-price="${set.price}">Add Set to Cart</button>
                </div>
            </div>
        `;
    }).join('');

    initSetAdd();
    initScrollReveal();
}

// ============================================
// Navbar Scroll
// ============================================

function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });
}

// ============================================
// Scroll Reveal (entrance animations)
// ============================================

function initScrollReveal() {
    const els = document.querySelectorAll('.reveal:not(.revealed)');
    if (!('IntersectionObserver' in window)) {
        els.forEach(el => el.classList.add('revealed'));
        return;
    }
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
}

// ============================================
// Interactive tilt / pointer glow on product cards
// ============================================

function initTiltCards() {
    document.querySelectorAll('.product-card').forEach(card => {
        if (card.dataset.tilt) return;
        card.dataset.tilt = '1';
        const img = card.querySelector('.product-image');
        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `translateY(-6px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
            if (img) {
                img.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
                img.style.setProperty('--my', `${(py + 0.5) * 100}%`);
            }
        });
        card.addEventListener('pointerleave', () => {
            card.style.transform = '';
        });
    });
}

// ============================================
// Product Filters
// ============================================

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            if (filter === 'all') {
                renderProducts(allProducts);
            } else {
                const filtered = allProducts.filter(p => p.badge === filter);
                renderProducts(filtered);
            }
        });
    });
}

// ============================================
// Cart System
// ============================================

function initCart() {
    const cartBtn = document.querySelector('.cart-btn');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');

    if (cartBtn) cartBtn.addEventListener('click', () => openCart());
    if (cartOverlay) cartOverlay.addEventListener('click', () => closeCart());
    if (cartClose) cartClose.addEventListener('click', () => closeCart());

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCart();
    });

    initSetAdd();
}

// Add an item to the cart, aggregating quantity by name.
function addToCart(name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price: Number(price), quantity: 1 });
    }
    updateCartUI();
    bumpCartIcon();
}

function setQuantity(name, delta) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.name !== name);
    }
    updateCartUI();
}

function initSetAdd() {
    document.querySelectorAll('.set-add-btn').forEach(btn => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);
            addToCart(name, price);

            btn.textContent = '✓ Added to Cart';
            btn.classList.add('added');
            setTimeout(() => {
                btn.textContent = 'Add Set to Cart';
                btn.classList.remove('added');
            }, 1500);

            openCart();
        });
    });
}

function openCart() {
    document.getElementById('cartOverlay').classList.add('open');
    document.getElementById('cartDrawer').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const o = document.getElementById('cartOverlay');
    const d = document.getElementById('cartDrawer');
    if (o) o.classList.remove('open');
    if (d) d.classList.remove('open');
    document.body.style.overflow = '';
}

function bumpCartIcon() {
    const icon = document.querySelector('.cart-btn');
    if (!icon) return;
    icon.classList.remove('bump');
    // force reflow to restart animation
    void icon.offsetWidth;
    icon.classList.add('bump');
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.querySelector('.cart-count');

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="cart-empty"><span>🌊</span><p>Your cart is empty</p></div>`;
        cartFooter.style.display = 'none';
        cartCount.classList.remove('visible');
        cartCount.textContent = '0';
        const ppContainer = document.getElementById('paypal-button-container');
        if (ppContainer) ppContainer.innerHTML = '';
    } else {
        const colors = [
            'linear-gradient(135deg, #E0F5F0, #E8B4B8)',
            'linear-gradient(135deg, #C8B8DB, #F7D1C4)',
            'linear-gradient(135deg, #F7D1C4, #FFECD2)',
            'linear-gradient(135deg, #B8E6DC, #C8B8DB)',
        ];

        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-color" style="background: ${colors[index % colors.length]};"></div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <span>$${item.price}</span>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="setQuantity('${item.name.replace(/'/g, "\\'")}', -1)" aria-label="Decrease">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="setQuantity('${item.name.replace(/'/g, "\\'")}', 1)" aria-label="Increase">+</button>
                    </div>
                </div>
                <div class="cart-item-line">
                    <span class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(0)}</span>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">✕</button>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cartTotal.textContent = `$${total.toFixed(0)}`;
        cartFooter.style.display = 'block';

        cartCount.textContent = totalQty;
        cartCount.classList.add('visible');

        // Re-render PayPal buttons with updated cart
        renderPayPalButtons();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// ============================================
// Quick Add Buttons
// ============================================

function initQuickAdd() {
    document.querySelectorAll('.quick-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);

            addToCart(name, price);

            btn.textContent = '✓ Added';
            btn.classList.add('added');

            setTimeout(() => {
                btn.textContent = '+ Quick Add';
                btn.classList.remove('added');
            }, 1500);

            showToast(`${name} added to cart`);
        });
    });
}

// ============================================
// Toast Notifications
// ============================================

let toastTimer = null;
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ============================================
// Confetti (order success celebration)
// ============================================

function launchConfetti() {
    const colors = ['#E0F5F0', '#E8B4B8', '#C8B8DB', '#F7D1C4', '#2C6E6A', '#FFECD2'];
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    document.body.appendChild(layer);
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.4 + 's';
        piece.style.animationDuration = 2 + Math.random() * 1.5 + 's';
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
        layer.appendChild(piece);
    }
    setTimeout(() => layer.remove(), 4000);
}

// ============================================
// Smooth Scroll
// ============================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 140;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}
