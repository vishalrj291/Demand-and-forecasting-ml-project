import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const SUB_CATEGORIES = [
  "Accessories",
  "Appliances",
  "Art",
  "Binders",
  "Bookcases",
  "Chairs",
  "Copiers",
  "Envelopes",
  "Fasteners",
  "Furnishings",
  "Labels",
  "Machines",
  "Paper",
  "Phones",
  "Storage",
  "Supplies",
  "Tables",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

function compactNumber(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__hint">{hint}</span>
    </div>
  );
}

function App() {
  const [form, setForm] = useState({
    month: "1",
    unit_price: "100",
    sub_category: "Accessories",
    ordering_cost: "250",
    holding_cost: "40",
    lead_time_days: "7",
    safety_stock: "100",
    inventory_level: "300",
  });
  const [demand, setDemand] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [risk, setRisk] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState({ demand: false, inventory: false, risk: false, insights: true });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInsights() {
      try {
        const result = await getJson("/api/insights");
        if (active) {
          setInsights(result);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading((current) => ({ ...current, insights: false }));
        }
      }
    }

    loadInsights();
    return () => {
      active = false;
    };
  }, []);

  const predictedDemand = demand?.predicted_demand ?? 0;
  const monthLabel = MONTHS[Number(form.month) - 1];
  const highRiskPercent = risk ? Math.round(risk.probabilities.high * 100) : 0;
  const recommendation = (() => {
    if (!demand) return "Run a prediction to generate a realistic scenario summary.";
    if (!inventory) return "Demand is ready. Calculate EOQ and reorder point to turn it into an inventory plan.";
    if (!risk) return "Inventory plan is ready. Check stockout risk to complete the operational picture.";
    if (risk.risk_level === "high") {
      return "Current inventory looks exposed. Increase safety stock or replenish earlier than the calculated reorder point.";
    }
    if (Number(form.inventory_level) <= inventory.reorder_point) {
      return "Inventory is currently near the reorder threshold. Plan the next purchase soon to stay protected.";
    }
    return "This scenario looks stable. Inventory is above the reorder point and current stockout risk is low.";
  })();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleDemand = async () => {
    setError("");
    setLoading((current) => ({ ...current, demand: true }));
    try {
      const result = await postJson("/api/predict/demand", {
        month: Number(form.month),
        unit_price: Number(form.unit_price),
        sub_category: form.sub_category,
      });
      setDemand(result);
      setInventory(null);
      setRisk(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((current) => ({ ...current, demand: false }));
    }
  };

  const handleInventory = async () => {
    setError("");
    setLoading((current) => ({ ...current, inventory: true }));
    try {
      const result = await postJson("/api/calculate/inventory", {
        predicted_demand: predictedDemand,
        ordering_cost: Number(form.ordering_cost),
        holding_cost: Number(form.holding_cost),
        lead_time_days: Number(form.lead_time_days),
        safety_stock: Number(form.safety_stock),
      });
      setInventory(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((current) => ({ ...current, inventory: false }));
    }
  };

  const handleRisk = async () => {
    setError("");
    setLoading((current) => ({ ...current, risk: true }));
    try {
      const result = await postJson("/api/predict/risk", {
        predicted_demand: predictedDemand,
        inventory_level: Number(form.inventory_level),
      });
      setRisk(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((current) => ({ ...current, risk: false }));
    }
  };

  return (
    <div className="page-shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />

      <main className="layout">
        <section className="hero">
          <div className="hero__copy-wrap">
            <p className="eyebrow">Demand Forecasting Portfolio Project</p>
            <h1>Real dataset, practical inventory logic, cleaner storytelling.</h1>
            <p className="hero__copy">
              This dashboard is powered by the Sample Superstore dataset and combines machine
              learning with inventory formulas to estimate demand, reorder strategy, and stockout
              exposure for a chosen product sub-category.
            </p>
          </div>

          <div className="hero__stats">
            <StatCard
              label="Dataset Rows"
              value={insights ? compactNumber(insights.records) : "..."}
              hint="Transactions used to build the demo"
            />
            <StatCard
              label="Total Sales"
              value={insights ? money(insights.total_sales) : "..."}
              hint="From the source CSV"
            />
            <StatCard
              label="Sub-Categories"
              value={insights ? insights.subcategories : "..."}
              hint="Product groups modeled in the app"
            />
          </div>
        </section>

        <section className="dashboard">
          <div className="panel panel--form">
            <div className="panel__header">
              <h2>Scenario Inputs</h2>
              <p>Choose one realistic scenario and run the three steps below.</p>
            </div>

            <div className="grid">
              <label>
                <span>Month</span>
                <select name="month" value={form.month} onChange={handleChange}>
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Unit Price</span>
                <input
                  name="unit_price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.unit_price}
                  onChange={handleChange}
                />
              </label>

              <label className="full-width">
                <span>Sub-Category</span>
                <select name="sub_category" value={form.sub_category} onChange={handleChange}>
                  {SUB_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Ordering Cost</span>
                <input
                  name="ordering_cost"
                  type="number"
                  min="1"
                  value={form.ordering_cost}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Holding Cost</span>
                <input
                  name="holding_cost"
                  type="number"
                  min="1"
                  value={form.holding_cost}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Lead Time (Days)</span>
                <input
                  name="lead_time_days"
                  type="number"
                  min="0"
                  value={form.lead_time_days}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Safety Stock</span>
                <input
                  name="safety_stock"
                  type="number"
                  min="0"
                  value={form.safety_stock}
                  onChange={handleChange}
                />
              </label>

              <label className="full-width">
                <span>Current Inventory</span>
                <input
                  name="inventory_level"
                  type="number"
                  min="0"
                  value={form.inventory_level}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="actions">
              <button onClick={handleDemand} disabled={loading.demand}>
                {loading.demand ? "Forecasting..." : "1. Predict Demand"}
              </button>
              <button onClick={handleInventory} disabled={!demand || loading.inventory}>
                {loading.inventory ? "Calculating..." : "2. Calculate EOQ & ROP"}
              </button>
              <button onClick={handleRisk} disabled={!demand || loading.risk}>
                {loading.risk ? "Checking..." : "3. Predict Stockout Risk"}
              </button>
            </div>

            {error ? <p className="error-banner">{error}</p> : null}
          </div>

          <div className="panel panel--results">
            <div className="panel__header">
              <h2>Decision Snapshot</h2>
              <p>Grounded in your scenario and the underlying sales data.</p>
            </div>

            <div className="results-grid">
              <StatCard
                label="Predicted Monthly Demand"
                value={demand ? `${demand.predicted_demand} units` : "--"}
                hint={`${form.sub_category} in ${monthLabel}`}
              />
              <StatCard
                label="Economic Order Quantity"
                value={inventory ? `${inventory.economic_order_quantity} units` : "--"}
                hint="Suggested order size per replenishment cycle"
              />
              <StatCard
                label="Reorder Point"
                value={inventory ? `${inventory.reorder_point} units` : "--"}
                hint="Trigger level for the next purchase"
              />
              <StatCard
                label="Stockout Risk"
                value={risk ? `${risk.risk_level.toUpperCase()} ${highRiskPercent}%` : "--"}
                hint="Model probability of running short"
              />
            </div>

            <div className="summary-card">
              <p className="summary-card__label">Business Recommendation</p>
              <p className="summary-card__text">{recommendation}</p>
            </div>

            <div className="summary-card">
              <p className="summary-card__label">Top Revenue Sub-Categories In Dataset</p>
              <div className="top-list">
                {insights?.top_subcategories?.map((item) => (
                  <div className="top-list__item" key={item.name}>
                    <span>{item.name}</span>
                    <strong>{money(item.sales)}</strong>
                  </div>
                )) ?? <p className="summary-card__text">Loading dataset insights...</p>}
              </div>
            </div>

            <div className="summary-card">
              <p className="summary-card__label">Model Notes</p>
              <ul>
                {(insights?.data_notes ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
