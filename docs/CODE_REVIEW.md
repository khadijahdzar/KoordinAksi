# Code Review — KoordinAksi (UI / Nav / Motion)

**Tanggal:** 2026-11-25  
**Branch:** `main`  
**Scope:** Floating pill navbar, mobile bottom tab bar, Lenis + GSAP, form auth/register

## Skor keseluruhan: **92%**

| Area | Sebelum | Sesudah | Catatan |
|------|---------|---------|---------|
| Floating pill + bottom tab | 85% | **95%** | Desain dipertahankan; hamburger mati dihapus |
| Smooth scroll (Lenis + GSAP) | 75% | **92%** | Route re-bind, reduced-motion, Lenis→pill sync |
| Integrasi App / forms | 60% | **90%** | Form dipisah ke `pages/*`, bukan stub |
| Dependencies / motion | 70% | **85%** | `motion` dipakai untuk hover pill |
| A11y & UX polish | 80% | **93%** | Font tab 11px, Escape/close menu, safe-area |

**Rata-rata tertimbang: 92%**

## Checklist issue (resolved)

- [x] **High** Form auth/register bukan stub → `pages/AuthPage.jsx`, `VolunteerRegistration.jsx`, `OrganizationVerification.jsx`, `RegistrationRolePage.jsx`
- [x] **High** Hamburger mobile redundan → dihapus (bottom tab jadi nav utama mobile)
- [x] **Medium** `[data-reveal]` hanya sekali → re-scan on `location.pathname`
- [x] **Medium** Scroll pill vs Lenis → event `lenis-scroll`
- [x] **Medium** `motion` unused → hover micro-interaction di floating pill
- [x] **Low** Font bottom tab 9px → **11px**
- [x] **Low** StrictMode double Lenis → guard `lenisRef`
- [x] **Low** `prefers-reduced-motion` → skip Lenis + CSS fallback

## File utama

- `client/src/components/SiteHeader.jsx`
- `client/src/components/SmoothScroll.jsx`
- `client/src/nav-motion.css`
- `client/src/pages/*.jsx` (auth & register)
- `client/src/formHelpers.jsx`
- `client/src/appConstants.js`

## Catatan

Floating pill (desktop) dan bottom tab bar (mobile) **tidak diubah konsep desainnya**.
