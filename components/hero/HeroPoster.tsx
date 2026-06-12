/**
 * The static dramatic poster: an agency command-center space rendered as inline
 * SVG. This is the Largest Contentful Paint base of the hero and the fallback
 * whenever the WebGL scene cannot or should not run (reduced motion, no WebGL,
 * save-data, a slow link, low core or memory counts). Because it is server
 * rendered SVG it paints on first paint, so the LCP never waits on WebGL.
 *
 * It draws a converging floor grid, a tactical network of nodes wired over it,
 * and a glowing central core, lit in the cool accent. Purely decorative and
 * aria-hidden; the hero's heading carries the meaning.
 */
export function HeroPoster() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      <defs>
        <radialGradient id="hp-sky" cx="50%" cy="22%" r="80%">
          <stop offset="0%" stopColor="#12253b" />
          <stop offset="45%" stopColor="#0a1018" />
          <stop offset="100%" stopColor="#07090d" />
        </radialGradient>
        <radialGradient id="hp-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bfe0ff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#5ba8f5" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#5ba8f5" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hp-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ba8f5" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#5ba8f5" stopOpacity="0.22" />
        </linearGradient>
        <filter id="hp-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="1600" height="900" fill="url(#hp-sky)" />

      {/* Converging floor grid below the horizon at y=520. */}
      <g stroke="#5ba8f5" strokeOpacity="0.18" strokeWidth="1.2">
        {Array.from({ length: 13 }).map((_, i) => {
          const x = (i / 12) * 1600;
          return <line key={`v${i}`} x1={x} y1="900" x2={800} y2="520" />;
        })}
        {Array.from({ length: 8 }).map((_, i) => {
          const t = i / 7;
          const y = 520 + t * t * 380;
          return <line key={`h${i}`} x1="0" y1={y} x2="1600" y2={y} />;
        })}
      </g>
      <rect y="520" width="1600" height="380" fill="url(#hp-floor)" />

      {/* The tactical network above the horizon. */}
      <g stroke="#5ba8f5" strokeOpacity="0.22" strokeWidth="1">
        {NETWORK_EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a][0]}
            y1={NODES[a][1]}
            x2={NODES[b][0]}
            y2={NODES[b][1]}
          />
        ))}
      </g>
      <g>
        {NODES.map(([x, y, r, hot], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill={hot ? "#f59e42" : "#9cc8fb"}
            fillOpacity={hot ? 0.95 : 0.8}
          />
        ))}
      </g>

      {/* The glowing core. */}
      <circle cx="800" cy="430" r="190" fill="url(#hp-core)" />
      <circle
        cx="800"
        cy="430"
        r="10"
        fill="#dff0ff"
        filter="url(#hp-glow)"
      />

      {/* A faint vignette to ground the edges. */}
      <rect
        width="1600"
        height="900"
        fill="#07090d"
        fillOpacity="0.0"
        stroke="#07090d"
        strokeOpacity="0.5"
        strokeWidth="120"
      />
    </svg>
  );
}

// A small, deterministic node field and a few edges so the poster reads as a
// network without any randomness at render time.
const NODES: [number, number, number, boolean][] = [
  [300, 250, 4, false],
  [520, 180, 3, false],
  [470, 360, 5, true],
  [700, 300, 3, false],
  [880, 230, 4, false],
  [1040, 330, 5, true],
  [1180, 220, 3, false],
  [1320, 360, 4, false],
  [220, 420, 3, false],
  [640, 460, 4, false],
  [980, 470, 3, false],
  [1260, 470, 5, true],
  [400, 150, 3, false],
  [760, 150, 3, false],
  [1120, 150, 4, false],
];

const NETWORK_EDGES: [number, number][] = [
  [0, 2],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [0, 8],
  [2, 9],
  [3, 9],
  [5, 10],
  [7, 11],
  [10, 11],
  [12, 1],
  [13, 4],
  [14, 6],
];
