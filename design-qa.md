# Student dashboard design QA

## Scope

- Student Home/Dashboard academic certificate, progress, level badge, ranking trigger and ranking sheet.
- Student Profile certificate summary and completion-oriented section cards.
- Populated desktop dashboard, mobile ranking sheet, and mobile certificate editor states.

## Evidence

- Certificate reference: `C:\Users\MyPc\Downloads\Clearing_text_from_certificate_t…_202608281831.jpeg` — 2752 × 1536 px.
- Ranking trigger reference: `C:\Users\MyPc\AppData\Local\Temp\codex-clipboard-fb1610fd-04c7-4ecc-8981-74c94db1e2f5.png` — 283 × 100 px.
- Desktop viewport: `design-qa/student-dashboard-desktop-viewport.png` — 1270 × 714 px, CSS viewport 1280 × 720, device pixel ratio 1.5.
- Mobile ranking: `design-qa/student-ranking-mobile.png` — 380 × 822 px.
- Mobile editor: `design-qa/certificate-editor-mobile.png` — 380 × 822 px.
- Combined reference/implementation review: `design-qa/reference-implementation-comparison.png`.

## Review

- The certificate preserves the formal framed composition of the reference while using Edmission navy, lime, ivory, brand mark, real profile fields, and readable completion status.
- The ranking trigger preserves the compact avatar cluster and trophy affordance, with a clearer Edmission label and 44 px minimum target.
- Typography, borders, radii, spacing, and colors follow the existing Edmission component tokens and stay consistent across dashboard and profile.
- Desktop hierarchy keeps the certificate as the primary action; supporting level and discovery cards remain secondary.
- Mobile certificate, editor, ranking filters, current-user state, and sticky “Find my position” action fit without horizontal overflow.
- The first mobile ranking review found dense metadata and a cramped badge. The row grid was revised to move the level badge to a second line, hide grant detail at the narrow breakpoint, and preserve the current-user focus target. The post-fix screenshot is the evidence above.
- Primary interactions tested: open ranking, change filter state, find current position, open certificate field editor, and close modal/sheet.
- Browser console contained no application errors. Existing React Router future-flag and Google Identity initialization warnings were non-blocking and unrelated to this redesign.

## Findings

- P0: none.
- P1: none.
- P2: none after the mobile ranking density fix.
- P3: consider translating the new English microcopy in a separate localization pass.

final result: passed
