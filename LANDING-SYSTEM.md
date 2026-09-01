# SUQ Media — Vertical Landing Page System

Reusable landing pages for paid (Meta) traffic, one per target industry.
Every page shares the same design system so it looks identical to
suqmedia.com. **Only the content changes between industries.**

## File layout

```
public/landing/landing.css     ← GLOBAL: design system + all components (shared)
public/landing/landing.js      ← GLOBAL: behavior + quote-form → CRM (shared)
mortgage-broker-apparel.html    ← INDUSTRY: content + meta only (the template)
```

- **Global files are shared.** Change the look or behavior once in
  `landing.css` / `landing.js` and every industry page updates.
- **Industry files hold content only.** They load the two global files and
  contain the nav, footer, section copy, images and meta tags.

## Add a new industry page

1. **Copy** `mortgage-broker-apparel.html` → e.g. `dental-clinic-uniforms.html`
   (flat file at the repo root, matching the site's `contact.html` pattern.
   URL becomes `suqmedia.com/dental-clinic-uniforms.html`).
2. Edit only the blocks marked **`INDUSTRY CONTENT`**:
   - `<title>` + `<meta name="description">` + `og:` tags
   - Hero: eyebrow, headline, sub, trust badges, marquee
   - Section 1 — Why It Matters (benefit cards)
   - Section 2 — Apparel Solutions (product set)
   - Section 4 — Portfolio labels + images
   - Social proof — testimonials
   - Section 6 — FAQ wording
   - Section 8 — Final CTA
   - Hero image: the `--lp-hero-image` inline var on `.lp-hero-bg`
3. Update the **`SUQ_QUOTE`** config block at the bottom (see below).
4. Leave the nav, footer, process steps, buttons, layout and `landing.css` /
   `landing.js` untouched — that's what keeps every page on-brand.

Sections marked **GLOBAL** (Why SUQ Media, Process, form structure) can stay
as-is; only tweak their tone if needed.

## Wiring the quote form to the CRM

Each page defines `window.SUQ_QUOTE` before `landing.js` loads. Until it holds
a real `formId`, the form runs in **preview mode** — it shows the success
state but does not send (a console warning notes this).

To go live, create a **LeadRescue / Growtheon** quote form with these fields
(Company, Contact Name, Email, Phone, Staff Quantity, Apparel Needed, Logo,
Notes — **the Logo field must be a File Upload**), then fill in the real
`formId` and each field's key:

```js
window.SUQ_QUOTE = {
  endpoint: 'https://auth.growtheon.co/functions/v1/handle-form-submission',
  key: 'sb_publishable_enLE5YM6C8teak0PBuPBHA_yxTm1MXO',
  formId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  industry: 'Mortgage Brokerage',
  industryField: '',      // optional LeadRescue key for an "Industry" field
  fields: {
    company: 'company-field_...',
    name:    'full-name-field_...',
    email:   'email-field_...',
    phone:   'phone-field_...',
    staff:   'select-field_...',
    apparel: 'select-field_...',
    logo:    'file-field_...',      // must be a File Upload field in LeadRescue
    notes:   'textarea-field_...'
  }
};
```

Field keys come from the LeadRescue form's embed (inspect its inputs, same as
the newsletter form). **The logo file-upload mechanism must be verified against
the real form** — `landing.js` currently sends the file as a base64 data URL;
if LeadRescue expects a signed upload URL or multipart instead, adjust
`readFile()` / the payload in `landing.js` to match.

One quote form can serve all industries (use the `industry` value to segment
in the CRM), or create one form per industry — your call.

## Images

The page ships with **clean dark/gradient placeholders — no mismatched
photos.** Two niche stock slots do the heavy lifting and are the priority
before ad spend (real, industry-specific photography is the single biggest
lever on conversion). Each is a one-line swap.

### Image slots (per industry)

| Slot | File | How it's wired | What to source |
|------|------|----------------|----------------|
| **Hero** | `public/images/lp-<industry>-hero.jpg` | `<img>` inside `.lp-hero-figure` (edit `src`) | Confident professional / office team, business attire; right-weighted, works beside left copy. |
| **Scene band** | `public/images/lp-<industry>-scene.jpg` | `<img>` inside `.scene-figure` (edit `src`) | A professional team in a modern office / at a table; approachable, "successful business" energy. |
| **Final-CTA bg** | `public/images/lp-<industry>-cta.jpg` | CSS var on `.final-bg`: `style="--lp-final-image:url('../images/…')"` (path relative to `landing.css`) | An office / professional scene that reads well heavily darkened. |
| Products (×4) | garment shots | `<img>` in each `.product-media` (replaces the `.product-ph` placeholder) | Clean polo / quarter-zip / dress-shirt / softshell — **ideally your own product photos**; a matched corporate set is scarce on free stock. |

Hero & scene use plain `<img>` tags (path relative to the HTML file, i.e.
`public/images/…`). Only the final-CTA background uses a CSS var (path relative
to `landing.css`, i.e. `../images/…`).

**Mortgage page images (sourced):** hero, scene and CTA are free Unsplash
photos by Vitaly Gariev (Unsplash license — free for commercial use, no
attribution required). Product cards still use placeholders pending real shots.

**Sourcing new industries:** Unsplash (free, commercial-OK) has strong
"professional office team / business meeting" results; Adobe Stock or iStock if
a paid license is preferred. Keep faces genuine and business-casual, and use
the same shot *type* across industries so every page feels like one system.

## Pages built

- **`mortgage-broker-apparel.html`** — mortgage brokerages. Quote form uses the
  `window.SUQ_QUOTE` config (preview mode until a LeadRescue form is wired).
- **`hospitality-apparel.html`** — restaurants / hotels / bars / hospitality,
  for Meta ad traffic. Short, conversion-first (hero → value → range → pain →
  form). Its quote form reuses the **live Custom Apparel backend directly**
  (Growtheon form `ffc5bbd9-9fec-4991-bf36-ace1b741fa87`, same field keys as
  `custom-apparel.html`) — so submissions land in the existing CRM, no wiring
  needed. Meta-Pixel hooks are in place (`.cta-quote` → CTAClick, first field
  focus → FormStart, success → `Lead`); paste the Pixel base code in `<head>`.
  Two photo slots (`hospitality-hero.jpg` hero background, `hospitality-team.jpg`
  value section) await real hospitality photography — placeholders until then.

- **`crew-hoodies.html`** — custom **printed** crew hoodies for construction,
  trades and automotive businesses (Meta ad traffic). Bold/industrial tone,
  short conversion flow (hero → industry → offer → showcase → 3-step → form →
  final CTA). **Printed apparel only — no embroidery mentioned; no pricing /
  turnaround / shipping claims.** Its quote form is **purpose-built** (not the
  apparel backend): fields are Name, Company, Email, Phone, Industry, Approx.
  Hoodies, Preferred Colour, Logo Upload (file), Additional Info. Its quote
  form is **wired + verified live** via the self-contained `CREW_FORM` config
  (Growtheon form `1df0e449-9c15-4b5b-8929-ad16264122d9`). Selects submit
  option values (`option1`…); the logo is sent as a base64 data URL when ≤4MB,
  else its filename is noted in the message so the lead still submits. A
  successful submit **redirects to `crew-hoodies-thank-you.html`** (noindex),
  which fires the Meta Pixel `PageView` + `Lead` — the clean conversion URL.
  Meta Pixel `859951363749640` is installed on both pages; on the form page
  `.cta-quote` → CTAClick and first field focus → FormStart. Honeypot hits get
  a silent inline success and never reach the thank-you page. Real branded-crew
  photography is in (`crew-hero`, `crew-construction`, `crew-automotive`,
  `crew-print`).

## Planned industries

`/mortgage-broker-apparel` (built) · dental-clinic-uniforms ·
accounting-firm-apparel · law-firm-apparel · insurance-broker-apparel ·
financial-advisor-apparel · real-estate-team-apparel ·
construction-company-apparel · home-builder-apparel ·
automotive-dealership-apparel
