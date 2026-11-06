const TOKEN_KEY = 'token';
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = '/login.html';
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  const data = await res.json().catch(() => null);
  if (res.status === 401 && token) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error((data && data.message) || 'Something went wrong');
  return data;
}

/* ---------- Small helpers ---------- */
const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Only allow http(s) links in href attributes
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '#');

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';

const dateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function avatarHtml(user, cls) {
  cls = cls || '';
  return user.avatar
    ? `<img class="avatar ${cls}" src="${esc(user.avatar)}" alt="${esc(user.name)}">`
    : `<div class="avatar ${cls}">${esc(initials(user.name))}</div>`;
}

function progressBar(pct, cls) {
  return `<div class="progress"><div class="progress-bar ${cls || ''}" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>`;
}

function toast(msg, type) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'error' ? 'error' : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}