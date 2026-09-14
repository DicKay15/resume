const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

// Order matters: [[proof]] is resolved before [label](url) so the single
// brackets left in the string can only belong to a link.
const renderInline = (value) =>
  escapeHtml(value)
    .replace(/\[\[(.+?)\]\]/g, '<strong class="proof">$1</strong>')
    .replace(
      /\[([^\[\]]+?)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a class="case-link" href="$2">$1</a>',
    );

const link = (label, url, className = "") =>
  `<a${className ? ` class="${className}"` : ""} href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;

const renderSkillGroup = ({ label, items }) => `
  <p class="skill-row"><strong class="skill-label">${escapeHtml(label)}:</strong> ${items.map(renderInline).join(", ")}</p>`;

// Preflight finding 12b: the title field used to parse with the city glued on,
// because "Company, Title City" has no delimiter after the title. Pipes give
// every parser an unambiguous three-field split.
const renderExperience = (role, isLast = false) => {
  const roleLabel = `${role.company} | ${role.title} | ${role.location}`;
  const dateTabs = roleLabel.length < 45 ? "\t\t" : "\t";

  return `
  <article class="role${isLast ? " role-last" : ""}">
    <div class="role-heading">
      <h3>${escapeHtml(role.company)} <span class="sep">|</span> ${escapeHtml(role.title)} <span class="sep">|</span> <span class="location">${escapeHtml(role.location)}</span>${dateTabs}<span class="role-dates">${escapeHtml(role.dates)}</span></h3>
    </div>
    ${role.description ? `<p class="role-description">${renderInline(role.description)}</p>` : ""}
    <ul>
      ${role.bullets.map((bullet) => `<li>${renderInline(bullet)}</li>`).join("\n")}
    </ul>
  </article>`;
};

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
<body${(data.meta.expectedPages ?? 1) > 1 ? ' class="density-comfortable"' : ""}>
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

    <section aria-labelledby="summary-heading" class="profile">
      <h2 id="summary-heading" class="profile-title">${escapeHtml(person.title)}</h2>
      <p>${renderInline(data.summary)}</p>
    </section>

    <section aria-labelledby="experience-heading" class="experience-heading-block">
      <h2 id="experience-heading" class="section-heading">Experience</h2>
    </section>
    ${data.experience.map((role, index) => renderExperience(role, index === data.experience.length - 1)).join("\n")}

    ${data.builds?.length ? `
    <section aria-labelledby="builds-heading" class="builds-section">
      <h2 id="builds-heading" class="section-heading">Selected builds</h2>
      ${data.builds.map((item) => `
        <article class="compact-entry build-entry">
          <div class="entry-row">
            <h3>${escapeHtml(item.name)} <span class="entry-detail">${escapeHtml(item.summary)}</span></h3>
            <p class="entry-date">${link(item.linkDisplay, item.url, "build-link")}</p>
          </div>
        </article>`).join("\n")}
    </section>` : ""}

    <section aria-labelledby="education-heading" class="education-section${data.meta.experienceOwnsFirstPage ? " page-two-start" : ""}">
      <h2 id="education-heading" class="section-heading">Education</h2>
      ${data.education.map((item) => `
        <article class="compact-entry education-entry">
          <div class="entry-row">
            <h3>${escapeHtml(item.institution)} <span class="entry-detail">${escapeHtml(item.qualification)}, ${escapeHtml(item.location)}</span></h3>
            <p class="entry-date">${escapeHtml(item.date)}</p>
          </div>
        </article>`).join("\n")}
    </section>

    <section aria-labelledby="achievement-heading">
      <h2 id="achievement-heading" class="section-heading">Awards and achievements</h2>
      <article class="compact-entry achievement">
        <div class="entry-row">
          <h3>${escapeHtml(data.achievement.title)} <span class="entry-detail">${escapeHtml(data.achievement.organization)}. ${escapeHtml(data.achievement.description)}</span></h3>
          <p class="entry-date">${escapeHtml(data.achievement.date)}</p>
        </div>
      </article>
    </section>

    <section aria-labelledby="skills-heading" class="skills last-section">
      <h2 id="skills-heading" class="section-heading">Skills</h2>
      ${data.skills.map(renderSkillGroup).join("\n")}
      <p class="skill-row"><strong class="skill-label">Languages:</strong> ${data.languages.map(escapeHtml).join(", ")}</p>
    </section>
  </main>
</body>
</html>`;
}
