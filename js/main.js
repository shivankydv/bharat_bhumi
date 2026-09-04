/**
 * Main Application Script
 * Bharat Bhumi Landing Pages
 */
import { isAuthenticated, getCurrentUser, logout } from './services/auth-service.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Bharat Bhumi Frontend Initialized');

  // Check auth session state to render dynamic navigation header
  const authNavContainer = document.getElementById('auth-nav-container');

  if (authNavContainer && isAuthenticated()) {
    const user = getCurrentUser();
    const username = user?.username || 'User';
    const role = user?.role || 'USER';

    authNavContainer.innerHTML = `
      <span class="hidden md:block text-label-md font-label-md text-on-primary/80">Language: EN/HI</span>
      <div class="flex items-center gap-3">
        <a href="dashboard.html" title="Open Citizen Dashboard" class="flex items-center gap-2 bg-on-primary/10 hover:bg-on-primary/20 px-3 py-1.5 rounded-md border border-on-primary/20 transition-colors">
          <span class="material-symbols-outlined text-on-primary text-[20px]">account_circle</span>
          <div class="flex flex-col text-left">
            <span class="text-on-primary text-label-md font-bold leading-none">${username}</span>
            <span class="text-on-primary/70 text-[10px] uppercase font-bold tracking-wider">${role} • Dashboard</span>
          </div>
        </a>
        <button id="btn-nav-logout" title="Sign Out" class="bg-error/20 hover:bg-error/30 text-on-primary border border-error/40 px-3 py-1.5 rounded-md text-label-md font-label-md font-semibold transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-[18px]">logout</span>
          <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    `;

    const btnLogout = document.getElementById('btn-nav-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        logout();
      });
    }
  }
});
