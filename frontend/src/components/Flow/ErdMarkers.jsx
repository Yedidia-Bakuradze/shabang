import React from 'react';

const ErdMarkers = () => {
    return (
        <svg
            style={{
                position: 'absolute',
                width: 0,
                height: 0,
                pointerEvents: 'none'
            }}
        >
            <defs>
                {/* Color variables — these work in Dark Mode */}
                <style>{`
                    :root {
                        --marker-stroke: #444;        /* light mode edge color */
                        --marker-bg: white;
                    }
                    .dark :root {
                        --marker-stroke: #e5e5e5;    /* brighter in dark */
                        --marker-bg: #white;        /* dark gray background */
                    }
                `}</style>

                {/* ZERO or ONE (0..1) */}
                <marker
                    id="marker-zero-one"
                    viewBox="0 0 20 20"
                    refX="18"
                    refY="10"
                    markerWidth="16"
                    markerHeight="16"
                    orient="auto-start-reverse"
                >
                    <circle
                        cx="10"
                        cy="10"
                        r="4.5"
                        fill="var(--marker-bg)"
                        stroke="var(--marker-stroke)"
                        strokeWidth="2.2"
                    />
                    <line
                        x1="18"
                        y1="4"
                        x2="18"
                        y2="16"
                        stroke="var(--marker-stroke)"
                        strokeWidth="2.4"
                    />
                </marker>

                {/* ONE (1) */}
                <marker
                    id="marker-one"
                    viewBox="0 0 20 20"
                    refX="18"
                    refY="10"
                    markerWidth="16"
                    markerHeight="16"
                    orient="auto-start-reverse"
                >
                    <line x1="10" y1="4" x2="10" y2="16" stroke="var(--marker-stroke)" strokeWidth="2.4" />
                    <line x1="18" y1="4" x2="18" y2="16" stroke="var(--marker-stroke)" strokeWidth="2.4" />
                </marker>

                {/* ZERO or MANY (0..N) */}
                <marker
                    id="marker-zero-many"
                    viewBox="0 0 20 20"
                    refX="18"
                    refY="10"
                    markerWidth="16"
                    markerHeight="16"
                    orient="auto-start-reverse"
                >
                    <circle
                        cx="8"
                        cy="10"
                        r="4.5"
                        fill="var(--marker-bg)"
                        stroke="var(--marker-stroke)"
                        strokeWidth="2.2"
                    />
                    <path
                        d="M20 4 L8 10 L20 16"
                        fill="none"
                        stroke="var(--marker-stroke)"
                        strokeWidth="2.6"
                    />
                </marker>

                {/* MANY (1..N) */}
                <marker
                    id="marker-many"
                    viewBox="0 0 20 20"
                    refX="18"
                    refY="10"
                    markerWidth="16"
                    markerHeight="16"
                    orient="auto-start-reverse"
                >
                    <line
                        x1="8"
                        y1="4"
                        x2="8"
                        y2="16"
                        stroke="var(--marker-stroke)"
                        strokeWidth="2.4"
                    />
                    <path
                        d="M20 4 L8 10 L20 16"
                        fill="none"
                        stroke="var(--marker-stroke)"
                        strokeWidth="2.6"
                    />
                </marker>
            </defs>
        </svg>
    );
};

export default ErdMarkers;
