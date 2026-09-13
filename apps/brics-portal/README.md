# BRICS Federated Health Resilience Portal

**Component: Member 4 (`apps/brics-portal`)**

---

## Overview
The BRICS Portal monitors privacy-preserving cross-border AI models across the 5 member nations (**India, Brazil, Russia, China, and South Africa**).

### Core Principles
1. **Zero Raw Patient Data Transfer**: Sovereign healthcare data stays in-country.
2. **Differential Privacy (DP)**: Only masked weight deltas ($\epsilon \le 1.0$) are exchanged.
3. **Cross-Border Early Warnings**: Collaborative demand and disease surge prediction.

### Run Locally
```bash
npm install
npm run dev
```
Port: `3001`
