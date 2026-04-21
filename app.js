/* ═══════════════════════════════════════════════════════
   DSI MANAGER — APP.JS
   Models:
     /predict_demand  → features: [Month, Unit_Price, Sub-Category_* (one-hot x17)]
                        output: predicted demand (units)
     /predict_risk    → features: [predicted_demand, inventory_level]
                        output: 0 = Low Risk, 1 = High Risk + probability
   Auto-fill: predicted demand → annual-demand, avg-daily-demand, risk-demand
═══════════════════════════════════════════════════════ */

'use strict';

/* ── CONFIG ── */
const API_BASE = 'http://127.0.0.1:5000'; // Change to your deployed Flask URL

/* ── SUB-CATEGORY COLUMNS (must match training order) ── */
const SUB_CATEGORIES = [
  'Sub-Category_Accessories','Sub-Category_Appliances','Sub-Category_Art',
  'Sub-Category_Binders','Sub-Category_Bookcases','Sub-Category_Chairs',
  'Sub-Category_Copiers','Sub-Category_Envelopes','Sub-Category_Fasteners',
  'Sub-Category_Furnishings','Sub-Category_Labels','Sub-Category_Machines',
  'Sub-Category_Paper','Sub-Category_Phones','Sub-Category_Storage',
  'Sub-Category_Supplies','Sub-Category_Tables'
];

/* ────────────────────────────────────────────────────────
   UTILITIES
──────────────────────────────────────────────────────── */

function numVal(id) {
  const v = document.getElementById(id)?.value.trim();
  return v === '' || v == null ? NaN : parseFloat(v);
}

function strVal(id) {
  return document.getElementById(id)?.value.trim() ?? '';
}

function setError(id, msg) {
  const errEl   = document.getElementById(id + '-error');
  const inputEl = document.getElementById(id);
  if (errEl)   errEl.textContent = msg;
  if (inputEl) inputEl.classList.toggle('field__input--error', !!msg);
}

function clearErrors(ids) {
  ids.forEach(id => setError(id, ''));
}

function setBtnLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.classList.add('loading');
    btn.dataset.origHtml = btn.innerHTML;
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.75s" repeatCount="indefinite"/>
        </path>
      </svg>
      Processing...`;
  } else {
    btn.classList.remove('loading');
    if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
  }
}

function showResultPanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.classList.remove('result-panel--hidden');
  panel.classList.add('result-panel--visible');
}

function animateCount(elementId, target, decimals, durationMs) {
  decimals   = decimals   ?? 0;
  durationMs = durationMs ?? 800;
  const el = document.getElementById(elementId);
  if (!el) return;
  const start = performance.now();
  function tick(now) {
    const t    = Math.min((now - start) / durationMs, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = (ease * target).toFixed(decimals);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setFlowStep(step) {
  document.querySelectorAll('.flow-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('flow-step--active', 'flow-step--done');
    if (s === step) el.classList.add('flow-step--active');
    if (s < step)  el.classList.add('flow-step--done');
  });
}

function autoFill(fieldId, value, badgeId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.value = value;
  el.classList.add('autofilled');
  setTimeout(() => el.classList.remove('autofilled'), 1500);
  if (badgeId) {
    const badge = document.getElementById(badgeId);
    if (badge) badge.classList.add('visible');
  }
}

/* ────────────────────────────────────────────────────────
   SECTION 1 — DEMAND PREDICTION
   POST /predict_demand
   Body: { features: [Month, Unit_Price, Sub-Category_* x17] }
──────────────────────────────────────────────────────── */

async function predictDemand() {
  clearErrors(['unit-price', 'month', 'sub-category']);

  let valid    = true;
  const price  = numVal('unit-price');
  const month  = strVal('month');
  const subCat = strVal('sub-category');

  if (isNaN(price) || price < 0) {
    setError('unit-price', 'Enter a valid positive price.');
    valid = false;
  }
  if (!month) {
    document.getElementById('month')?.classList.add('field__select--error');
    const e = document.getElementById('month-error');
    if (e) e.textContent = 'Please select a month.';
    valid = false;
  }
  if (!subCat) {
    document.getElementById('sub-category')?.classList.add('field__select--error');
    const e = document.getElementById('sub-category-error');
    if (e) e.textContent = 'Please select a sub-category.';
    valid = false;
  }

  if (!valid) return;

  setBtnLoading('predict-btn', true);

  // Build one-hot encoded sub-category vector
  const oneHot   = SUB_CATEGORIES.map(col => col === subCat ? 1 : 0);
  // Feature order must match training: [Month, Unit_Price, sub-cat x17]
  const features = [parseInt(month), price, ...oneHot];

  try {
    const res = await fetch(`${API_BASE}/predict_demand`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ features })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data       = await res.json();
    const prediction = Math.round(data.prediction);

    showResultPanel('demand-result');
    animateCount('demand-value', prediction, 0, 800);

    // Auto-fill EOQ: annual demand = monthly * 12
    autoFill('annual-demand',    Math.round(prediction * 12),          'eoq-autofill-badge');
    // Auto-fill ROP: avg daily = monthly / 30
    autoFill('avg-daily-demand', (prediction / 30).toFixed(2),         'rop-autofill-badge');
    // Auto-fill stockout risk
    autoFill('risk-demand',      prediction,                            'risk-autofill-badge');

    setFlowStep(2);

  } catch (err) {
    console.error('Demand prediction failed:', err);
    alert(`Prediction failed: ${err.message}`);
  } finally {
    setBtnLoading('predict-btn', false);
  }
}

/* ────────────────────────────────────────────────────────
   SECTION 2 — EOQ CALCULATOR  (client-side, no API)
   Formula: EOQ = sqrt(2 * D * S / H)
──────────────────────────────────────────────────────── */

function calculateEOQ() {
  clearErrors(['annual-demand', 'ordering-cost', 'holding-cost']);

  let valid = true;
  const D = numVal('annual-demand');
  const S = numVal('ordering-cost');
  const H = numVal('holding-cost');

  if (isNaN(D) || D <= 0) { setError('annual-demand', 'Annual demand must be > 0.'); valid = false; }
  if (isNaN(S) || S <= 0) { setError('ordering-cost', 'Ordering cost must be > 0.'); valid = false; }
  if (isNaN(H) || H <= 0) { setError('holding-cost',  'Holding cost must be > 0.');  valid = false; }

  if (!valid) return;

  setBtnLoading('eoq-btn', true);
  setTimeout(() => {
    setBtnLoading('eoq-btn', false);
    const eoq = Math.round(Math.sqrt((2 * D * S) / H) * 100) / 100;
    showResultPanel('eoq-result');
    animateCount('eoq-value', eoq, 2, 700);
  }, 400);
}

/* ────────────────────────────────────────────────────────
   SECTION 3 — ROP CALCULATOR  (client-side, no API)
   Formula: ROP = (AvgDailyDemand * LeadTime) + SafetyStock
──────────────────────────────────────────────────────── */

function calculateROP() {
  clearErrors(['avg-daily-demand', 'lead-time', 'safety-stock']);

  let valid = true;
  const d  = numVal('avg-daily-demand');
  const lt = numVal('lead-time');
  const ss = numVal('safety-stock');

  if (isNaN(d)  || d < 0)  { setError('avg-daily-demand', 'Enter a valid daily demand (>= 0).'); valid = false; }
  if (isNaN(lt) || lt < 0) { setError('lead-time',        'Lead time must be >= 0 days.');        valid = false; }
  if (isNaN(ss) || ss < 0) { setError('safety-stock',     'Safety stock must be >= 0 units.');    valid = false; }

  if (!valid) return;

  setBtnLoading('rop-btn', true);
  setTimeout(() => {
    setBtnLoading('rop-btn', false);
    const rop = Math.round(((d * lt) + ss) * 100) / 100;
    showResultPanel('rop-result');
    animateCount('rop-value', rop, 0, 700);
  }, 400);
}

/* ────────────────────────────────────────────────────────
   SECTION 4 — STOCKOUT RISK PREDICTOR
   POST /predict_risk
   Body: { features: [predicted_demand, inventory_level] }
   Output: prediction (0=Low, 1=High) + probability [[p0, p1]]
──────────────────────────────────────────────────────── */

async function predictStockoutRisk() {
  clearErrors(['risk-demand', 'inventory-level']);

  let valid       = true;
  const demand    = numVal('risk-demand');
  const inventory = numVal('inventory-level');

  if (isNaN(demand)    || demand < 0)    { setError('risk-demand',     'Enter a valid demand value.');        valid = false; }
  if (isNaN(inventory) || inventory < 0) { setError('inventory-level', 'Enter a valid inventory quantity.'); valid = false; }

  if (!valid) return;

  setBtnLoading('risk-btn', true);

  try {
    const res = await fetch(`${API_BASE}/predict_risk`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      // Features: [predicted_demand, current_inventory_level]
      body:    JSON.stringify({ features: [demand, inventory] })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data       = await res.json();
    const isHighRisk = data.prediction === 1;
    const prob       = data.probability[0]; // [p_low, p_high]
    const highProb   = Math.round(prob[1] * 100);
    const lowProb    = Math.round(prob[0] * 100);

    showResultPanel('risk-result');

    const valueEl = document.getElementById('risk-value');
    if (valueEl) {
      valueEl.textContent = isHighRisk ? 'HIGH RISK' : 'LOW RISK';
      valueEl.classList.remove('risk-high', 'risk-low');
      valueEl.classList.add(isHighRisk ? 'risk-high' : 'risk-low');
    }

    const meterFill = document.getElementById('risk-meter-fill');
    if (meterFill) {
      meterFill.classList.remove('high', 'low');
      meterFill.classList.add(isHighRisk ? 'high' : 'low');
      setTimeout(() => { meterFill.style.width = highProb + '%'; }, 100);
    }

    const probNote = document.getElementById('risk-prob-note');
    if (probNote) {
      probNote.textContent =
        `High-risk probability: ${highProb}%  ·  Low-risk probability: ${lowProb}%`;
    }

    setFlowStep(4);

  } catch (err) {
    console.error('Stockout risk prediction failed:', err);
    alert(`Risk prediction failed: ${err.message}`);
  } finally {
    setBtnLoading('risk-btn', false);
  }
}

/* ────────────────────────────────────────────────────────
   LIVE ERROR CLEARING ON INPUT
──────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.field__input, .field__select').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('field__input--error', 'field__select--error');
      const errEl = document.getElementById(el.id + '-error');
      if (errEl) errEl.textContent = '';
    });
  });
});
