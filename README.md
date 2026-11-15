m# 🧞‍♂️ CallGenie AI — Autonomous Telephony & Voice AI Platform

[![Live Demo](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)](https://callgenie-ai-amber.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://callgenie-ai-52ra.onrender.com)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud/atlas)
[![AI Voice](https://img.shields.io/badge/Voice%20AI-OmniDimension-7C3AED?style=for-the-badge)](https://omnidimension.com)

**CallGenie AI** is a production-grade, full-stack autonomous AI telephony and voice operations console. It enables enterprises to deploy, monitor, and converse with hyper-realistic, low-latency multilingual voice AI personas with live speech synthesis, real-time transcription, and automated cloud call persistence.

---

## ✨ Key Features

- **🎙️ Real-Time Dual-Channel Voice Telephony:**
  - Browser-native low-latency duplex conversation powered by Web Speech API (`webkitSpeechRecognition` & `speechSynthesis`).
  - Automatic microphone permission detection and echo feedback suppression.
  - Live audio waveform and active listening indicator.

- **🌐 Multilingual AI Voice Personas:**
  - **Mallishwari (మల్లేశ్వరి):** Native Telugu AI voice assistant with Cartesia Ramya voice synthesis and Telugu (`te-IN`) speech recognition.
  - **Sophia:** Real Estate Sales Specialist (Warm & Professional).
  - **Liam:** Tier 1 IT Support & Account Verification.
  - **Chloe:** Medical Appointments & Clinical Triage.

- **📊 Comprehensive Telephony Analytics Dashboard:**
  - Real-time tracking of total calls, active personas, latency benchmarks (TTFT < 280ms), and automated session costs.
  - Interactive transcript inspector with speaker breakdown, message timestamps, and sentiment labeling.

- **🔗 OmniDimension Cloud Webhook Receiver:**
  - Dedicated `/api/webhook/omnidimension` endpoint that ingests external call webhooks, parses conversational transcripts, calculates duration, and persists records in MongoDB Atlas.

---

## 🏗️ System Architecture

```
                       ┌───────────────────────────────┐
                       │     User Browser / Client      │
                       │ (Vite React + Web Speech API) │
                       └───────────────┬───────────────┘
                                       │
                      REST Requests /  │  Live Telephony
                      Audio Streaming  │  Transcripts
                                       ▼
                       ┌───────────────────────────────┐
                       │     Node.js Express API       │
                       │     (Render Cloud Host)       │
                       └───────┬───────────────┬───────┘
                               │               │
        Ingests Call Webhooks  │               │ Reads & Writes Agents /
        (Post-Call Data)       │               │ Historical Call Records
                               ▼               ▼
                ┌───────────────────────┐   ┌───────────────────────────┐
                │  OmniDimension Engine │   │   MongoDB Atlas Cluster   │
                │   (Telugu Voice AI)   │   │  (Collections: agents,    │
                └───────────────────────┘   │   calls)                  │
                                            └───────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Lucide Icons, Modern CSS3 Flexbox/Grid
- **Backend:** Node.js, Express.js (ES Modules), CORS, Dotenv
- **Database & ORM:** MongoDB Atlas, Mongoose
- **Cloud Infrastructure:** Vercel (Frontend CI/CD), Render (Backend Web Service)
- **External Voice AI:** OmniDimension (Cartesia TTS, Soniox STT, GPT-4.1-mini)

---

## 📡 REST API Reference

### Health Check
- `GET /` — API health status and server timestamp.

### Agents
- `GET /api/agents` — Fetch all configured AI voice personas.
- `POST /api/agents` — Create a new persona with custom name, role, voice, and latency.
- `GET /api/agents/seed` — Seed initial default agents if collection is empty.

### Call History
- `GET /api/calls` — Fetch all historical voice sessions with duration, cost, and transcript.
- `POST /api/calls` — Log a completed voice call session.

### Webhook
- `POST /api/webhook/omnidimension` — Ingest post-call payloads directly from OmniDimension.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+)
- npm or pnpm
- MongoDB Atlas cluster connection string

### 1. Clone the repository
```bash
git clone https://github.com/SHARATH282/callgenie-ai.git
cd callgenie-ai
```

### 2. Configure Backend
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/`:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
```
Start backend:
```bash
npm run dev
```

### 3. Configure Frontend
From the root directory:
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in Google Chrome or Microsoft Edge.

---

## 👥 Authors & Team
- **Sharath Admin** — Full-Stack Voice AI Telephony Engineer
- Built with ❤️ for next-generation multilingual conversational AI.
