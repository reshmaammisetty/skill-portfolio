document.getElementById('themeBtn').onclick = toggleTheme;

if (getToken()) {
  const login = document.getElementById('loginLink');
  const nav = document.getElementById('ctaNav');
  const main = document.getElementById('ctaMain');
  login.classList.add('hidden');
  nav.textContent = 'Go to dashboard';
  nav.href = '/dashboard.html';
  main.textContent = 'Go to dashboard';
  main.href = '/dashboard.html';
}