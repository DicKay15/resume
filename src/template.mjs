const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderInline = (value) =>
  escapeHtml(value)
    .replace(/\[\[(.+?)\]\]/g, '<strong class="proof">$1</strong>');

const link = (label, url, className = "") =>
  `<a${className ? ` class="${className}"` : ""} href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;

const renderSkillGroup = ({ label, items }) => `
  <div class="skill-row">
    <h3>${escapeHtml(label)}</h3>
    <p>${items.map(renderInline).join(", ")}</p>
  </div>`;

const renderExperience = (role, isLast = false) => {
  const roleLabel = `${role.company}, ${role.title} ${role.location}`;
  const dateTabs = roleLabel.length < 45 ? "\t\t" : "\t";

  return `
  <article class="role${isLast ? " role-last" : ""}">
    <div class="role-heading">
      <h3>${escapeHtml(role.company)}, ${escapeHtml(role.title)} <span class="location">${escapeHtml(role.location)}</span>${dateTabs}<span class="role-dates">${escapeHtml(role.dates)}</span></h3>
    </div>
    ${role.description ? `<p class="role-description">${renderInline(role.description)}</p>` : ""}
    <ul>
      ${role.bullets.map((bullet) => `<li>${renderInline(bullet)}</li>`).join("\n")}
    </ul>
  </article>`;
};

export function renderResume(data, css) {
  const { person } = data;
  const pageBreakIndex = data.experience.findIndex((role) => role.pageBreakBefore);
  const firstPageRoles = pageBreakIndex === -1 ? data.experience : data.experience.slice(0, pageBreakIndex);
  const continuedRoles = pageBreakIndex === -1 ? [] : data.experience.slice(pageBreakIndex);

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
      <p class="availability">${escapeHtml(person.location)} <span>|</span> ${escapeHtml(person.workPreference)}</p>
      <p class="contact">
        <span>${link(person.phoneDisplay, person.phoneUrl)}</span>
        <span>${link(person.email, `mailto:${person.email}`)}</span>
        <span>${link(person.linkedinDisplay, person.linkedinUrl)}</span>
        <span>${link(person.portfolioDisplay, person.portfolioUrl)}</span>
      </p>
    </header>

    <section aria-labelledby="summary-heading" class="profile">
      <h2 id="summary-heading" class="profile-title">${escapeHtml(person.title)}</h2>
      <p>${renderInline(data.summary)}</p>
    </section>

    <section aria-labelledby="experience-heading" class="experience-heading-block">
      <h2 id="experience-heading" class="section-heading">Experience</h2>
    </section>
    ${firstPageRoles.map((role, index) => renderExperience(role, index === firstPageRoles.length - 1)).join("\n")}

    ${continuedRoles.length ? `
    <h2 id="experience-continued-heading" class="section-heading continued-heading">Experience, continued</h2>
    ${continuedRoles.map((role, index) => renderExperience(role, index === continuedRoles.length - 1)).join("\n")}` : ""}

    <section aria-labelledby="education-heading" class="education-section">
      <h2 id="education-heading" class="section-heading">Education</h2>
      ${data.education.map((item) => `
        <article class="compact-entry education-entry">
          <div class="entry-row">
            <h3>${escapeHtml(item.institution)}</h3>
            <p class="entry-date">${escapeHtml(item.date)}</p>
          </div>
          <p class="education-detail">${escapeHtml(item.qualification)} <span>|</span> ${escapeHtml(item.location)}</p>
        </article>`).join("\n")}
    </section>

    <section aria-labelledby="certifications-heading">
      <h2 id="certifications-heading" class="section-heading">Certifications</h2>
      <div class="credentials">
        ${data.certifications.map((item) => `<p><strong>${escapeHtml(item.name)}</strong> <span>${escapeHtml(item.issuer)}</span></p>`).join("\n")}
      </div>
    </section>

    <section aria-labelledby="achievement-heading">
      <h2 id="achievement-heading" class="section-heading">Awards and achievements</h2>
      <article class="compact-entry achievement">
        <div class="entry-row">
          <h3>${escapeHtml(data.achievement.title)} <span class="entry-detail">${escapeHtml(data.achievement.organization)}</span></h3>
          <p class="entry-date">${escapeHtml(data.achievement.date)}</p>
        </div>
        <p>${renderInline(data.achievement.description)}</p>
      </article>
    </section>

    <section aria-labelledby="skills-heading" class="skills last-section">
      <h2 id="skills-heading" class="section-heading">Skills</h2>
      ${data.skills.map(renderSkillGroup).join("\n")}
      <div class="skill-row">
        <h3>Languages</h3>
        <p>${data.languages.map(escapeHtml).join(", ")}</p>
      </div>
    </section>
  </main>
</body>
</html>`;
}
