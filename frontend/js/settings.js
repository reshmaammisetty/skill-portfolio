(async () => {
  let me = await initApp();
  if (!me) return;

  const $ = (id) => document.getElementById(id);
  const showErr = (id, msg) => { $(id).textContent = msg; $(id).classList.remove('hidden'); };
  const hideErr = (id) => $(id).classList.add('hidden');

  function fill() {
    $('name').value = me.name;
    $('headline').value = me.headline || '';
    $('email').value = me.email;
    $('username').value = me.username;
    $('isPublic').value = String(me.isPublic);
    $('urlPreview').textContent = `${location.origin}/u/${me.username}`;
  }
  fill();

  $('username').addEventListener('input', () => ($('urlPreview').textContent = `${location.origin}/u/${$('username').value.toLowerCase()}`));

  $('accountForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErr('accountError');
    try {
      me = await api('/users/profile', {
        method: 'PUT',
        body: { name: $('name').value, headline: $('headline').value, username: $('username').value, isPublic: $('isPublic').value === 'true' },
      });
      refreshTopbarUser(me);
      fill();
      toast('Account settings saved');
    } catch (err) { showErr('accountError', err.message); }
  });

  $('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErr('passwordError');
    if ($('newPassword').value !== $('confirmPassword').value) return showErr('passwordError', 'New passwords do not match');
    try {
      await api('/users/password', { method: 'PUT', body: { currentPassword: $('currentPassword').value, newPassword: $('newPassword').value } });
      e.target.reset();
      toast('Password changed');
    } catch (err) { showErr('passwordError', err.message); }
  });

  $('themeToggle').onclick = toggleTheme;
  $('logoutBtn2').onclick = logout;

  $('deleteBtn').onclick = () =>
    openForm({
      title: 'Delete account', submitText: 'Delete permanently',
      fields: [{ name: 'password', label: 'Enter your password to confirm. This cannot be undone.', type: 'password', required: true, full: true }],
      onSubmit: async (d) => {
        await api('/users/me', { method: 'DELETE', body: { password: d.password } });
        localStorage.removeItem('token');
        window.location.href = '/';
      },
    });
})();