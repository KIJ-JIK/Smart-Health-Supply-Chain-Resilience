# 🏥 Smart Health & Supply Chain Resilience
## Teammate Onboarding & Collaboration Guide

> **Official Repository**: [https://github.com/KIJ-JIK/Smart-Health-Supply-Chain-Resilience](https://github.com/KIJ-JIK/Smart-Health-Supply-Chain-Resilience)  
> **Master Architecture**: Monorepo containing 3 Portals, Central Backend Sync Engine, and AI Engine.

---

## 👥 1. Team Roles & Folder Ownership

To prevent merge conflicts and ensure everyone works independently, each member owns a dedicated directory:

| Team Role | Assigned Folder | Tech Stack | Port | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Member 3 (Ansh)** | `apps/phc-portal/` | React, Vite, TS, Dexie.js, PWA | `5173` | **PHC Edge Field Tool**: Offline-first inventory, FEFO dispensing, beds, oxygen, patient triage telemetry. |
| **Member 1** | `apps/governance-portal/` | React, Vite, Tailwind, Recharts | `3000` | **District & State Command Center**: Hospital ward maps, stockout alerts, AI redistribution approvals, crisis mode. |
| **Member 2** | `services/backend/` | Node.js, Express, TypeScript | `8000` | **Core API & Sync Engine**: `POST /sync/push`, `GET /sync/pull`, telemetry ingest, database schemas, RBAC auth. |
| **Member 4** | `apps/brics-portal/` | React, Vite, Tailwind | `3001` | **BRICS Resilience Portal**: Cross-border federated AI dashboard across 🇮🇳, 🇧🇷, 🇷🇺, 🇨🇳, 🇿🇦 with Differential Privacy tracker. |
| **Member 4** | `services/ai-engine/` | Python, FastAPI, Prophet | `5000` | **AI Optimization Engine**: Medicine demand forecasting, stockout predictor, and FedAvg/Flower coordinator. |

---

## 🚀 2. First-Time Setup (Do This Once)

### Step 1: Clone the repository
```bash
git clone https://github.com/KIJ-JIK/Smart-Health-Supply-Chain-Resilience.git
cd Smart-Health-Supply-Chain-Resilience
```

### Step 2: Install dependencies
```bash
# 1. Install root monorepo runner
npm install

# 2. Install dependencies for your specific component:
# If you are working on the Backend:
cd services/backend && npm install && cd ../..

# If you are working on the Governance Portal:
cd apps/governance-portal && npm install && cd ../..

# If you are working on the BRICS Portal:
cd apps/brics-portal && npm install && cd ../..

# If you are working on the PHC Portal:
cd apps/phc-portal && npm install && cd ../..

# If you are working on the AI Engine:
cd services/ai-engine && pip install -r requirements.txt && cd ../..
```

---

## 🔄 3. Daily Git Workflow (Never Break `main`)

### Rule #1: Always pull latest changes before starting work
```bash
git checkout main
git pull origin main
```

### Rule #2: Always code inside your own feature branch
```bash
# Syntax: git checkout -b feat/<your-name>-<feature-name>

# Examples:
git checkout -b feat/rahul-governance-maps
git checkout -b feat/priya-backend-postgres
git checkout -b feat/amit-brics-telemetry
```

### Rule #3: Run your module locally to build and test
- **Governance Portal**: `cd apps/governance-portal && npm run dev` (Port 3000)
- **Backend API**: `cd services/backend && npm run dev` (Port 8000)
- **PHC Portal**: `cd apps/phc-portal && npm run dev` (Port 5173)
- **BRICS Portal**: `cd apps/brics-portal && npm run dev` (Port 3001)
- **AI Engine**: `cd services/ai-engine && python main.py` (Port 5000)

### Rule #4: Test build before committing
Run this inside your folder to make sure there are no TypeScript or compilation errors:
```bash
npm run build
```

### Rule #5: Commit and push your branch to GitHub
```bash
git add .
git commit -m "feat: implement live facility capacity table"
git push -u origin feat/<your-branch-name>
```

### Rule #6: Merge into `main` via GitHub Pull Request
1. Open the [GitHub Repo](https://github.com/KIJ-JIK/Smart-Health-Supply-Chain-Resilience).
2. Click **Compare & pull request** on your branch banner.
3. Review changes and click **Merge pull request**.
4. Everyone can now run `git pull origin main` to get your new features!

---

## 🔌 4. How the Components Talk to Each Other

```text
       ┌──────────────────────┐               ┌────────────────────────┐
       │   apps/phc-portal    │               │ apps/governance-portal │
       │     (Port 5173)      │               │      (Port 3000)       │
       └──────────┬───────────┘               └───────────▲────────────┘
                  │                                       │
                  │ POST /sync/push                       │ GET /api/facilities
                  │ GET  /sync/pull                       │ GET /api/alerts
                  ▼                                       │
         ┌────────────────────────────────────────────────┴────────────┐
         │                  services/backend (Port 8000)               │
         │           - Ingests offline mutations from PHCs             │
         │           - Aggregates beds, oxygen, and medicine inventory │
         │           - Emits stockout alerts to Governance             │
         └────────────────────────────────┬────────────────────────────┘
                                          │
                                          │ POST /predict/demand
                                          ▼
                         ┌─────────────────────────────────┐
                         │   services/ai-engine (Port 5000)│
                         │   - Prophet Demand Forecasting  │
                         │   - Redistribution Optimizer    │
                         └────────────────┬────────────────┘
                                          │
                                          │ Model update weights (FedAvg)
                                          ▼
                         ┌─────────────────────────────────┐
                         │    apps/brics-portal (Port 3001)│
                         │    - Cross-Border AI Telemetry  │
                         │    - Privacy Budget Ledger (DP) │
                         └─────────────────────────────────┘
```

---

## ⚡ 5. Master Launch (All 4 Services in 1 Terminal)

From the project root:
```bash
npm run dev
```

This single command boots the entire platform simultaneously:
- 🏥 **PHC Portal (Ansh)**: [http://localhost:5173](http://localhost:5173)
- 📊 **Governance Portal (Member 1)**: [http://localhost:3000](http://localhost:3000)
- 🌐 **BRICS Portal (Member 4)**: [http://localhost:3001](http://localhost:3001)
- ⚙️ **Core Backend (Member 2)**: [http://localhost:8000](http://localhost:8000)

---

## 🎯 6. Demo Script for Presentation / Evaluators

When demonstrating the project to mentors or judges, show this complete end-to-end loop:

1. **Open PHC Portal** (`localhost:5173`):
   - Show offline-first PWA dispensing medicine and updating bed count.
   - Show the live EKG telemetry line and spotlight interactive cards.
2. **Open Central Backend** (`localhost:8000/health`):
   - Show `POST /sync/push` ingesting mutations and incrementing `server_seq`.
3. **Open Governance Command Center** (`localhost:3000`):
   - Show the district CMO view receiving the live facility data.
   - Click **Approve Reallocation** on the AI Redistribution Optimizer to resolve a stockout.
4. **Open BRICS Resilience Portal** (`localhost:3001`):
   - Click **Run FedAvg Round** to show privacy-preserving federated AI model training across the 5 member nations without raw patient data leaving national borders.

---

## ⚠️ 7. Do's and Don'ts

- ✅ **DO** keep all your files inside your assigned folder.
- ✅ **DO** run `git pull origin main` every morning.
- ✅ **DO** test your build (`npm run build`) before pushing.
- ❌ **DON'T** push directly to `main` without a Pull Request.
- ❌ **DON'T** commit `node_modules` or `.env` files with private secrets.
- ❌ **DON'T** modify files inside someone else's folder without coordinating with them first.
