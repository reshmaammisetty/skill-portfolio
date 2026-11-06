(async () => {
  if (!(await initApp())) return;
  let goals = [];
  const listEl = document.getElementById('list');
  const typeEl = document.getElementById('filterType');
  const statusEl = document.getElementById('filterStatus');
  const STATUSES = ['Not Started', 'In Progress', 'Completed'];
  const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

  const fields = [
    { name: 'title', label: 'Goal', required: true, full: true, maxlength: 120, placeholder: 'e.g. Practice JavaScript for 1 hour' },
    { name: 'description', label: 'Description (optional)', type: 'textarea', rows: 2, full: true, maxlength: 600 },
    { name: 'type', label: 'Goal type', type: 'select', options: ['Daily', 'Weekly', 'Monthly'], default: 'Weekly' },
    { name: 'deadline', label: 'Deadline', type: 'date' },
    { name: 'progress', label: 'Completion', type: 'range', full: true },
    { name: 'status', label: 'Status', type: 'select', options: STATUSES, full: true },
  ];

  const isOverdue = (g) => g.status !== 'Completed' && g.deadline && dateInput(g.deadline) < todayStr();

  function render() {
    const shown = goals.filter((g) => (typeEl.value === 'All' || g.type === typeEl.value) && (statusEl.value === 'All' || g.status === statusEl.value));
    if (!shown.length) {
      listEl.innerHTML = `<div class="card empty"><h3>${goals.length ? 'No goals match these filters' : 'No goals yet'}</h3><p class="muted">${goals.length ? 'Try changing the filters.' : 'Create your first goal to start building momentum.'}</p></div>`;
      return;
    }
    listEl.innerHTML = shown.map((g) => `
      <article class="card goal-card ${isOverdue(g) ? 'overdue' : ''}">
        <div class="card-head">
          <div>
            <h3>${esc(g.title)}</h3>
            <span class="badge">${g.type}</span> <span class="badge badge-${slug(g.status)}">${g.status}</span>
            ${isOverdue(g) ? '<span class="badge badge-overdue">Overdue</span>' : ''}
          </div>
          <div class="actions">
            <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${g._id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="del" data-id="${g._id}">Delete</button>
          </div>
        </div>
        ${g.description ? `<p class="small muted" style="margin-bottom:.6rem">${esc(g.description)}</p>` : ''}
        ${progressBar(g.progress, g.status === 'Completed' ? 'green' : '')}
        <div class="progress-meta"><span>${g.deadline ? 'Deadline: ' + fmtDate(g.deadline) : 'No deadline'}</span><strong>${g.progress}%</strong></div>
        <div class="goal-controls">
          <div class="range-row"><input type="range" min="0" max="100" step="5" value="${g.progress}" data-progress="${g._id}" aria-label="Completion"><output>${g.progress}%</output></div>
          <select data-status="${g._id}" aria-label="Status">${STATUSES.map((s) => `<option ${s === g.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
        </div>
      </article>`).join('');
  }

  async function patch(id, body) {
    try {
      const updated = await api('/goals/' + id, { method: 'PUT', body });
      goals = goals.map((x) => (x._id === id ? updated : x));
      render();
      if (updated.status === 'Completed' && body.status !== undefined || body.progress === 100) toast('Goal completed 🎉');
    } catch (e) { toast(e.message, 'error'); render(); }
  }

  listEl.addEventListener('input', (e) => {
    if (e.target.matches('[data-progress]')) e.target.nextElementSibling.textContent = e.target.value + '%';
  });
  listEl.addEventListener('change', (e) => {
    if (e.target.matches('[data-progress]')) patch(e.target.dataset.progress, { progress: Number(e.target.value) });
    if (e.target.matches('[data-status]')) patch(e.target.dataset.status, { status: e.target.value });
  });

  document.getElementById('addBtn').onclick = () =>
    openForm({
      title: 'New goal', fields, submitText: 'Create goal',
      onSubmit: async (d) => { goals.unshift(await api('/goals', { method: 'POST', body: d })); render(); toast('Goal created'); },
    });

  onActions(listEl, {
    edit: (id) => {
      const g = goals.find((x) => x._id === id);
      openForm({
        title: 'Edit goal', fields, values: { ...g, deadline: dateInput(g.deadline) },
        onSubmit: async (d) => {
          const updated = await api('/goals/' + id, { method: 'PUT', body: d });
          goals = goals.map((x) => (x._id === id ? updated : x));
          render(); toast('Goal updated');
        },
      });
    },
    del: async (id) => {
      if (!confirm('Delete this goal?')) return;
      try { await api('/goals/' + id, { method: 'DELETE' }); goals = goals.filter((x) => x._id !== id); render(); toast('Goal deleted'); }
      catch (e) { toast(e.message, 'error'); }
    },
  });

  typeEl.onchange = render;
  statusEl.onchange = render;
  try { goals = await api('/goals'); render(); } catch (e) { toast(e.message, 'error'); }
})();