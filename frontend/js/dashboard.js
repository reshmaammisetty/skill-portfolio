(async () => {
  const user = await initApp();
  if (!user) return;

  const first = user.name.split(' ')[0];
  document.getElementById('welcome').innerHTML = `
    ${avatarHtml(user, 'avatar-lg')}
    <div class="info">
      <h1>Welcome back, ${esc(first)} 👋</h1>
      <p class="muted">${esc(user.headline || 'Add a professional headline to complete your profile.')}${user.location ? ' · ' + esc(user.location) : ''}</p>
    </div>
    <div class="actions">
      <a class="btn btn-outline btn-sm" href="/profile.html">View profile</a>
      <a class="btn btn-primary btn-sm" href="/u/${esc(user.username)}" target="_blank" rel="noopener">Public portfolio</a>
    </div>`;

  let data;
  try {
    data = await api('/dashboard');
  } catch (err) {
    return toast(err.message, 'error');
  }
  const s = data.stats;

  const stat = (num, label, href) =>
    `<a class="card stat-card" href="${href}" style="text-decoration:none;color:inherit"><div class="num">${num}</div><div class="label">${label}</div></a>`;
  document.getElementById('stats').innerHTML =
    stat(s.totalSkills, 'Total skills', '/skills.html') +
    stat(`${s.completedProjects}<span class="muted small"> / ${s.totalProjects}</span>`, 'Completed projects', '/projects.html') +
    stat(s.achievements, 'Achievements', '/achievements.html') +
    stat(s.activeGoals, 'Active goals', '/goals.html');

  document.getElementById('learning').innerHTML = `
    <p class="muted small" style="margin:.3rem 0 .8rem">Roadmap completion across all learning paths</p>
    <div class="num" style="font-size:2rem;font-weight:700;color:var(--primary)">${s.learningProgress}%</div>
    ${progressBar(s.learningProgress, 'green')}
    <div class="progress-meta"><span>${s.roadmapSteps.done} of ${s.roadmapSteps.total} steps done</span><a href="/roadmap.html">Open roadmaps</a></div>
    <p class="dist-title">Average skill proficiency</p>
    ${progressBar(s.avgSkillProgress)}
    <div class="progress-meta"><span>${s.avgSkillProgress}%</span><a href="/skills.html">Manage skills</a></div>`;

  const dist = (obj, order) => {
    const total = Object.values(obj).reduce((a, b) => a + b, 0);
    if (!total) return '<p class="muted small">No data yet</p>';
    return order
      .map((k) => `<div class="dist-row"><span>${k}</span>${progressBar(Math.round(((obj[k] || 0) / total) * 100))}<strong>${obj[k] || 0}</strong></div>`)
      .join('');
  };
  const a = data.analytics;
  document.getElementById('analytics').innerHTML =
    `<p class="dist-title">Skills by level</p>${dist(a.skillsByLevel, ['Beginner', 'Intermediate', 'Advanced', 'Expert'])}
     <p class="dist-title">Projects by status</p>${dist(a.projectsByStatus, ['Planned', 'In Progress', 'Completed'])}
     <p class="dist-title">Goals by status</p>${dist(a.goalsByStatus, ['Not Started', 'In Progress', 'Completed'])}`;

  document.getElementById('goals').innerHTML = data.upcomingGoals.length
    ? data.upcomingGoals
        .map(
          (g) => `<div class="mini-goal"><div class="row"><span>${esc(g.title)}</span><span class="muted small">${g.deadline ? 'Due ' + fmtDate(g.deadline) : g.type}</span></div>${progressBar(g.progress)}</div>`
        )
        .join('')
    : '<p class="muted">No active goals. <a href="/goals.html">Create one</a> to stay on track.</p>';

  document.getElementById('activity').innerHTML = data.recentActivities.length
    ? data.recentActivities.map((x) => `<li><span class="dot"></span><div>${esc(x.message)}<time>${timeAgo(x.createdAt)}</time></div></li>`).join('')
    : '<li class="muted">Your activity will appear here as you use the app.</li>';
})();