/**
 * Utility helper for managing session-based vs. persistent ("Remember Me") authentication storage.
 * - When rememberMe is FALSE (default): Credentials stored in sessionStorage (cleared automatically on tab close).
 * - When rememberMe is TRUE: Credentials stored in localStorage (persists across tab closes and device restarts).
 */

export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
}

export function getStoredUser() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function setStoredAuth(token, user, rememberMe = false) {
  const userStr = typeof user === 'string' ? user : JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', userStr);
    localStorage.setItem('rememberMe', 'true');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  } else {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', userStr);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
  }
}

export function updateStoredUser(user) {
  const isRemembered = localStorage.getItem('rememberMe') === 'true' || !!localStorage.getItem('token');
  const userStr = typeof user === 'string' ? user : JSON.stringify(user);
  if (isRemembered) {
    localStorage.setItem('user', userStr);
  } else {
    sessionStorage.setItem('user', userStr);
  }
}

export function clearStoredAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}
