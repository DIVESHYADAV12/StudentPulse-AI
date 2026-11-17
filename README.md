# StudentPulse AI — Your AI-Powered Career Readiness Companion

> A unified, intelligent career readiness ecosystem helping college students benchmark skills, bridge career gaps, simulate mock interviews, and build personalized learning roadmaps.

---

## 🏗️ Architecture & Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts.
  * *Theme:* Luxury EdTech / Emerald Green (`#064E3B`, `#059669`) & Warm Cream (`#FAF8F5`).
* **Backend:** Python FastAPI, Motor (Async MongoDB), Pydantic v2, Uvicorn.
* **Database:** MongoDB Atlas (Cloud NoSQL).
* **AI Engine:** Google Gemini Flash (`gemini-1.5-flash`) via Google AI Studio (Free Tier).

---

## 📁 Repository Structure

```
StudentPulseAi/
├── client/                 # React + Vite Frontend Application
│   ├── src/
│   │   ├── App.jsx         # Main App & Diagnostics View
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Tailwind CSS & custom design tokens
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                 # FastAPI Backend Application
│   ├── app/
│   │   ├── config.py       # Pydantic Settings & environment variables
│   │   ├── database.py     # Async Motor MongoDB connection & collection helpers
│   │   └── main.py         # FastAPI application, CORS, health checks
│   ├── run.py              # Python runner script
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variable template
│   └── .env                # Local environment configuration
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Setup
1. Open a terminal in the root folder:
   ```bash
   cd server
   ```
2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```
3. (Optional) Add your credentials to `server/.env`:
   * **MongoDB Atlas URI:** Obtain from [cloud.mongodb.com](https://cloud.mongodb.com/) (M0 Free Tier).
   * **Gemini API Key:** Obtain free from [aistudio.google.com](https://aistudio.google.com/).
4. Start the backend:
   ```bash
   PYTHONPATH=. python run.py
   ```
   * Interactive Swagger API documentation will be available at: [http://localhost:8005/docs](http://localhost:8005/docs)

### 2. Frontend Setup
1. Open a second terminal in the root folder:
   ```bash
   cd client
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   * Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 🗺️ Roadmap & Current Status

- [x] **Phase 1: Project Foundation & Architecture Setup** *(Completed)*
- [x] **Phase 2: Authentication, Student Profile & GitHub Sync** *(Completed)*
- [x] **Phase 3: AI Skill Gap Analyzer & Student Dashboard** *(Completed)*
- [x] **Phase 4: AI Mock Interview Preparation & Action Plan Engine** *(Completed)*
- [x] **Phase 5: 24/7 AI Career Mentor & UI/UX Polish** *(Completed)*
# StudentPulse-AI
