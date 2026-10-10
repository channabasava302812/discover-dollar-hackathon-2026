# SurplusLink - Forensic Audit & Logistics Engine

## 🚀 Project Overview
SurplusLink is a high-performance Full-Stack platform designed to bridge the gap between food donors (restaurants) and volunteers. Built with a "Maximum Control" philosophy, the system enforces 7 strict business rules to prevent over-booking, ensure logistical feasibility, and provide real-time auditing of food waste vs. recovery.

### 🧩 Core "Audit-Ready" Features:
- **Simulated Clock Engine:** A custom-built temporal logic that allows for "What-If" scenario testing without relying on system time.
- **7-Rule Validation Guard:** Every claim is cross-referenced against capacity, time-windows, zones, and volunteer schedules.
- **System Integrity Dashboard:** Implements a real-time audit where `Listed = Collected + Missed + Wasted + In Progress + Still Open`.
- **Real-time Forensic Audit Trail:** A persistent activity feed recording every system state change for full traceability and accountability.

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas (Cloud) - Ensures state survives server restarts.
- **Frontend:** React.js, Vite, Tailwind CSS (v4), Lucide Icons.
- **Logic Engine:** Custom multi-rule validator with deterministic sorting.

---

## ⚙️ Setup & Installation

### 1. Backend Setup
```bash
cd backend
npm install
node seed.js  # Crucial: This loads the initial clock, donors, and volunteers
node server.js
Backend local endpoint: http://localhost:5000

Frontend Setup
cd frontend
npm install
npm run dev

Frontend local endpoint: http://localhost:5173
