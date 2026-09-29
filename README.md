# 🏥 AURA: Autonomous Universal Resilience Architecture
## National-Scale Healthcare Operations, Supply Chain Intelligence & BRICS Federated AI Grid

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

> **AURA** is an end-to-end, offline-tolerant health resilience platform connecting frontline Primary Health Centres (PHCs), District/State Governance authorities, and Cross-Border BRICS Federated AI networks. It integrates real-time telemetry, automated FEFO medicine dispensing, epidemic surge detection, autonomous text-to-SQL AI copilots, and 100% bilingual English/Hindi Devanagari localization with zero-gibberish PDF reporting.

---

## 🏛️ System Architecture & Portal Ecosystem

```mermaid
flowchart TD
    subgraph AURA_Point [AURA Point · Frontline PHC Node (Port 5173)]
        P1[Offline-First IndexedDB / Dexie.js]
        P2[FEFO Medicine Ledger & AI Rx Scanner]
        P3[Bed & Oxygen Telemetry]
        P4[Local Conflict-Free Delta Sync Engine]
    end

    subgraph AURA_Vantage [AURA Vantage · Governance Command Center (Port 3000)]
        G1[National, State & District Tier Command]
        G2[14-Day Epidemiological Demand Forecasting]
        G3[GIS Health Facility & Stockout Map]
        G4[Bilingual Devanagari PDF/Excel Statutory Dossiers]
    end

    subgraph AURA_Sovereign [AURA Sovereign · BRICS Federated Grid (Port 3001)]
        B1[5-Nation Consensus: IN, BR, RU, CN, ZA]
        B2[Rényi Differential Privacy ε-Budget Ledger]
        B3[Paillier SMPC & Cryptographic Proof DAG]
        B4[Zero Raw Egress Data Residency Enclaves]
    end

    subgraph Central_Core [AURA Central Backend & AI Engine (Port 8000)]
        C1[Express + PostgreSQL Relational Engine]
        C2[Delta Sync /sync/push & /sync/pull]
        C3[Autonomous AI Copilot: Text-to-SQL & Hindi NLP]
        C4[Multi-Jurisdiction RBAC & Stale Telemetry Detector]
    end

    AURA_Point <-->|Bidirectional Delta Sync| Central_Core
    AURA_Vantage <-->|GraphQL & REST Telemetry Queries| Central_Core
    Central_Core <-->|Federated Model Weights| AURA_Sovereign
```

---

## 🌐 Complete Portal & Service Directory

| Portal / Service | Port | Target User Role | Tech Stack | Key Purpose & Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **AURA Point**<br>`apps/phc-portal` | `5173` | Frontline Medical Officers, Staff Nurses, Pharmacists | React 18, Vite, TypeScript, Dexie.js, TailwindCSS, Lucide | **Offline-First PHC Workbench**: FEFO medicine inventory, Gemini Vision prescription scanner, bed occupancy tracking, oxygen telemetry, and offline sync queue. |
| **AURA Vantage**<br>`apps/governance-portal` | `3000` | National Directors, State Health Secretaries, District CMOs | Next.js 14, React 18, TypeScript, Recharts, jsPDF, SheetJS | **Multi-Tier Statutory Command**: 4-tier statutory dossiers (National → State → District → PHC), macro stockout projections, GIS resource maps, and bilingual Hindi/English PDF exports. |
| **AURA Sovereign**<br>`apps/brics-portal` | `3001` | Cross-Border Epidemiologists, Sovereign AI Auditors | React 18, Vite, TypeScript, Apollo GraphQL, Recharts | **BRICS Federated AI Grid**: 5-nation model consensus (India, Brazil, Russia, China, South Africa), Differential Privacy ($\varepsilon$-budget) gauges, and model lineage DAGs. |
| **AURA Central Backend**<br>`services/backend` | `8000` | Platform Infrastructure & Autonomous AI Engine | Node.js, Express, TypeScript, PostgreSQL, Gemini LLM | **Core Sync & Intelligence**: Text-to-SQL Natural Language Copilot, RBAC session management, conflict resolution engine, and REST/GraphQL APIs. |

---

## 👥 How Each User Role Accesses & Uses Platform Features

### 1. Frontline Healthcare Staff (AURA Point — `http://localhost:5173`)
- **Login Credentials**: Medical Officer / Pharmacist credentials (e.g. `dr.rajesh@phc.gov.in` / `mo_active`).
- **How to Use Features**:
  1. **Offline Pharmacy & FEFO Dispensing (`/inventory`, `/billing`)**:
     - View real-time drug batches sorted automatically by **First-Expiry-First-Out (FEFO)**.
     - Click **"Scan Packaging (Gemini Vision)"** or **"Scan Rx"** to auto-extract medicine names, batch numbers, and dosage units using Google AI Vision.
     - Dispense medications with instant local IndexedDB ledger writes that sync seamlessly when back online.
  2. **Beds & Oxygen Telemetry (`/beds`, `/oxygen`)**:
     - Monitor total vs. occupied beds across General, Emergency, and Isolation wards.
     - Adjust active bed allocations with auto-computed vacancies.
     - Log Type-D oxygen cylinder pressure and manifold backup durations.
  3. **Offline Sync & Emergency SOS (`/sync`, `/emergency`)**:
     - View pending offline mutations and resolve conflict flags in the sync drawer.
     - Trigger **Emergency SOS Protocol** during mass casualty incidents to broadcast urgent resource requests to district command.

---

### 2. District, State & National Administrators (AURA Vantage — `http://localhost:3000`)
- **Login Credentials**:
  - **National Director**: `dr.rajesh.national@health.gov.in` (Role: `national_admin`)
  - **State Health Secretary**: `secretary.state@health.gov.in` (Role: `state_admin`)
  - **District Chief Medical Officer**: `cmo.district@health.gov.in` (Role: `district_admin`)
- **How to Use Features**:
  1. **Jurisdiction Scoping & Telemetry Warnings**:
     - Use the top **Scope Selector** to switch between National Overview, specific States (e.g., Andaman & Nicobar, Maharashtra, Bihar), or Districts.
     - The top **Telemetry Stale Banner** alerts if any PHCs have delayed syncs over 60 minutes.
  2. **Epidemiological Demand Forecasting (`/forecasts`)**:
     - View 14-day forward forecast curves for Oxygen cylinders, ICU beds, and essential antibiotics powered by Temporal-Fusion-Transformers.
  3. **Statutory Dossiers & Native Hindi PDF Export (`/analytics`)**:
     - Select report tiers (**National**, **State**, **District**, **PHC**).
     - Click **"Export PDF Report"** (or **"पीडीएफ रिपोर्ट डाउनलोड करें"**) to download crisp, official A4 dossiers rendered in Devanagari Hindi or English with zero character corruption.
     - Click **"Export CSV"** or **"Export Excel"** for data pipeline ingestion with UTF-8 BOM encoding.
  4. **Autonomous AI Copilot**:
     - Click the bottom-right **AURA Copilot** button to ask complex queries in English or Hindi (e.g. *"Show me PHCs with less than 3 days of Paracetamol stock"* or *"किस जिले में ऑक्सीजन की सबसे ज्यादा कमी है?"*).

---

### 3. International AI & Resilience Researchers (AURA Sovereign — `http://localhost:3001`)
- **Login Credentials**: Research Lead / Cross-Border Auditor (`researcher@brics-health.org`).
- **How to Use Features**:
  1. **5-Nation Federated Consensus (`/overview`)**:
     - Inspect federated model convergence rounds across India, Brazil, Russia, China, and South Africa without exchanging raw patient records.
  2. **Differential Privacy Fuel Gauge (`/privacy`)**:
     - Monitor active privacy loss ($\varepsilon$ budget) and Rényi Differential Privacy (RDP) parameters ensuring mathematical zero patient re-identification.
  3. **Cryptographic Model Lineage DAG (`/lineage`)**:
     - Audit the directed acyclic graph (DAG) proving Paillier homomorphic encryption and zero raw data egress guarantees.

---

## 🌐 Universal Multilingual Localization (English ↔ हिन्दी)

AURA features a universal client-side translation engine across all portals:
- **Instant Toggle**: Click the **"हिन्दी / English"** button in any portal header to switch the entire application interface instantly.
- **Shared State**: Language preference is preserved in browser storage across all tabs and portal switches.
- **Loop-Proof DOM Architecture**: Translates text nodes using longest-first substring matching and WeakMap original string stashing, eliminating recursive text duplication.
- **Native Devanagari PDF Export Engine**: Uses high-DPI Unicode canvas typography to guarantee proper Hindi ligatures, matras, and conjuncts with **zero gibberish**.
- **Bilingual AI Copilot**: Formulates responses in formal Devanagari Hindi when queried in Hindi or when Hindi mode is toggled on.

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/KIJ-JIK/Smart-Health-Supply-Chain-Resilience.git
cd Smart-Health-Supply-Chain-Resilience
```

### 2. Install Root & Workspace Dependencies
```bash
npm install
```

### 3. Start All Services Concurrently
```bash
npm run dev
```

The monorepo runner will spin up all portals and services:
- 🏥 **AURA Point (PHC Portal)**: [http://localhost:5173](http://localhost:5173)
- 📊 **AURA Vantage (Governance Portal)**: [http://localhost:3000](http://localhost:3000)
- 🌐 **AURA Sovereign (BRICS Portal)**: [http://localhost:3001](http://localhost:3001)
- ⚙️ **AURA Backend API**: [http://localhost:8000](http://localhost:8000)

---

## 🧪 Build & Verification Commands

To verify TypeScript types and build readiness across all portals:

```bash
# Typecheck Governance Portal
cd apps/governance-portal && npx tsc --noEmit

# Typecheck PHC Portal
cd apps/phc-portal && npx tsc --noEmit

# Typecheck BRICS Portal
cd apps/brics-portal && npx tsc --noEmit

# Build Backend API
cd services/backend/smart-health-platform/backend && npm run build
```

---

## 👥 Team & Attribution

Built with ❤️ for **Build with AI: Code for Communities — Second Edition**

- **Ansh**
- **Arya**
- **Sumiya**
- **Abdullah**

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
