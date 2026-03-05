# Edmission SEO Checklist

This checklist is designed for the current frontend setup (Vite SPA).

## 1) Before deployment

- [ ] Confirm production domain is correct (`https://edmission.uz`).
- [ ] Ensure `index.html` contains:
  - [ ] canonical URL
  - [ ] meta description/title
  - [ ] Open Graph tags
  - [ ] Twitter tags
  - [ ] hreflang alternates
  - [ ] JSON-LD structured data
- [ ] Confirm `public/robots.txt` exists and is served.
- [ ] Confirm `public/sitemap.xml` exists and is served.
- [ ] Confirm OG image exists (`/og-image.svg`).
- [ ] Build succeeds (`npm run build`).

## 2) After deployment quick checks

- [ ] Open `https://edmission.uz/robots.txt` (must return 200).
- [ ] Open `https://edmission.uz/sitemap.xml` (must return 200).
- [ ] Open `https://edmission.uz/og-image.svg` (must return 200).
- [ ] Open home page and inspect `<head>` in browser devtools.
- [ ] Validate that social preview works with URL unfurl tools.

## 3) Google Search Console

- [ ] Add property for `https://edmission.uz`.
- [ ] Verify ownership (DNS TXT recommended).
- [ ] Submit sitemap:
  - `https://edmission.uz/sitemap.xml`
- [ ] Use URL Inspection:
  - [ ] Request indexing for `/`
  - [ ] Request indexing for `/privacy`
  - [ ] Request indexing for `/login` and `/register` if desired
- [ ] Check Coverage report for blocked/noindex issues.
- [ ] Check Core Web Vitals and Mobile Usability.

## 4) Yandex Webmaster

- [ ] Add site in Yandex Webmaster.
- [ ] Verify ownership (meta tag or DNS).
- [ ] Submit sitemap:
  - `https://edmission.uz/sitemap.xml`
- [ ] Check indexing diagnostics and crawl errors.
- [ ] Check regional targeting settings if needed.

## 5) Optional improvements (recommended)

- [ ] Add a raster OG image (`/og-image.jpg` 1200x630) for broader social compatibility.
- [ ] Add server-side rendered metadata per route (SSR/Prerender) for deeper SEO.
- [ ] Extend sitemap with additional public URLs.
- [ ] Add breadcrumb structured data where relevant.
- [ ] Monitor branded and non-branded search queries monthly.

## 6) Re-index trigger after major updates

- [ ] Update `sitemap.xml` `lastmod` values (if using dynamic generation in future).
- [ ] Re-submit sitemap in GSC and Yandex.
- [ ] Re-run URL inspection for updated key pages.
