const CATEGORIES = ['Programming', 'Frontend', 'Backend', 'Database', 'Design', 'DevOps', 'Data Science', 'Soft Skills', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

(async () => {
  if (!(await initApp())) return;
  let skills = [];
  const listEl = document.getElementById('list');
  const filterEl = document.getElementById('filterCategory');
  filterEl.innerHTML = ['All'].concat(CATEGORIES).map((c) => `<option value="${c}">${c === 'All' ? 'All categories' : c}</option>`).join('');

  const fields = [
    { name: 'name', label: 'Skill name', required: true, full: true, maxlength: 60, placeholder: 'e.g. JavaScript' },
    { name: 'category', label: 'Category', type: 'select', options: CATEGORIES, default: 'Programming' },
    { name: 'level', label: 'Level', type: 'select', options: LEVELS },
    { name: 'progress', label: 'Progress', type: 'range', full: true },
    { name: 'notes', label: 'Notes (optional)', type: 'textarea', rows: 3, full: true, maxlength: 500 },
  ];

  function render() {
    const cat = filterEl.value;
    const shown = skills.filter((s) => cat === 'All' || s.category === cat);
    if (!shown.length) {
      listEl.innerHTML = `<div class="card empty"><h3>${skills.length ? 'No skills in this category' : 'No skills yet'}</h3><p class="muted">${skills.length ? 'Try another category.' : 'Add your first skill to start tracking your progress.'}</p></div>`;
      return;
    }
    listEl.innerHTML = shown.map((s) => `
      <article class="card">
        <div class="card-head">
          <div><h3>${esc(s.name)}</h3><span class="badge">${esc(s.category)}</span> <span class="badge badge-${s.level.toLowerCase()}">${s.level}</span></div>
          <div class="actions">
            <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${s._id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="del" data-id="${s._id}">Delete</button>
          </div>
        </div>
        ${progressBar(s.progress)}
        <div class="progress-meta"><span>Proficiency</span><strong>${s.progress}%</strong></div>
        ${s.notes ? `<p class="muted small" style="margin-top:.5rem">${esc(s.notes)}</p>` : ''}
      </article>`).join('');
  }

  async function load() {
    try { skills = await api('/skills'); render(); } catch (e) { toast(e.message, 'error'); }
  }

  document.getElementById('addBtn').onclick = () =>
    openForm({
      title: 'Add skill', fields, submitText: 'Add skill',
      onSubmit: async (d) => { skills.unshift(await api('/skills', { method: 'POST', body: d })); render(); toast('Skill added'); },
    });

  onActions(listEl, {
    edit: (id) => {
      const s = skills.find((x) => x._id === id);
      openForm({
        title: 'Edit skill', fields, values: s,
        onSubmit: async (d) => {
          const updated = await api('/skills/' + id, { method: 'PUT', body: d });
          skills = skills.map((x) => (x._id === id ? updated : x));
          render(); toast('Skill updated');
        },
      });
    },
    del: async (id) => {
      if (!confirm('Delete this skill?')) return;
      try { await api('/skills/' + id, { method: 'DELETE' }); skills = skills.filter((x) => x._id !== id); render(); toast('Skill deleted'); }
      catch (e) { toast(e.message, 'error'); }
    },
  });
  filterEl.onchange = render;
  load();
})();