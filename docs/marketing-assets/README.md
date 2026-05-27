# Marketing Assets — Print Source Files

This folder holds the HTML source for FamilyBridge's printable marketing
materials. They render to print-ready PDFs via WeasyPrint and are designed
for `8.5"x11"` letter (2-pager) and `11"x8.5"` letter landscape (trifold).

## Files

- **`trifold-brochure.html`** — 3-panel C-fold (letter-fold) brochure,
  11"x8.5" landscape. Outside = inside-flap + back-cover + front-cover.
  Inside = three content panels covering the layered system + outcomes.
- **`provider-2pager.html`** — 8.5"x11" portrait two-page sheet covering
  what FamilyBridge is, six modules at a glance, how it works, outcomes,
  doctrine disclaimer, and a CTA with QR + contact.

## Rendering to print-ready PDF

```bash
# Vector PDF from source
weasyprint trifold-brochure.html /tmp/trifold.pdf
weasyprint provider-2pager.html  /tmp/provider.pdf

# Rasterize to 600 DPI PNG (what Office Depot and other web preflight
# tools actually check — vector PDFs sometimes trip "low resolution"
# false positives in their heuristics).
pdftoppm -r 600 -png /tmp/trifold.pdf  /tmp/tri_600
pdftoppm -r 600 -png /tmp/provider.pdf /tmp/prov_600

# Re-bundle into a PDF with explicit 600 DPI metadata
img2pdf /tmp/tri_600-1.png /tmp/tri_600-2.png \
  --pagesize 11inx8.5in \
  --imgsize 11inx8.5in \
  -o /root/FamilyBridge-Trifold-Brochure-PrintReady.pdf
```

For the trifold with **0.125" bleed** (professional print-shop spec), use
`pypdf` to add `TrimBox` and `BleedBox` to a slightly larger page. See the
script lineage in chat — paths produce
`FamilyBridge-Trifold-Brochure-PrintReady-Bleed.pdf` at 11.25" × 8.75"
media with an 11" × 8.5" trim box.

## Brand tokens

- Sage: `#436B5A` (primary)
- Sage deep: `#2F4D40`
- Sage light: `#6B8F7C`
- Teal: `#4AA09B` (accent)
- Cream: `#FAF7F2` (background)
- Cream warm: `#F3ECDF`
- Ink: `#2A2E33`
- Muted: `#6B7280`
- Line: `#E5DFD2`

## Key content principles

- **FIIS™ = Family Intervention Intelligence System.** Always spelled out
  on first use, abbreviated thereafter.
- **No outcome claims with fake numbers.** Use "Outcomes you can measure"
  framing — list what's tracked, never invent stats.
- **911 first** disclaimer is required on any provider-facing material:
  not a clinician, not a lawyer, not an emergency responder.
- Phone: `503-836-2136` · Web: `familybridgeapp.com` ·
  Provider URL: `familybridgeapp.com/for-providers`

## Versions in repo history

- v1: original 4-page provider sheet (now superseded; lived in chat only)
- v2: consolidated 2-pager with QR on contact card
- **v3 (current):** added "Outcomes you can measure" block to both pieces

Bump the file when you re-export to track which rendered PDF maps to which
HTML source. Render commands are in `~/builds/FamilyBridgeApp/`'s git
history (commits touching `/root/FamilyBridge-*.pdf` filenames).
