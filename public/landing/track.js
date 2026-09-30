/* ============================================================
   SUQ MEDIA — CONVERSION EVENT TRACKING (Phase 3)

   Pushes clean, non-PII custom events to window.dataLayer so
   Google Tag Manager (GTM-WHFVKFBN) can build GA4 conversions.

   This file NEVER creates a GA4/GTM/Pixel ID and NEVER sends a
   hit directly to GA4 — it only pushes to window.dataLayer. GTM
   owns the tags.

   Events emitted:
     • generate_lead      — a form was confirmed successfully sent
     • phone_click        — a tel:+14034521559 link was clicked
     • quote_cta_click    — a styled quote / project-start CTA was clicked
     • contact_cta_click  — a styled contact CTA was clicked

   Included on every page, once, high in <head> (after the GTM
   snippet, so window.dataLayer already exists).

   Public API for page/form scripts:
     window.suqTrack(event, params)   generic dataLayer push
     window.suqLead(formName, leadType)
        Call ONCE at a form's confirmed-success point
        (after `res.ok && result.success`). Never on submit
        click, validation failure, honeypot, preview, or error.
   ============================================================ */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  function push(obj) {
    try { window.dataLayer.push(obj); } catch (e) { /* no-op */ }
  }

  // Path only (no query string) so no stray URL parameters can carry PII.
  function pagePath() { return location.pathname; }
  function pageTitle() { return document.title; }

  var PHONE_NUMBER = '+14034521559';

  /* ── Generic push ───────────────────────────────────────── */
  window.suqTrack = function (event, params) {
    if (!event) return;
    var payload = { event: event };
    if (params) {
      for (var k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k)) payload[k] = params[k];
      }
    }
    push(payload);
  };

  /* ── generate_lead ──────────────────────────────────────────
     Called by a form ONLY after a confirmed successful response,
     or once on a dedicated thank-you page (see data attributes).  */
  function fireLead(formName, leadType) {
    window.suqTrack('generate_lead', {
      form_name: formName || 'Unknown',
      lead_type: leadType || 'inquiry',
      page_path: pagePath(),
      page_title: pageTitle()
    });
  }
  window.suqLead = fireLead;

  /* ── newsletter_signup ──────────────────────────────────────
     A secondary engagement event, NOT a sales lead. Call ONCE at
     a newsletter form's confirmed-success point. Never generate_lead. */
  window.suqNewsletter = function (formName) {
    window.suqTrack('newsletter_signup', {
      form_name: formName || 'Newsletter',
      page_path: pagePath(),
      page_title: pageTitle()
    });
  };

  /* ── One-time conversion redirect flag ──────────────────────
     A form calls this ONCE, immediately before redirecting to its
     thank-you page, ONLY after a genuinely successful response.
     The thank-you page consumes the flag once (see below), so a
     refresh or a direct visit fires nothing. */
  var CONVERSION_FLAG = 'suq_conversion';
  window.suqMarkConversion = function () {
    try { sessionStorage.setItem(CONVERSION_FLAG, '1'); } catch (e) { /* no-op */ }
  };

  /* ── CTA / phone location inference ─────────────────────── */
  function locationOf(el) {
    var explicit = el.getAttribute('data-cta-location');
    if (explicit) return explicit;
    if (el.closest('.sticky-cta')) return 'sticky';
    if (el.closest('header, nav, #navbar, .navbar, .dropdown-menu, .nav-dropdown, .mobile-menu, .mobile-dropdown')) return 'nav';
    if (el.closest('footer')) return 'footer';
    if (el.closest('[id$="-hero"], #lp-hero, .hero, .ca-hero-content, .lp-hero-content')) return 'hero';
    if (el.closest('#final, .final, .final-bg, #lp-final')) return 'final';
    if (el.closest('form')) return 'form';
    return 'body';
  }

  function ctaText(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  // Quote form targets: custom-apparel intake, and the on-page #intake / #quote anchors.
  var QUOTE_RE = /(^|\/)custom-apparel\.html#intake$/;
  function isQuoteHref(href) {
    return href === '#intake' || href === '#quote' || QUOTE_RE.test(href);
  }
  // Contact targets: contact page, and on-page #contact / #contact-form anchors.
  var CONTACT_RE = /(^|\/)contact\.html($|[#?])/;
  function isContactHref(href) {
    return href === '#contact' || href === '#contact-form' || CONTACT_RE.test(href);
  }

  /* ── Single delegated click listener (no duplicate listeners) ── */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';

    // Phone: any tel: link, wherever it sits on the page.
    if (href.indexOf('tel:') === 0) {
      window.suqTrack('phone_click', {
        page_path: pagePath(),
        link_location: locationOf(a),
        phone_number: PHONE_NUMBER
      });
      return;
    }

    // CTAs must be styled conversion buttons (.btn/.opt-cta) or an element
    // explicitly marked as a conversion CTA (data-cta-location, e.g. the
    // styled "Get a Quote" buttons in the desktop/mobile headers).
    // Plain nav/footer/dropdown/menu links are excluded.
    if (!(a.classList.contains('btn') || a.classList.contains('opt-cta') || a.hasAttribute('data-cta-location'))) return;

    if (isQuoteHref(href)) {
      window.suqTrack('quote_cta_click', {
        page_path: pagePath(),
        cta_text: ctaText(a),
        cta_location: locationOf(a),
        destination: href
      });
    } else if (isContactHref(href)) {
      window.suqTrack('contact_cta_click', {
        page_path: pagePath(),
        cta_text: ctaText(a),
        cta_location: locationOf(a),
        destination: href
      });
    }
  }, false);

  /* ── Thank-you / confirmation pages ─────────────────────────
     There is deliberately NO unconditional page-load event. A thank-you
     page declares its conversion with body attributes:
       data-ty-event="generate_lead"  data-ty-name="Custom Apparel"  data-ty-type="apparel"
       data-ty-event="newsletter_signup"  data-ty-name="Newsletter (Home)"
     The event fires ONCE, and only when the one-time flag set by the form
     (window.suqMarkConversion, just before its post-success redirect) is
     present. The flag is consumed immediately, so a refresh, a direct visit,
     or a new session fires nothing. */
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }
  onReady(function () {
    var b = document.body;
    if (!b) return;
    var ev = b.getAttribute('data-ty-event');
    if (!ev) return;
    var confirmed = false;
    try {
      confirmed = !!sessionStorage.getItem(CONVERSION_FLAG);
      if (confirmed) sessionStorage.removeItem(CONVERSION_FLAG);
    } catch (e) { confirmed = false; }
    if (!confirmed) return;
    if (ev === 'generate_lead') {
      fireLead(b.getAttribute('data-ty-name'), b.getAttribute('data-ty-type'));
    } else if (ev === 'newsletter_signup') {
      window.suqNewsletter(b.getAttribute('data-ty-name'));
    }
  });
})();
