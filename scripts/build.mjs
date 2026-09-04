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

let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
} catch (error) {
  if (!executablePath) throw error;
  console.warn("System Chrome did not launch; retrying with Playwright Chromium.");
  browser = await chromium.launch({ headless: true });
}

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });

  const client = await page.context().newCDPSession(page);
  await Promise.all([client.send("DOM.enable"), client.send("CSS.enable")]);
  const { root: documentRoot } = await client.send("DOM.getDocument");
  const fontChecks = [
    ["h1", "HelveticaNeue-Light"],
    [".profile p", "HelveticaNeue"],
    [".role-dates", "Menlo-Regular"],
    [".proof", "Menlo-Bold"],
  ];
  for (const [selector, expectedPostScriptName] of fontChecks) {
    const { nodeId } = await client.send("DOM.querySelector", {
      nodeId: documentRoot.nodeId,
      selector,
    });
    const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });
    const postScriptNames = fonts.map((font) => font.postScriptName);
    if (!postScriptNames.includes(expectedPostScriptName)) {
      throw new Error(
        `${selector} must render with ${expectedPostScriptName}; found ${postScriptNames.join(", ") || "no platform font"}.`,
      );
    }
  }

  await page.pdf({
    path: pdfPath,
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="box-sizing:border-box;width:100%;padding:0 19.05mm 5.35mm;color:rgb(126,134,146)!important;-webkit-print-color-adjust:exact;font-family:Menlo,'Liberation Mono',monospace;font-size:7.6pt;"><span style="color:rgb(126,134,146)!important">${data.person.name}&nbsp;&nbsp;&nbsp;${data.person.title}&nbsp;&nbsp;&nbsp;</span><span class="pageNumber" style="color:rgb(126,134,146)!important"></span></div>`,
  });
} finally {
  await browser.close();
}

console.log(`Generated ${path.relative(root, htmlPath)}`);
console.log(`Generated ${path.relative(root, pdfPath)}`);
