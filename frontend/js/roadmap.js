(async () => {
  if (!(await initApp())) return;
  let roadmaps = [];
  let selectedId = null;
  const listEl = document.getElementById('roadmapList');
  const detail = document.getElementById('detail');

  const pctOf = (r) => (r.steps.length ? Math.round((r.steps.filter((s) => s.completed).length / r.steps.length) * 100) : 0);
  const current = () => roadmaps.find((r) => r._id === selectedId);
  const cleanSteps = (steps) => steps.map((s) => ({ title: s.title, type: s.type, completed: s.completed }));

  function render() {
    listEl.innerHTML = roadmaps.length
      ? roadmaps.map((r) => `<button class="rm-item ${r._id === selectedId ? 'active' : ''}" data-action="select" data-id="${r._id}">
          <strong>${esc(r.title)}</strong>${progressBar(pctOf(r), 'green')}<span class="small muted">${pctOf(r)}% · ${r.steps.length} steps</span></button>`).join('')
      : '<p class="muted small">No roadmaps yet.</p>';

    const r = current();
    if (!r) {
      detail.innerHTML = `<div class="empty"><h3>Create your first learning path</h3><p class="muted">For example: "Become a full-stack developer". Add topics and milestones, then tick them off as you learn.</p></div>`;
      return;
    }
    const done = r.steps.filter((s) => s.completed).length;
    detail.innerHTML = `
      <div class="card-head">
        <div><h2>${esc(r.title)}</h2>${r.description ? `<p class="muted small">${esc(r.description)}</p>` : ''}</div>
        <div class="actions">
          <button class="btn btn-primary btn-sm" data-action="addStep">+ Step</button>
          <button class="btn btn-ghost btn-sm" data-action="editRm">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delRm">Delete</button>
        </div>
      </div>
      ${progressBar(pctOf(r), 'green')}
      <p class="small muted" style="margin-top:.35rem">${done} of ${r.steps.length} completed · ${pctOf(r)}%</p>
      <div class="flow">
        <div class="flow-start">Start</div>
        ${r.steps.map((s, i) => `
          <div class="flow-arrow"></div>
          <div class="flow-node ${s.type === 'Milestone' ? 'milestone' : ''} ${s.completed ? 'done' : ''}">
            <label class="check"><input type="checkbox" data-action="toggle" data-id="${i}" ${s.completed ? 'checked' : ''}><span>${esc(s.title)}</span></label>
            <span class="badge">${s.type}</span>
            <div class="node-actions">
              <button data-action="up" data-id="${i}" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button data-action="down" data-id="${i}" title="Move down" ${i === r.steps.length - 1 ? 'disabled' : ''}>↓</button>
              <button data-action="removeStep" data-id="${i}" title="Remove">✕</button>
            </div>
          </div>`).join('')}
        <div class="flow-arrow"></div>
        <div class="flow-end">Goal reached</div>
      </div>
      ${r.steps.length ? '' : '<p class="muted small" style="text-align:center;margin-top:1rem">No steps yet. Click "+ Step" to add your first topic.</p>'}`;
  }

  async function saveSteps(steps) {
    try {
      const updated = await api('/roadmaps/' + selectedId, { method: 'PUT', body: { steps: cleanSteps(steps) } });
      roadmaps = roadmaps.map((x) => (x._id === updated._id ? updated : x));
      render();
    } catch (e) { toast(e.message, 'error'); render(); }
  }

  // Lines starting with * become milestones
  const parseTopics = (text) =>
    text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) =>
      l.startsWith('*') ? { title: l.replace(/^\*+\s*/, ''), type: 'Milestone', completed: false } : { title: l, type: 'Topic', completed: false }
    );

  document.getElementById('addBtn').onclick = () =>
    openForm({
      title: 'New learning roadmap', submitText: 'Create roadmap',
      fields: [
        { name: 'title', label: 'Roadmap title', required: true, full: true, maxlength: 100, placeholder: 'e.g. Full-stack web developer' },
        { name: 'description', label: 'Description (optional)', full: true, maxlength: 400 },
        { name: 'topics', label: 'Topics (one per line, start a line with * for a milestone)', type: 'textarea', rows: 6, full: true, placeholder: 'HTML & CSS basics\nJavaScript fundamentals\n*Build a portfolio site\nNode.js & Express' },
      ],
      onSubmit: async (d) => {
        const r = await api('/roadmaps', { method: 'POST', body: { title: d.title, description: d.description, steps: parseTopics(d.topics) } });
        roadmaps.unshift(r); selectedId = r._id; render(); toast('Roadmap created');
      },
    });

  onActions(listEl, { select: (id) => { selectedId = id; render(); } });

  onActions(detail, {
    toggle: (i) => { const steps = cleanSteps(current().steps); steps[i].completed = !steps[i].completed; saveSteps(steps); },
    up: (i) => { i = +i; const s = cleanSteps(current().steps); [s[i - 1], s[i]] = [s[i], s[i - 1]]; saveSteps(s); },
    down: (i) => { i = +i; const s = cleanSteps(current().steps); [s[i + 1], s[i]] = [s[i], s[i + 1]]; saveSteps(s); },
    removeStep: (i) => saveSteps(cleanSteps(current().steps).filter((_, idx) => idx !== +i)),
    addStep: () =>
      openForm({
        title: 'Add step', submitText: 'Add step',
        fields: [
          { name: 'title', label: 'Topic or milestone', required: true, full: true, maxlength: 120 },
          { name: 'type', label: 'Type', type: 'select', options: ['Topic', 'Milestone'], full: true },
        ],
        onSubmit: async (d) => {
          const updated = await api('/roadmaps/' + selectedId, { method: 'PUT', body: { steps: [...cleanSteps(current().steps), { title: d.title, type: d.type, completed: false }] } });
          roadmaps = roadmaps.map((x) => (x._id === updated._id ? updated : x)); render();
        },
      }),
    editRm: () => {
      const r = current();
      openForm({
        title: 'Edit roadmap', values: r,
        fields: [
          { name: 'title', label: 'Title', required: true, full: true, maxlength: 100 },
          { name: 'description', label: 'Description', full: true, maxlength: 400 },
        ],
        onSubmit: async (d) => {
          const updated = await api('/roadmaps/' + r._id, { method: 'PUT', body: d });
          roadmaps = roadmaps.map((x) => (x._id === updated._id ? updated : x)); render(); toast('Roadmap updated');
        },
      });
    },
    delRm: async () => {
      if (!confirm('Delete this entire roadmap?')) return;
      try {
        await api('/roadmaps/' + selectedId, { method: 'DELETE' });
        roadmaps = roadmaps.filter((x) => x._id !== selectedId);
        selectedId = roadmaps[0] ? roadmaps[0]._id : null;
        render(); toast('Roadmap deleted');
      } catch (e) { toast(e.message, 'error'); }
    },
  });

  try {
    roadmaps = await api('/roadmaps');
    selectedId = roadmaps[0] ? roadmaps[0]._id : null;
    render();
  } catch (e) { toast(e.message, 'error'); }
})();