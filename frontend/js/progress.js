(async () => {
  if (!(await initApp())) return;

  const sum = (arr, key) => arr.reduce((s, x) => s + x[key], 0);
  const round = (n) => Math.round(n * 10) / 10;

  function spark(values) {
    const v = values.slice(-12);
    if (v.length < 2) return '<div class="spark"></div>';
    const pts = v.map((y, i) => `${(i / (v.length - 1)) * 100},${29 - (y / 100) * 28}`).join(' ');
    return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline fill="none" stroke="currentColor" stroke-width="2" points="${pts}"/></svg>`;
  }

  async function load() {
    let sum_, logs;
    try {
      [sum_, logs] = await Promise.all([api('/progress/summary'), api('/progress/logs')]);
    } catch (e) { return toast(e.message, 'error'); }

    const dayLabel = (d) => `${d.label}: ${round(d.hours)}h, ${d.activities} activities`;
    barChart(document.getElementById('weekChart'), sum_.weekly.map((d) => ({ label: d.label, value: round(d.hours), title: dayLabel(d) })));
    barChart(document.getElementById('monthChart'), sum_.monthly.map((d) => ({ label: d.label, value: round(d.hours), title: dayLabel(d) })));
    document.getElementById('weekTotal').textContent = `${round(sum(sum_.weekly, 'hours'))} h · ${sum(sum_.weekly, 'activities')} activities`;
    const m = sum_.monthly[sum_.monthly.length - 1];
    document.getElementById('monthTotal').textContent = `This month: ${round(m.hours)} h · ${m.activities} activities`;

    document.getElementById('skillImprovement').innerHTML = sum_.skillImprovement.length
      ? sum_.skillImprovement.map((s) => {
          const delta = s.latest - s.first;
          return `<div class="skill-row">
            <div><strong>${esc(s.skillName)}</strong>${progressBar(s.latest)}
              <span class="small muted">${s.first}% → ${s.latest}% ${delta ? `(${delta > 0 ? '+' : ''}${delta}%)` : ''} · ${s.updates} update${s.updates === 1 ? '' : 's'}</span></div>
            ${spark(s.values)}</div>`;
        }).join('')
      : '<p class="muted" style="margin-top:.6rem">Add skills and update their progress to see improvement here.</p>';

    const ps = sum_.projectStats;
    const total = sum_.totalProjects;
    document.getElementById('projectStats').innerHTML = total
      ? `<div class="num" style="font-size:2rem;font-weight:700;color:var(--primary);margin-top:.4rem">${Math.round((ps.Completed / total) * 100)}%</div>
         <p class="muted small" style="margin-bottom:.8rem">${ps.Completed} of ${total} projects completed</p>` +
        ['Planned', 'In Progress', 'Completed'].map((k) => `<div class="dist-row"><span>${k}</span>${progressBar(Math.round((ps[k] / total) * 100), k === 'Completed' ? 'green' : '')}<strong>${ps[k]}</strong></div>`).join('')
      : '<p class="muted" style="margin-top:.6rem">No projects yet. Add one on the Projects page.</p>';

    document.getElementById('history').innerHTML = logs.length
      ? `<table><thead><tr><th>Date</th><th>Topic</th><th>Hours</th><th>Notes</th><th></th></tr></thead><tbody>
          ${logs.map((l) => `<tr><td>${fmtDate(l.date)}</td><td>${esc(l.skillName)}</td><td>${l.hours}</td><td>${esc(l.note)}</td>
            <td><button class="btn btn-danger btn-sm" data-action="del" data-id="${l._id}">Delete</button></td></tr>`).join('')}</tbody></table>`
      : '<p class="muted" style="margin-top:.6rem">No learning sessions logged yet. Use "Log learning session" to start your history.</p>';
  }

  document.getElementById('logBtn').onclick = () =>
    openForm({
      title: 'Log learning session', submitText: 'Save session',
      fields: [
        { name: 'skillName', label: 'What did you study?', required: true, full: true, maxlength: 80, placeholder: 'e.g. Express.js routing' },
        { name: 'hours', label: 'Hours', type: 'number', required: true, min: 0.1, max: 24, step: '0.1', default: 1 },
        { name: 'date', label: 'Date', type: 'date', required: true, default: todayStr() },
        { name: 'note', label: 'Notes (optional)', type: 'textarea', rows: 3, full: true, maxlength: 300 },
      ],
      onSubmit: async (d) => { await api('/progress/logs', { method: 'POST', body: d }); toast('Session logged'); await load(); },
    });

  onActions(document.getElementById('history'), {
    del: async (id) => {
      if (!confirm('Delete this log entry?')) return;
      try { await api('/progress/logs/' + id, { method: 'DELETE' }); toast('Entry deleted'); load(); } catch (e) { toast(e.message, 'error'); }
    },
  });

  load();
})();