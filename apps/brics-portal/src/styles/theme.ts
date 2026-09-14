// ---------------------------------------------------------------------------
// Design system tokens for BRICS Federated AI Monitoring & Coordination.
// Follows "trust and oversight" visual language:
//   - Neutral dark/slate theme with high contrast readability
//   - Status-color system:
//       green: healthy / participating / approved / completed
//       amber: degraded / paused / collecting_updates / aggregating / awaiting_review
//       red:   failed / excluded / rejected / voided
//       gray:  opted-out / announced / inactive / unknown
//   - Typography scale for KPI numbers vs body/labels
// ---------------------------------------------------------------------------

export const colors = {
  bg: {
    base: '#f6f8fa',
    surface: '#ffffff',
    surfaceHover: '#f3f4f6',
    surfaceActive: '#e5e7eb',
    border: '#d0d7de',
    borderSubtle: '#eaeef2',
    header: '#ffffff',
    sidebar: '#ffffff',
  },
  text: {
    primary: '#1f2328',
    secondary: '#57606a',
    muted: '#6e7781',
    inverse: '#ffffff',
  },
  status: {
    green: {
      bg: '#dafbe1',
      border: '#aceebb',
      text: '#1a7f37',
      dot: '#1a7f37',
    },
    amber: {
      bg: '#fff8c5',
      border: '#fae17d',
      text: '#9a6700',
      dot: '#bf8700',
    },
    red: {
      bg: '#ffebe9',
      border: '#ffc1c0',
      text: '#cf222e',
      dot: '#d1242f',
    },
    gray: {
      bg: '#f6f8fa',
      border: '#d0d7de',
      text: '#57606a',
      dot: '#8c959f',
    },
  },
  brand: {
    primary: '#0969da',
    primaryHover: '#0854ad',
    primaryBg: '#ddf4ff',
  },
} as const;

export const typography = {
  kpi: {
    fontSize: '2rem', // 32px
    lineHeight: '2.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  kpiSmall: {
    fontSize: '1.5rem', // 24px
    lineHeight: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums',
  },
  titleLarge: {
    fontSize: '1.25rem', // 20px
    lineHeight: '1.75rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  titleMedium: {
    fontSize: '1rem', // 16px
    lineHeight: '1.5rem',
    fontWeight: 600,
  },
  body: {
    fontSize: '0.875rem', // 14px
    lineHeight: '1.25rem',
    fontWeight: 400,
  },
  bodySmall: {
    fontSize: '0.75rem', // 12px
    lineHeight: '1rem',
    fontWeight: 400,
  },
  mono: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '0.8125rem', // 13px
  },
} as const;
