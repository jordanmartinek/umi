/* ============================================
   UMI UMI — Admin Dashboard Scripts
   ============================================ */

let products = [];
let categories = [];
let orders = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initLogin();
    initNav();
    initModals();
    initForms();
    initOrderFilters();
    initAdminLang();
    initAiFill();
    initSidebarToggle();
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// Mobile sidebar: hamburger opens it, backdrop/nav-tap closes it.
function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar || !toggle) return;

    const open = () => {
        sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('show');
        toggle.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
        sidebar.classList.contains('open') ? close() : open();
    });
    if (backdrop) backdrop.addEventListener('click', close);
    // Tapping any sidebar link/button closes the drawer on mobile.
    sidebar.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', close);
    });
}

// i18n shorthand (safe even before admin-i18n.js has parsed)
function t(key, fallback) {
    return (window.AdminI18n && window.AdminI18n.t) ? window.AdminI18n.t(key) : (fallback || key);
}

// Parse a response body as JSON without throwing on empty/non-JSON responses.
async function safeJson(res) {
    try { return await res.json(); } catch (e) { return {}; }
}

// Turn an API error body into a user-facing message. The PERSIST_FAILED code
// (no persistent storage configured) gets a dedicated, translated explanation
// so the owner knows exactly what to do; otherwise fall back.
function errorMessage(body, fallback) {
    if (body && body.code === 'PERSIST_FAILED') {
        return t('err.persist', 'Changes can\u2019t be saved yet — persistent storage isn\u2019t set up. Add Upstash Redis in Vercel, then redeploy.');
    }
    if (body && body.error) return body.error;
    return fallback;
}

// Sidebar language switch + re-render dynamic content on language change
function initAdminLang() {
    const sidebarBtn = document.getElementById('langToggleSidebar');
    if (sidebarBtn && window.AdminI18n) {
        sidebarBtn.addEventListener('click', () => {
            AdminI18n.setLang(AdminI18n.getLang() === 'en' ? 'es' : 'en');
        });
    }
    updateLangSwitchLabel();

    // Re-render JS-built tables/stats whenever the language changes
    document.addEventListener('umi:langchange', () => {
        updateLangSwitchLabel();
        if (Array.isArray(products) && products.length) renderProducts();
        if (Array.isArray(categories)) { renderCategories(); populateCategorySelect(); }
        if (Array.isArray(orders)) { renderOrders(orders); renderOrderStats(); }
    });
}

// The sidebar switch shows the OTHER language (the one you'd switch to)
function updateLangSwitchLabel() {
    const label = document.getElementById('langSwitchLabel');
    if (!label || !window.AdminI18n) return;
    label.textContent = AdminI18n.getLang() === 'en' ? 'Español' : 'English';
}

// ============================================
// AI photo autofill
// ============================================

function initAiFill() {
    const fileInput = document.getElementById('aiPhoto');
    const analyzeBtn = document.getElementById('aiAnalyzeBtn');
    const preview = document.getElementById('aiPreview');
    if (!fileInput || !analyzeBtn) return;

    // Show a thumbnail preview as soon as a photo is chosen.
    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        setAiStatus('');
        if (!file) { preview.style.display = 'none'; preview.src = ''; return; }
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    });

    analyzeBtn.addEventListener('click', () => analyzePhoto(fileInput.files && fileInput.files[0]));
}

function setAiStatus(msg, kind) {
    const el = document.getElementById('aiStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'ai-status' + (kind ? ' ai-status-' + kind : '');
}

// Read a File as a base64 string (without the "data:...;base64," prefix).
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const comma = result.indexOf('base64,');
            resolve(comma !== -1 ? result.slice(comma + 7) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function analyzePhoto(file) {
    const btn = document.getElementById('aiAnalyzeBtn');
    if (!file) { setAiStatus(t('ai.noPhoto', 'Please choose a photo first.'), 'error'); return; }

    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = t('ai.analyzing', 'Analyzing photo…');
    setAiStatus(t('ai.analyzing', 'Analyzing photo…'));

    try {
        const base64 = await fileToBase64(file);
        const res = await fetch('/api/admin/analyze-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg' }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            // Distinguish "not configured" so the owner knows it's a setup step.
            const msg = /GEMINI_API_KEY|not configured/i.test(data.error || '')
                ? t('ai.notConfigured', 'AI is not set up yet. Add a GEMINI_API_KEY in Vercel and redeploy.')
                : (data.error || t('ai.error', 'Could not analyze the photo. Please try again.'));
            setAiStatus(msg, 'error');
            return;
        }

        applyAiSuggestion(data.suggestion || {});
        setAiStatus(t('ai.done', '✓ Fields filled in — review and edit, then save.'), 'success');
    } catch (e) {
        setAiStatus(t('ai.error', 'Could not analyze the photo. Please try again.'), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = original;
    }
}

// Prefill the form inputs from the AI suggestion. Only fills non-empty values
// so it never wipes something the owner already typed.
function applyAiSuggestion(s) {
    const setIf = (id, val) => {
        if (val === undefined || val === null || val === '') return;
        const el = document.getElementById(id);
        if (el) el.value = val;
    };
    setIf('productName', s.name);
    setIf('productNameEs', s.name_es);
    setIf('productDescription', s.description);
    setIf('productDescriptionEs', s.description_es);
    setIf('productEmoji', s.emoji);
    if (s.price !== undefined && s.price !== null && s.price !== '' && Number(s.price) > 0) {
        setIf('productPrice', s.price);
    }
    // Category: only select it if the suggested slug matches an existing option.
    if (s.category) {
        const sel = document.getElementById('productCategory');
        if (sel) {
            const match = Array.from(sel.options).find(o => o.value === s.category || o.textContent.trim().toLowerCase() === String(s.category).toLowerCase());
            if (match) sel.value = match.value;
        }
    }
}

// Clear the AI section's preview/status when the product modal opens.
function resetAiFill() {
    const fileInput = document.getElementById('aiPhoto');
    const preview = document.getElementById('aiPreview');
    if (fileInput) fileInput.value = '';
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    setAiStatus('');
}

// ============================================
// Auth
// ============================================

async function checkAuth() {
    try {
        const res = await fetch('/api/auth/check');
        if (res.ok) {
            showDashboard();
        }
    } catch (e) {
        // Not authenticated, show login
    }
}

function initLogin() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                errorEl.textContent = '';
                showDashboard();
            } else {
                errorEl.textContent = t('login.error', 'Invalid password. Please try again.');
            }
        } catch (e) {
            errorEl.textContent = t('login.connError', 'Connection error. Please try again.');
        }
    });
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginPassword').value = '';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'grid';
    loadOrders();
    loadProducts();
    loadCategories();
    loadSettings();
}

// ============================================
// Navigation
// ============================================

function initNav() {
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;

            document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${view}`).classList.add('active');
        });
    });
}

// ============================================
// Load Data
// ============================================

async function loadProducts() {
    try {
        const res = await fetch('/api/admin/products');
        products = await res.json();
        renderProducts();
    } catch (e) {
        console.error('Failed to load products', e);
    }
}

async function loadCategories() {
    try {
        const res = await fetch('/api/admin/categories');
        categories = await res.json();
        renderCategories();
        populateCategorySelect();
    } catch (e) {
        console.error('Failed to load categories', e);
    }
}

async function loadSettings() {
    try {
        const res = await fetch('/api/admin/settings');
        const settings = await res.json();
        document.getElementById('settingStoreName').value = settings.storeName || '';
        document.getElementById('settingAnnouncement').value = settings.announcementText || '';
        document.getElementById('settingPromoCode').value = settings.promoCode || '';
        document.getElementById('settingPromoDiscount').value = settings.promoDiscount || 0;
        document.getElementById('settingFreeShipping').value = settings.freeShippingThreshold || 0;
    } catch (e) {
        console.error('Failed to load settings', e);
    }
}

// ============================================
// Render Products
// ============================================

function renderProducts() {
    const table = document.getElementById('productsTable');

    if (products.length === 0) {
        table.innerHTML = `<div class="empty-state"><span>📦</span><p>${t('products.empty', 'No products yet. Add your first bracelet!')}</p></div>`;
        return;
    }

    const header = `
        <div class="product-row product-row-header">
            <span></span>
            <span>${t('products.col.product', 'Product')}</span>
            <span>${t('products.col.price', 'Price')}</span>
            <span class="badge-col">${t('products.col.badge', 'Badge')}</span>
            <span>${t('products.col.status', 'Status')}</span>
            <span>${t('products.col.actions', 'Actions')}</span>
        </div>
    `;

    const rows = products.map(product => {
        const category = categories.find(c => c.id === product.category);
        const badgeClass = product.badge ? `badge-${product.badge}` : '';

        return `
            <div class="product-row">
                <div class="product-thumb" style="background: ${product.gradient};">
                    ${product.emoji || '✿'}
                </div>
                <div>
                    <div class="name">${product.name}</div>
                    <div class="desc">${product.description || ''}</div>
                </div>
                <div class="price">$${product.price}</div>
                <div class="badge-col">
                    ${product.badge ? `<span class="badge-tag ${badgeClass}">${product.badge}</span>` : '—'}
                </div>
                <div>
                    <span class="status-dot ${product.active ? 'status-active' : 'status-hidden'}"></span>
                    ${product.active ? t('products.active', 'Active') : t('products.hidden', 'Hidden')}
                </div>
                <div class="row-actions">
                    <button class="action-btn" onclick="editProduct('${product.id}')" title="Edit">✏️</button>
                    <button class="action-btn delete" onclick="deleteProduct('${product.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    table.innerHTML = header + rows;
}

// ============================================
// Render Categories
// ============================================

function renderCategories() {
    const list = document.getElementById('categoriesList');

    if (categories.length === 0) {
        list.innerHTML = `<div class="empty-state"><span>🏷️</span><p>${t('categories.empty', 'No categories yet. Create your first collection!')}</p></div>`;
        return;
    }

    list.innerHTML = categories.map(cat => `
        <div class="category-row">
            <div class="category-info">
                <span class="order">${cat.order}</span>
                <div>
                    <div class="name">${cat.name}</div>
                    <div class="slug">/${cat.slug}</div>
                </div>
            </div>
            <div class="row-actions">
                <button class="action-btn" onclick="editCategory('${cat.id}')" title="Edit">✏️</button>
                <button class="action-btn delete" onclick="deleteCategory('${cat.id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function populateCategorySelect() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">No category</option>' +
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

// ============================================
// Modals
// ============================================

function initModals() {
    // Product modal
    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
    document.getElementById('productModalClose').addEventListener('click', () => closeModal('productModal'));
    document.getElementById('productModalCancel').addEventListener('click', () => closeModal('productModal'));

    // Category modal
    document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal());
    document.getElementById('categoryModalClose').addEventListener('click', () => closeModal('categoryModal'));
    document.getElementById('categoryModalCancel').addEventListener('click', () => closeModal('categoryModal'));

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });

    // Gradient preview
    document.getElementById('productGradient').addEventListener('input', (e) => {
        document.getElementById('gradientPreview').style.background = e.target.value;
    });
}

function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');

    form.reset();
    document.getElementById('productId').value = '';
    document.getElementById('gradientPreview').style.background = '';
    resetAiFill();

    if (product) {
        title.textContent = t('pm.editTitle', 'Edit Product');
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productNameEs').value = product.name_es || '';
        document.getElementById('productDescriptionEs').value = product.description_es || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productBadge').value = product.badge || '';
        document.getElementById('productEmoji').value = product.emoji || '';
        document.getElementById('productGradient').value = product.gradient || '';
        document.getElementById('productActive').value = product.active ? 'true' : 'false';
        document.getElementById('productFeatured').checked = !!product.featured;
        document.getElementById('gradientPreview').style.background = product.gradient || '';
    } else {
        title.textContent = t('pm.addTitle', 'Add Product');
    }

    modal.classList.add('open');
}

function openCategoryModal(category = null) {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm');

    form.reset();
    document.getElementById('categoryId').value = '';

    if (category) {
        title.textContent = t('cm.editTitle', 'Edit Category');
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
    } else {
        title.textContent = t('cm.addTitle', 'Add Category');
    }

    modal.classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

// ============================================
// Form Submissions
// ============================================

function initForms() {
    // Product form
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('productId').value;

        // The API reads JSON (it JSON-parses the request body), so send JSON —
        // not multipart FormData — otherwise no fields persist. `image` is stored
        // as a string/URL by the API; file uploads aren't supported server-side.
        const payload = {
            name: document.getElementById('productName').value,
            name_es: document.getElementById('productNameEs').value,
            price: document.getElementById('productPrice').value,
            description: document.getElementById('productDescription').value,
            description_es: document.getElementById('productDescriptionEs').value,
            category: document.getElementById('productCategory').value,
            badge: document.getElementById('productBadge').value,
            emoji: document.getElementById('productEmoji').value,
            gradient: document.getElementById('productGradient').value,
            active: document.getElementById('productActive').value,
            featured: document.getElementById('productFeatured').checked,
        };

        try {
            const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                closeModal('productModal');
                loadProducts();
                showToast(id ? t('products.updated', 'Product updated! ✿') : t('products.added', 'Product added! 🌊'));
            } else {
                showToast(errorMessage(await safeJson(res), t('products.saveError', 'Error saving product')), 'error');
            }
        } catch (e) {
            showToast(t('generic.connError', 'Connection error'), 'error');
        }
    });

    // Category form
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value;

        try {
            const url = id ? `/api/admin/categories/${id}` : '/api/admin/categories';
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                closeModal('categoryModal');
                loadCategories();
                showToast(id ? t('categories.updated', 'Category updated! 🏷️') : t('categories.added', 'Category added! ✿'));
            } else {
                showToast(errorMessage(await safeJson(res), t('categories.saveError', 'Error saving category')), 'error');
            }
        } catch (e) {
            showToast(t('generic.connError', 'Connection error'), 'error');
        }
    });

    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            storeName: document.getElementById('settingStoreName').value,
            announcementText: document.getElementById('settingAnnouncement').value,
            promoCode: document.getElementById('settingPromoCode').value,
            promoDiscount: parseInt(document.getElementById('settingPromoDiscount').value),
            freeShippingThreshold: parseInt(document.getElementById('settingFreeShipping').value)
        };

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                showToast(t('settings.saved', 'Settings saved! ⚙️'));
            } else {
                showToast(errorMessage(await safeJson(res), t('settings.saveError', 'Error saving settings')), 'error');
            }
        } catch (e) {
            showToast(t('generic.connError', 'Connection error'), 'error');
        }
    });

    // Change password
    document.getElementById('changePasswordBtn').addEventListener('click', async () => {
        const currentPassword = document.getElementById('settingCurrentPw').value;
        const newPassword = document.getElementById('settingNewPw').value;

        if (!currentPassword || !newPassword) {
            showToast(t('settings.pwBothFields', 'Please fill in both password fields'), 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast(t('settings.pwTooShort', 'New password must be at least 6 characters'), 'error');
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (res.ok) {
                showToast(t('settings.pwUpdated', 'Password updated! 🔐'));
                document.getElementById('settingCurrentPw').value = '';
                document.getElementById('settingNewPw').value = '';
            } else {
                showToast(t('settings.pwIncorrect', 'Current password is incorrect'), 'error');
            }
        } catch (e) {
            showToast(t('generic.connError', 'Connection error'), 'error');
        }
    });
}

// ============================================
// CRUD Actions
// ============================================

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) openProductModal(product);
}

async function deleteProduct(id) {
    if (!confirm(t('products.deleteConfirm', 'Are you sure you want to delete this product?'))) return;

    try {
        const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadProducts();
            showToast(t('products.deleted', 'Product deleted'));
        } else {
            showToast(errorMessage(await safeJson(res), t('products.deleteError', 'Error deleting product')), 'error');
        }
    } catch (e) {
        showToast(t('products.deleteError', 'Error deleting product'), 'error');
    }
}

function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (category) openCategoryModal(category);
}

async function deleteCategory(id) {
    if (!confirm(t('categories.deleteConfirm', 'Are you sure? Products in this category will become uncategorized.'))) return;

    try {
        const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadCategories();
            showToast(t('categories.deleted', 'Category deleted'));
        } else {
            showToast(errorMessage(await safeJson(res), t('categories.deleteError', 'Error deleting category')), 'error');
        }
    } catch (e) {
        showToast(t('categories.deleteError', 'Error deleting category'), 'error');
    }
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}



// ============================================
// Orders
// ============================================

async function loadOrders() {
    try {
        const res = await fetch('/api/admin/orders');
        orders = await res.json();
        renderOrders(orders);
        renderOrderStats();
    } catch (e) {
        console.error('Failed to load orders', e);
    }
}

function renderOrderStats() {
    const stats = document.getElementById('orderStats');
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const paidCount = orders.filter(o => o.status === 'paid').length;
    const fulfilledCount = orders.filter(o => o.status === 'fulfilled').length;

    stats.innerHTML = `
        <div class="stat-pills">
            <span class="stat-pill">${orders.length} ${t('orders.stat.orders', 'orders')}</span>
            <span class="stat-pill revenue">$${totalRevenue.toFixed(2)} ${t('orders.stat.revenue', 'revenue')}</span>
            <span class="stat-pill pending">${paidCount} ${t('orders.stat.toFulfill', 'to fulfill')}</span>
        </div>
    `;
}

function renderOrders(ordersToRender) {
    const table = document.getElementById('ordersTable');

    if (ordersToRender.length === 0) {
        table.innerHTML = `<div class="empty-state"><span>🧾</span><p>${t('orders.empty', "No orders yet. They'll appear here once customers check out.")}</p></div>`;
        return;
    }

    const header = `
        <div class="order-row order-row-header">
            <span>${t('orders.col.order', 'Order')}</span>
            <span>${t('orders.col.customer', 'Customer')}</span>
            <span>${t('orders.col.items', 'Items')}</span>
            <span>${t('orders.col.total', 'Total')}</span>
            <span>${t('orders.col.status', 'Status')}</span>
            <span>${t('orders.col.actions', 'Actions')}</span>
        </div>
    `;

    const dateLocale = (window.AdminI18n && AdminI18n.getLang() === 'es') ? 'es-ES' : 'en-US';
    const rows = ordersToRender.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString(dateLocale, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const itemNames = (order.items || []).map(i => i.name).join(', ') || '—';
        const statusClass = order.status === 'fulfilled' ? 'status-fulfilled' : 'status-paid';
        const statusLabel = order.status === 'fulfilled' ? t('orders.status.fulfilled', 'Fulfilled') : t('orders.status.paid', 'Paid');

        return `
            <div class="order-row">
                <div>
                    <div class="order-id">${order.id}</div>
                    <div class="order-date">${date}</div>
                </div>
                <div>
                    <div class="order-customer">${order.payer?.name || '—'}</div>
                    <div class="order-email">${order.payer?.email || ''}</div>
                </div>
                <div class="order-items-cell" title="${itemNames}">${itemNames}</div>
                <div class="order-total">$${(order.total || 0).toFixed(2)}</div>
                <div>
                    <span class="order-status ${statusClass}">${statusLabel}</span>
                </div>
                <div class="row-actions">
                    ${order.status === 'paid' ? `<button class="btn btn-small btn-primary" onclick="fulfillOrder('${order.id}')">${t('orders.markFulfilled', 'Mark Fulfilled')}</button>` : `<span class="fulfilled-check">✓</span>`}
                </div>
            </div>
        `;
    }).join('');

    table.innerHTML = header + rows;
}

function initOrderFilters() {
    document.querySelectorAll('[data-order-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-order-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.orderFilter;
            if (filter === 'all') {
                renderOrders(orders);
            } else {
                renderOrders(orders.filter(o => o.status === filter));
            }
        });
    });
}

async function fulfillOrder(id) {
    try {
        const res = await fetch(`/api/admin/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'fulfilled' }),
        });

        if (res.ok) {
            loadOrders();
            showToast(t('orders.fulfilledToast', 'Order marked as fulfilled! 📦'));
        } else {
            showToast(errorMessage(await safeJson(res), t('orders.updateError', 'Error updating order')), 'error');
        }
    } catch (e) {
        showToast(t('generic.connError', 'Connection error'), 'error');
    }
}
