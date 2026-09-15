# Dhrumil Kherde resume

[![Generate resume](https://github.com/DicKay15/resume/actions/workflows/generate-resume.yml/badge.svg)](https://github.com/DicKay15/resume/actions/workflows/generate-resume.yml)

An ATS-safe, two-page Product Designer resume with content separated from presentation and PDF generation.

## Download

- [Latest generated PDF](output/pdf/Dhrumil-Kherde-Product-Designer-Resume.pdf)
- [Generated HTML](output/html/resume.html)

## Edit the resume

All editable resume content is in one file:

`content/resume.yml`

Open that file on GitHub, click the pencil button, make the change, and commit it to `main`. GitHub Actions will automatically:

1. Generate the HTML and PDF.
2. Check that every source entry appears in the PDF.
3. Check the section order, links, punctuation, and page count.
4. Commit the regenerated files back to this repository.

Wrap measurable proof or an important keyword in `[[double brackets]]` to use the teal monospaced evidence style. The generator keeps the text searchable and removes the markers from the PDF. Use this single emphasis style consistently; do not add a second inline bold treatment.

## Project structure

```text
content/
  resume.yml                    Editable source of truth
  original-pdf-extraction.md    Preserved extraction from the August 2026 PDF
src/
  template.mjs                  Accessible HTML structure
  resume.css                    US Letter print design
scripts/
  build.mjs                     HTML and PDF generator
  validate.mjs                  ATS and source-completeness checks
output/
  html/resume.html              Generated browser version
  pdf/*.pdf                     Generated resume
docs/
  ats-audit.md                  Audit findings and corrections
```

## Run locally

Requires Node.js 22 or newer.

```bash
npm install --omit=optional --ignore-scripts --no-audit --no-fund
npx playwright install chromium
npm run check
```

On macOS, the generator automatically uses installed Google Chrome when available.

## Design principles

- Standard ATS section names
- Single-column reading order
- Visible URLs and contact details
- Searchable text with no images, icons, or decorative graphics
- Measured US Letter geometry and 54pt side margins matching the broad-coverage reference
- Helvetica Neue for content and Menlo for dates and evidence, verified during generation
- Left-aligned editorial hierarchy based on the broad-coverage resume reference
- Teal monospaced emphasis reserved for measurable evidence
- Restrained hierarchy designed for recruiters and parsing software
- All active resume punctuation uses ASCII hyphens

See [the ATS audit](docs/ats-audit.md) for the complete correction record.

## Two documents

| Content file | Output | Target roles |
|---|---|---|
| `content/resume.yml` | `Dhrumil-Kherde-Product-Designer-Resume.pdf` | Product Designer, UX Designer, Senior Product Designer |
| `content/resume-design-engineer.yml` | `Dhrumil-Kherde-Design-Engineer-Resume.pdf` | Design Engineer, UX Engineer, Design Systems Engineer |
| `content/resume-consumer-social.yml` | `Dhrumil-Kherde-Product-Designer-Consumer-Resume.pdf` | Consumer, social, and games product design |

Cover letters reuse the same letterhead and CSS, one YAML file per company:

| Content file | Output |
|---|---|
| `content/cover-letter-chesscom.yml` | `Dhrumil-Kherde-Cover-Letter-Chess-com.pdf` |

```
npm run check                                    # main resume
npm run build -- resume-design-engineer.yml      # variant
npm run validate -- resume-design-engineer.yml
npm run cover-letter -- cover-letter-chesscom.yml # cover letter
node scripts/preflight.mjs [content-file.yml]    # the Preflight report's machine checks
```

`scripts/preflight.mjs` reproduces the 13 Sep 2026 "Kherde Resume Preflight"
machine checks (text extraction, column structure, ASCII, fonts, contact block,
hyperlinks, section headers, job title field, date format, page count, footer
leak). Run it after any change. Findings log: `docs/resume/preflight-audit-2026-09-13.md`
in the personal docs repo.
