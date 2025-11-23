import React from "react";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ErdTableNode from "./ErdTableNode";

const nodeTypes = {
  erdTable: ErdTableNode,
};

/**
 * Project Canvas Page – Tasks 94 + 120
 */
function ProjectCanvas({ projectId }) {
  const initialNodes = [
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

  const initialEdges = [
    {
      id: "users-orders",
      source: "users",
      target: "orders",
      label: "1 → n",
      type: "default",
    },
  ];

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
          <h2 style={{ margin: 0 }}>Project #{projectId} – Schema Canvas</h2>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
            Interactive ERD based on @xyflow/react library.
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
          nodes={initialNodes}
          edges={initialEdges}
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
