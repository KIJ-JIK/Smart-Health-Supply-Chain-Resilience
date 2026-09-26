# Project Attributions & Open-Source Citations

This document certifies that the **Smart Health Supply Chain Resilience Platform** is original software developed during the hackathon period, built upon properly licensed open-source components and authoritative public health standards in accordance with Hackathon Guideline 03.

---

## 1. Google AI Services & SDKs
- **Google Gemini Generative AI:**
  - `gemini-3.8-flash`, `gemini-2.0-flash`, `gemini-flash-lite-latest` multimodal language and vision models.
  - Used for: Autonomous Clinical Copilot (Text-to-SQL + RAG), Prescription & Medicine Blister Pack Computer Vision, and BRICS Multilateral Threat Intelligence & Translation.
  - API License: Google Generative AI Terms of Service.

---

## 2. Open-Source Frameworks & Libraries
All libraries used are distributed under permissive open-source licenses (MIT or Apache 2.0):

| Component | Repository / Provider | License | Purpose in Architecture |
|---|---|---|---|
| **Next.js 14** | Vercel | MIT | SSR/SSG App Router for Governance Command Portal |
| **Vite** | Evan You & Vite Contributors | MIT | High-performance bundling for PHC Edge & BRICS Portals |
| **Apollo Client** | Apollo GraphQL | MIT | Reactive GraphQL data layer with cache normalization |
| **Express** | OpenJS Foundation | MIT | Backend HTTP and REST/GraphQL routing server |
| **PostgreSQL & `pg`** | PostgreSQL Global Development Group | PostgreSQL / MIT | Relational multi-tenant ledger with Row-Level Security (RLS) |
| **Dexie.js** | David Fahlander | Apache 2.0 | IndexedDB wrapper for offline-first clinical queue storage |
| **MapLibre GL** | MapLibre Community | BSD-3-Clause | Open-source WebGL GIS mapping engine |
| **Deck.gl** | OpenJS Foundation / Vis.gl | MIT | Large-scale spatial data visualization layer |
| **Recharts** | Recharts Team | MIT | Compositional SVG charting for epidemiological curves |
| **Lucide Icons** | Lucide Project | ISC | Healthcare, logistics, and UI iconography |
| **Tailwind CSS** | Tailwind Labs | MIT | Utility-first CSS architecture |
| **Zustand** | Paul Henschel & Daishi Kato | MIT | Micro-state management for auth and scope filtering |

---

## 3. Public Health Datasets & Normative Guidelines
- **Ministry of Health and Family Welfare (MoHFW), Government of India:**
  - Indian Public Health Standards (IPHS) 2022 guidelines for Primary Healthcare Centres (PHCs) and Community Health Centres (CHCs).
  - Facility staffing norms, Essential Drugs List (EDL), and bed-to-population ratios.
- **National Family Health Survey (NFHS-5):**
  - Demographic epidemiological baseline indicators and state-level healthcare utilization statistics.
- **World Health Organization (WHO):**
  - Model List of Essential Medicines (EML) 23rd List (2023) for medicine classification, standard units, and therapeutic categories.
- **BRICS Health Ministers Framework:**
  - Guidelines for Federated Pandemic Early Warning and Collaborative Medical Supply Reserve mechanisms.

---

## 4. Code Originality Statement
All custom algorithms—including the deterministic First-Expiry-First-Out (FEFO) allocation engine, the differential privacy budget ledger ($\epsilon$-budget accumulator), the offline sync conflict reconciliation protocol, the multi-model LLM fallback cascade, and the prescription computer vision parser—are original works developed by the team specifically for this challenge.
