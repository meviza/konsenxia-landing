# KONSENXIA — EN content index

Machine-readable JSON pages for the konsenxia.com multi-page landing site.

```
konsenxia/
  nav.json                 — navigation labels + CTAs (design language: clinical-noir-teal)
  footer.json               — footer columns (Product, Company, Legal, Community), social links
  github.json               — org/repo/url placeholders, star/watch/fork CTAs
  pages/
    home.json               — hero, problem, solution (4 commitments), trust, dual CTA
    platform.json           — architecture layers, 8 feature modules, operating model
    metrics.json            — qualitative/architecture metric objects + investor narrative
    community.json          — GitHub CTAs, good first issues, code of conduct tone
    open-source.json        — MIT/Apache dual-license table, open vs private boundary, commercial CTA
    company.json            — corporate profile, press/investor/developer bullets, contact channels
    contact.json            — demo/pilot/investor/partner intro (form fields live in app)
    privacy.json            — privacy policy with KVKK / GDPR rights
    terms.json              — terms of use
    cookies.json            — cookie policy
    security.json           — responsible disclosure + clinical-content boundaries
    licenses.json           — license overview page
```

Rules: every number → methodology + source + date + status (`../METRICS_POLICY.md`). Status stays `architecture` or `roadmap` unless a lab source exists. Wording: "designed for" ≠ "certified"; planned ≠ shipped. Sources: repo docs/healthcare_ai_architecture.md, docs/legal/*, FAZ_C expert review themes.
