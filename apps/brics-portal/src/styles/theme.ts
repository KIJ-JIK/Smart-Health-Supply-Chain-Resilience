// ---------------------------------------------------------------------------
// Design system tokens for BRICS Federated AI Monitoring & Coordination.
// Aligned with the District & National Health Governance Command Center theme:
//   - Dark slate command palette (#0a0f1a, #0d1523, #111827)
//   - High-contrast glowing neon status accents
//   - Cyan, Teal, Indigo brand highlights
// ---------------------------------------------------------------------------

export const colors = {
  bg: {
    base: '#0a0f1a',
    surface: '#0d1523',
    surfaceHover: '#111c2e',
    surfaceActive: '#1e293b',
    border: '#1e293b',
    borderSubtle: '#152238',
    header: '#0d1523',
    sidebar: '#0d1523',
    card: '#111827',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
    inverse: '#0a0f1a',
  },
  status: {
    green: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#34d399',
      dot: '#10b981',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#fbbf24',
      dot: '#f59e0b',
    },
    red: {
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.3)',
      text: '#fb7185',
      dot: '#f43f5e',
    },
    gray: {
      bg: 'rgba(100, 116, 139, 0.12)',
      border: 'rgba(100, 116, 139, 0.3)',
      text: '#94a3b8',
      dot: '#64748b',
    },
    blue: {
      bg: 'rgba(14, 165, 233, 0.12)',
      border: 'rgba(14, 165, 233, 0.3)',
      text: '#38bdf8',
      dot: '#0ea5e9',
    },
    teal: {
      bg: 'rgba(20, 184, 166, 0.12)',
      border: 'rgba(20, 184, 166, 0.3)',
      text: '#2dd4bf',
      dot: '#14b8a6',
    },
  },
  brand: {
    primary: '#14b8a6',
    primaryHover: '#0d9488',
    primaryBg: 'rgba(20, 184, 166, 0.12)',
    indigo: '#6366f1',
    cyan: '#06b6d4',
  },
} as const;

export const typography = {
  kpi: {
    fontSize: '2rem',
    lineHeight: '2.5rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  kpiSmall: {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums',
  },
  titleLarge: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  titleMedium: {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 600,
  },
  body: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 400,
  },
  bodySmall: {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 400,
  },
  mono: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.8125rem',
    fontVariantNumeric: 'tabular-nums',
  },
} as const;
