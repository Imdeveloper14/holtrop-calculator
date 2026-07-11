//-----------------------------------------------------
// Batch Processing Module
//-----------------------------------------------------

let batchRunning = false;
let batchCancelRequested = false;
let batchResults = [];
let batchErrors = [];

window.handleBatchImport = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    reader.onload = function(e) {
        let rows = [];
        if (isExcel) {
            rows = window.parseExcelData(e.target.result);
        } else {
            rows = window.parseCSVData(e.target.result);
        }

        if (rows.length === 0) {
            alert("No data rows found in the imported file.");
            return;
        }

        // Start batch calculation
        startBatchCalculation(rows);
    };

    if (isExcel) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
};

window.cancelBatchCalculation = function() {
    if (batchRunning) {
        batchCancelRequested = true;
        batchRunning = false;
        document.getElementById("batchProgressLabel").textContent = "Calculation Cancelled.";
    }
};

async function startBatchCalculation(rows) {
    batchRunning = true;
    batchCancelRequested = false;
    batchResults = [];
    batchErrors = [];

    const progressDiv = document.getElementById("batchProgressContainer");
    const progressBar = document.getElementById("batchProgressBar");
    const progressLabel = document.getElementById("batchProgressLabel");

    if (progressDiv) progressDiv.style.display = "block";

    const appendages = window.appendagesList || [];
    const engineInputs = {
        mcr: 5000,
        sfoc: 190,
        numEngines: 1,
        mechEfficiency: 0.97,
        fuelPrice: 600,
        voyageDist: 1000,
        fuelType: "MDO"
    };

    const envInputs = {
        shipType: "Bulk Carrier",
        gt: 10000,
        dwt: 15000,
        vref: 15.0,
        mcr: 5000,
        pAE: 500,
        sfoc: 190,
        fuelType: "MDO",
        annualDist: 30000,
        annualFuel: 3000
    };

    for (let i = 0; i < rows.length; i++) {
        if (batchCancelRequested) {
            batchRunning = false;
            return;
        }

        const r = rows[i];
        const name = r["vessel name"] || r["name"] || "Vessel #" + (i + 1);

        // Update progress bar
        const pct = ((i + 1) / rows.length) * 100;
        if (progressBar) progressBar.value = pct;
        if (progressLabel) progressLabel.textContent = `Processing: ${i + 1} / ${rows.length} (${name})`;

        // Asynchronous yield to allow UI update and cancellation checks
        await new Promise(resolve => setTimeout(resolve, 5));

        // Parse fields
        const lwl = Number(r["lwl"]) || Number(r["lpp"]) || 0;
        const beam = Number(r["beam"]) || 0;
        const draft = Number(r["draft"]) || 0;
        const disp = Number(r["displacement"]) || 0;
        const cb = Number(r["cb"]) || 0;
        const cm = Number(r["cm"]) || 0.98;
        const cwp = Number(r["cwp"]) || 0.75;
        const lcb = Number(r["lcb"]) || 0.0;
        const speed = Number(r["speed"]) || 0;
        const abt = Number(r["bulb area"]) || 0;
        const hb = Number(r["bulb height"]) || 0;
        const at = Number(r["transom area"]) || 0;

        // Validation
        if (lwl <= 0 || beam <= 0 || draft <= 0 || cb <= 0 || speed <= 0) {
            batchErrors.push({
                row: i + 1,
                name: name,
                error: "Invalid basic geometry parameters (LWL, Beam, Draft, Cb, Speed must be > 0)."
            });
            continue;
        }

        try {
            const v = {
                lwl, beam, draft, cb, cm, cwp, lcb, speed, abt, hb, at, disp,
                lpp: Number(r["lpp"]) || lwl * 0.98
            };

            const S = wettedSurface(v);
            const coeff = hullCoefficients(v);
            const hc = holtropCoefficients(v);
            const c16 = holtropC16(v);
            const c15 = holtropC15(v);
            const friction = frictionResistance(S, v.lwl, v.speed);
            const ff = formFactor(v);
            const viscousResistance = friction.Rf * (1 + ff.k1);

            const Cp_wave = v.cb / v.cm;
            const Lr_wave = v.lwl * (1 - Cp_wave + (0.06 * Cp_wave * v.lcb) / (4 * Cp_wave - 1));
            const ie_exponent = 
                -Math.pow(v.lwl / v.beam, 0.80856) *
                Math.pow(1 - v.cwp, 0.30484) *
                Math.pow(Math.max(0, 1 - Cp_wave - 0.0225 * v.lcb), 0.6367) *
                Math.pow((v.lwl - Lr_wave) / v.beam, 0.34574) *
                Math.pow(100 * v.disp / Math.pow(v.lwl, 3), 0.16302);
            const ie = 1 + 89 * Math.exp(ie_exponent);

            const c1 = 2223105 * Math.pow(hc.c7, 3.78613) * Math.pow(v.draft / v.beam, 1.07961) * Math.pow(Math.max(1.0, 90 - ie), -1.37565);
            const c2 = 1.0;
            const c5 = 1.0;

            const m1 = 0.0140407 * (v.lwl / v.draft) - 1.75254 * (Math.pow(v.disp, 1/3) / v.lwl) - 4.79323 * (v.beam / v.lwl) - c16.c16;
            const m2 = c15.c15 * Cp_wave * Cp_wave * Math.exp(-0.1 / (friction.Fn * friction.Fn || 1.0));
            const lambda = (v.lwl / v.beam < 12) ? (1.446 * Cp_wave - 0.03 * (v.lwl / v.beam)) : (1.446 * Cp_wave - 0.36);

            const wave = holtropWaveResistance(v, c1, c2, c5, c15.c15, c16.c16, m1, m2, lambda);
            const air = airResistance(v);
            const appendage = appendageResistance(v, friction.Cf, appendages);
            const correlation = correlationAllowance(v, S);
            const bulb = bulbResistance(v);
            const transom = transomResistance(v);

            const total = totalResistance(v, friction, viscousResistance, wave, appendage.Rapp, air.Ra, correlation.RA, bulb.Rb, transom.Rtr);
            const power = effectivePower(v, total.Rt);
            const propulsionData = propulsion(power);
            const pb_kW = propulsionData.brakePower / 1000;

            const eng = window.calculateEngineSelection(pb_kW, v.speed, engineInputs);
            const emissions = window.calculateEmissions(eng.fc_kgh, engineInputs.fuelType);

            const tempEnv = Object.assign({}, envInputs, { gt: lwl*beam*draft, dwt: lwl*beam*draft*1.2, mcr: engineInputs.mcr });
            const eexi = window.calculateEEXI(v, tempEnv);
            const cii = window.calculateCII(v, tempEnv);

            batchResults.push({
                name,
                lwl, beam, draft, cb, disp, speed,
                Rt: total.Rt,
                PE: power.PE,
                PB: propulsionData.brakePower,
                fuelDay: eng.fc_day,
                co2: emissions.co2,
                eexi: eexi.attained,
                cii: cii.rating
            });
        } catch (err) {
            batchErrors.push({
                row: i + 1,
                name: name,
                error: err.message || "Unknown computation error."
            });
        }
    }

    batchRunning = false;
    if (progressLabel) progressLabel.textContent = `Completed processing ${batchResults.length} vessels.`;

    // Render Batch Results
    renderBatchDashboard();
}

function renderBatchDashboard() {
    // Render failed report
    const errBody = document.getElementById("batchErrorsBody");
    if (errBody) {
        errBody.innerHTML = "";
        batchErrors.forEach(e => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>Row ${e.row}</td><td>${e.name || "Unknown"}</td><td style="color: #d32f2f;">${e.error}</td>`;
            errBody.appendChild(tr);
        });
    }

    // Populate Top 10 Best Designs sorted by Lowest Rt
    const top10 = [...batchResults].sort((a, b) => a.Rt - b.Rt).slice(0, 10);
    const tbody = document.getElementById("batchResultsBody");
    if (tbody) {
        tbody.innerHTML = "";
        top10.forEach((res, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>#${idx + 1}</strong></td>
                <td>${res.name}</td>
                <td>${res.lwl.toFixed(1)}</td>
                <td>${res.beam.toFixed(1)}</td>
                <td>${res.draft.toFixed(1)}</td>
                <td>${res.cb.toFixed(3)}</td>
                <td>${(res.Rt / 1000).toFixed(2)}</td>
                <td>${(res.PE / 1000).toFixed(2)}</td>
                <td>${res.fuelDay.toFixed(2)}</td>
                <td>${res.cii}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Trigger charts drawing
    window.drawBatchCharts(batchResults);
}

window.exportBatchCsv = function() {
    if (batchResults.length === 0) {
        alert("No batch results to export.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Vessel Name,LWL (m),Beam (m),Draft (m),Cb,Displacement (m3),Speed (knots),Total Resistance (kN),Effective Power (kW),Brake Power (kW),Daily Fuel (tons/day),CO2 (kg/h),EEXI,CII\n";

    batchResults.forEach(r => {
        csvContent += `"${r.name}",${r.lwl.toFixed(2)},${r.beam.toFixed(2)},${r.draft.toFixed(2)},${r.cb.toFixed(3)},${r.disp.toFixed(1)},${r.speed.toFixed(1)},${(r.Rt/1000).toFixed(3)},${(r.PE/1000).toFixed(3)},${(r.PB/1000).toFixed(3)},${r.fuelDay.toFixed(3)},${r.co2.toFixed(2)},${r.eexi.toFixed(4)},${r.cii}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "batch_processing_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.exportBatchExcel = function() {
    if (batchResults.length === 0) {
        alert("No batch results to export.");
        return;
    }
    const data = batchResults.map(r => ({
        "Vessel Name": r.name,
        "LWL (m)": Number(r.lwl.toFixed(2)),
        "Beam (m)": Number(r.beam.toFixed(2)),
        "Draft (m)": Number(r.draft.toFixed(2)),
        "Cb": Number(r.cb.toFixed(3)),
        "Displacement (m3)": Number(r.disp.toFixed(1)),
        "Speed (knots)": Number(r.speed.toFixed(1)),
        "Total Resistance (kN)": Number((r.Rt/1000).toFixed(3)),
        "Effective Power (kW)": Number((r.PE/1000).toFixed(3)),
        "Brake Power (kW)": Number((r.PB/1000).toFixed(3)),
        "Daily Fuel (tons/day)": Number(r.fuelDay.toFixed(3)),
        "CO2 (kg/h)": Number(r.co2.toFixed(2)),
        "EEXI": Number(r.eexi.toFixed(4)),
        "CII": r.cii
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Results");
    XLSX.writeFile(workbook, "batch_processing_results.xlsx");
};

document.addEventListener("DOMContentLoaded", () => {
    const importBtn = document.getElementById("batchFileImport");
    if (importBtn) importBtn.addEventListener("change", window.handleBatchImport);

    const cancelBtn = document.getElementById("cancelBatchBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", window.cancelBatchCalculation);

    const expBtn = document.getElementById("exportBatchCsvBtn");
    if (expBtn) expBtn.addEventListener("click", window.exportBatchCsv);

    const expXlsBtn = document.getElementById("exportBatchExcelBtn");
    if (expXlsBtn) expXlsBtn.addEventListener("click", window.exportBatchExcel);
});
