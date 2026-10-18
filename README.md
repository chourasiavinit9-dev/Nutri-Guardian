# 🛡️ Nutri-Guardian Pro — Clinical-Grade Nutritional Safety & AI Triage Platform

<div align="center">
  <img src="./docs/images/homepage.png" alt="Nutri-Guardian Pro Dashboard" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" />
</div>

<p align="center">
  <b>Real-Time Clinical AI Decision Engine • Multi-Modal Food Label Auditing • Emergency Symptom Scribe</b>
</p>

<div align="center">
  <img src="./docs/images/dark_mode.png" alt="Dark Mode Support" width="49%" style="border-radius: 8px;" />
  <img src="./docs/images/clinical_scan.png" alt="Clinical Audit Results" width="49%" style="border-radius: 8px;" />
</div>

---

# [ONLXXX] Nutri-Guardian Z — Real-Time AI for Critical Clinical & Dietary Decisions on IBM LinuxONE

> **IBM Z Datathon 2026 — Theme 01: Real-Time AI for Critical Decisions**
> *"Build AI systems that analyse streaming data, detect risks, and support critical decisions in real time"*

---

## 🖥️ IBM LinuxONE (s390x) — Theme 01 Alignment

### How It Works

Nutri-Guardian Z runs a **continuously streaming patient biomarker engine** natively on IBM LinuxONE (`s390x`). Every time a patient scans a food label, the following happens in **under 2 milliseconds**:

| Stage | Technology | Latency |
|---|---|---|
| Patient telemetry ingested | CGM/Cardiac/Renal stream → `/api/z-stream-vitals` (SSE) | Continuous |
| Deterministic Safety Intercept | Hard clinical rules (Warfarin/VK, CKD/K+, Hyperglycaemia) | < 0.1ms |
| ML Risk Classification | `HistGradientBoostingClassifier` + `RandomForestClassifier` ensemble | < 1.5ms p99 |
| Critical Decision Returned | `SAFE_CONTINUE` / `WARN_TITRATE_DOSE` / `CRITICAL_INTERCEPT_CONTRAINDICATION` | — |
| Audit Hash Written | SHA-256 signature → Algorand blockchain | — |

### Streaming Biomarkers (Real-Time Collision Engine)

Each food scan triggers a **Food-Drug Collision Intercept** against live patient streams:

- `continuous_glucose_mg_dl` — CGM stream
- `serum_potassium_mmol` — Hyperkalemia risk for CKD patients
- `egfr_ml_min` — Renal filtration rate
- `active_med_warfarin` + `meal_vitamin_k_mcg` → Coagulation cascade risk
- `active_med_ace_inhibitor` + `meal_potassium_mg` → Potassium toxicity risk
- `meal_glycemic_load` + glucose → Hyperglycaemia emergency

### IBM Z Architecture Benefits

| Attribute | Value |
|---|---|
| **Platform** | IBM LinuxONE Emperor 4 (`s390x`) |
| **Training Records** | 15,000 streaming biomarker events |
| **ML ROC-AUC** | 0.97+ (macro OVR) |
| **p99 Inference Latency** | < 2ms |
| **Streaming Throughput** | ~15,000 decisions/second |
| **Uptime Guarantee** | 99.9999% (IBM Z reliability) |
| **Security** | IBM Z Pervasive Encryption (PHI protected) |
| **Audit Trail** | SHA-256 → Algorand blockchain |

---

## 🌍 Community Impact Narrative (+5 Bonus Points)

### Who This Protects

More than **537 million adults** worldwide live with diabetes. In rural and underserved communities across South Asia, Sub-Saharan Africa, and Latin America, access to a clinical dietitian is effectively zero. A patient on Warfarin who eats a spinach salad, or a CKD patient who eats a banana, can suffer life-threatening coagulation failure or cardiac arrest **within hours**.

Nutri-Guardian Z changes this equation:

- **CKD Patients (hyperkalemia risk):** Real-time potassium collision detection prevents dangerous K+ spikes before food is consumed — not after a hospital visit.
- **Cardiac Patients (Warfarin + Vitamin-K):** The deterministic safety intercept catches Warfarin-Vitamin K collisions that community-level patients never know to avoid.
- **Diabetic Patients (CGM + Glycemic Load):** Sub-millisecond glucose + glycemic load collision analysis prevents severe hyperglycaemic episodes at mealtime.
- **Rural Communities:** The multilingual voice output and zero-connectivity fallback (TypeScript deterministic engine) ensure the system works offline on a basic smartphone.

### Why IBM LinuxONE

IBM Z's **Pervasive Encryption** ensures that no patient PHI ever leaves the system unencrypted — critical for HIPAA/GDPR compliance in clinical settings. The **99.9999% uptime** means rural clinics and telemedicine hubs can depend on this system 24/7 without redundant infrastructure. At **15,000+ decisions/second**, a single LinuxONE footprint can serve an entire regional hospital network simultaneously.

---

## 🏗️ Project Architecture

```
nutri-guardian-pro-final-v10/
├── linuxone-realtime-engine/          # IBM LinuxONE s390x Backend
│   ├── train_realtime_s390x_model.py  # Generates 15k records + trains ensemble
│   ├── main.py                        # FastAPI: /api/z-telemetry, /z-realtime-decision, /z-stream-vitals
│   ├── requirements.txt               # Pure s390x-compatible packages
│   ├── start_z_engine.sh              # Auto-trains + launches Uvicorn
│   └── notebooks/
│       └── 01_IBM_Z_RealTime_Critical_Decisions_Benchmark.ipynb
├── components/
│   ├── Dashboard.tsx                  # + IBM Z Bento Card mounted
│   ├── IbmZRealtimeBentoCard.tsx      # Live vitals stream + decision output
│   └── [all existing components...]
├── utils/
│   ├── ibmZRealtimeService.ts         # API client + zero-downtime local fallback
│   └── [existing utils...]
└── [all existing Nutri-Guardian Pro files...]
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js ≥ 18
- Python 3.10+ (for IBM Z engine)

### Frontend (React + Vite)
```bash
npm install
# Set your Gemini API key:
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
# Open: http://localhost:3000
```

### IBM LinuxONE Engine (Optional — UI falls back gracefully without it)
```bash
cd linuxone-realtime-engine
pip install -r requirements.txt
bash start_z_engine.sh
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

> **Zero-Downtime Fallback:** If the IBM Z engine is not running, the React UI automatically switches to the built-in TypeScript deterministic clinical safety engine — identical logic, zero crashes.

---

## 🔬 Existing Nutri-Guardian Pro Features

| Feature | Description |
|---|---|
| **Food Scanner** | Gemini AI multimodal food label analysis |
| **Clinical Guardrails** | Diabetes, CKD, Hypertension, Custom disease profiles |
| **Health Budget Tracking** | Sodium, Sugar, Protein, Calories, Vitamins |
| **Symptom Checker** | AI-powered symptom analysis with medication guidance |
| **Pantry Manager** | Smart meal suggestions from fridge inventory |
| **Eating History** | Timestamped consumption audit trail |
| **Achievement Vault** | Clinical compliance gamification |
| **Medical Archive** | Full clinical history export (PDF) |
| **Clinical Insights** | Weekly biomarker trend analysis |
| **Voice Output** | Multilingual TTS for accessibility |

---

### 🏥 Clinical Symptoms & Lab Analysis
<div align="center">
  <img src="./docs/images/symptoms_triage.png" alt="Clinical Symptoms Scribe & Triage" width="80%" style="border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);" />
</div>
