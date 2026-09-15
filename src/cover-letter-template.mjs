const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

// Same inline grammar as the resume: [[proof]] then [label](url).
const renderInline = (value) =>
  escapeHtml(value)
    .replace(/\[\[(.+?)\]\]/g, '<strong class="proof">$1</strong>')
    .replace(
      /\[([^\[\]]+?)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a class="case-link" href="$2">$1</a>',
    );

const link = (label, url, className = "") =>
  `<a${className ? ` class="${className}"` : ""} href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;

export function renderCoverLetter(data, css, letterCss) {
  const { person, letter } = data;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Cover letter from ${escapeHtml(person.name)} for ${escapeHtml(letter.role)} at ${escapeHtml(letter.company)}">
  <title>${escapeHtml(data.meta.pageTitle)}</title>
  <style>${css}</style>
  <style>${letterCss}</style>
</head>
<body class="cover-letter">
  <main>
    <header class="resume-header">
      <h1>${escapeHtml(person.name)}</h1>
      <p class="portfolio-lead">${link(person.portfolioDisplay, person.portfolioUrl, "portfolio-link")}</p>
      <p class="contact">
        <span>${escapeHtml(person.location)}, ${escapeHtml(person.workPreference)}</span>
        <span>${link(person.phoneDisplay, person.phoneUrl)}</span>
        <span>${link(person.email, `mailto:${person.email}`)}</span>
        <span>${link(person.linkedinDisplay, person.linkedinUrl)}</span>
      </p>
    </header>

    <section aria-labelledby="letter-heading" class="letter-meta">
      <h2 id="letter-heading" class="section-heading">${escapeHtml(letter.heading)}</h2>
      <p class="letter-subject">${escapeHtml(letter.role)} <span class="sep">|</span> ${escapeHtml(letter.company)}<span class="letter-date">${escapeHtml(letter.date)}</span></p>
    </section>

    <section class="letter-body">
      <p class="salutation">${escapeHtml(letter.salutation)}</p>
      ${letter.paragraphs.map((p) => `<p>${renderInline(p)}</p>`).join("\n      ")}
      <p class="signoff">${escapeHtml(letter.signoff)}</p>
      <p class="signature">${escapeHtml(person.name)}</p>
    </section>
  </main>
</body>
</html>`;
}
