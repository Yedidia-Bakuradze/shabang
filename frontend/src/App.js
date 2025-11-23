import React, { useState } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import ProjectCanvas from "./components/ProjectCanvas";
import { createProject } from "./services/projectService";
import { getProjectIdFromPath, navigateToProject } from "./utils/routing";

/**
 * Main Application:
 * - If URL is /projects/:id → show ProjectCanvas
 * - Otherwise → show Dashboard
 */
function App() {
  const [isCreating, setIsCreating] = useState(false);

  const projectId = getProjectIdFromPath();
  if (projectId) {
    return <ProjectCanvas projectId={projectId} />;
  }

  const handleCreateProject = async () => {
    try {
      setIsCreating(true);

      const data = await createProject("New project");
      console.log("Created project:", data);

      navigateToProject(data.id);
    } catch (error) {
      console.error("Error while creating project:", error);
      alert("Failed to create project. Please check the console for details.");
      setIsCreating(false);
    }
  };

  return (
    <Dashboard onCreateProject={handleCreateProject} isCreating={isCreating} />
  );
}

export default App;
