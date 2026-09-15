import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import YAML from "yaml";
import { renderCoverLetter } from "../src/cover-letter-template.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentArg = process.argv[2] || "cover-letter.yml";
const contentPath = path.isAbsolute(contentArg)
  ? contentArg
  : path.join(root, "content", contentArg);

const [yamlSource, css, letterCss] = await Promise.all([
  fs.readFile(contentPath, "utf8"),
  fs.readFile(path.join(root, "src", "resume.css"), "utf8"),
  fs.readFile(path.join(root, "src", "cover-letter.css"), "utf8"),
]);

const data = YAML.parse(yamlSource);

// Guard against the YAML colon trap that silently renders [object Object].
for (const [i, p] of data.letter.paragraphs.entries()) {
  if (typeof p !== "string") {
    throw new Error(
      `letter.paragraphs[${i}] parsed as ${typeof p}, not a string. An unquoted colon turns a YAML scalar into a map; use a '- >-' block scalar.`,
    );
  }
}

const html = renderCoverLetter(data, css, letterCss).replace(/[ \t]+$/gm, "");
const htmlDirectory = path.join(root, "output", "html");
const pdfDirectory = path.join(root, "output", "pdf");
const htmlPath = path.join(htmlDirectory, `${path.basename(contentPath, path.extname(contentPath))}.html`);
const pdfPath = path.join(pdfDirectory, data.meta.outputFilename);

await Promise.all([
  fs.mkdir(htmlDirectory, { recursive: true }),
  fs.mkdir(pdfDirectory, { recursive: true }),
]);
await fs.writeFile(htmlPath, html, "utf8");

const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath =
  process.env.RESUME_CHROME_PATH ||
  (process.platform === "darwin"
    ? await fs.access(macChrome).then(() => macChrome).catch(() => undefined)
    : undefined);

let browser;
try {
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
} catch (error) {
  if (!executablePath) throw error;
  browser = await chromium.launch({ headless: true });
}

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: pdfPath,
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true,
  });
} finally {
  await browser.close();
}

console.log(`Generated ${path.relative(root, htmlPath)}`);
console.log(`Generated ${path.relative(root, pdfPath)}`);
