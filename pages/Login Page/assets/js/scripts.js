const API_BASE = window.location.pathname.includes('/ECOM-FINALS1/')
  ? `${window.location.origin}/ECOM-FINALS1/api`
  : `${window.location.origin}/api`;

function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('toggleIcon');

  if (!passwordInput || !toggleIcon) return;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.textContent = 'visibility';
  } else {
    passwordInput.type = 'password';
    toggleIcon.textContent = 'visibility_off';
  }
}

function showPopupMessage(message, type = 'success', redirectUrl = null) {
  const popup = document.createElement('div');
  popup.className = `custom-popup ${type}`;
  const icon = type === 'success' ? 'check_circle' : 'error';

  popup.innerHTML = `
    <span class="material-icons popup-icon">${icon}</span>
    <span class="popup-text">${message}</span>
  `;

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.opacity = '0';
    setTimeout(() => {
      popup.remove();
      if (redirectUrl) window.location.href = redirectUrl;
    }, 300);
  }, 1500);
}

async function safeJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(text || 'Invalid server response');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const loginBtn = document.getElementById('loginBtn');
  const nameInput = document.getElementById('name');
  const passwordInput = document.getElementById('password');

  if (!loginBtn) return;

  loginBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!name || !password) {
      showPopupMessage('Please fill in all fields.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ name, password })
      });

      const data = await safeJson(response);

      if (data.success) {
        showPopupMessage('Login successful!', 'success', data.redirect || '../../index.html');
      } else {
        showPopupMessage(data.message || 'Login failed.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showPopupMessage('Login failed.', 'error');
    }
  });
});