const toggle = document.getElementById('togglePassword');
const passwordField = document.getElementById('password');
const loginForm = document.getElementById('loginForm');
const errorEl = document.getElementById('error');
const usernameField = document.getElementById('username');

function togglePasswordVisibility() {
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    toggle.textContent = '🙈';
    toggle.classList.add('active');
    toggle.setAttribute('aria-label', 'Hide password');
  } else {
    passwordField.type = 'password';
    toggle.textContent = '👁';
    toggle.classList.remove('active');
    toggle.setAttribute('aria-label', 'Show password');
  }
}

toggle.addEventListener('click', togglePasswordVisibility);
toggle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    togglePasswordVisibility();
  }
});

// ----------------------
// Per-username Lockout mechanism with live countdown
// ----------------------
let countdownTimer = null;

function getLockoutInfo(username) {
  return JSON.parse(localStorage.getItem("loginLockout_" + username)) || { attempts: 0, lockedUntil: 0 };
}

function setLockoutInfo(username, info) {
  localStorage.setItem("loginLockout_" + username, JSON.stringify(info));
}

function isLockedOut(username) {
  const { lockedUntil } = getLockoutInfo(username);
  return Date.now() < lockedUntil;
}

// Show live countdown
function startCountdown(username) {
  clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    const { lockedUntil } = getLockoutInfo(username);
    const remainingMs = lockedUntil - Date.now();

    if (remainingMs <= 0) {
      clearInterval(countdownTimer);
      errorEl.textContent = "";
      return;
    }

    const mins = Math.floor(remainingMs / 1000 / 60);
    const secs = Math.floor((remainingMs / 1000) % 60);
    errorEl.textContent = `Too many failed attempts. Please try again in ${mins}m ${secs}s.`;
  }, 1000);
}

// ✅ Stop countdown & clear error if switching username
usernameField.addEventListener('input', () => { 
  clearInterval(countdownTimer);
  errorEl.textContent = '';
});

passwordField.addEventListener('input', () => { errorEl.textContent = ''; });

loginForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const username = usernameField.value.trim();
  const password = passwordField.value.trim();
  const lockout = getLockoutInfo(username);

  // Check if locked
  if (isLockedOut(username)) {
    startCountdown(username);
    passwordField.value = "";
    passwordField.focus();
    return;
  }

  fetch('../php/admin-login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  })
  .then(response => response.text())
  .then(text => {
    const data = JSON.parse(text);
    if (data.success) {
      // ✅ Login success: reset attempts
      setLockoutInfo(username, { attempts: 0, lockedUntil: 0 });
      clearInterval(countdownTimer);

      if (data.role === "students") {
        localStorage.setItem("loggedStudentId", data.user_id);
      }
      window.location.href = data.redirect;  
    } else {
      // ❌ Login failed
      lockout.attempts++;
      passwordField.value = "";
      passwordField.focus();

      if (lockout.attempts >= 3) {
        lockout.lockedUntil = Date.now() + (5 * 60 * 1000); // 5 minutes
        lockout.attempts = 0;
        setLockoutInfo(username, lockout);
        startCountdown(username);
      } else {
        errorEl.textContent = data.message || `Invalid username or password. Attempt ${lockout.attempts}/3.`;
        setLockoutInfo(username, lockout);
      }
    }
  })
  .catch(err => {
    console.error("Fetch error:", err);
    errorEl.textContent = 'Error connecting to server.';
    passwordField.value = "";
    passwordField.focus();
  });
});
