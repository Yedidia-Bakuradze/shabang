import React from "react";

function Dashboard({ onCreateProject, isCreating }) {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Schema Engine Dashboard</h1>

        <p>
          Your project list will appear here in the future. For now, you can create a new project.
        </p>

        <button onClick={onCreateProject} disabled={isCreating}>
          {isCreating ? "Creating Project..." : "Create New Project"}
        </button>
      </header>
    </div>
  );
}

export default Dashboard;
