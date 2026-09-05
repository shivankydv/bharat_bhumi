/**
 * Authentication Page Logic (js/auth.js)
 * Manages UI tabs, validation, password visibility, and Spring Boot API integration.
 */
import { login, isAuthenticated, getCurrentUser } from './services/auth-service.js';

// Single role router: ADMIN officers go to the Admin Portal, everyone else
// goes to the citizen dashboard. Uses the actual backend role from session.
function landingPageForSession() {
  const role = String(getCurrentUser()?.role || "USER").toUpperCase();
  return role === "ADMIN" ? "admin-dashboard.html" : "dashboard.html";
}

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, resume in the correct portal for the stored role
  if (isAuthenticated()) {
    console.log('[Auth] User already authenticated. Redirecting by role...');
    window.location.href = landingPageForSession();
    return;
  }

  // Element Selectors
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  const alertContainer = document.getElementById('auth-alert');
  const alertIcon = document.getElementById('auth-alert-icon');
  const alertMessage = document.getElementById('auth-alert-message');

  const toggleLoginPass = document.getElementById('toggle-login-password');
  const loginPassInput = document.getElementById('login-password');

  const toggleSignupPass = document.getElementById('toggle-signup-password');
  const signupPassInput = document.getElementById('signup-password');

  const loginUsernameInput = document.getElementById('login-username');
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const loginSpinner = document.getElementById('login-spinner');
  const loginBtnText = document.getElementById('login-btn-text');

  const forgotPasswordLink = document.getElementById('forgot-password-link');

  // --- TAB SWITCHER LOGIC ---
  function setActiveTab(mode) {
    hideAlert();

    if (mode === 'login') {
      // Login Active
      tabLogin.className = 'flex-1 py-2.5 px-4 text-center rounded-md font-label-md font-bold text-label-md transition-all duration-200 bg-primary text-on-primary shadow-sm flex items-center justify-center gap-2';
      tabSignup.className = 'flex-1 py-2.5 px-4 text-center rounded-md font-label-md font-bold text-label-md transition-all duration-200 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center gap-2';

      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');

      loginUsernameInput.focus();
    } else {
      // Signup Active
      tabSignup.className = 'flex-1 py-2.5 px-4 text-center rounded-md font-label-md font-bold text-label-md transition-all duration-200 bg-primary text-on-primary shadow-sm flex items-center justify-center gap-2';
      tabLogin.className = 'flex-1 py-2.5 px-4 text-center rounded-md font-label-md font-bold text-label-md transition-all duration-200 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center gap-2';

      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');

      document.getElementById('signup-username').focus();
    }
  }

  if (tabLogin) tabLogin.addEventListener('click', () => setActiveTab('login'));
  if (tabSignup) tabSignup.addEventListener('click', () => setActiveTab('signup'));

  // --- PASSWORD VISIBILITY TOGGLE ---
  if (toggleLoginPass && loginPassInput) {
    toggleLoginPass.addEventListener('click', () => {
      const isPassword = loginPassInput.type === 'password';
      loginPassInput.type = isPassword ? 'text' : 'password';
      const icon = toggleLoginPass.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = isPassword ? 'visibility_off' : 'visibility';
    });
  }

  if (toggleSignupPass && signupPassInput) {
    toggleSignupPass.addEventListener('click', () => {
      const isPassword = signupPassInput.type === 'password';
      signupPassInput.type = isPassword ? 'text' : 'password';
      const icon = toggleSignupPass.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = isPassword ? 'visibility_off' : 'visibility';
    });
  }

  // --- ALERT MESSAGING HELPERS ---
  function showAlert(message, type = 'error') {
    if (!alertContainer || !alertMessage) return;

    alertMessage.innerHTML = message;
    alertContainer.classList.remove('hidden');

    if (type === 'error') {
      alertContainer.className = 'mb-6 p-4 rounded-lg border border-error/30 bg-error-container text-on-error-container text-body-md flex items-start gap-3 transition-all duration-200';
      if (alertIcon) alertIcon.textContent = 'error';
    } else if (type === 'success') {
      alertContainer.className = 'mb-6 p-4 rounded-lg border border-[#16a34a]/30 bg-[#16a34a]/10 text-[#16a34a] text-body-md flex items-start gap-3 transition-all duration-200';
      if (alertIcon) alertIcon.textContent = 'check_circle';
    } else if (type === 'info') {
      alertContainer.className = 'mb-6 p-4 rounded-lg border border-primary/30 bg-primary-container/10 text-primary-container text-body-md flex items-start gap-3 transition-all duration-200';
      if (alertIcon) alertIcon.textContent = 'info';
    }
  }

  function hideAlert() {
    if (alertContainer) alertContainer.classList.add('hidden');
  }

  // --- LOGIN SUBMISSION HANDLER ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const username = loginUsernameInput.value.trim();
      const password = loginPassInput.value;

      if (!username || !password) {
        showAlert('Please enter both username and password.');
        return;
      }

      // UI Loading state
      btnLoginSubmit.disabled = true;
      if (loginSpinner) loginSpinner.classList.remove('hidden');
      if (loginBtnText) loginBtnText.textContent = 'Signing in...';

      try {
        const session = await login(username, password);

        showAlert(`Login successful! Welcome back, <strong>${session.username}</strong> (${session.role}).`, 'success');

        // saveSession (inside login) overwrites any stale session; route by the
        // fresh backend role after a brief pause
        const target = String(session.role || "USER").toUpperCase() === "ADMIN"
          ? "admin-dashboard.html"
          : "dashboard.html";
        setTimeout(() => {
          window.location.href = target;
        }, 800);

      } catch (error) {
        console.error('[Auth] Login error:', error);
        
        let msg = 'Authentication failed. Please check your credentials and try again.';
        if (error.status === 401 || error.status === 400) {
          msg = 'Invalid username or password.';
        } else if (error.message && error.message !== 'Failed to fetch') {
          msg = error.message;
        } else if (error.message === 'Failed to fetch') {
          msg = 'Unable to connect to authentication server. Please verify backend service on http://localhost:8080.';
        }

        showAlert(msg, 'error');

        // Reset button state
        btnLoginSubmit.disabled = false;
        if (loginSpinner) loginSpinner.classList.add('hidden');
        if (loginBtnText) loginBtnText.textContent = 'Sign In';
      }
    });
  }

  // --- SIGNUP SUBMISSION HANDLER ---
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideAlert();

      const username = document.getElementById('signup-username').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      const role = document.getElementById('signup-role').value;

      if (!username || !password || !confirmPassword) {
        showAlert('Please complete all required signup fields.');
        return;
      }

      if (password !== confirmPassword) {
        showAlert('Passwords do not match. Please re-enter passwords carefully.');
        return;
      }

      // Requirement 4: Public registration endpoint is NOT available in backend.
      // Do not invent fake API call or fake success.
      showAlert(
        `<strong>Public Registration Unavailable</strong><br>` +
        `Account creation for <strong>${username}</strong> (${role}) requires administrator authorization. ` +
        `Public self-registration is currently disabled on the backend. Please contact your system administrator.`,
        'info'
      );
    });
  }

  // Forgot Password placeholder click
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showAlert('Password reset service is managed by state administrators. Please contact your local District Magistrate land department.', 'info');
    });
  }
});
