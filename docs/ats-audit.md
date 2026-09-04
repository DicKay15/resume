# ATS audit and rewrite record

## Original PDF result

The original two-page PDF passed basic ATS extraction in two independent parsers. Name, roles, dates, bullets, education, skills, tools, languages, and certifications appeared in the correct order.

## Issues corrected

| Original issue | Correction |
|---|---|
| ATS text exposed only “LinkedIn” and “Portfolio” | Full LinkedIn and portfolio URLs are now visible text and clickable links |
| Portfolio pointed to Folio 4 | Updated to the current Folio 5 portfolio |
| Phone lacked an international prefix in visible text | Updated to `+91 83205 65071` |
| Contact details wrapped across two lines | Consolidated into one aligned line beneath `India | Remote`, with visible URLs |
| LinkedIn used HTTP | Updated to HTTPS |
| “About” and “Achievement” were less standard section labels | Renamed to “Professional summary” and “Awards and achievements” |
| Combined skills/tools/certifications heading | Split into standard Skills and Certifications sections |
| Generic terms such as “Research” | Added accurate exact-match terms such as UX Research, User Research, Product Strategy, Accessibility, Data Visualization, and Developer Handoff |
| Grammar and consistency issues | Corrected engineer/engineers, on-site, two months, capitalization, number formatting, and section labels |
| Page 2 was mostly empty | Rebalanced the content across two intentional A4 pages |
| Pages/Quartz PDF produced non-fatal cross-reference warnings | Replaced with a tagged Chromium PDF with Unicode text mappings |
| Special dash characters | Active content uses ASCII hyphens only |

## ATS-safe design decisions

- One-column reading order
- Standard section names
- Searchable text, no images or icons
- No tables in the resume itself
- Embedded IBM Plex Sans and IBM Plex Mono subsets with Unicode mappings
- Plain bullets and ASCII punctuation
- Dates written consistently as month and year
- Visible contact details and URLs
- Two pages, balanced through natural role-safe pagination

## Automated validation

`npm run check` verifies:

- The PDF is exactly two pages.
- Every active source string appears in the extracted PDF text.
- Standard sections appear in the correct order.
- Phone, email, LinkedIn, and portfolio hyperlink annotations exist.
- LinkedIn and portfolio addresses are visible in the document.
- Active content contains no special dash characters.

Keyword matching still depends on each job description. The master resume includes broad, defensible Product Designer terminology and should be tailored when a role has specialized requirements.
