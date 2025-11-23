import React from "react";

/**
 * Custom Node – ERD Table
 */
function ErdTableNode({ data }) {
  return (
    <div
      style={{
        minWidth: 220,
        background: "#1f2937",
        color: "white",
        borderRadius: 8,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
        fontSize: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "6px 10px",
          background: "#111827",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {data.label}
      </div>
      <div style={{ padding: "4px 10px" }}>
        {data.columns?.map((col) => (
          <div
            key={col.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "2px 0",
              opacity: col.pk ? 1 : 0.9,
            }}
          >
            <span>
              {col.name}
              {col.pk && " 🔑"}
              {col.fk && " 🔗"}
            </span>
            <span style={{ opacity: 0.8 }}>{col.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ErdTableNode;
