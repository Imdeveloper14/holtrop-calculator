import { OptimizationEngine } from './optimization/OptimizationEngine.js';
import { ObjectiveFunctions } from './optimization/ObjectiveFunctions.js';
import { OptimizationCharts } from './optimization/OptimizationCharts.js';
import { OptimizationReport } from './optimization/OptimizationReport.js';
import { OptimizationExport } from './optimization/OptimizationExport.js';

let activeEngine = null;
let chartsManager = new OptimizationCharts();
let baselineResult = null;
let optimizedResult = null;
let historyLog = [];

function injectOptimizationUI() {
  const container = document.getElementById("optimizationBody");
  if (!container) return;

  container.innerHTML = `
<div class="form-grid" style="grid-template-columns: 1fr; gap: 20px;">
  <!-- Objective Function -->
  <div class="form-group">
    <label class="form-label" for="optObjectiveSelect">Objective Function (Select One)</label>
    <select id="optObjectiveSelect" class="form-select">
      <option value="resistance">Minimum Total Resistance</option>
      <option value="effectivePower">Minimum Effective Power</option>
      <option value="deliveredPower">Minimum Delivered Power</option>
      <option value="fuelConsumption">Minimum Fuel Consumption</option>
      <option value="co2Emissions">Minimum CO₂ Emissions</option>
      <option value="voyageCost">Minimum Voyage Cost</option>
    </select>
  </div>

  <!-- Variables and Constraints Grid -->
  <div style="display: grid; gap: 12px; border: 1px solid var(--color-border); padding: 14px; border-radius: 8px; background: rgba(0,0,0,0.1);">
    <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px; color: var(--color-text-1);">Variables & Constraints</div>
    
    <!-- Cb -->
    <div style="display: grid; grid-template-columns: 180px 1fr 1fr; gap: 12px; align-items: center;">
      <label style="color: var(--color-text-2);"><input type="checkbox" id="optVarCb" checked> Block Coefficient Cb</label>
      <input id="optMinCb" type="number" value="0.55" step="0.01" class="form-input" placeholder="Min">
      <input id="optMaxCb" type="number" value="0.85" step="0.01" class="form-input" placeholder="Max">
    </div>

    <!-- Beam -->
    <div style="display: grid; grid-template-columns: 180px 1fr 1fr; gap: 12px; align-items: center;">
      <label style="color: var(--color-text-2);"><input type="checkbox" id="optVarBeam" checked> Beam B (m)</label>
      <input id="optMinBeam" type="number" value="10.0" step="0.5" class="form-input" placeholder="Min">
      <input id="optMaxBeam" type="number" value="40.0" step="0.5" class="form-input" placeholder="Max">
    </div>

    <!-- Draft -->
    <div style="display: grid; grid-template-columns: 180px 1fr 1fr; gap: 12px; align-items: center;">
      <label style="color: var(--color-text-2);"><input type="checkbox" id="optVarDraft" checked> Draft T (m)</label>
      <input id="optMinDraft" type="number" value="2.0" step="0.1" class="form-input" placeholder="Min">
      <input id="optMaxDraft" type="number" value="15.0" step="0.1" class="form-input" placeholder="Max">
    </div>

    <!-- LCB -->
    <div style="display: grid; grid-template-columns: 180px 1fr 1fr; gap: 12px; align-items: center;">
      <label style="color: var(--color-text-2);"><input type="checkbox" id="optVarLcb"> LCB (%LPP)</label>
      <input id="optMinLcb" type="number" value="-5.0" step="0.1" class="form-input" placeholder="Min">
      <input id="optMaxLcb" type="number" value="5.0" step="0.1" class="form-input" placeholder="Max">
    </div>

    <!-- Bulb Area -->
    <div style="display: grid; grid-template-columns: 180px 1fr 1fr; gap: 12px; align-items: center;">
      <label style="color: var(--color-text-2);"><input type="checkbox" id="optVarAbt"> Bulb Area (m²)</label>
      <input id="optMinAbt" type="number" value="0.0" step="0.5" class="form-input" placeholder="Min">
      <input id="optMaxAbt" type="number" value="30.0" step="0.5" class="form-input" placeholder="Max">
    </div>

    <!-- Transom Area -->
    <div style="display: grid; grid-template-columns: 180px 1fr 1fr; gap: 12px; align-items: center;">
      <label style="color: var(--color-text-2);"><input type="checkbox" id="optVarAt"> Transom Area (m²)</label>
      <input id="optMinAt" type="number" value="0.0" step="0.5" class="form-input" placeholder="Min">
      <input id="optMaxAt" type="number" value="30.0" step="0.5" class="form-input" placeholder="Max">
    </div>

    <!-- Appendage Area -->
    <div style="display: grid; grid-template-columns: 180px 1fr 1fr; gap: 12px; align-items: center;">
      <label style="color: var(--color-text-2);"><input type="checkbox" id="optVarAppendageArea"> Appendage Area (m²)</label>
      <input id="optMinAppendageArea" type="number" value="0.0" step="0.5" class="form-input" placeholder="Min">
      <input id="optMaxAppendageArea" type="number" value="50.0" step="0.5" class="form-input" placeholder="Max">
    </div>
  </div>

  <!-- Resolution / Grid Steps -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <div class="form-group">
      <label class="form-label" for="optSteps">Steps per Variable</label>
      <input id="optSteps" type="number" value="5" min="2" max="10" class="form-input">
    </div>
    <div class="form-group" style="display:none;">
      <input id="optMaxCases" type="number" value="500">
    </div>
  </div>

  <!-- Progress Indicators -->
  <div id="optProgressCard" style="display: none; border: 1px solid var(--color-border); padding: 14px; border-radius: 8px; background: rgba(0,0,0,0.15);">
    <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px; color: var(--color-text-1);">Optimization Progress</div>
    <div style="width: 100%; height: 16px; border-radius: 4px; overflow: hidden; background: var(--color-border); position: relative;">
      <div id="optProgressBarInner" style="width: 0%; height: 100%; background: var(--color-primary); transition: width 0.1s ease-in-out;"></div>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 6px; color: var(--color-text-3);">
      <span id="optProgressLabel">Ready to run...</span>
      <span id="optTimeLabel">Remaining: -- s</span>
    </div>
  </div>

  <!-- Dynamic Dashboard Overlay -->
  <div id="optDashboardCard" style="display: none; border: 1px solid var(--color-success); padding: 14px; border-radius: 8px; background: rgba(46,125,50,0.08);">
    <div style="font-weight: 600; font-size: 13px; margin-bottom: 10px; color: #4caf50;">Optimization Dashboard</div>
    <div class="results-kpi-row" style="margin-top: 0; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
      <div class="result-kpi-card" style="padding: 10px; background: rgba(0,0,0,0.15); border: 1px solid var(--color-border);">
        <div class="result-kpi-label" style="font-size: 10px;">Baseline Score</div>
        <div class="result-kpi-value" id="optBaseScore" style="font-size: 14px; color: var(--color-text-1);">&mdash;</div>
      </div>
      <div class="result-kpi-card" style="padding: 10px; background: rgba(0,0,0,0.15); border: 1px solid var(--color-border);">
        <div class="result-kpi-label" style="font-size: 10px;">Optimized Score</div>
        <div class="result-kpi-value" id="optBestScore" style="font-size: 14px; color: #4caf50;">&mdash;</div>
      </div>
      <div class="result-kpi-card" style="padding: 10px; background: rgba(46,125,50,0.15); border: 1px solid rgba(46,125,50,0.3);">
        <div class="result-kpi-label" style="font-size: 10px; color: #4caf50;">Improvement</div>
        <div class="result-kpi-value" id="optPctImprovement" style="font-size: 14px; color: #4caf50;">&mdash;</div>
      </div>
    </div>
  </div>
</div>

<div class="form-actions" style="margin-top: 20px;">
  <button class="btn btn-primary" id="runOptBtn" type="button">
    <i data-lucide="play-circle" style="width:15px;height:15px;"></i>
    Run Optimization
  </button>
  <button class="btn btn-danger" id="cancelOptBtn" type="button" style="display: none;">
    <i data-lucide="x-circle" style="width:15px;height:15px;"></i>
    Cancel Optimization
  </button>
  <button class="btn btn-secondary" id="exportOptPdfBtn" type="button" style="display: none;">
    <i data-lucide="file-text" style="width:15px;height:15px;"></i>
    Export PDF
  </button>
  <button class="btn btn-secondary" id="exportOptExcelBtn" type="button" style="display: none;">
    <i data-lucide="file-spreadsheet" style="width:15px;height:15px;"></i>
    Export Excel
  </button>
  <button class="btn btn-secondary" id="exportOptCsvBtn" type="button" style="display: none;">
    <i data-lucide="download" style="width:15px;height:15px;"></i>
    Export CSV
  </button>
</div>

<!-- Container for dynamically injected comparison table -->
<div id="optComparisonTableContainer"></div>
  `;

  document.getElementById("runOptBtn")?.addEventListener("click", runOptimizationProcess);
  document.getElementById("cancelOptBtn")?.addEventListener("click", cancelActiveProcess);
  document.getElementById("exportOptPdfBtn")?.addEventListener("click", () => OptimizationExport.exportPDF("optimizationSectionNav"));
  document.getElementById("exportOptExcelBtn")?.addEventListener("click", () => OptimizationExport.exportExcel(baselineResult, optimizedResult, historyLog));
  document.getElementById("exportOptCsvBtn")?.addEventListener("click", () => OptimizationExport.exportCSV(baselineResult, optimizedResult, historyLog));
  
  if (window.lucide) window.lucide.createIcons();
}

function cancelActiveProcess() {
  if (activeEngine) {
    activeEngine.cancel();
  }
}

function runOptimizationProcess() {
  // Read inputs from primary particulars
  const baseVessel = {
    lwl: Number(document.getElementById("lwl")?.value) || 100,
    beam: Number(document.getElementById("beam")?.value) || 18,
    draft: Number(document.getElementById("draft")?.value) || 5.5,
    cb: Number(document.getElementById("cb")?.value) || 0.70,
    cm: Number(document.getElementById("cm")?.value) || 0.98,
    cwp: Number(document.getElementById("cwp")?.value) || 0.80,
    lcb: Number(document.getElementById("lcb")?.value) || 0.0,
    abt: Number(document.getElementById("abt")?.value) || 0.0,
    hb: Number(document.getElementById("hb")?.value) || 0.0,
    at: Number(document.getElementById("at")?.value) || 0.0,
    speed: Number(document.getElementById("speed")?.value) || 15.0,
    appendageArea: (window.appendagesList || []).reduce((acc, a) => acc + a.area, 0) || 0
  };

  const engineInputs = {
    mcr: Number(document.getElementById("engineMCR")?.value) || 5000,
    sfoc: Number(document.getElementById("engineSFOC")?.value) || 190,
    numEngines: Number(document.getElementById("numEngines")?.value) || 1,
    mechEfficiency: Number(document.getElementById("mechEfficiency")?.value) || 0.97,
    fuelPrice: Number(document.getElementById("fuelPrice")?.value) || 600,
    voyageDist: Number(document.getElementById("voyageDistInput")?.value) || 1000,
    fuelType: document.getElementById("fuelType")?.value || "MDO"
  };

  const variables = {
    cb: document.getElementById("optVarCb").checked,
    beam: document.getElementById("optVarBeam").checked,
    draft: document.getElementById("optVarDraft").checked,
    lcb: document.getElementById("optVarLcb").checked,
    abt: document.getElementById("optVarAbt").checked,
    at: document.getElementById("optVarAt").checked,
    appendageArea: document.getElementById("optVarAppendageArea").checked
  };

  const constraints = {
    minCb: Number(document.getElementById("optMinCb").value),
    maxCb: Number(document.getElementById("optMaxCb").value),
    minBeam: Number(document.getElementById("optMinBeam").value),
    maxBeam: Number(document.getElementById("optMaxBeam").value),
    minDraft: Number(document.getElementById("optMinDraft").value),
    maxDraft: Number(document.getElementById("optMaxDraft").value),
    minLcb: Number(document.getElementById("optMinLcb").value),
    maxLcb: Number(document.getElementById("optMaxLcb").value),
    minAbt: Number(document.getElementById("optMinAbt").value),
    maxAbt: Number(document.getElementById("optMaxAbt").value),
    minAt: Number(document.getElementById("optMinAt").value),
    maxAt: Number(document.getElementById("optMaxAt").value),
    minAppendageArea: Number(document.getElementById("optMinAppendageArea").value),
    maxAppendageArea: Number(document.getElementById("optMaxAppendageArea").value)
  };

  const objectiveId = document.getElementById("optObjectiveSelect").value;
  const steps = Number(document.getElementById("optSteps").value) || 5;

  // Toggle Visibility
  document.getElementById("optProgressCard").style.display = "block";
  document.getElementById("runOptBtn").style.display = "none";
  document.getElementById("cancelOptBtn").style.display = "inline-flex";

  const objMeta = ObjectiveFunctions.getObjectives().find(o => o.id === objectiveId);
  const objName = objMeta ? objMeta.name : "Objective";

  activeEngine = new OptimizationEngine({
    baseVessel,
    engineInputs,
    variables,
    constraints,
    objectiveId,
    steps,
    onProgress: (progress, completed, total, estTime, bestEval) => {
      document.getElementById("optProgressBarInner").style.width = `${progress}%`;
      document.getElementById("optProgressLabel").textContent = `Evaluating Design #${completed} of ${total}...`;
      document.getElementById("optTimeLabel").textContent = `Remaining: ${estTime.toFixed(1)} s`;

      if (bestEval) {
        document.getElementById("optDashboardCard").style.display = "block";
        const val = ObjectiveFunctions.evaluate(objectiveId, bestEval) * (objMeta?.multiplier || 1.0);
        document.getElementById("optBestScore").textContent = `${val.toFixed(2)} ${objMeta?.unit || ''}`;
      }
    },
    onComplete: (base, best, history) => {
      activeEngine = null;
      baselineResult = base;
      optimizedResult = best;
      historyLog = history;

      document.getElementById("optProgressCard").style.display = "none";
      document.getElementById("runOptBtn").style.display = "inline-flex";
      document.getElementById("cancelOptBtn").style.display = "none";
      
      document.getElementById("exportOptPdfBtn").style.display = "inline-flex";
      document.getElementById("exportOptExcelBtn").style.display = "inline-flex";
      document.getElementById("exportOptCsvBtn").style.display = "inline-flex";

      // Render comparative report
      OptimizationReport.renderComparison("optComparisonTableContainer", base, best);

      // Render Charts
      chartsManager.render(history, base, best, objName);

      // Complete Dashboard Card values
      const baseScoreVal = ObjectiveFunctions.evaluate(objectiveId, base) * (objMeta?.multiplier || 1.0);
      const bestScoreVal = ObjectiveFunctions.evaluate(objectiveId, best) * (objMeta?.multiplier || 1.0);
      const improvement = baseScoreVal !== 0 ? ((baseScoreVal - bestScoreVal) / baseScoreVal) * 100 : 0;

      document.getElementById("optBaseScore").textContent = `${baseScoreVal.toFixed(2)} ${objMeta?.unit || ''}`;
      document.getElementById("optBestScore").textContent = `${bestScoreVal.toFixed(2)} ${objMeta?.unit || ''}`;
      document.getElementById("optPctImprovement").textContent = `-${improvement.toFixed(2)}%`;
    },
    onError: (errMsg) => {
      activeEngine = null;
      document.getElementById("optProgressCard").style.display = "none";
      document.getElementById("runOptBtn").style.display = "inline-flex";
      document.getElementById("cancelOptBtn").style.display = "none";
      alert(errMsg);
    }
  });

  activeEngine.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectOptimizationUI);
} else {
  injectOptimizationUI();
}
