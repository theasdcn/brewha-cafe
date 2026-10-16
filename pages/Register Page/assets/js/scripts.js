const API_BASE = window.location.pathname.includes('/ECOM-FINALS1/')
  ? `${window.location.origin}/ECOM-FINALS1/api`
  : `${window.location.origin}/api`;

function togglePassword(inputId, iconId) {
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = document.getElementById(iconId);

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
  const registerBtn = document.getElementById('registerBtn');
  const nameInput = document.getElementById('name');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');

  if (!registerBtn) return;

  registerBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    if (!name || !password || !confirmPassword) {
      showPopupMessage('Please fill in all fields.', 'error');
      return;
    }

    if (name.length < 3) {
      showPopupMessage('Username must be at least 3 characters long.', 'error');
      return;
    }

    if (!/^[A-Za-z0-9_]+$/.test(name)) {
      showPopupMessage('Username can only contain letters, numbers, and underscore.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showPopupMessage('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 8) {
      showPopupMessage('Password must be at least 8 characters long.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ name, password, confirmPassword })
      });

      const data = await safeJson(response);

      if (data.success) {
        showPopupMessage('Registration successful!', 'success', '../Login Page/index.html');
      } else {
        showPopupMessage(data.message || 'Registration failed.', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      showPopupMessage('Registration failed.', 'error');
    }
  });
});