(async () => {
  document.getElementById('themeBtn').onclick = toggleTheme;
  if (getToken()) {
    const cta = document.getElementById('navCta');
    cta.textContent = 'My dashboard';
    cta.href = '/dashboard.html';
  }

  const root = document.getElementById('portfolio');
  const username = location.pathname.startsWith('/u/')
    ? decodeURIComponent(location.pathname.split('/')[2] || '')
    : new URLSearchParams(location.search).get('u');

  const unavailable = (msg) =>
    (root.innerHTML = `<div class="card empty"><h2>Portfolio unavailable</h2><p class="muted">${esc(msg)}</p></div>`);
  if (!username) return unavailable('No username was provided.');

  let data;
  try {
    data = await api('/public/' + encodeURIComponent(username));
  } catch (err) {
    return unavailable(err.message);
  }

  const { profile: p, skills, projects, achievements } = data;
  document.title = `${p.name} · Portfolio`;
  const SOCIAL = [['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['twitter', 'X / Twitter'], ['website', 'Website']];
  const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

  root.innerHTML = `
    <section class="card pf-hero">
      ${avatarHtml(p, 'avatar-xl')}
      <div style="flex:1;min-width:220px">
        <h1>${esc(p.name)}</h1>
        <p>${esc(p.headline || '')}</p>
        <p class="muted small">${esc(p.location || '')}</p>
        <div class="links" style="margin-top:.6rem;flex-wrap:wrap">
          ${SOCIAL.filter(([k]) => p.social && p.social[k]).map(([k, l]) => `<a href="${safeUrl(p.social[k])}" target="_blank" rel="noopener noreferrer">${l}</a>`).join('')}
        </div>
      </div>
    </section>

    ${p.bio ? `<section class="card pf-section"><h2>About</h2><p class="pre" style="margin-top:.5rem">${esc(p.bio)}</p></section>` : ''}

    ${skills.length ? `<section class="card pf-section"><h2 style="margin-bottom:.9rem">Skills</h2>
      ${skills.map((s) => `<div class="pf-skill"><div class="row"><span>${esc(s.name)} <span class="badge badge-${s.level.toLowerCase()}">${s.level}</span></span><span>${s.progress}%</span></div>${progressBar(s.progress)}</div>`).join('')}</section>` : ''}

    ${projects.length ? `<section class="pf-section"><h2 style="margin-bottom:.9rem">Projects</h2><div class="cards">
      ${projects.map((x) => `<article class="card"><div class="card-head"><h3>${esc(x.title)}</h3><span class="badge badge-${slug(x.status)}">${x.status}</span></div>
        ${x.description ? `<p class="small">${esc(x.description)}</p>` : ''}
        <div class="chips">${x.technologies.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
        <div class="links">${x.githubUrl ? `<a href="${safeUrl(x.githubUrl)}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}${x.liveUrl ? `<a href="${safeUrl(x.liveUrl)}" target="_blank" rel="noopener noreferrer">Live demo</a>` : ''}</div></article>`).join('')}</div></section>` : ''}

    ${achievements.length ? `<section class="card pf-section"><h2 style="margin-bottom:.6rem">Achievements</h2>
      ${achievements.map((a) => `<div class="edu-item"><div><strong>${esc(a.title)}</strong><div class="muted small">${esc(a.type)}${a.issuer ? ' · ' + esc(a.issuer) : ''} · ${fmtDate(a.date)}</div></div>${a.credentialUrl ? `<a class="small" href="${safeUrl(a.credentialUrl)}" target="_blank" rel="noopener noreferrer">View</a>` : ''}</div>`).join('')}</section>` : ''}

    ${(p.education || []).length ? `<section class="card pf-section"><h2 style="margin-bottom:.6rem">Education</h2>
      ${p.education.map((e) => `<div class="edu-item"><div><strong>${esc(e.school)}</strong><div>${esc([e.degree, e.field].filter(Boolean).join(', '))}</div><div class="muted small">${esc([e.startYear, e.endYear].filter(Boolean).join(' – '))}</div></div></div>`).join('')}</section>` : ''}`;
})();