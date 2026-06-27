/* ══════════════════════════════════════════════════════════════
   MESH MAKEUP STUDIO — Scripts
   ══════════════════════════════════════════════════════════════ */
'use strict';

/* ╔══════════════════════════════════════════════════════════╗
   ║  CONFIGURATION  —  ⚠️  À PERSONNALISER                     ║
   ║  Remplace les valeurs ci-dessous par les vraies infos.    ║
   ╚══════════════════════════════════════════════════════════╝ */
const CONFIG = {
  // Numéro WhatsApp au format international SANS "+", espaces ni "0" initial.
  // Ex. France 06 12 34 56 78  ->  "33612345678"
  whatsappNumber: '33646925489',

  // Email de contact (utilisé par le bouton de secours du formulaire)
  email: 'meshmakeupstudio@gmail.com',
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  [applyWhatsappLinks, initHeaderScroll, initMobileNav, initReveal, initPortfolio,
   initLightbox, initCarousel, initContactForm, initNewsletter, setDynamicYear].forEach(safe);
});


/* ─── ROBUSTESSE ─────────────────────────────────────────────── */
/* Exécute une init en isolant ses erreurs (une qui plante n'empêche pas les autres) */
function safe(fn) {
  try { fn(); } catch (e) { console.error('[MESH] init échouée :', (fn && fn.name) || fn, e); }
}

/* Ne jamais laisser de contenu invisible */
function revealAll() {
  document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
}
// Si une erreur JS imprévue survient, on révèle tout (le site reste lisible)
window.addEventListener('error', revealAll);
// Après chargement, on révèle les éléments déjà à l'écran qu'un observer aurait manqués
window.addEventListener('load', () => setTimeout(() => {
  document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
  });
}, 1000));

/* Swipe tactile horizontal (mobile) */
function addSwipe(el, onLeft, onRight) {
  if (!el) return;
  let x0 = null, y0 = null;
  el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? onLeft : onRight)();
    x0 = y0 = null;
  }, { passive: true });
}


/* ─── LIENS WHATSAPP : une seule source (CONFIG) ─────────────── */
function applyWhatsappLinks() {
  document.querySelectorAll('a.js-whatsapp').forEach(a => {
    a.href = `https://wa.me/${CONFIG.whatsappNumber}`;
  });
}


/* ─── HEADER : opacité au scroll ─────────────────────────────── */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}


/* ─── NAV MOBILE ─────────────────────────────────────────────── */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;

  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    document.body.style.overflow = '';
  };
  const open = () => {
    toggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  toggle.addEventListener('click', () => {
    toggle.getAttribute('aria-expanded') === 'true' ? close() : open();
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}


/* ─── RÉVÉLATION AU SCROLL ───────────────────────────────────── */
function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  // Délai en cascade pour les éléments d'un même groupe
  items.forEach(el => {
    const i = el.dataset.revealOrder;
    if (i) el.style.setProperty('--reveal-delay', `${Number(i) * 0.09}s`);
    io.observe(el);
  });
}


/* ─── PORTFOLIO : filtres ────────────────────────────────────── */
function initPortfolio() {
  const filters = document.querySelectorAll('.filter');
  const items = document.querySelectorAll('.gallery-item');
  if (!filters.length || !items.length) return;

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      const cat = btn.dataset.filter;
      items.forEach(item => {
        const show = cat === 'all' || item.dataset.category === cat;
        item.classList.toggle('is-hidden', !show);
      });
    });
  });
}


/* ─── LIGHTBOX (portfolio) ───────────────────────────────────── */
function initLightbox() {
  const triggers = Array.from(document.querySelectorAll('.gallery-item'));
  const box = document.querySelector('.lightbox');
  if (!triggers.length || !box) return;

  const imgEl = box.querySelector('.lightbox-figure img');
  const capEl = box.querySelector('.lightbox-cap');
  const btnClose = box.querySelector('.lightbox-close');
  const btnPrev = box.querySelector('.lightbox-prev');
  const btnNext = box.querySelector('.lightbox-next');
  let current = 0;
  let lastFocus = null;

  const visibleItems = () => triggers.filter(t => !t.classList.contains('is-hidden'));

  const render = () => {
    const items = visibleItems();
    const item = items[current];
    if (!item) return;
    const img = item.querySelector('img');
    imgEl.src = img.dataset.full || img.src;
    imgEl.alt = img.alt;
    capEl.textContent = item.dataset.caption || img.alt || '';
  };

  const openAt = (item) => {
    const items = visibleItems();
    current = Math.max(0, items.indexOf(item));
    render();
    lastFocus = document.activeElement;
    box.classList.add('open');
    box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  };
  const close = () => {
    box.classList.remove('open');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  const step = (dir) => {
    const items = visibleItems();
    current = (current + dir + items.length) % items.length;
    render();
  };

  triggers.forEach(item => item.addEventListener('click', () => openAt(item)));
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => step(-1));
  btnNext.addEventListener('click', () => step(1));
  addSwipe(box, () => step(1), () => step(-1));
  box.addEventListener('click', e => { if (e.target === box) close(); });
  document.addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
}


/* ─── CAROUSEL (avis) ────────────────────────────────────────── */
function initCarousel() {
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const prev = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  const dotsWrap = carousel.querySelector('.carousel-dots');
  if (slides.length <= 1) { if (prev) prev.style.display = 'none'; if (next) next.style.display = 'none'; return; }

  let index = 0;
  let timer = null;

  const dots = slides.map((_, i) => {
    const d = document.createElement('button');
    d.className = 'carousel-dot';
    d.type = 'button';
    d.setAttribute('aria-label', `Avis ${i + 1}`);
    d.addEventListener('click', () => { go(i); restart(); });
    dotsWrap.appendChild(d);
    return d;
  });

  const go = (i) => {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, n) => d.setAttribute('aria-current', n === index ? 'true' : 'false'));
  };
  const restart = () => {
    if (prefersReducedMotion) return;
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), 6000);
  };

  prev.addEventListener('click', () => { go(index - 1); restart(); });
  next.addEventListener('click', () => { go(index + 1); restart(); });
  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', restart);
  addSwipe(carousel.querySelector('.carousel-viewport'),
    () => { go(index + 1); restart(); },
    () => { go(index - 1); restart(); });

  go(0);
  restart();
}


/* ─── FORMULAIRE CONTACT → WHATSAPP ──────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const feedback = form.querySelector('.form-feedback');

  const setError = (field, msg) => {
    const group = field.closest('.field');
    if (!group) return;
    group.classList.toggle('has-error', !!msg);
    const err = group.querySelector('.field-error');
    if (err) err.textContent = msg || '';
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };

  const validate = () => {
    let ok = true;
    let firstInvalid = null;

    const nom = form.nom;
    const email = form.email;
    const message = form.message;
    const consent = form.consent;

    if (!nom.value.trim()) { setError(nom, 'Merci d’indiquer votre nom.'); ok = false; firstInvalid ||= nom; }
    else setError(nom, '');

    // Email facultatif : on ne vérifie le format que s'il est renseigné
    const emailVal = email.value.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailVal && !emailRe.test(emailVal)) { setError(email, 'Adresse email invalide.'); ok = false; firstInvalid ||= email; }
    else setError(email, '');

    if (message.value.trim().length < 10) { setError(message, 'Décrivez votre projet en quelques mots.'); ok = false; firstInvalid ||= message; }
    else setError(message, '');

    if (consent && !consent.checked) {
      const group = consent.closest('.form-consent');
      if (group) group.classList.add('has-error');
      ok = false; firstInvalid ||= consent;
    } else if (consent) {
      const group = consent.closest('.form-consent');
      if (group) group.classList.remove('has-error');
    }

    if (firstInvalid) firstInvalid.focus();
    return ok;
  };

  // Construit le message WhatsApp à partir des champs (valeurs encodées)
  const buildMessage = () => {
    const get = (name) => (form[name] && form[name].value.trim()) || '—';
    const lines = [
      '✨ Nouvelle demande — MESH Makeup Studio',
      '',
      `• Nom : ${get('nom')}`,
      `• Email : ${get('email')}`,
      `• Téléphone : ${get('telephone')}`,
      `• Prestation : ${get('service')}`,
      `• Date souhaitée : ${get('date')}`,
      `• Prête au plus tard à : ${get('heure_prete')}`,
      '',
      `Message :`,
      get('message'),
    ];
    return lines.join('\n');
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      feedback.textContent = 'Merci de corriger les champs indiqués.';
      feedback.className = 'form-feedback err';
      return;
    }

    const text = encodeURIComponent(buildMessage());
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${text}`;

    feedback.textContent = 'Ouverture de WhatsApp… Envoyez le message pré-rempli pour finaliser.';
    feedback.className = 'form-feedback ok';

    // Ouvre WhatsApp (nouvel onglet / app). noopener pour la sécurité.
    const win = window.open(url, '_blank', 'noopener');
    if (!win) window.location.href = url; // si la pop-up est bloquée

    form.reset();
    form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
  });
}


/* ─── NEWSLETTER (front uniquement, retour visuel) ──────────────
   ⚠️ Non connectée : à brancher à un service (Mailchimp, Brevo…)
   ou à supprimer si inutile.                                      */
function initNewsletter() {
  document.querySelectorAll('.news-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const original = btn.textContent;
      btn.textContent = '✓ Merci !';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = original; btn.disabled = false; form.reset(); }, 3000);
    });
  });
}


/* ─── ANNÉE DYNAMIQUE ────────────────────────────────────────── */
function setDynamicYear() {
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
}
