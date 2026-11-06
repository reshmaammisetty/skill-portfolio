const errorBox = document.getElementById('formError');
const successBox = document.getElementById('formSuccess');

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}

function handleForm(formId, fn) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await fn(Object.fromEntries(new FormData(form)), form);
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
    }
  });
}

handleForm('loginForm', async (d) => {
  localStorage.removeItem('token'); // clear any stale session first
  const res = await api('/auth/login', { method: 'POST', body: { email: d.email, password: d.password } });
  setToken(res.token);
  window.location.href = '/dashboard.html';
});

handleForm('registerForm', async (d) => {
  if (d.password !== d.confirm) throw new Error('Passwords do not match');
  localStorage.removeItem('token');
  const res = await api('/auth/register', { method: 'POST', body: { name: d.name, email: d.email, password: d.password } });
  setToken(res.token);
  window.location.href = '/dashboard.html';
});

handleForm('forgotForm', async (d, form) => {
  const res = await api('/auth/forgot-password', { method: 'POST', body: { email: d.email } });
  let html = esc(res.message);
  // Development only: the server returns the link so the flow can be tested without an email service
  if (res.devResetLink) {
    html += `<br><br><strong>Dev mode:</strong> <a href="${esc(res.devResetLink)}">Open reset link</a>`;
  }
  successBox.innerHTML = html;
  successBox.classList.remove('hidden');
  form.reset();
});

handleForm('resetForm', async (d, form) => {
  if (d.password !== d.confirm) throw new Error('Passwords do not match');
  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) throw new Error('Reset link is missing its token. Request a new one.');
  const res = await api('/auth/reset-password', { method: 'POST', body: { token, password: d.password } });
  successBox.innerHTML = esc(res.message) + ' <a href="/login.html">Log in</a>';
  successBox.classList.remove('hidden');
  form.classList.add('hidden');
});