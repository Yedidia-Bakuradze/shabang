/**
 * Service for handling project-related API calls
 */

export const createProject = async (projectName = "New project") => {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: projectName }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create project: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
};
