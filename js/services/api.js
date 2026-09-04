/**
 * API Service Module
 * Prepared for future Spring Boot (Java) REST API integration.
 */
const API_BASE_URL = window.API_BASE_URL || '/api/v1';

export async function fetchApi(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[API Error] Request failed for ${endpoint}:`, error);
    throw error;
  }
}
