const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

const NAV = [
  ['dashboard', 'Dashboard', '/dashboard.html', 'grid'],
  ['profile', 'Profile', '/profile.html', 'user'],
  ['skills', 'Skills', '/skills.html', 'zap'],
  ['projects', 'Projects', '/projects.html', 'folder'],
  ['achievements', 'Achievements', '/achievements.html', 'award'],
  ['goals', 'Goals', '/goals.html', 'target'],
  ['roadmap', 'Learning Roadmap', '/roadmap.html', 'map'],
  ['progress', 'Progress', '/progress.html', 'chart'],
  ['settings', 'Settings', '/settings.html', 'settings'],
];

let currentUser = null;

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' h ago';
  const days = Math.floor(h / 24);
  return days < 7 ? days + ' d ago' : fmtDate(d);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------- App start: authenticate and build the shell ---------- */
async function initApp() {
  if (!getToken()) {
    window.location.href = '/login.html';
    return null;
  }
  try {
    currentUser = await api('/auth/me');
  } catch (err) {
    toast(err.message, 'error');
    return null;
  }
  renderShell();
  return currentUser;
}

function refreshTopbarUser(user) {
  currentUser = user;
  const el = document.querySelector('.topbar-user');
  if (el) el.innerHTML = avatarHtml(user);
}

function renderShell() {
  const page = document.body.dataset.page;

  document.getElementById('sidebar').innerHTML = `
    <a class="brand" href="/dashboard.html"><span class="logo">S</span><span>SkillFolio</span></a>
    <nav class="nav">
      ${NAV.map(([key, label, href, ic]) => `<a href="${href}" class="${key === page ? 'active' : ''}">${icon(ic)}<span>${label}</span></a>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <a class="nav-link" href="/u/${esc(currentUser.username)}" target="_blank" rel="noopener" style="text-decoration:none">${icon('globe')}<span>Public portfolio</span></a>
      <button class="nav-link" id="logoutBtn">${icon('logout')}<span>Log out</span></button>
    </div>`;

  document.getElementById('topbar').innerHTML = `
    <button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">${icon('menu')}</button>
    <div class="search">
      <input id="searchInput" type="search" placeholder="Search skills, projects, goals..." autocomplete="off">
      <div id="searchResults" class="dropdown hidden"></div>
    </div>
    <div class="topbar-actions">
      <button class="icon-btn" id="themeBtn" title="Toggle light/dark mode">${icon('moon')}</button>
      <div class="relative notif-wrap">
        <button class="icon-btn" id="bellBtn" title="Notifications">${icon('bell')}<span id="bellBadge" class="badge-dot hidden"></span></button>
        <div id="notifPanel" class="dropdown dropdown-right hidden"></div>
      </div>
      <a href="/profile.html" class="topbar-user" title="My profile">${avatarHtml(currentUser)}</a>
    </div>`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('themeBtn').onclick = toggleTheme;
  document.getElementById('menuBtn').onclick = () => document.body.classList.toggle('sidebar-open');
  overlay.onclick = () => document.body.classList.remove('sidebar-open');

  setupSearch();
  setupNotifications();
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  const box = document.getElementById('searchResults');
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) return box.classList.add('hidden');
    timer = setTimeout(async () => {
      try {
        const results = await api('/search?q=' + encodeURIComponent(q));
        box.innerHTML = results.length
          ? results.map((r) => `<a class="result" href="${r.url}"><strong>${esc(r.title)}</strong><span class="muted small">${r.type}${r.sub ? ' · ' + esc(r.sub) : ''}</span></a>`).join('')
          : '<div class="dropdown-empty">No results found</div>';
        box.classList.remove('hidden');
      } catch (err) { /* ignore */ }
    }, 300);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search')) box.classList.add('hidden');
  });
}

function setupNotifications() {
  const bell = document.getElementById('bellBtn');
  const panel = document.getElementById('notifPanel');
  const badge = document.getElementById('bellBadge');
  let unread = 0;

  async function load() {
    try {
      const data = await api('/notifications');
      unread = data.unread;
      badge.classList.toggle('hidden', !unread);
      panel.innerHTML =
        '<div class="dropdown-title">Notifications</div>' +
        (data.items.length
          ? data.items.map((n) => `<div class="notif ${n.read ? '' : 'unread'}">${esc(n.message)}<span>${timeAgo(n.createdAt)}</span></div>`).join('')
          : '<div class="dropdown-empty">You are all caught up</div>');
    } catch (err) { /* ignore */ }
  }

  bell.onclick = async () => {
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden') && unread) {
      badge.classList.add('hidden');
      unread = 0;
      try { await api('/notifications/read-all', { method: 'PUT' }); } catch (err) { /* ignore */ }
    }
  };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-wrap')) panel.classList.add('hidden');
  });
  load();
}

/* ---------- Modal and form builder ---------- */
function openModal(title, bodyHtml) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <div class="modal-body">${bodyHtml}</div></div>`;
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  wrap.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close));
  return { el: wrap, close };
}

function fieldHtml(f, val) {
  const v = val != null ? val : f.default != null ? f.default : '';
  const id = 'f_' + f.name;
  const req = f.required ? 'required' : '';
  let input;
  if (f.type === 'textarea') {
    input = `<textarea id="${id}" name="${f.name}" rows="${f.rows || 4}" maxlength="${f.maxlength || 1500}" placeholder="${esc(f.placeholder || '')}" ${req}>${esc(v)}</textarea>`;
  } else if (f.type === 'select') {
    input = `<select id="${id}" name="${f.name}" ${req}>${f.options.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  } else if (f.type === 'range') {
    input = `<div class="range-row"><input type="range" id="${id}" name="${f.name}" min="0" max="100" step="5" value="${esc(v || 0)}"><output>${esc(v || 0)}%</output></div>`;
  } else {
    input = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}" ${req}
      placeholder="${esc(f.placeholder || '')}" maxlength="${f.maxlength || 200}"
      ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} ${f.step ? `step="${f.step}"` : ''}>`;
  }
  return `<div class="field ${f.full ? 'full' : ''}"><label for="${id}">${esc(f.label)}</label>${input}</div>`;
}

function openForm({ title, fields, values = {}, submitText = 'Save', onSubmit }) {
  const html = `<form class="form-grid">
      ${fields.map((f) => fieldHtml(f, values[f.name])).join('')}
      <div class="form-error full hidden"></div>
      <div class="modal-actions full">
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary">${esc(submitText)}</button>
      </div></form>`;
  const modal = openModal(title, html);
  const form = modal.el.querySelector('form');
  const errBox = form.querySelector('.form-error');

  form.querySelectorAll('input[type=range]').forEach((r) =>
    r.addEventListener('input', () => (r.nextElementSibling.textContent = r.value + '%'))
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {};
    fields.forEach((f) => {
      let v = form.elements[f.name].value;
      if (f.type === 'number' || f.type === 'range') v = v === '' ? null : Number(v);
      data[f.name] = v;
    });
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    errBox.classList.add('hidden');
    try {
      await onSubmit(data);
      modal.close();
    } catch (err) {
      errBox.textContent = err.message;
      errBox.classList.remove('hidden');
      btn.disabled = false;
    }
  });
  return modal;
}

/* Event delegation: buttons with data-action="name" data-id="..." */
function onActions(container, handlers) {
  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || !container.contains(el)) return;
    const fn = handlers[el.dataset.action];
    if (fn) fn(el.dataset.id, el);
  });
}

/* ---------- Charts (plain HTML/CSS, no libraries) ---------- */
function barChart(el, data) {
  const max = Math.max(...data.map((d) => d.value), 1);
  el.innerHTML = `<div class="bars">${data
    .map(
      (d) => `<div class="bar-col" title="${esc(d.title || d.label)}">
        <span class="bar-val">${d.value ? +d.value.toFixed(1) : ''}</span>
        <div class="bar-track"><div class="bar-fill" style="height:${(d.value / max) * 100}%"></div></div>
        <span class="bar-label">${esc(d.label)}</span></div>`
    )
    .join('')}</div>`;
}