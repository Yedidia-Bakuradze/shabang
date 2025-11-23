import React, { useState, useEffect } from "react";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ErdTableNode from "./ErdTableNode";
import { getProject } from "../services/projectService";

const nodeTypes = {
  erdTable: ErdTableNode,
};

/**
 * Project Canvas Page – Tasks 94 + 120
 */
function ProjectCanvas({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const data = await getProject(projectId);
        setProject(data);
        setError(null);
      } catch (err) {
        console.error("Error loading project:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // Convert project entities to ReactFlow nodes
  const getNodesFromEntities = () => {
    if (!project || !project.entities || Object.keys(project.entities).length === 0) {
      // Return demo nodes if no entities exist yet
      return demoNodes;
    }

    // TODO: Convert project.entities to ReactFlow nodes format
    // For now, return demo nodes
    return demoNodes;
  };

  const getEdgesFromRelations = () => {
    if (!project || !project.entities || Object.keys(project.entities).length === 0) {
      return demoEdges;
    }

    // TODO: Convert project relations to ReactFlow edges
    return demoEdges;
  };

  const demoNodes = [
    {
      id: "users",
      position: { x: 0, y: 0 },
      data: {
        label: "users",
        columns: [
          { name: "id", type: "uuid", pk: true },
          { name: "email", type: "varchar(255)" },
          { name: "created_at", type: "timestamp" },
        ],
      },
      type: "erdTable",
    },
    {
      id: "orders",
      position: { x: 350, y: 50 },
      data: {
        label: "orders",
        columns: [
          { name: "id", type: "uuid", pk: true },
          { name: "user_id", type: "uuid", fk: "users.id" },
          { name: "total", type: "numeric" },
        ],
      },
      type: "erdTable",
    },
  ];

  const demoEdges = [
    {
      id: "users-orders",
      source: "users",
      target: "orders",
      label: "1 → n",
      type: "default",
    },
  ];

  const nodes = getNodesFromEntities();
  const edges = getEdgesFromRelations();

  if (loading) {
    return (
      <div className="App" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2>Loading project...</h2>
          <p>Please wait while we load your schema.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#ff6b6b" }}>
          <h2>Error loading project</h2>
          <p>{error}</p>
          <a href="/" style={{ color: "#4a9eff", textDecoration: "underline" }}>
            ← Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="App" style={{ height: "100vh" }}>
      <header
        className="App-header"
        style={{
          height: 70,
          padding: "0 16px",
          justifyContent: "space-between",
          flexDirection: "row",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <h2 style={{ margin: 0 }}>
            {project?.name || `Project #${projectId}`} – Schema Canvas
          </h2>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
            Interactive ERD based on @xyflow/react library.
            {project && Object.keys(project.entities || {}).length === 0 && (
              <span style={{ marginLeft: 8, fontStyle: "italic" }}>
                (Empty project - demo data shown)
              </span>
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a
            href="/"
            style={{
              color: "white",
              fontSize: 13,
              textDecoration: "underline",
            }}
          >
            ← Back to dashboard
          </a>
        </div>
      </header>

      <div style={{ width: "100%", height: "calc(100vh - 70px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

export default ProjectCanvas;
