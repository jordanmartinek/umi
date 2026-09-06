/* ============================================
   UMI UMI ACCESSORIES — Lightweight i18n (EN / ES)
   ---------------------------------------------
   - Text lives in the I18N dictionary below.
   - Any element with data-i18n="key" gets its text replaced.
   - data-i18n-attr="placeholder:key,aria-label:key" translates attributes.
   - Language choice is remembered in localStorage ("umi_lang").
   - Exposes window.UmiI18n.{ t, getLang, setLang, apply } so page scripts
     (carousel, filters, cart) can translate dynamic content too.
   ============================================ */
(function () {
    const I18N = {
        en: {
            // Announcement + nav
            'announce.shipping': 'FREE SHIPPING ON ORDERS OVER $75',
            'nav.home': 'Home',
            'nav.shop': 'Shop',
            'lang.toggle': 'ES',
            'lang.label': 'Español',

            // Hero
            'hero.badge': 'BEST SELLER',
            'hero.title': 'Butterfly Bloom Pendant',
            'hero.sub': 'Ocean Blue • Sky Cyan • Sunbeam Yellow',
            'hero.desc': 'A little burst of joy to carry with you. The Butterfly Bloom Pendant is hand-strung from vibrant blue, cyan, and yellow beads into a cheerful butterfly, finished on a soft adjustable cord — playful, lightweight, and made to make you smile.',
            'hero.feat1.t': 'Hand-Beaded Butterfly', 'hero.feat1.s': 'Bright blue, cyan & yellow beads',
            'hero.feat2.t': 'Handmade with Love',    'hero.feat2.s': 'Each piece is unique',
            'hero.feat3.t': 'Adjustable Cord',        'hero.feat3.s': 'Comfy, durable & one-size-fits-all',
            'hero.addToCart': 'Add to Cart',
            'hero.added': '✓ Added to Cart',
            'hero.shipping': '🚚 Shipping & Returns',
            'hero.shippingBody': "Free shipping on orders over $75. Ships in 2–4 business days. 30-day easy returns — if it's not perfect, we'll make it right. 🤍",
            'hero.polaroid': 'Good things<br>take time',

            // New Releases
            'nr.eyebrow': 'Fresh off the workbench',
            'nr.title': 'New Releases',
            'nr.sub': 'The latest little joys — just added to the collection.',

            // Find Your Piece finder
            'find.eyebrow': 'Customize your search',
            'find.title': 'Find Your Piece',
            'find.sub': 'Tell us your vibe and we\u2019ll match you with something special.',
            'find.styleLabel': 'Style',
            'find.colorLabel': 'Color',
            'find.style.all': 'All', 'find.style.bracelets': 'Bracelets', 'find.style.pendants': 'Pendants',
            'find.style.rings': 'Rings', 'find.style.anklets': 'Anklets', 'find.style.earrings': 'Earrings',
            'find.color.all': 'All', 'find.color.pink': 'Pink', 'find.color.blue': 'Blue',
            'find.color.lavender': 'Lavender', 'find.color.gold': 'Gold', 'find.color.cyan': 'Cyan', 'find.color.multi': 'Multi',
            'find.count': 'match', 'find.countPlural': 'matches',
            'find.none': 'No matches yet — try another combo!',
            'find.seeAll': 'See all in Shop →',

            // Band
            'band.bubble': 'MORE<br>THAN JUST<br>JEWELRY...',
            'band.f1': 'Natural<br>Gemstones', 'band.f2': 'Handmade<br>with Love',
            'band.f3': 'Inspired by<br>Nature',  'band.f4': 'Made for<br>Your Journey',
            'band.cat': 'Good<br>Vibes<br>Only',

            // You might also like
            'also.title': 'You Might Also Like',

            // Footer
            'foot.headline': 'Handmade<br>Jewelry for<br>a Brighter<br>You.',
            'foot.cta': 'Shop the Collection',
            'foot.ctaHome': 'Back to Home',

            // Shop page
            'shop.eyebrow': 'Handmade with love',
            'shop.title': 'Shop the Collection',
            'shop.sub': 'Little pieces of joy — beaded pendants, bracelets, rings & more, each one made to make you smile.',

            // Cart + checkout
            'cart.title': 'Your Cart 🛍️',
            'cart.empty': 'Your cart is empty',
            'cart.total': 'Total',
            'cart.loading': 'Loading checkout...',
            'cart.fallback': 'Checkout with PayPal',
            'cart.note': '✦ Free shipping on orders over $75 ✦',
            'cart.quickAdd': 'Quick Add',
            'order.title': 'Thank You!',
            'order.body': 'Your order has been placed successfully.',
            'order.id': 'Order ID:',
            'order.email': 'A confirmation email will be sent from PayPal.',
            'order.continue': 'Continue Shopping',
            'toast.added': 'added',
        },
        es: {
            'announce.shipping': 'ENVÍO GRATIS EN PEDIDOS SUPERIORES A $75',
            'nav.home': 'Inicio',
            'nav.shop': 'Tienda',
            'lang.toggle': 'EN',
            'lang.label': 'English',

            'hero.badge': 'MÁS VENDIDO',
            'hero.title': 'Colgante Mariposa en Flor',
            'hero.sub': 'Azul Océano • Cian Cielo • Amarillo Sol',
            'hero.desc': 'Una pequeña dosis de alegría para llevar contigo. El Colgante Mariposa en Flor está tejido a mano con vibrantes cuentas azules, cian y amarillas en forma de una alegre mariposa, rematado con un suave cordón ajustable: divertido, ligero y hecho para sacarte una sonrisa.',
            'hero.feat1.t': 'Mariposa de Cuentas', 'hero.feat1.s': 'Cuentas azules, cian y amarillas',
            'hero.feat2.t': 'Hecho a Mano con Amor', 'hero.feat2.s': 'Cada pieza es única',
            'hero.feat3.t': 'Cordón Ajustable',      'hero.feat3.s': 'Cómodo, resistente y talla única',
            'hero.addToCart': 'Añadir al Carrito',
            'hero.added': '✓ Añadido al Carrito',
            'hero.shipping': '🚚 Envíos y Devoluciones',
            'hero.shippingBody': 'Envío gratis en pedidos superiores a $75. Se envía en 2–4 días hábiles. Devoluciones fáciles en 30 días: si no es perfecto, lo solucionamos. 🤍',
            'hero.polaroid': 'Las cosas buenas<br>toman tiempo',

            'nr.eyebrow': 'Recién salido del taller',
            'nr.title': 'Novedades',
            'nr.sub': 'Las últimas pequeñas alegrías, recién añadidas a la colección.',

            'find.eyebrow': 'Personaliza tu búsqueda',
            'find.title': 'Encuentra tu Pieza',
            'find.sub': 'Cuéntanos tu estilo y te encontraremos algo especial.',
            'find.styleLabel': 'Estilo',
            'find.colorLabel': 'Color',
            'find.style.all': 'Todo', 'find.style.bracelets': 'Pulseras', 'find.style.pendants': 'Colgantes',
            'find.style.rings': 'Anillos', 'find.style.anklets': 'Tobilleras', 'find.style.earrings': 'Aretes',
            'find.color.all': 'Todos', 'find.color.pink': 'Rosa', 'find.color.blue': 'Azul',
            'find.color.lavender': 'Lavanda', 'find.color.gold': 'Dorado', 'find.color.cyan': 'Cian', 'find.color.multi': 'Multicolor',
            'find.count': 'resultado', 'find.countPlural': 'resultados',
            'find.none': 'Aún no hay resultados: ¡prueba otra combinación!',
            'find.seeAll': 'Ver todo en la Tienda →',

            'band.bubble': 'MÁS<br>QUE SIMPLES<br>JOYAS...',
            'band.f1': 'Piedras<br>Naturales', 'band.f2': 'Hecho a Mano<br>con Amor',
            'band.f3': 'Inspirado en<br>la Naturaleza', 'band.f4': 'Hecho para<br>tu Camino',
            'band.cat': 'Solo<br>Buena<br>Vibra',

            'also.title': 'También te Puede Gustar',

            'foot.headline': 'Joyería<br>Artesanal para<br>un Día más<br>Radiante.',
            'foot.cta': 'Ver la Colección',
            'foot.ctaHome': 'Volver al Inicio',

            'shop.eyebrow': 'Hecho a mano con amor',
            'shop.title': 'Ver la Colección',
            'shop.sub': 'Pequeñas dosis de alegría: colgantes, pulseras, anillos y más, cada uno hecho para sacarte una sonrisa.',

            'cart.title': 'Tu Carrito 🛍️',
            'cart.empty': 'Tu carrito está vacío',
            'cart.total': 'Total',
            'cart.loading': 'Cargando el pago...',
            'cart.fallback': 'Pagar con PayPal',
            'cart.note': '✦ Envío gratis en pedidos superiores a $75 ✦',
            'cart.quickAdd': 'Añadir',
            'order.title': '¡Gracias!',
            'order.body': 'Tu pedido se ha realizado con éxito.',
            'order.id': 'Nº de Pedido:',
            'order.email': 'PayPal te enviará un correo de confirmación.',
            'order.continue': 'Seguir Comprando',
            'toast.added': 'añadido',
        },
    };

    let lang = localStorage.getItem('umi_lang') || 'en';
    if (!I18N[lang]) lang = 'en';

    function t(key) {
        const table = I18N[lang] || I18N.en;
        return (key in table) ? table[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
    }

    // Translate all tagged elements in the DOM
    function apply() {
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            // Allow simple <br> markup from the dictionary
            if (val.indexOf('<') !== -1) el.innerHTML = val;
            else el.textContent = val;
        });

        // Attribute translations, e.g. data-i18n-attr="aria-label:nav.shop"
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            el.getAttribute('data-i18n-attr').split(',').forEach(pair => {
                const [attr, key] = pair.split(':').map(s => s.trim());
                if (attr && key) el.setAttribute(attr, t(key));
            });
        });

        // Update the toggle button label
        const btn = document.getElementById('langToggle');
        if (btn) {
            btn.textContent = t('lang.toggle');
            btn.setAttribute('aria-label', t('lang.label'));
        }

        // Let page scripts re-render dynamic content in the new language
        document.dispatchEvent(new CustomEvent('umi:langchange', { detail: { lang } }));
    }

    function setLang(next) {
        if (!I18N[next]) return;
        lang = next;
        localStorage.setItem('umi_lang', lang);
        apply();
    }
    function getLang() { return lang; }

    // Public API for other scripts
    window.UmiI18n = { t, getLang, setLang, apply };

    // Wire up the toggle + initial apply on load
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('langToggle');
        if (btn) btn.addEventListener('click', () => setLang(lang === 'en' ? 'es' : 'en'));
        apply();
    });
})();
