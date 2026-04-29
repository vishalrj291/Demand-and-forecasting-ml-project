# ForecastIQ — AI Demand & Inventory Intelligence

> A full-stack machine learning project for demand forecasting, inventory optimization, and stockout risk assessment.

**Live Demo:** [https://demand-and-forecasting-ml-project.onrender.com](https://demand-and-forecasting-ml-project.onrender.com)

---

## What This Project Does

ForecastIQ combines ML models with classical inventory formulas to deliver:

- **Demand Forecasting** — Predicts monthly product demand using month, unit price, and sub-category
- **Inventory Optimization** — Calculates Economic Order Quantity (EOQ) and Reorder Point (ROP)
- **Stockout Risk** — Classifies high/low risk of running out of stock given current inventory vs demand
- **Multi-Page Dashboard** — Home, Dashboard, Team, About, Terms & Privacy pages

---

## Team

| Name | Role |
|------|------|
| Vishal Raj | Full-Stack Developer — React Frontend, UI/UX, API Integration |
| Divyanshi | Data Scientist — Feature Engineering, EDA, Model Evaluation |
| Monty Gaurav | ML Research & Testing — Model Validation, Inventory Logic, Documentation |
| Dhruv |Lead ML Engineer — Model Architecture, Backend API, Data Pipeline |

---

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI endpoints
│   │   ├── ml.py          # Model training & inference
│   │   └── schemas.py     # Pydantic request schemas
│   ├── data/
│   │   └── SampleSuperstore.csv
│   ├── requirements.txt
│   └── render-start.sh
├── frontend/
│   ├── src/
│   │   ├── components/    # Navbar, Footer
│   │   ├── hooks/         # useAnimations
│   │   ├── pages/         # Home, Dashboard, Team, About, Terms, Privacy
│   │   ├── App.jsx        # Router setup
│   │   └── styles.css     # Full design system + animations
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
└── render.yaml
```

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at `http://127.0.0.1:8000`. Models are auto-generated on first startup from the CSV.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# Leave VITE_API_BASE_URL blank in .env for local dev
# The Vite proxy will forward /api/* requests to Render automatically
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/insights` | Dataset summary & top sub-categories |
| POST | `/api/predict/demand` | Predict monthly demand |
| POST | `/api/calculate/inventory` | Calculate EOQ & reorder point |
| POST | `/api/predict/risk` | Classify stockout risk |

**Example demand request:**
```json
POST /api/predict/demand
{
  "month": 11,
  "unit_price": 40,
  "sub_category": "Phones"
}
```

**Example risk request:**
```json
POST /api/predict/risk
{
  "predicted_demand": 350,
  "inventory_level": 15
}
```

---

## ML Models

| Model | Type | Target | Features |
|-------|------|--------|----------|
| Demand Forecasting | Linear Regression | Monthly Quantity | Month, Unit Price, Sub-Category (one-hot) |
| Stockout Risk | Logistic Regression | High/Low Risk | Predicted Demand, Inventory Level |

**Stockout risk rule:** `HIGH` when `inventory_level < predicted_demand`, `LOW` otherwise.

---

## Deploy

### Backend → Render

1. Push to GitHub
2. Create a Render Web Service from the repo
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `bash render-start.sh`
6. Set env var: `ALLOWED_ORIGINS=https://your-frontend.vercel.app`

### Frontend → Vercel

1. Import the repo into Vercel
2. Root directory: `frontend`
3. Framework preset: `Vite`
4. Add env var: `VITE_API_BASE_URL=https://your-backend.onrender.com`

---

## Tech Stack

- **Frontend:** React 18, React Router v6, Vite, Vanilla CSS
- **Backend:** Python 3.11, FastAPI, Uvicorn
- **ML:** Scikit-Learn, Pandas, NumPy, Joblib
- **Hosting:** Render (backend), Vercel (frontend)
- **Dataset:** Sample Superstore (9,994 transactions, 17 sub-categories)

---

## Notes

- `backend/models/*.pkl` is gitignored — models auto-regenerate on backend startup
- `frontend/.env` is gitignored — copy `.env.example` to `.env` for local dev
- Vite proxy is configured to forward `/api/*` to Render in local dev (no CORS issues)
