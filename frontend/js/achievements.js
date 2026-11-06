(async () => {
  if (!(await initApp())) return;
  let items = [];
  const listEl = document.getElementById('list');
  const filterEl = document.getElementById('filterType');

  const fields = [
    { name: 'title', label: 'Title', required: true, full: true, maxlength: 120, placeholder: 'e.g. Full-Stack Web Development Certificate' },
    { name: 'type', label: 'Type', type: 'select', options: ['Certificate', 'Coding Competition', 'Course Completion', 'Other'] },
    { name: 'date', label: 'Date', type: 'date', required: true, default: todayStr() },
    { name: 'issuer', label: 'Issuer / organizer', full: true, maxlength: 100, placeholder: 'e.g. Coursera, HackerRank' },
    { name: 'credentialUrl', label: 'Certificate / credential link', type: 'url', full: true, maxlength: 300 },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3, full: true, maxlength: 600 },
  ];

  function render() {
    const t = filterEl.value;
    const shown = items.filter((a) => t === 'All' || a.type === t);
    if (!shown.length) {
      listEl.innerHTML = `<div class="card empty"><h3>${items.length ? 'Nothing of this type' : 'No achievements yet'}</h3><p class="muted">${items.length ? 'Try another filter.' : 'Add certificates and wins as you earn them.'}</p></div>`;
      return;
    }
    listEl.innerHTML = shown.map((a) => `
      <article class="card">
        <div class="card-head">
          <div><h3>${esc(a.title)}</h3><span class="badge">${esc(a.type)}</span></div>
          <div class="actions">
            <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${a._id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="del" data-id="${a._id}">Delete</button>
          </div>
        </div>
        <p class="small muted">${esc(a.issuer)}${a.issuer ? ' · ' : ''}${fmtDate(a.date)}</p>
        ${a.description ? `<p class="small" style="margin-top:.4rem">${esc(a.description)}</p>` : ''}
        ${a.credentialUrl ? `<div class="links" style="margin-top:.6rem"><a href="${safeUrl(a.credentialUrl)}" target="_blank" rel="noopener noreferrer">View credential</a></div>` : ''}
      </article>`).join('');
  }

  const sortItems = () => items.sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById('addBtn').onclick = () =>
    openForm({
      title: 'Add achievement', fields, submitText: 'Add achievement',
      onSubmit: async (d) => { items.push(await api('/achievements', { method: 'POST', body: d })); sortItems(); render(); toast('Achievement added'); },
    });

  onActions(listEl, {
    edit: (id) => {
      const a = items.find((x) => x._id === id);
      openForm({
        title: 'Edit achievement', fields, values: { ...a, date: dateInput(a.date) },
        onSubmit: async (d) => {
          const updated = await api('/achievements/' + id, { method: 'PUT', body: d });
          items = items.map((x) => (x._id === id ? updated : x));
          sortItems(); render(); toast('Achievement updated');
        },
      });
    },
    del: async (id) => {
      if (!confirm('Delete this achievement?')) return;
      try { await api('/achievements/' + id, { method: 'DELETE' }); items = items.filter((x) => x._id !== id); render(); toast('Achievement deleted'); }
      catch (e) { toast(e.message, 'error'); }
    },
  });

  filterEl.onchange = render;
  try { items = await api('/achievements'); render(); } catch (e) { toast(e.message, 'error'); }
})();