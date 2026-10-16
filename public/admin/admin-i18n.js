/* ============================================
   UMI UMI — Admin Dashboard i18n (EN / ES)
   ---------------------------------------------
   Mirrors the storefront's lightweight i18n:
   - Static text: elements tagged with data-i18n="key".
   - Attributes:  data-i18n-attr="placeholder:key,aria-label:key".
   - Dynamic text (JS-rendered tables, toasts, dialogs) calls
     window.AdminI18n.t(key).
   - Language choice is shared with the storefront via the same
     localStorage key ("umi_lang"), so switching one follows through.
   - Exposes window.AdminI18n.{ t, getLang, setLang, apply }.
   ============================================ */
(function () {
    const I18N = {
        en: {
            // Document / login
            'doc.title': 'Umi Umi — Admin Dashboard',
            'login.subtitle': 'Admin Dashboard',
            'login.password': 'Enter admin password',
            'login.signIn': 'Sign In',
            'login.error': 'Invalid password. Please try again.',
            'login.connError': 'Connection error. Please try again.',

            // Sidebar
            'side.badge': 'Admin',
            'side.orders': 'Orders',
            'side.products': 'Products',
            'side.categories': 'Categories',
            'side.settings': 'Settings',
            'side.viewStore': 'View Store',
            'side.logout': 'Logout',
            'lang.toggle': 'ES',
            'lang.label': 'Español',

            // Orders view
            'orders.title': 'Orders',
            'orders.subtitle': 'Track and manage customer orders',
            'orders.filter.all': 'All',
            'orders.filter.paid': 'Paid',
            'orders.filter.fulfilled': 'Fulfilled',
            'orders.col.order': 'Order',
            'orders.col.customer': 'Customer',
            'orders.col.items': 'Items',
            'orders.col.total': 'Total',
            'orders.col.status': 'Status',
            'orders.col.actions': 'Actions',
            'orders.empty': "No orders yet. They'll appear here once customers check out.",
            'orders.status.paid': 'Paid',
            'orders.status.fulfilled': 'Fulfilled',
            'orders.markFulfilled': 'Mark Fulfilled',
            'orders.stat.orders': 'orders',
            'orders.stat.revenue': 'revenue',
            'orders.stat.toFulfill': 'to fulfill',
            'orders.fulfilledToast': 'Order marked as fulfilled! 📦',
            'orders.updateError': 'Error updating order',

            // Products view
            'products.title': 'Products',
            'products.subtitle': 'Manage your bracelet inventory',
            'products.add': '+ Add Product',
            'products.col.product': 'Product',
            'products.col.price': 'Price',
            'products.col.badge': 'Badge',
            'products.col.status': 'Status',
            'products.col.actions': 'Actions',
            'products.empty': 'No products yet. Add your first bracelet!',
            'products.active': 'Active',
            'products.hidden': 'Hidden',
            'products.deleteConfirm': 'Are you sure you want to delete this product?',
            'products.deleted': 'Product deleted',
            'products.deleteError': 'Error deleting product',
            'products.added': 'Product added! 🌊',
            'products.updated': 'Product updated! ✿',
            'products.saveError': 'Error saving product',

            // Categories view
            'categories.title': 'Categories',
            'categories.subtitle': 'Organize your collections',
            'categories.add': '+ Add Category',
            'categories.empty': 'No categories yet. Create your first collection!',
            'categories.deleteConfirm': 'Are you sure? Products in this category will become uncategorized.',
            'categories.deleted': 'Category deleted',
            'categories.deleteError': 'Error deleting category',
            'categories.added': 'Category added! ✿',
            'categories.updated': 'Category updated! 🏷️',
            'categories.saveError': 'Error saving category',

            // Settings view
            'settings.title': 'Settings',
            'settings.subtitle': 'Store configuration',
            'settings.storeInfo': 'Store Info',
            'settings.storeName': 'Store Name',
            'settings.announcement': 'Announcement Bar Text',
            'settings.promotions': 'Promotions',
            'settings.promoCode': 'Promo Code',
            'settings.discount': 'Discount %',
            'settings.freeShipping': 'Free Shipping Threshold ($)',
            'settings.changePassword': 'Change Password',
            'settings.currentPassword': 'Current Password',
            'settings.newPassword': 'New Password',
            'settings.updatePassword': 'Update Password',
            'settings.save': 'Save Settings',
            'settings.saved': 'Settings saved! ⚙️',
            'settings.saveError': 'Error saving settings',
            'settings.pwBothFields': 'Please fill in both password fields',
            'settings.pwTooShort': 'New password must be at least 6 characters',
            'settings.pwUpdated': 'Password updated! 🔐',
            'settings.pwIncorrect': 'Current password is incorrect',

            // Product modal
            'pm.addTitle': 'Add Product',
            'pm.editTitle': 'Edit Product',
            'pm.name': 'Product Name',
            'pm.namePh': 'e.g. Seafoam Blossom',
            'pm.price': 'Price ($)',
            'pm.description': 'Description',
            'pm.descriptionPh': 'e.g. Aqua beads · Dried flower charms',
            'pm.nameEs': 'Name in Spanish',
            'pm.nameEsHint': '(optional — shown when the store is in Spanish)',
            'pm.nameEsPh': 'e.g. Colgante Mariposa en Flor',
            'pm.descEs': 'Description in Spanish',
            'pm.descEsHint': '(optional)',
            'pm.descEsPh': 'e.g. Cuentas aqua · Dije de flor seca',
            'pm.category': 'Category',
            'pm.badge': 'Badge',
            'pm.badge.none': 'None',
            'pm.badge.new': 'New',
            'pm.badge.bestseller': 'Bestseller',
            'pm.badge.limited': 'Limited',
            'pm.badge.sale': 'Sale',
            'pm.emoji': 'Emoji Icon',
            'pm.status': 'Status',
            'pm.status.active': 'Active',
            'pm.status.hidden': 'Hidden',
            'pm.gradient': 'Background Gradient',
            'pm.image': 'Product Image (optional — overrides gradient)',
            'pm.cancel': 'Cancel',
            'pm.save': 'Save Product',

            // Category modal
            'cm.addTitle': 'Add Category',
            'cm.editTitle': 'Edit Category',
            'cm.name': 'Category Name',
            'cm.namePh': 'e.g. Ocean Collection',
            'cm.cancel': 'Cancel',
            'cm.save': 'Save Category',

            // AI photo autofill
            'ai.title': '✨ Fill from a photo',
            'ai.sub': 'Upload a product photo and let AI draft the details for you.',
            'ai.analyze': 'Analyze photo',
            'ai.analyzing': 'Analyzing photo…',
            'ai.done': '✓ Fields filled in — review and edit, then save.',
            'ai.noPhoto': 'Please choose a photo first.',
            'ai.error': 'Could not analyze the photo. Please try again.',
            'ai.notConfigured': 'AI is not set up yet. Add a GEMINI_API_KEY in Vercel and redeploy.',

            // Generic
            'generic.connError': 'Connection error',
            'err.persist': 'Changes can’t be saved yet — persistent storage isn’t set up. Add Upstash Redis in Vercel, then redeploy.',
        },
        es: {
            'doc.title': 'Umi Umi — Panel de Administración',
            'login.subtitle': 'Panel de Administración',
            'login.password': 'Introduce la contraseña de administrador',
            'login.signIn': 'Iniciar Sesión',
            'login.error': 'Contraseña incorrecta. Inténtalo de nuevo.',
            'login.connError': 'Error de conexión. Inténtalo de nuevo.',

            'side.badge': 'Admin',
            'side.orders': 'Pedidos',
            'side.products': 'Productos',
            'side.categories': 'Categorías',
            'side.settings': 'Ajustes',
            'side.viewStore': 'Ver Tienda',
            'side.logout': 'Cerrar Sesión',
            'lang.toggle': 'EN',
            'lang.label': 'English',

            'orders.title': 'Pedidos',
            'orders.subtitle': 'Sigue y gestiona los pedidos de clientes',
            'orders.filter.all': 'Todos',
            'orders.filter.paid': 'Pagados',
            'orders.filter.fulfilled': 'Enviados',
            'orders.col.order': 'Pedido',
            'orders.col.customer': 'Cliente',
            'orders.col.items': 'Artículos',
            'orders.col.total': 'Total',
            'orders.col.status': 'Estado',
            'orders.col.actions': 'Acciones',
            'orders.empty': 'Aún no hay pedidos. Aparecerán aquí cuando los clientes compren.',
            'orders.status.paid': 'Pagado',
            'orders.status.fulfilled': 'Enviado',
            'orders.markFulfilled': 'Marcar Enviado',
            'orders.stat.orders': 'pedidos',
            'orders.stat.revenue': 'ingresos',
            'orders.stat.toFulfill': 'por enviar',
            'orders.fulfilledToast': '¡Pedido marcado como enviado! 📦',
            'orders.updateError': 'Error al actualizar el pedido',

            'products.title': 'Productos',
            'products.subtitle': 'Gestiona tu inventario de pulseras',
            'products.add': '+ Añadir Producto',
            'products.col.product': 'Producto',
            'products.col.price': 'Precio',
            'products.col.badge': 'Etiqueta',
            'products.col.status': 'Estado',
            'products.col.actions': 'Acciones',
            'products.empty': 'Aún no hay productos. ¡Añade tu primera pulsera!',
            'products.active': 'Activo',
            'products.hidden': 'Oculto',
            'products.deleteConfirm': '¿Seguro que quieres eliminar este producto?',
            'products.deleted': 'Producto eliminado',
            'products.deleteError': 'Error al eliminar el producto',
            'products.added': '¡Producto añadido! 🌊',
            'products.updated': '¡Producto actualizado! ✿',
            'products.saveError': 'Error al guardar el producto',

            'categories.title': 'Categorías',
            'categories.subtitle': 'Organiza tus colecciones',
            'categories.add': '+ Añadir Categoría',
            'categories.empty': 'Aún no hay categorías. ¡Crea tu primera colección!',
            'categories.deleteConfirm': '¿Estás seguro? Los productos de esta categoría quedarán sin categorizar.',
            'categories.deleted': 'Categoría eliminada',
            'categories.deleteError': 'Error al eliminar la categoría',
            'categories.added': '¡Categoría añadida! ✿',
            'categories.updated': '¡Categoría actualizada! 🏷️',
            'categories.saveError': 'Error al guardar la categoría',

            'settings.title': 'Ajustes',
            'settings.subtitle': 'Configuración de la tienda',
            'settings.storeInfo': 'Información de la Tienda',
            'settings.storeName': 'Nombre de la Tienda',
            'settings.announcement': 'Texto de la Barra de Anuncios',
            'settings.promotions': 'Promociones',
            'settings.promoCode': 'Código Promocional',
            'settings.discount': 'Descuento %',
            'settings.freeShipping': 'Umbral de Envío Gratis ($)',
            'settings.changePassword': 'Cambiar Contraseña',
            'settings.currentPassword': 'Contraseña Actual',
            'settings.newPassword': 'Nueva Contraseña',
            'settings.updatePassword': 'Actualizar Contraseña',
            'settings.save': 'Guardar Ajustes',
            'settings.saved': '¡Ajustes guardados! ⚙️',
            'settings.saveError': 'Error al guardar los ajustes',
            'settings.pwBothFields': 'Por favor rellena ambos campos de contraseña',
            'settings.pwTooShort': 'La nueva contraseña debe tener al menos 6 caracteres',
            'settings.pwUpdated': '¡Contraseña actualizada! 🔐',
            'settings.pwIncorrect': 'La contraseña actual es incorrecta',

            'pm.addTitle': 'Añadir Producto',
            'pm.editTitle': 'Editar Producto',
            'pm.name': 'Nombre del Producto',
            'pm.namePh': 'ej. Flor de Espuma',
            'pm.price': 'Precio ($)',
            'pm.description': 'Descripción',
            'pm.descriptionPh': 'ej. Cuentas aqua · Dijes de flor seca',
            'pm.nameEs': 'Nombre en Español',
            'pm.nameEsHint': '(opcional — se muestra cuando la tienda está en español)',
            'pm.nameEsPh': 'ej. Colgante Mariposa en Flor',
            'pm.descEs': 'Descripción en Español',
            'pm.descEsHint': '(opcional)',
            'pm.descEsPh': 'ej. Cuentas aqua · Dije de flor seca',
            'pm.category': 'Categoría',
            'pm.badge': 'Etiqueta',
            'pm.badge.none': 'Ninguna',
            'pm.badge.new': 'Nuevo',
            'pm.badge.bestseller': 'Más Vendido',
            'pm.badge.limited': 'Limitado',
            'pm.badge.sale': 'Oferta',
            'pm.emoji': 'Icono Emoji',
            'pm.status': 'Estado',
            'pm.status.active': 'Activo',
            'pm.status.hidden': 'Oculto',
            'pm.gradient': 'Degradado de Fondo',
            'pm.image': 'Imagen del Producto (opcional — reemplaza el degradado)',
            'pm.cancel': 'Cancelar',
            'pm.save': 'Guardar Producto',

            'cm.addTitle': 'Añadir Categoría',
            'cm.editTitle': 'Editar Categoría',
            'cm.name': 'Nombre de la Categoría',
            'cm.namePh': 'ej. Colección Océano',
            'cm.cancel': 'Cancelar',
            'cm.save': 'Guardar Categoría',

            'ai.title': '✨ Rellenar desde una foto',
            'ai.sub': 'Sube una foto del producto y deja que la IA redacte los detalles por ti.',
            'ai.analyze': 'Analizar foto',
            'ai.analyzing': 'Analizando la foto…',
            'ai.done': '✓ Campos rellenados: revísalos, edítalos y guarda.',
            'ai.noPhoto': 'Por favor elige una foto primero.',
            'ai.error': 'No se pudo analizar la foto. Inténtalo de nuevo.',
            'ai.notConfigured': 'La IA aún no está configurada. Añade GEMINI_API_KEY en Vercel y vuelve a desplegar.',

            'generic.connError': 'Error de conexión',
            'err.persist': 'Los cambios aún no se pueden guardar: falta configurar el almacenamiento persistente. Añade Upstash Redis en Vercel y vuelve a desplegar.',
        },
    };

    let lang = localStorage.getItem('umi_lang') || 'en';
    if (!I18N[lang]) lang = 'en';

    function t(key) {
        const table = I18N[lang] || I18N.en;
        return (key in table) ? table[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
    }

    function apply() {
        document.documentElement.lang = lang;

        // Document title
        if (I18N[lang]['doc.title']) document.title = t('doc.title');

        // Text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val.indexOf('<') !== -1) el.innerHTML = val;
            else el.textContent = val;
        });

        // Attributes, e.g. data-i18n-attr="placeholder:login.password"
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            el.getAttribute('data-i18n-attr').split(',').forEach(pair => {
                const [attr, key] = pair.split(':').map(s => s.trim());
                if (attr && key) el.setAttribute(attr, t(key));
            });
        });

        // Toggle button label
        const btn = document.getElementById('langToggle');
        if (btn) {
            btn.textContent = t('lang.toggle');
            btn.setAttribute('aria-label', t('lang.label'));
        }

        // Let admin.js re-render dynamic tables/toasts in the new language
        document.dispatchEvent(new CustomEvent('umi:langchange', { detail: { lang } }));
    }

    function setLang(next) {
        if (!I18N[next]) return;
        lang = next;
        localStorage.setItem('umi_lang', lang);
        apply();
    }
    function getLang() { return lang; }

    window.AdminI18n = { t, getLang, setLang, apply };

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('langToggle');
        if (btn) btn.addEventListener('click', () => setLang(lang === 'en' ? 'es' : 'en'));
        apply();
    });
})();
