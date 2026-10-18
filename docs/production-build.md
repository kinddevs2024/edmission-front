# Production frontend build

Use the canonical tracked source with the active site's protected build environment. A source commit marker alone does not prove that an old server source directory matches the deployed assets.

1. Copy the active frontend `.env` to the isolated staging directory, preserving restrictive permissions. Never print or commit it.
2. Run `ADMISSION_BUILD_BASELINE_ENV=/absolute/path/to/active/.env npm run build:production` in staging. The preflight requires Google sign-in and checks every configured public Vite setting against the active baseline without exposing values.
3. Preserve production public assets and approved external runtime scripts. Keep the admissions workspace, weekly calendar and support history fixes in the same canonical source.
4. Before switching the HTML, check both login and registration: autumn campus background, desktop form on the left, translucent card, Google and Telegram buttons. Exercise the existing phone/email validation without creating production test accounts. Google account authentication itself requires an account owner's consent.

The restored autumn authentication design and JPEG are tracked in source; no binary patch or import-map override is required for this layout.
