# BRICS Federated Intelligence & Surveillance Portal (`apps/brics-portal-vite-staging`)

**Staged Vite + React SPA Implementation for `Smart-Health-Supply-Chain-Resilience/apps/brics-portal`**  
*Source of Truth: Masterplan §65, Architecture §5.7, Member 1 Prompts 0–8 (`Sumaiya_BRICS.md`), Datasets 24–26 (`05_brics_federated.sql`)*

---

## 1. Overview & Architectural Role

The BRICS Federated Intelligence Portal is an operator-facing surveillance and governance console for sovereign cross-border model training among the five member nations:
- 🇮🇳 **India** (`IN`)
- 🇧🇷 **Brazil** (`BR`)
- 🇷🇺 **Russia** (`RU`)
- 🇨🇳 **China** (`CN`)
- 🇿🇦 **South Africa** (`ZA`)

### Core Operational Axiom
> **"The coordinator only ever sees the sum of updates, never an individual country's raw model or data."**

National primary healthcare center (PHC) patient records and local consumption figures **never cross international borders**. Sovereign nodes train local models on derived materialized views, clip gradients with calibrated Gaussian noise (\(\epsilon, \delta\)), and transmit only masked weight deltas.

---

## 2. Technical Stack (Adapted for Team Vite Monorepo)

- **Build System & Dev Server**: Vite 5 (`@vitejs/plugin-react`)
- **UI Framework**: React 18 + TypeScript 5
- **Routing**: React Router v6 (`react-router-dom`) with declarative layout routing (`<Outlet />`)
- **GraphQL Client**: Apollo Client (`@apollo/client`) configured with SchemaLink for self-contained, in-memory mock resolution during standalone frontend development
- **State Management**: Zustand store (`src/store/ui-store.ts`)
- **Design Tokens**: Custom theme tokens (`src/styles/theme.ts`) with high-contrast accessibility and status tones
- **Charts & Gauges**: Lightweight SVG/HTML-based interactive charts (`SimpleLineChart`, `PrivacyBudgetChart`, `PrivacyBudgetGauge`)

---

## 3. Adaptation Summary from Next.js 14 to Vite

| Component / Layer | Original Local (Next.js 14) | Staged Target (Vite SPA) | Notes |
| :--- | :--- | :--- | :--- |
| **App Shell / Layout** | `src/app/layout.tsx` + `app-shell.tsx` | `src/layouts/AppLayout.tsx` | Renders `<Sidebar />`, `<Header />`, and `<Outlet />` |
| **Application Root** | Implicit Next App Router bootstrap | `src/main.tsx` + `src/App.tsx` | Mounts `<ApolloWrapper>`, `<BrowserRouter>`, and route table into `#root` |
| **Navigation** | `next/link` (`href`) | `react-router-dom` (`Link`, `to`) | Adapted in `Sidebar.tsx` and `RoundDetailDrawer.tsx` |
| **Active Route State** | `usePathname()` from `next/navigation` | `useLocation().pathname` | Adapted in `Sidebar.tsx` |
| **Programmatic Nav** | `useRouter()` from `next/navigation` | `useNavigate()` from `react-router-dom` | Adapted in `OverviewPage.tsx` |
| **Query Parameters** | `useSearchParams()` from `next/navigation` | `useSearchParams()` from `react-router-dom` | Adapted in `NodesPage.tsx` and `RoundReviewPage.tsx` |
| **Page Directory** | `src/app/**/page.tsx` | `src/pages/*.tsx` | Decoupled from Next file-system router into standard page modules |
| **HTML Shell** | Next.js dynamic HTML | `index.html` | Explicit root HTML file for Vite bundler |
| **Path Aliasing** | `tsconfig.json` | `vite.config.ts` (`resolve.alias`) + `tsconfig.json` | Maps `@/*` to `src/*` |

---

## 4. Route Map

- `/` — **Overview**: Active sovereign nodes count, current training round, last aggregation, 5 country status cards.
- `/nodes` — **Node Registry & Convergence Telemetry**: Historical loss/accuracy SVG chart, participation toggle with confirmation dialog.
- `/rounds` — **Training Rounds Lifecycle**: Round status timeline, contribution drawer, "Start New Round" modal.
- `/rounds/review` — **Human-in-the-Loop Aggregation Review**: MAE/RMSE deltas, privacy budget gauge, mandatory audit rationale on rejection.
- `/lineage` — **Global Model Lineage History**: Version progression (v1.0 → v1.18), S3 weight URIs, cryptographic SHA-256 signatures.
- `/privacy` — **Privacy & Secure Aggregation Monitoring**: Differential privacy epsilon consumption chart, threshold alert banner.
- `/settings` — **Consortium Settings**: Sovereign coordinator endpoints, disabled new country onboarding with data-sovereignty tooltip.

---

## 5. Staging Directory Structure

```
apps/brics-portal-vite-staging/
├── index.html
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── vite-env.d.ts
    ├── components/
    │   ├── common/         (KpiCard, CountryNodeCard, StatusBadge, DataFreshnessLabel, SimpleLineChart, etc.)
    │   ├── layout/         (Header, Sidebar with React Router Link)
    │   ├── lineage/        (MetricDelta)
    │   ├── privacy/        (PrivacyBudgetChart)
    │   ├── providers/      (ApolloWrapper)
    │   ├── review/         (MetricComparisonTable, PrivacyBudgetGauge)
    │   ├── rounds/         (StartRoundModal, RoundDetailDrawer)
    │   └── settings/       (TopologyTable)
    ├── graphql/            (schema, resolvers, mock-data, mock-node-details, operations, client)
    ├── hooks/              (useCurrentUser)
    ├── layouts/            (AppLayout with Outlet)
    ├── pages/              (OverviewPage, NodesPage, RoundsPage, RoundReviewPage, LineagePage, PrivacyPage, SettingsPage)
    ├── store/              (useUIStore)
    ├── styles/             (theme tokens)
    └── types/              (federated domain types)
```

---

## 6. How to Run Locally

```bash
# Navigate to the staging directory
cd apps/brics-portal-vite-staging

# Install dependencies (if not using monorepo root install)
npm install

# Start local Vite development server (port 3000)
npm run dev

# Type-check TypeScript sources
npm run type-check

# Build for production (outputs to dist/)
npm run build
```
