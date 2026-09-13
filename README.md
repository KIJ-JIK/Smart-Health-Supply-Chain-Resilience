# Smart Health & Supply Chain Resilience
## National-Scale Health Resilience & Supply Chain Platform

> **A federated, offline-tolerant healthcare operations and supply-chain intelligence system connecting ground-level Primary Health Centres (PHCs), District/State Governance authorities, Central Sync Backends, and Cross-Border BRICS Federated AI nodes.**

---

## 🏛️ System Architecture & Monorepo Layout

```text
Smart-Health-Supply-Chain-Resilience/
├── apps/
│   ├── phc-portal/           <-- [Member 3 / Ansh]: Offline-First PWA (React + Dexie.js)
│   ├── governance-portal/    <-- [Member 1]: District & State Command Center (React/Next.js)
│   └── brics-portal/         <-- [Member 4]: BRICS Cross-Border Federated AI Dashboard
│
├── services/
│   ├── backend/              <-- [Member 2]: Central Node.js API & Offline Delta Sync Engine
│   └── ai-engine/            <-- [Member 4]: Demand Forecasting & Federated Learning Coordinator
│
├── final_masterplan.md       <-- Complete Product Requirements & Data Specifications
├── final_architecture.md     <-- High-Level System Topology & Sync Contracts
├── docker-compose.yml        <-- Multi-container local deployment
└── package.json              <-- Master Monorepo runner
```

---

## 👥 Team Assignments & Ports

| Service | Port | Lead / Owner | Tech Stack | Description |
| :--- | :--- | :--- | :--- | :--- |
| **PHC Portal** | `5173` | **Ansh (Member 3)** | React, Vite, TS, Dexie.js, PWA | Offline-first field tool for nurses & doctors (FEFO pharmacy, beds, oxygen, triage) |
| **Governance Portal**| `3000` | **Member 1** | React, Vite, Tailwind, Recharts | District & State command dashboard (resource reallocation, critical alerts) |
| **BRICS Portal** | `3001` | **Member 4** | React, Vite, Tailwind | Privacy-preserving cross-border AI telemetry (India, Brazil, Russia, China, South Africa) |
| **Core Backend** | `8000` | **Member 2** | Node.js, Express, TypeScript | Sync Engine (`POST /sync/push`, `GET /sync/pull`), RBAC, Telemetry store |
| **AI Engine** | `5000` | **Member 4** | Python, FastAPI, Prophet | Medicine demand forecasting, stockout predictor, FedAvg coordinator |

---

## 🚀 Quickstart: Launch Everything Together

### 1. Install & Launch All Web Portals and Backend
From the repository root:
```bash
# Install root orchestrator
npm install

# Start all 4 services concurrently in one terminal
npm run dev
```

Your services will boot up at:
- 🏥 **PHC Portal**: [http://localhost:5173](http://localhost:5173)
- 📊 **Governance Portal**: [http://localhost:3000](http://localhost:3000)
- 🌐 **BRICS Portal**: [http://localhost:3001](http://localhost:3001)
- ⚙️ **Core Backend API**: [http://localhost:8000](http://localhost:8000)

---

## 🛠️ How Each Team Member Contributes

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KIJ-JIK/Smart-Health-Supply-Chain-Resilience.git
   cd Smart-Health-Supply-Chain-Resilience
   ```
2. **Create your feature branch:**
   ```bash
   git checkout -b feat/<your-name>-<feature>
   ```
3. **Work exclusively within your assigned folder:**
   - E.g., Member 2 works in `services/backend/`
   - Member 1 works in `apps/governance-portal/`
   - Member 4 works in `apps/brics-portal/` or `services/ai-engine/`
4. **Push your changes:**
   ```bash
   git add .
   git commit -m "feat: implement district resource allocation view"
   git push origin feat/<your-name>-<feature>
   ```
5. **Open a Pull Request on GitHub** to merge into `main`.
