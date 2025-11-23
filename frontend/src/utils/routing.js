/**
 * Utility functions for routing
 */

/**
 * Parse the current pathname to extract project ID
 * @returns {string|null} Project ID or null if not on a project page
 */
export const getProjectIdFromPath = () => {
  const path = window.location.pathname;
  if (path.startsWith("/projects/")) {
    const parts = path.split("/");
    return parts[2] || null;
  }
  return null;
};

/**
 * Navigate to a specific project page
 * @param {string} projectId - The project ID to navigate to
 */
export const navigateToProject = (projectId) => {
  window.location.href = `/projects/${projectId}`;
};

/**
 * Navigate to the dashboard
 */
export const navigateToDashboard = () => {
  window.location.href = "/";
};
