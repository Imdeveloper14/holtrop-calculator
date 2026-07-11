//-----------------------------------------------------
// Holtrop & Mennen Hull Form Optimization Module
//-----------------------------------------------------

let optResults = [];
let optResChart = null;
let optPowerChart = null;
let optFuelChart = null;
let optParetoChart = null;

window.runHullOptimization = function() {
    // Read input ranges
    const inputs = {
        minLwl: Number(document.getElementById("optMinLwl").value) || 50,
        maxLwl: Number(document.getElementById("optMaxLwl").value) || 150,
        minBeam: Number(document.getElementById("optMinBeam").value) || 10,
        maxBeam: Number(document.getElementById("optMaxBeam").value) || 30,
        minDraft: Number(document.getElementById("optMinDraft").value) || 4,
        maxDraft: Number(document.getElementById("optMaxDraft").value) || 10,
        minCb: Number(document.getElementById("optMinCb").value) || 0.60,
        maxCb: Number(document.getElementById("optMaxCb").value) || 0.85,
        steps: Number(document.getElementById("optSteps").value) || 3,
        maxCases: Number(document.getElementById("optMaxCases").value) || 500,

        // Base constants from normal input card
        baseCm: Number(document.getElementById("cm").value) || 0.98,
        baseCwp: Number(document.getElementById("cwp").value) || 0.75,
        baseLcb: Number(document.getElementById("lcb").value) || 0.0,
        baseAbt: Number(document.getElementById("abt").value) || 0.0,
        baseHb: Number(document.getElementById("hb").value) || 0.0,
        baseAt: Number(document.getElementById("at").value) || 0.0,
        baseSpeed: Number(document.getElementById("speed").value) || 15.0
    };

    if (inputs.minLwl <= 0 || inputs.maxLwl <= inputs.minLwl || inputs.steps <= 0) {
        alert("Please enter valid range limits.");
        return;
    }

    const variants = window.generateHullVariants(inputs);
    optResults = [];

    // Auxiliary variables
    const appendages = window.appendagesList || [];
    const engineInputs = {
        mcr: Number(document.getElementById("engineMCR").value) || 5000,
        sfoc: Number(document.getElementById("engineSFOC").value) || 190,
        numEngines: Number(document.getElementById("numEngines").value) || 1,
        mechEfficiency: Number(document.getElementById("mechEfficiency").value) || 0.97,
        fuelPrice: Number(document.getElementById("fuelPrice").value) || 600,
        voyageDist: Number(document.getElementById("voyageDistInput").value) || 1000,
        fuelType: document.getElementById("fuelType").value || "MDO"
    };

    variants.forEach((v, idx) => {
        try {
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

            const checks = checkApplicability(v, friction);
            const warningCount = checks.filter(c => c.status === "WARNING" || c.status === "OUT OF RANGE").length;
            const warningText = warningCount > 0 ? "WARNING" : "PASS";

            optResults.push({
                idx: idx + 1,
                lwl: v.lwl,
                beam: v.beam,
                draft: v.draft,
                cb: v.cb,
                disp: v.disp,
                speed: v.speed,
                Rt: total.Rt,
                PE: power.PE,
                PB: propulsionData.brakePower,
                fuelDay: eng.fc_day,
                co2: emissions.co2,
                lbRatio: v.lwl / v.beam,
                warning: warningText
            });
        } catch (err) {}
    });

    if (optResults.length === 0) {
        alert("Optimization returned no valid results.");
        return;
    }

    // Find Best Designs
    const bestRt = [...optResults].sort((a, b) => a.Rt - b.Rt)[0];
    const bestPE = [...optResults].sort((a, b) => a.PE - b.PE)[0];
    const bestFuel = [...optResults].sort((a, b) => a.fuelDay - b.fuelDay)[0];

    // Populate Best Design UI
    document.getElementById("optBestRtName").textContent = "Case #" + bestRt.idx + " (" + (bestRt.Rt / 1000).toFixed(2) + " kN)";
    document.getElementById("optBestPowerName").textContent = "Case #" + bestPE.idx + " (" + (bestPE.PE / 1000).toFixed(2) + " kW)";
    document.getElementById("optBestFuelName").textContent = "Case #" + bestFuel.idx + " (" + bestFuel.fuelDay.toFixed(2) + " t/day)";

    // Render Table (Top 10 sorted by lowest Rt)
    const top10 = [...optResults].sort((a, b) => a.Rt - b.Rt).slice(0, 10);
    const tbody = document.getElementById("optResultsListBody");
    tbody.innerHTML = "";

    top10.forEach(res => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${res.idx}</strong></td>
            <td>${res.lwl.toFixed(1)}</td>
            <td>${res.beam.toFixed(1)}</td>
            <td>${res.draft.toFixed(1)}</td>
            <td>${res.cb.toFixed(3)}</td>
            <td>${(res.Rt / 1000).toFixed(2)}</td>
            <td>${(res.PE / 1000).toFixed(2)}</td>
            <td>${res.fuelDay.toFixed(2)}</td>
            <td style="color: ${res.warning === 'WARNING' ? '#ff9800' : '#2e7d32'}; font-weight: bold;">${res.warning}</td>
        `;
        tbody.appendChild(tr);
    });

    // Draw Optimization Charts
    drawOptCharts(optResults);
};

function drawOptCharts(results) {
    if (optResChart) optResChart.destroy();
    if (optPowerChart) optPowerChart.destroy();
    if (optFuelChart) optFuelChart.destroy();
    if (optParetoChart) optParetoChart.destroy();

    // Sort by Cb for trend lines
    const sortedByCb = [...results].sort((a, b) => a.cb - b.cb);
    const sortedByLb = [...results].sort((a, b) => a.lbRatio - b.lbRatio);

    const ctx1 = document.getElementById("optResChart").getContext("2d");
    const rtData = results.map(r => r.Rt / 1000);
    const rtScale = window.getDynamicScale(rtData);
    optResChart = new Chart(ctx1, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Resistance vs Cb',
                data: results.map(r => ({ x: r.cb, y: r.Rt / 1000 })),
                backgroundColor: '#1e88e5'
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Block Coefficient (Cb)' } },
                y: {
                    title: { display: true, text: 'Resistance (kN)' },
                    min: rtScale.min,
                    max: rtScale.max,
                    suggestedMax: rtScale.suggestedMax,
                    ticks: {
                        callback: function(value) {
                            return window.formatChartTicks(value, 'resistance');
                        }
                    }
                }
            }
        }
    });

    const ctx2 = document.getElementById("optPowerChart").getContext("2d");
    const peData = results.map(r => r.PE / 1000);
    const powerScale = window.getDynamicScale(peData);
    optPowerChart = new Chart(ctx2, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Effective Power vs L/B',
                data: results.map(r => ({ x: r.lbRatio, y: r.PE / 1000 })),
                backgroundColor: '#4caf50'
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'L/B Ratio' } },
                y: {
                    title: { display: true, text: 'Effective Power (kW)' },
                    min: powerScale.min,
                    max: powerScale.max,
                    suggestedMax: powerScale.suggestedMax,
                    ticks: {
                        callback: function(value) {
                            return window.formatChartTicks(value, 'power');
                        }
                    }
                }
            }
        }
    });

    const ctx3 = document.getElementById("optFuelChart").getContext("2d");
    const fuelData = results.map(r => r.fuelDay);
    const fuelScale = window.getDynamicScale(fuelData);
    optFuelChart = new Chart(ctx3, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Daily Fuel (tons/day) vs Speed (kn)',
                data: results.map(r => ({ x: r.speed, y: r.fuelDay })),
                backgroundColor: '#ff9800'
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Speed (knots)' } },
                y: {
                    title: { display: true, text: 'Fuel (tons/day)' },
                    min: fuelScale.min,
                    max: fuelScale.max,
                    suggestedMax: fuelScale.suggestedMax,
                    ticks: {
                        callback: function(value) {
                            return window.formatChartTicks(value, 'fuel');
                        }
                    }
                }
            }
        }
    });

    const ctx4 = document.getElementById("optParetoChart").getContext("2d");
    optParetoChart = new Chart(ctx4, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Pareto (Resistance vs Fuel)',
                data: results.map(r => ({ x: r.Rt / 1000, y: r.fuelDay })),
                backgroundColor: '#e91e63'
            }]
        },
        options: {
            scales: {
                x: {
                    title: { display: true, text: 'Total Resistance (kN)' },
                    min: rtScale.min,
                    max: rtScale.max,
                    suggestedMax: rtScale.suggestedMax,
                    ticks: {
                        callback: function(value) {
                            return window.formatChartTicks(value, 'resistance');
                        }
                    }
                },
                y: {
                    title: { display: true, text: 'Daily Fuel Consumption (tons)' },
                    min: fuelScale.min,
                    max: fuelScale.max,
                    suggestedMax: fuelScale.suggestedMax,
                    ticks: {
                        callback: function(value) {
                            return window.formatChartTicks(value, 'fuel');
                        }
                    }
                }
            }
        }
    });
}

window.exportOptCsv = function() {
    if (optResults.length === 0) {
        alert("Please run optimization first.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Case ID,LWL (m),Beam (m),Draft (m),Cb,Displacement (m3),Speed (knots),Total Resistance (kN),Effective Power (kW),Brake Power (kW),Daily Fuel (tons/day),CO2 (kg/h)\n";

    optResults.forEach(r => {
        csvContent += `${r.idx},${r.lwl.toFixed(2)},${r.beam.toFixed(2)},${r.draft.toFixed(2)},${r.cb.toFixed(3)},${r.disp.toFixed(1)},${r.speed.toFixed(1)},${(r.Rt/1000).toFixed(3)},${(r.PE/1000).toFixed(3)},${(r.PB/1000).toFixed(3)},${r.fuelDay.toFixed(3)},${r.co2.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hull_optimization_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

document.addEventListener("DOMContentLoaded", () => {
    const runBtn = document.getElementById("runOptBtn");
    if (runBtn) runBtn.addEventListener("click", window.runHullOptimization);

    const expBtn = document.getElementById("exportOptCsvBtn");
    if (expBtn) expBtn.addEventListener("click", window.exportOptCsv);
});
