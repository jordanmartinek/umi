/* ============================================
   UMI UMI — Admin Dashboard Scripts
   ============================================ */

let products = [];
let categories = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initLogin();
    initNav();
    initModals();
    initForms();
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

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
                errorEl.textContent = 'Invalid password. Please try again.';
            }
        } catch (e) {
            errorEl.textContent = 'Connection error. Please try again.';
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
        table.innerHTML = `<div class="empty-state"><span>📦</span><p>No products yet. Add your first bracelet!</p></div>`;
        return;
    }

    const header = `
        <div class="product-row product-row-header">
            <span></span>
            <span>Product</span>
            <span>Price</span>
            <span class="badge-col">Badge</span>
            <span>Status</span>
            <span>Actions</span>
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
                    ${product.active ? 'Active' : 'Hidden'}
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
        list.innerHTML = `<div class="empty-state"><span>🏷️</span><p>No categories yet. Create your first collection!</p></div>`;
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

    if (product) {
        title.textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productBadge').value = product.badge || '';
        document.getElementById('productEmoji').value = product.emoji || '';
        document.getElementById('productGradient').value = product.gradient || '';
        document.getElementById('productActive').value = product.active ? 'true' : 'false';
        document.getElementById('gradientPreview').style.background = product.gradient || '';
    } else {
        title.textContent = 'Add Product';
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
        title.textContent = 'Edit Category';
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
    } else {
        title.textContent = 'Add Category';
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
        const formData = new FormData();

        formData.append('name', document.getElementById('productName').value);
        formData.append('price', document.getElementById('productPrice').value);
        formData.append('description', document.getElementById('productDescription').value);
        formData.append('category', document.getElementById('productCategory').value);
        formData.append('badge', document.getElementById('productBadge').value);
        formData.append('emoji', document.getElementById('productEmoji').value);
        formData.append('gradient', document.getElementById('productGradient').value);
        formData.append('active', document.getElementById('productActive').value);

        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) formData.append('image', imageFile);

        try {
            const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, { method, body: formData });
            if (res.ok) {
                closeModal('productModal');
                loadProducts();
                showToast(id ? 'Product updated! ✿' : 'Product added! 🌊');
            } else {
                showToast('Error saving product', 'error');
            }
        } catch (e) {
            showToast('Connection error', 'error');
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
                showToast(id ? 'Category updated! 🏷️' : 'Category added! ✿');
            } else {
                showToast('Error saving category', 'error');
            }
        } catch (e) {
            showToast('Connection error', 'error');
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
                showToast('Settings saved! ⚙️');
            } else {
                showToast('Error saving settings', 'error');
            }
        } catch (e) {
            showToast('Connection error', 'error');
        }
    });

    // Change password
    document.getElementById('changePasswordBtn').addEventListener('click', async () => {
        const currentPassword = document.getElementById('settingCurrentPw').value;
        const newPassword = document.getElementById('settingNewPw').value;

        if (!currentPassword || !newPassword) {
            showToast('Please fill in both password fields', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters', 'error');
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (res.ok) {
                showToast('Password updated! 🔐');
                document.getElementById('settingCurrentPw').value = '';
                document.getElementById('settingNewPw').value = '';
            } else {
                showToast('Current password is incorrect', 'error');
            }
        } catch (e) {
            showToast('Connection error', 'error');
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
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadProducts();
            showToast('Product deleted');
        }
    } catch (e) {
        showToast('Error deleting product', 'error');
    }
}

function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (category) openCategoryModal(category);
}

async function deleteCategory(id) {
    if (!confirm('Are you sure? Products in this category will become uncategorized.')) return;

    try {
        const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadCategories();
            showToast('Category deleted');
        }
    } catch (e) {
        showToast('Error deleting category', 'error');
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
