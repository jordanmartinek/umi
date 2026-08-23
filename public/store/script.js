/* ============================================
   UMI UMI — Storefront Scripts
   Loads products dynamically from the API
   ============================================ */

let allProducts = [];
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initCart();
    initSmoothScroll();
    loadStoreData();
});

// ============================================
// Load data from API
// ============================================

async function loadStoreData() {
    try {
        const [productsRes, settingsRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/settings/public')
        ]);

        allProducts = await productsRes.json();
        const settings = await settingsRes.json();

        renderProducts(allProducts);
        initFilters();
        applySettings(settings);
    } catch (e) {
        console.error('Failed to load store data:', e);
        document.getElementById('productsGrid').innerHTML =
            '<div class="loading-state">Unable to load products. Please refresh.</div>';
    }
}

function applySettings(settings) {
    if (settings.announcementText) {
        document.getElementById('announcementText').textContent = '✿ ' + settings.announcementText + ' ✿';
    }
}

// ============================================
// Render Products
// ============================================

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');

    if (products.length === 0) {
        grid.innerHTML = '<div class="loading-state">No products found</div>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const badgeHTML = product.badge ?
            `<div class="product-badge ${product.badge === 'bestseller' ? 'bestseller-badge' : ''} ${product.badge === 'limited' ? 'limited-badge' : ''}">${product.badge}</div>` : '';

        const imageStyle = product.image ?
            `background-image: url('${product.image}'); background-size: cover; background-position: center;` :
            `background: ${product.gradient || 'linear-gradient(160deg, #E0F5F0, #C8E6E0, #E8B4B8)'};`;

        return `
            <div class="product-card" data-category="${product.badge || ''}">
                <div class="product-image" style="${imageStyle}">
                    ${badgeHTML}
                    ${!product.image ? `<div class="product-visual"><span>${product.emoji || '✿'}</span></div>` : ''}
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

    // Re-attach quick add listeners
    initQuickAdd();
}

// ============================================
// Navbar Scroll
// ============================================

function initNavbar() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
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

    cartBtn.addEventListener('click', () => openCart());
    cartOverlay.addEventListener('click', () => closeCart());
    cartClose.addEventListener('click', () => closeCart());

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCart();
    });

    // Set add-to-cart buttons
    document.querySelectorAll('.set-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const setCard = btn.closest('.set-card');
            const name = setCard.querySelector('h3').textContent;
            const priceText = setCard.querySelector('.set-price').textContent;
            const price = parseInt(priceText.replace('$', ''));

            cart.push({ name, price });
            updateCartUI();

            btn.textContent = '✓ Added to Cart';
            setTimeout(() => { btn.textContent = 'Add Set to Cart'; }, 1500);

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
    document.getElementById('cartOverlay').classList.remove('open');
    document.getElementById('cartDrawer').classList.remove('open');
    document.body.style.overflow = '';
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.querySelector('.cart-count');

    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="cart-empty"><span>🌊</span><p>Your cart is empty</p></div>`;
        cartFooter.style.display = 'none';
        cartCount.classList.remove('visible');
        cartCount.textContent = '0';
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
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${index})">✕</button>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = `$${total}`;
        cartFooter.style.display = 'block';

        cartCount.textContent = cart.length;
        cartCount.classList.add('visible');
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
            const price = parseInt(btn.dataset.price);

            cart.push({ name, price });
            updateCartUI();

            btn.textContent = '✓ Added';
            btn.classList.add('added');

            setTimeout(() => {
                btn.textContent = '+ Quick Add';
                btn.classList.remove('added');
            }, 1500);

            openCart();
        });
    });
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
