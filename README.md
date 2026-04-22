# Demand Forecasting & Inventory Optimization

A clean full-stack machine learning project for portfolio use and deployment:

- `backend/`: FastAPI API ready for Render
- `frontend/`: Vite + React dashboard ready for Vercel
- automatic model generation from `SampleSuperstore.csv`
- GitHub-friendly structure with reproducible training logic

## What This Project Does

This app helps demonstrate a practical inventory analytics workflow:

- predicts monthly demand from month, unit price, and product sub-category
- calculates EOQ and reorder point
- predicts stockout risk from predicted demand and current inventory

## Project Structure

```text
.
|-- backend
|   |-- app
|   |-- data
|   |-- models
|   `-- requirements.txt
|-- frontend
|   |-- src
|   `-- package.json
`-- render.yaml
```

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will run at `http://127.0.0.1:8000`. If the model files are missing, they are generated automatically on startup.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env` to your backend URL.

## API Endpoints

- `GET /api/health`
- `POST /api/predict/demand`
- `POST /api/calculate/inventory`
- `POST /api/predict/risk`

Example demand request:

```json
{
  "month": 6,
  "unit_price": 120.5,
  "sub_category": "Chairs"
}
```

## Deploy Backend On Render

1. Push the repository to GitHub.
2. Create a new Render Web Service from the repo.
3. Render can read `render.yaml`, or use:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `bash render-start.sh`
4. Set `ALLOWED_ORIGINS` to your Vercel frontend URL.

## Deploy Frontend On Vercel

1. Import the same repository into Vercel.
2. Set the root directory to `frontend`.
3. Framework preset: `Vite`.
4. Add env var:
   - `VITE_API_BASE_URL=https://your-render-backend.onrender.com`

## Notes

- The original repository mixed Streamlit and static frontend code in one flat folder.
- This version uses one consistent architecture that is easier to maintain and deploy.
- `backend/models/*.pkl` is ignored because the backend can regenerate them.
