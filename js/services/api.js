/**
 * API Service Module
 * Prepared for Spring Boot (Java) REST API integration with JWT Bearer Token support.
 */
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * Helper to get active JWT token from unified session storage
 */
export function getAuthToken() {
  try {
    const sessionData = localStorage.getItem('bharat_auth_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.token || null;
    }
  } catch (e) {
    console.warn('[API Service] Error reading auth session token:', e);
  }
  return null;
}

/**
 * Universal Fetch Abstraction with Automatic Authorization Header Injection
 */
export async function fetchApi(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Parse response json if present
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API Error] Request failed for ${endpoint}:`, error);
    throw error;
  }
}
