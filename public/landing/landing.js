/* ============================================================
   SUQ MEDIA — VERTICAL LANDING PAGE SYSTEM
   Shared behavior for every industry landing page:
   year stamp, navbar scroll, mobile menu, scroll reveal,
   file-upload label, and the quote form → CRM submission.

   Each industry page defines window.SUQ_QUOTE (endpoint, key,
   formId, field-key map, and an `industry` label) BEFORE this
   script loads. See LANDING-SYSTEM.md.
   ============================================================ */
(function () {
  'use strict';

  /* ── Year ── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Navbar scroll ── */
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ── Hamburger / mobile menu ── */
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      hamburgerBtn.setAttribute('aria-expanded', open);
      hamburgerBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.querySelectorAll('.mobile-link').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  /* ── Scroll reveal ── */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ── File-upload: show chosen filename ── */
  var fileInput = document.getElementById('q-logo');
  var fileName = document.getElementById('q-logo-name');
  if (fileInput && fileName) {
    fileInput.addEventListener('change', function () {
      fileName.textContent = fileInput.files && fileInput.files.length
        ? fileInput.files[0].name
        : 'PNG, JPG, PDF, AI, SVG — up to 10MB';
    });
  }

  /* ── Quote form → CRM (LeadRescue / Growtheon) ── */
  var form = document.getElementById('quoteForm');
  if (!form) return;

  var cfg = window.SUQ_QUOTE || {};
  var configured = cfg.formId && cfg.formId.indexOf('REPLACE') === -1;
  var startTime = Date.now();

  function showSuccess() {
    form.style.display = 'none';
    var trust = document.querySelector('#quoteForm + .cf-trust');
    if (trust) trust.style.display = 'none';
    var ok = document.getElementById('quoteSuccess');
    if (ok) { ok.style.display = 'block'; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }

  // Read a file as a base64 data string (mechanism verified against the
  // real LeadRescue form once it exists; see LANDING-SYSTEM.md).
  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    // Honeypot: bots fill the hidden field; humans don't
    if (form.website && form.website.value) { showSuccess(); return; }

    var errEl = document.getElementById('quoteError');
    if (errEl) errEl.style.display = 'none';
    var btn = form.querySelector('button[type="submit"]');
    var originalLabel = btn ? btn.textContent : '';

    // PREVIEW MODE — form UI is complete but not yet wired to a live CRM
    // form. Fill window.SUQ_QUOTE with a real formId + field keys to send.
    if (!configured) {
      console.warn('[SUQ_QUOTE] Quote form is in preview mode — set window.SUQ_QUOTE.formId and field keys to enable live submissions.');
      showSuccess();
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    try {
      var f = cfg.fields || {};
      var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var data = {};
      data[f.company] = val('q-company');
      data[f.name]    = val('q-name');
      data[f.email]   = val('q-email');
      data[f.phone]   = val('q-phone');
      data[f.staff]   = val('q-staff');
      data[f.apparel] = val('q-apparel');
      data[f.notes]   = val('q-notes');
      if (cfg.industryField && cfg.industry) data[cfg.industryField] = cfg.industry;

      // Logo upload (required field)
      var logoEl = document.getElementById('q-logo');
      if (f.logo && logoEl && logoEl.files && logoEl.files.length) {
        data[f.logo] = await readFile(logoEl.files[0]);
      }

      var payload = {
        formId: cfg.formId,
        data: data,
        deviceType: window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop',
        pageUrl: location.href,
        referrer: document.referrer,
        completionTimeSeconds: Math.round((Date.now() - startTime) / 1000)
      };

      var res = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'authorization': 'Bearer ' + cfg.key,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      var result = await res.json().catch(function () { return {}; });
      if (!(res.ok && result.success)) throw new Error(result.message || 'Submission failed');
      showSuccess();
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = originalLabel; }
      if (errEl) {
        errEl.textContent = "Sorry, we couldn't send your request just now. Please try again, or email info@suqmedia.com.";
        errEl.style.display = 'block';
      }
    }
  });
})();
