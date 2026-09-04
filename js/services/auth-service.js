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
 */
export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('[Auth Service] Error clearing auth session:', error);
  }
  // Redirect to home or login page
  if (window.location.pathname.endsWith('login.html')) {
    window.location.reload();
  } else {
    window.location.href = 'index.html';
  }
}
