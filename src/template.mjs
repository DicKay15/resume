const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const link = (label, url, className = "") =>
  `<a${className ? ` class="${className}"` : ""} href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;

const renderSkillGroup = ({ label, items }) => `
  <p class="skill-line">
    <strong>${escapeHtml(label)}:</strong>
    ${items.map(escapeHtml).join(", ")}
  </p>`;

const renderExperience = (role) => `
  ${role.pageBreakBefore ? '<div class="page-break"></div><h2 class="continued-heading">Work experience, continued</h2>' : ""}
  <article class="role">
    <div class="role-heading">
      <h3>${escapeHtml(role.company)} <span class="location">| ${escapeHtml(role.location)}</span></h3>
      <p class="role-meta"><strong>${escapeHtml(role.title)}</strong> | ${escapeHtml(role.dates)}</p>
    </div>
    <ul>
      ${role.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("\n")}
    </ul>
  </article>`;

export function renderResume(data, css) {
  const { person } = data;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Resume for ${escapeHtml(person.name)}, ${escapeHtml(person.title)}">
  <title>${escapeHtml(data.meta.pageTitle)}</title>
  <style>${css}</style>
</head>
<body>
  <main>
    <header class="resume-header">
      <h1>${escapeHtml(person.name)}</h1>
      <p class="headline">${escapeHtml(person.title)}</p>
      <p class="contact contact-primary">
        <span>${escapeHtml(person.location)}</span>
        <span>${link(person.phoneDisplay, person.phoneUrl)}</span>
        <span>${link(person.email, `mailto:${person.email}`)}</span>
      </p>
      <p class="contact contact-links">
        <span>LinkedIn: ${link(person.linkedinDisplay, person.linkedinUrl)}</span>
        <span>Portfolio: ${link(person.portfolioDisplay, person.portfolioUrl)}</span>
      </p>
    </header>

    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading">Professional summary</h2>
      <p>${escapeHtml(data.summary)}</p>
    </section>

    <section aria-labelledby="skills-heading" class="skills">
      <h2 id="skills-heading">Skills</h2>
      ${data.skills.map(renderSkillGroup).join("\n")}
    </section>

    <section aria-labelledby="experience-heading" class="experience">
      <h2 id="experience-heading">Work experience</h2>
      ${data.experience.map(renderExperience).join("\n")}
    </section>

    <section aria-labelledby="education-heading">
      <h2 id="education-heading">Education</h2>
      ${data.education.map((item) => `
        <article class="compact-entry">
          <h3>${escapeHtml(item.qualification)}</h3>
          <p>${escapeHtml(item.institution)} | ${escapeHtml(item.location)} | ${escapeHtml(item.date)}</p>
        </article>`).join("\n")}
    </section>

    <section aria-labelledby="certifications-heading">
      <h2 id="certifications-heading">Certifications</h2>
      <p>${data.certifications.map((item) => `${escapeHtml(item.name)}, ${escapeHtml(item.issuer)}`).join(" | ")}</p>
    </section>

    <section aria-labelledby="achievement-heading">
      <h2 id="achievement-heading">Awards and achievements</h2>
      <article class="compact-entry">
        <h3>${escapeHtml(data.achievement.title)} | ${escapeHtml(data.achievement.organization)} | ${escapeHtml(data.achievement.date)}</h3>
        <p>${escapeHtml(data.achievement.description)}</p>
      </article>
    </section>

    <section aria-labelledby="languages-heading" class="last-section">
      <h2 id="languages-heading">Languages</h2>
      <p>${data.languages.map(escapeHtml).join(", ")}</p>
    </section>
  </main>
</body>
</html>`;
}
