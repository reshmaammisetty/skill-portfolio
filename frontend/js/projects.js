(async () => {
  if (!(await initApp())) return;
  let projects = [];
  const listEl = document.getElementById('list');
  const filterEl = document.getElementById('filterStatus');
  const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

  const fields = [
    { name: 'title', label: 'Project title', required: true, full: true, maxlength: 100 },
    { name: 'description', label: 'Description', type: 'textarea', full: true, maxlength: 1500 },
    { name: 'technologies', label: 'Technologies used (comma separated)', full: true, placeholder: 'HTML, CSS, JavaScript, Node.js' },
    { name: 'githubUrl', label: 'GitHub repository link', type: 'url', maxlength: 300, placeholder: 'https://github.com/...' },
    { name: 'liveUrl', label: 'Live project link', type: 'url', maxlength: 300, placeholder: 'https://...' },
    { name: 'status', label: 'Status', type: 'select', options: ['Planned', 'In Progress', 'Completed'], default: 'In Progress' },
  ];

  const toPayload = (d) => ({ ...d, technologies: d.technologies.split(',').map((t) => t.trim()).filter(Boolean) });

  function render() {
    const st = filterEl.value;
    const shown = projects.filter((p) => st === 'All' || p.status === st);
    if (!shown.length) {
      listEl.innerHTML = `<div class="card empty"><h3>${projects.length ? 'No projects with this status' : 'No projects yet'}</h3><p class="muted">${projects.length ? 'Try another filter.' : 'Add a project to build your portfolio.'}</p></div>`;
      return;
    }
    listEl.innerHTML = shown.map((p) => `
      <article class="card">
        <div class="card-head"><h3>${esc(p.title)}</h3><span class="badge badge-${slug(p.status)}">${p.status}</span></div>
        ${p.description ? `<p class="small">${esc(p.description)}</p>` : ''}
        <div class="chips">${p.technologies.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
        <div class="card-foot">
          <div class="links">
            ${p.githubUrl ? `<a href="${safeUrl(p.githubUrl)}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}
            ${p.liveUrl ? `<a href="${safeUrl(p.liveUrl)}" target="_blank" rel="noopener noreferrer">Live demo</a>` : ''}
          </div>
          <div class="actions">
            <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${p._id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="del" data-id="${p._id}">Delete</button>
          </div>
        </div>
      </article>`).join('');
  }

  document.getElementById('addBtn').onclick = () =>
    openForm({
      title: 'Add project', fields, submitText: 'Add project',
      onSubmit: async (d) => { projects.unshift(await api('/projects', { method: 'POST', body: toPayload(d) })); render(); toast('Project added'); },
    });

  onActions(listEl, {
    edit: (id) => {
      const p = projects.find((x) => x._id === id);
      openForm({
        title: 'Edit project', fields, values: { ...p, technologies: p.technologies.join(', ') },
        onSubmit: async (d) => {
          const updated = await api('/projects/' + id, { method: 'PUT', body: toPayload(d) });
          projects = projects.map((x) => (x._id === id ? updated : x));
          render(); toast('Project updated');
        },
      });
    },
    del: async (id) => {
      if (!confirm('Delete this project?')) return;
      try { await api('/projects/' + id, { method: 'DELETE' }); projects = projects.filter((x) => x._id !== id); render(); toast('Project deleted'); }
      catch (e) { toast(e.message, 'error'); }
    },
  });

  filterEl.onchange = render;
  try { projects = await api('/projects'); render(); } catch (e) { toast(e.message, 'error'); }
})();