import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const yamlPath = path.join(root, "content", "resume.yml");
const htmlPath = path.join(root, "output", "html", "resume.html");

const yamlSource = await fs.readFile(yamlPath, "utf8");
const data = YAML.parse(yamlSource);
const pdfPath = path.join(root, "output", "pdf", data.meta.outputFilename);
const [html, pdfBuffer] = await Promise.all([
  fs.readFile(htmlPath, "utf8"),
  fs.readFile(pdfPath),
]);

const requiredTopLevel = [
  "meta",
  "person",
  "summary",
  "skills",
  "experience",
  "education",
  "certifications",
  "achievement",
  "languages",
];

for (const key of requiredTopLevel) {
  if (!data[key]) throw new Error(`Missing required content block: ${key}`);
}

const forbiddenDashes = /[\u2010-\u2015\u2212]/u;
if (forbiddenDashes.test(yamlSource)) {
  throw new Error("Use ASCII hyphens in active resume content.");
}

if (yamlSource.includes("**")) {
  throw new Error("Use only [[double brackets]] for inline resume emphasis.");
}

for (const visibleUrl of [data.person.linkedinDisplay, data.person.portfolioDisplay]) {
  if (!html.includes(visibleUrl)) {
    throw new Error(`Visible URL missing from HTML: ${visibleUrl}`);
  }
}

const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) });
const pdf = await loadingTask.promise;
if (pdf.numPages !== 2) {
  throw new Error(`Expected exactly 2 PDF pages, found ${pdf.numPages}.`);
}

const pageTexts = [];
const annotations = [];
for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
  const page = await pdf.getPage(pageNumber);
  const [textContent, pageAnnotations] = await Promise.all([
    page.getTextContent(),
    page.getAnnotations(),
  ]);
  pageTexts.push(textContent.items.map((item) => item.str).join(" "));
  annotations.push(...pageAnnotations);

  const viewport = page.getViewport({ scale: 1 });
  if (Math.abs(viewport.width - 612) > 0.5 || Math.abs(viewport.height - 792) > 0.5) {
    throw new Error(
      `Expected US Letter pages (612 x 792 pt); page ${pageNumber} is ${viewport.width} x ${viewport.height}.`,
    );
  }
}

const pdfText = pageTexts.join(" ");
const normalize = (value) =>
  String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9+%@.]/g, "");
const normalizedPdf = normalize(pdfText);

const sourceStrings = [
  data.person.name,
  data.person.title,
  data.person.location,
  data.person.workPreference,
  data.person.phoneDisplay,
  data.person.email,
  data.person.linkedinDisplay,
  data.person.portfolioDisplay,
  data.summary,
  ...data.skills.flatMap((group) => [group.label, ...group.items]),
  ...data.experience.flatMap((role) => [
    role.company,
    role.location,
    role.title,
    role.dates,
    ...(role.description ? [role.description] : []),
    ...role.bullets,
  ]),
  ...data.education.flatMap((item) => [
    item.institution,
    item.location,
    item.qualification,
    item.date,
  ]),
  ...data.certifications.flatMap((item) => [item.name, item.issuer]),
  data.achievement.title,
  data.achievement.organization,
  data.achievement.date,
  data.achievement.description,
  ...data.languages,
];

const missing = sourceStrings.filter((value) => !normalizedPdf.includes(normalize(value)));
if (missing.length) {
  throw new Error(`PDF is missing source content:\n- ${missing.join("\n- ")}`);
}

const requiredOrder = [
  data.person.title,
  "Experience",
  "Education",
  "Certifications",
  "Awards and achievements",
  "Skills",
  "Languages",
].map(normalize);

let previousIndex = -1;
for (const heading of requiredOrder) {
  const index = normalizedPdf.indexOf(heading);
  if (index <= previousIndex) throw new Error(`Section order failed at ${heading}.`);
  previousIndex = index;
}

let experienceCursor = normalizedPdf.indexOf(normalize("Experience"));
for (const role of data.experience) {
  const orderedRoleContent = [
    `${role.company} ${role.title}`,
    ...(role.description ? [role.description] : []),
    ...role.bullets,
  ];

  for (const value of orderedRoleContent) {
    const index = normalizedPdf.indexOf(normalize(value), experienceCursor + 1);
    if (index === -1) {
      throw new Error(`Experience reading order failed at: ${value}`);
    }
    experienceCursor = index;
  }
}

const educationIndex = normalizedPdf.indexOf(normalize("Education"), experienceCursor + 1);
if (educationIndex === -1) {
  throw new Error("Education must follow the final experience bullet in PDF reading order.");
}

const annotationUrls = new Set(
  annotations
    .map((annotation) => annotation.url || annotation.unsafeUrl)
    .filter(Boolean),
);
for (const url of [
  data.person.phoneUrl,
  `mailto:${data.person.email}`,
  data.person.linkedinUrl,
  data.person.portfolioUrl,
]) {
  if (!annotationUrls.has(url)) {
    throw new Error(`PDF hyperlink annotation missing: ${url}`);
  }
}

console.log(`Validated ${sourceStrings.length} source strings across ${pdf.numPages} pages.`);
console.log(`Validated ${annotationUrls.size} PDF hyperlink annotations.`);
console.log("Section and experience reading order, visible URLs, ASCII punctuation, Letter page size, and page count passed.");
