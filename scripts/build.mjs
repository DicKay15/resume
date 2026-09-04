import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import YAML from "yaml";
import { renderResume } from "../src/template.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentPath = path.join(root, "content", "resume.yml");
const cssPath = path.join(root, "src", "resume.css");
const htmlDirectory = path.join(root, "output", "html");
const pdfDirectory = path.join(root, "output", "pdf");

const [yamlSource, css] = await Promise.all([
  fs.readFile(contentPath, "utf8"),
  fs.readFile(cssPath, "utf8"),
]);

const data = YAML.parse(yamlSource);
const html = renderResume(data, css).replace(/[ \t]+$/gm, "");
const htmlPath = path.join(htmlDirectory, "resume.html");
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

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="box-sizing:border-box;width:100%;padding:0 14mm 5mm;display:flex;align-items:center;justify-content:space-between;color:#7b8594;font-family:'Courier New',monospace;font-size:7pt;letter-spacing:.02em;"><span>${data.person.name}&nbsp;&nbsp;&nbsp;${data.person.title}</span><span class="pageNumber"></span></div>`,
  });
} finally {
  await browser.close();
}

console.log(`Generated ${path.relative(root, htmlPath)}`);
console.log(`Generated ${path.relative(root, pdfPath)}`);
