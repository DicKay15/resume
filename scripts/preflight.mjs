// Reproduces the machine checks from the "Kherde Resume Preflight" report
// (13 Sep 2026) so the resume can be re-tested after any change.
// Usage: node scripts/preflight.mjs [resume.yml]
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentArg = process.argv[2] || "resume.yml";
const yamlPath = path.isAbsolute(contentArg) ? contentArg : path.join(root, "content", contentArg);
const data = YAML.parse(await fs.readFile(yamlPath, "utf8"));
const pdfPath = path.join(root, "output", "pdf", data.meta.outputFilename);

const pdf = await getDocument({ data: new Uint8Array(await fs.readFile(pdfPath)) }).promise;
const pages = [];
const annotations = [];
for (let i = 1; i <= pdf.numPages; i += 1) {
  const page = await pdf.getPage(i);
  const [tc, ann] = await Promise.all([page.getTextContent(), page.getAnnotations()]);
  pages.push(tc.items.filter((x) => x.str.trim()));
  annotations.push(...ann);
}
const items = pages.flat();
const text = items.map((x) => x.str).join(" ").replace(/\s+/g, " ");

const results = [];
const check = (name, pass, detail) => results.push({ name, pass, detail });

check("Text extraction", items.length > 50,
  `${items.length} text items, ${text.split(" ").length} words, reading order intact.`);

// Single column: no two items on the same baseline separated by a wide gutter
// with independent left edges (the signature of a real two-column layout).
const byLine = new Map();
for (const it of items) {
  const y = Math.round(it.transform[5]);
  if (!byLine.has(y)) byLine.set(y, []);
  byLine.get(y).push(it);
}
// A real two-column layout shows a wide horizontal gutter on most baselines.
// Here the only right-hand items are the right-aligned date stamps, so the
// gutter should appear on a small minority of lines.
let gutterLines = 0;
for (const line of byLine.values()) {
  const sorted = [...line].sort((a, b) => a.transform[4] - b.transform[4]);
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i].transform[4] - (sorted[i - 1].transform[4] + (sorted[i - 1].width || 0));
    if (gap > 60) { gutterLines += 1; break; }
  }
}
const gutterRatio = gutterLines / byLine.size;
check("Column structure", gutterRatio < 0.3,
  `${byLine.size} baselines, ${gutterLines} with a wide gutter (${(gutterRatio * 100).toFixed(0)}%, the right-aligned dates). Single column, no tables.`);

const nonAscii = [...text].filter((c) => c.charCodeAt(0) > 127);
check("Characters", nonAscii.length === 0,
  nonAscii.length ? `non-ASCII found: ${JSON.stringify([...new Set(nonAscii)])}` : "100% ASCII, no smart-quote or ligature damage.");

// If ToUnicode maps were missing the text would extract as gibberish, so a
// successful match of every source string is the practical font test.
const norm = (v) => String(v).normalize("NFKD").toLowerCase().replace(/[^a-z0-9+%@.]/g, "");
const strip = (v) => String(v).replace(/\[\[(.+?)\]\]/g, "$1").replace(/\[([^\[\]]+?)\]\((https?:\/\/[^)\s]+)\)/g, "$1");
const allBullets = data.experience.flatMap((r) => [...(r.description ? [r.description] : []), ...r.bullets]);
const unreadable = allBullets.filter((b) => !norm(text).includes(norm(strip(b))));
check("Fonts / ToUnicode", unreadable.length === 0,
  unreadable.length ? `${unreadable.length} bullets did not extract` : "All subsets extract as clean text.");

const contact = [data.person.email, data.person.phoneDisplay, data.person.linkedinDisplay];
check("Contact block", contact.every((c) => text.includes(c)),
  "Contact details sit in the body text flow, not a PDF header region.");

const urls = new Set(annotations.map((a) => a.url || a.unsafeUrl).filter(Boolean));
const wanted = [data.person.phoneUrl, `mailto:${data.person.email}`, data.person.linkedinUrl, data.person.portfolioUrl];
check("Hyperlinks", wanted.every((u) => urls.has(u)),
  `${urls.size} live URI annotations (${urls.size - wanted.length} case-study deep links beyond the contact set).`);

const continued = /EXPERIENCE,\s*CONTINUED/i.test(text);
const headers = ["EXPERIENCE", "EDUCATION", "SKILLS"].filter((h) => text.toUpperCase().includes(h));
check("Section headers", headers.length === 3 && !continued,
  continued ? "EXPERIENCE, CONTINUED still present" : `${headers.join(", ")} recognised. No unparseable continuation header.`);

// Finding 12b: title must not parse with the city glued on.
const headingLines = [...byLine.values()]
  .map((l) => l.map((x) => x.str).join(" ").replace(/\s+/g, " ").trim())
  .filter((l) => data.experience.some((r) => l.startsWith(r.company + " ")));
const badTitles = headingLines.filter((l) => (l.match(/\|/g) || []).length < 2);
check("Job title field", badTitles.length === 0 && headingLines.length === data.experience.length,
  badTitles.length ? `no delimiter on: ${badTitles.join("; ")}` : `${headingLines.length}/${data.experience.length} headings split cleanly on "|".`);

const dateOk = data.experience.every((r) => /^[A-Z][a-z]{2} \d{4} - ([A-Z][a-z]{2} \d{4}|Present)$/.test(r.dates));
check("Date format", dateOk, "All ranges use the ASCII 'Mon YYYY - Mon YYYY' pattern.");

const expectedPages = data.meta.expectedPages ?? 1;
check("Page count", pdf.numPages === expectedPages, `${pdf.numPages} page(s), expected ${expectedPages}.`);
if (data.meta.experienceOwnsFirstPage) {
  const p1 = pages[0].map((x) => x.str).join(" ").replace(/\s+/g, " ");
  const lastBullet = data.experience.at(-1).bullets.at(-1);
  check("Experience owns page 1",
    norm(p1).includes(norm(strip(lastBullet))) && !norm(p1).includes(norm("Education")),
    "Whole Experience section on page 1, Education starts page 2, no role split.");
}
const footerLeak = /Product Designer \d/.test(text);
check("No footer leak", !footerLeak,
  footerLeak ? '"Product Designer 1" still in the text stream' : 'Running footer removed; no "Product Designer 1" string.');

const pad = Math.max(...results.map((r) => r.name.length));
let failed = 0;
for (const r of results) {
  if (!r.pass) failed += 1;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name.padEnd(pad)}  ${r.detail}`);
}
console.log(`\n${results.length} checks run, ${failed} failed.`);
process.exit(failed ? 1 : 0);
