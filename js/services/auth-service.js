/**
 * Authentication Service Module for Bharat Bhumi
 * Handles login API requests, JWT token storage, and session lifecycle.
 */
import { fetchApi } from './api.js';

const SESSION_KEY = 'bharat_auth_session';

/**
 * Authenticates user credentials with Spring Boot backend endpoint POST /api/v1/auth/login
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<Object>} Response session data containing token, userId, username, role
 */
export async function login(username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  const payload = {
    username: username.trim(),
    password: password
  };

  const response = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  // Extract authentication payload properties
  const token = response.token;
  const userId = response.userId || '';
  const respUsername = response.username || username;
  const role = response.role || 'USER';

  if (!token) {
    throw new Error('Invalid server response: Authentication token is missing.');
  }

  // Create unified session object
  const session = {
    token,
    userId,
    username: respUsername,
    role,
    loggedInAt: new Date().toISOString()
  };

  // Persist session consistently in localStorage
  saveSession(session);

  return session;
}

/**
 * Persists session data in localStorage
 */
export function saveSession(sessionData) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('[Auth Service] Failed to save session:', error);
  }
}

/**
 * Retrieves current active authentication session object
 * @returns {Object|null} Session object or null if not authenticated
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('[Auth Service] Failed to parse session:', error);
    return null;
  }
}

/**
 * Checks if a valid user session exists
 * @returns {boolean}
 */
export function isAuthenticated() {
  const session = getSession();
  return Boolean(session && session.token);
}

/**
 * Returns current authenticated user profile
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return {
    userId: session.userId,
    username: session.username,
    role: session.role
  };
}

/**
 * Clears authentication session and logs user out
 * @param {string} redirectUrl - URL to redirect to after logout (defaults to login.html)
 */
export function logout(redirectUrl = 'login.html') {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('[Auth Service] Error clearing auth session:', error);
  }
  // Redirect to specified login page
  window.location.href = redirectUrl;
}

/**
 * Returns the authenticated role in uppercase, or null when logged out.
 * The session role (written by login() from the backend response) is the
 * single source of truth — never inferred from URL, username, or page.
 */
export function getRole() {
  const session = getSession();
  return session && session.role ? String(session.role).toUpperCase() : null;
}

/**
 * Portal home for a role: ADMIN officers use the Admin Portal,
 * everyone else uses the citizen dashboard.
 */
export function portalHomeForRole(role) {
  return String(role || '').toUpperCase() === 'ADMIN' ? 'admin-dashboard.html' : 'dashboard.html';
}

function currentFile() {
  try {
    return window.location.pathname.split('/').pop().toLowerCase().split('?')[0];
  } catch (error) {
    return '';
  }
}

function go(target) {
  // Never redirect to the page we are already on (prevents guard loops).
  try {
    if (currentFile() !== String(target).toLowerCase()) {
      window.location.href = target;
    }
  } catch (error) {
    /* non-browser environment (tests) */
  }
}

/**
 * Central portal guard for protected pages.
 *
 * kind "admin"   → role must be ADMIN (wrong role goes to citizen dashboard)
 * kind "citizen" → role must be USER (wrong role goes to the Admin Portal)
 * kind "any"     → shared pages (e.g. GIS Explorer): any authenticated role
 *
 * Logged-out users always go to login.html. Public pages (index/login)
 * must NOT call this. Also re-checks on bfcache restore so browser
 * Back/Forward after logout cannot expose a cached protected page.
 *
 * Frontend routing only — backend authorization is unchanged and authoritative.
 */
export function requirePortal(kind) {
  const check = () => {
    if (!isAuthenticated()) {
      go('login.html');
      return false;
    }
    const role = getRole();
    if (kind === 'admin' && role !== 'ADMIN') {
      go('dashboard.html');
      return false;
    }
    if (kind === 'citizen' && role !== 'USER') {
      go('admin-dashboard.html');
      return false;
    }
    return true;
  };
  const ok = check();
  try {
    window.addEventListener('pageshow', (event) => {
      if (event && event.persisted) {
        check();
      }
    });
  } catch (error) {
    /* non-browser environment (tests) */
  }
  return ok;
}

/**
 * Auth-only guard for pages shared by both portals (no role routing).
 */
export function requireAuth() {
  return requirePortal('any');
}
