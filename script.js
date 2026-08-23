/* ============================================
   UMI UMI — Storefront Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initFilters();
    initCart();
    initQuickAdd();
    initSmoothScroll();
});

/* ============================================
   Navbar Scroll
   ============================================ */

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

/* ============================================
   Product Filters
   ============================================ */

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            productCards.forEach(card => {
                if (filter === 'all') {
                    card.classList.remove('hidden');
                } else {
                    const categories = card.dataset.category || '';
                    if (categories.includes(filter)) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                }
            });
        });
    });
}

/* ============================================
   Cart System
   ============================================ */

let cart = [];

function initCart() {
    const cartBtn = document.querySelector('.cart-btn');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartClose = document.getElementById('cartClose');

    cartBtn.addEventListener('click', () => openCart());
    cartOverlay.addEventListener('click', () => closeCart());
    cartClose.addEventListener('click', () => closeCart());

    // Keyboard close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCart();
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
        cartItems.innerHTML = `
            <div class="cart-empty">
                <span>🌊</span>
                <p>Your cart is empty</p>
            </div>
        `;
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

/* ============================================
   Quick Add Buttons
   ============================================ */

function initQuickAdd() {
    const quickAddBtns = document.querySelectorAll('.quick-add');

    quickAddBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const price = parseInt(btn.dataset.price);

            cart.push({ name, price });
            updateCartUI();

            // Visual feedback
            btn.textContent = '✓ Added';
            btn.classList.add('added');

            setTimeout(() => {
                btn.textContent = '+ Quick Add';
                btn.classList.remove('added');
            }, 1500);

            // Open cart briefly
            openCart();
        });
    });

    // Also handle the set buttons
    const setBtns = document.querySelectorAll('.set-card .btn');
    setBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const setCard = btn.closest('.set-card');
            const name = setCard.querySelector('h3').textContent;
            const priceText = setCard.querySelector('.set-price').textContent;
            const price = parseInt(priceText.replace('$', ''));

            cart.push({ name, price });
            updateCartUI();

            btn.textContent = '✓ Added to Cart';
            setTimeout(() => {
                btn.textContent = 'Add Set to Cart';
            }, 1500);

            openCart();
        });
    });
}

/* ============================================
   Smooth Scroll
   ============================================ */

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
