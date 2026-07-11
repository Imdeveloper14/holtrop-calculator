//-----------------------------------------------------
// Holtrop & Mennen Performance Curves Module
//-----------------------------------------------------

let rtCurveChart = null;
let peCurveChart = null;
let breakdownCurveChart = null;
let co2SpeedChart = null;
let ciiTrendChart = null;
let performanceResults = [];

window.generatePerformanceCurves = function() {
    console.log("Performance Started");
    performanceResults = [];

    const start = Number(document.getElementById("curveStart").value) || 0;
    const end = Number(document.getElementById("curveEnd").value) || 0;
    const step = Number(document.getElementById("curveStep").value) || 0.5;

    if (start <= 0 || end <= 0 || end <= start || step <= 0) {
        const errMsg = "Invalid speed range (Start Speed: " + start + ", End Speed: " + end + ", Increment: " + step + ")";
        console.error(errMsg);
        alert("Please enter a valid speed range (Start Speed > 0, End Speed > Start Speed, Increment > 0).");
        return;
    }

    // Capture current vessel inputs
    const vessel = {
        lpp: Number(document.getElementById("lpp").value),
        lwl: Number(document.getElementById("lwl").value),
        beam: Number(document.getElementById("beam").value),
        draft: Number(document.getElementById("draft").value),
        disp: Number(document.getElementById("disp").value),
        cb: Number(document.getElementById("cb").value),
        cm: Number(document.getElementById("cm").value),
        cwp: Number(document.getElementById("cwp").value),
        lcb: Number(document.getElementById("lcb").value),
        abt: Number(document.getElementById("abt").value),
        hb: Number(document.getElementById("hb").value),
        at: Number(document.getElementById("at").value),
        rhoAir: Number(document.getElementById("rhoAir").value),
        windSpeed: Number(document.getElementById("windSpeed").value),
        windDir: Number(document.getElementById("windDir").value),
        av: Number(document.getElementById("av").value),
        cdAir: Number(document.getElementById("cdAir").value),
        numPropellers: Number(document.getElementById("numPropellers").value),
        propDiameter: Number(document.getElementById("propDiameter").value),
        propPitch: Number(document.getElementById("propPitch").value),
        propEAR: Number(document.getElementById("propEAR").value),
        propBlades: Number(document.getElementById("propBlades").value),
        propRPM: Number(document.getElementById("propRPM").value),
        wakeFraction: Number(document.getElementById("wakeFraction").value),
        thrustDeduction: Number(document.getElementById("thrustDeduction").value),
        rotativeEfficiency: Number(document.getElementById("rotativeEfficiency").value),
        propBSeriesType: document.getElementById("propBSeriesType").value,
        speed: 0 // Will vary
    };

    console.log(vessel);

    if (vessel.lwl <= 0 || vessel.beam <= 0 || vessel.draft <= 0) {
        const errMsg = "Invalid vessel dimensions: LWL=" + vessel.lwl + ", Beam=" + vessel.beam + ", Draft=" + vessel.draft;
        console.error(errMsg);
        alert("Please enter valid vessel particulars first.");
        return;
    }

    const S = wettedSurface(vessel);
    const hc = holtropCoefficients(vessel);
    const c16 = holtropC16(vessel);
    const c15 = holtropC15(vessel);
    const ff = formFactor(vessel);

    const speeds = [];
    for (let speed = start; speed <= end; speed += step) {
        speeds.push(speed);
    }
    if (speeds[speeds.length - 1] !== end) {
        speeds.push(end);
    }

    speeds.forEach(spd => {
        vessel.speed = spd;

        const friction = frictionResistance(S, vessel.lwl, vessel.speed);
        const viscousResistance = friction.Rf * (1 + ff.k1);
        
        // Inline wave resistance coefficients calculation
        const Cp_wave = vessel.cb / vessel.cm;
        const Lr_wave = vessel.lwl * (1 - Cp_wave + (0.06 * Cp_wave * vessel.lcb) / (4 * Cp_wave - 1));
        const ie_exponent = 
            -Math.pow(vessel.lwl / vessel.beam, 0.80856) *
            Math.pow(1 - vessel.cwp, 0.30484) *
            Math.pow(Math.max(0, 1 - Cp_wave - 0.0225 * vessel.lcb), 0.6367) *
            Math.pow((vessel.lwl - Lr_wave) / vessel.beam, 0.34574) *
            Math.pow(100 * vessel.disp / Math.pow(vessel.lwl, 3), 0.16302);
        const ie = 1 + 89 * Math.exp(ie_exponent);

        const c1 = 2223105 * Math.pow(hc.c7, 3.78613) * Math.pow(vessel.draft / vessel.beam, 1.07961) * Math.pow(Math.max(1.0, 90 - ie), -1.37565);
        const c2 = 1.0;
        const c5 = 1.0;

        const m1 = 0.0140407 * (vessel.lwl / vessel.draft) - 1.75254 * (Math.pow(vessel.disp, 1/3) / vessel.lwl) - 4.79323 * (vessel.beam / vessel.lwl) - c16.c16;
        const m2 = c15.c15 * Cp_wave * Cp_wave * Math.exp(-0.1 / (friction.Fn * friction.Fn || 1.0));
        const lambda = (vessel.lwl / vessel.beam < 12) ? (1.446 * Cp_wave - 0.03 * (vessel.lwl / vessel.beam)) : (1.446 * Cp_wave - 0.36);

        const wave = holtropWaveResistance(
            vessel,
            c1,
            c2,
            c5,
            c15.c15,
            c16.c16,
            m1,
            m2,
            lambda
        );

        const air = airResistance(vessel);
        const appendage = appendageResistance(vessel, friction.Cf, window.appendagesList);
        const correlation = correlationAllowance(vessel, S);
        const bulb = bulbResistance(vessel);
        const transom = transomResistance(vessel);

        const total = totalResistance(
            vessel,
            friction,
            viscousResistance,
            wave,
            appendage.Rapp,
            air.Ra,
            correlation.RA,
            bulb.Rb,
            transom.Rtr
        );

        const power = effectivePower(vessel, total.Rt);
        const propulsionData = propulsion(power);

        performanceResults.push({
            speed: spd,
            Rt: total.Rt,
            PE: power.PE,
            PD: propulsionData.deliveredPower,
            PB: propulsionData.brakePower,
            breakdown: total.breakdown
        });
    });

    console.log(performanceResults);

    if (performanceResults.length === 0) {
        console.error("performanceResults is empty: No speeds were evaluated in the loop.");
        return;
    }

    // Render Table
    const tbody = document.getElementById("curveTableBody");
    if (tbody) {
        tbody.innerHTML = "";
        performanceResults.forEach(res => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${res.speed.toFixed(1)}</td>
                <td>${(res.Rt / 1000).toFixed(2)}</td>
                <td>${(res.PE / 1000).toFixed(2)}</td>
                <td>${(res.PD / 1000).toFixed(2)}</td>
                <td>${(res.PB / 1000).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Draw Charts
    drawCurveCharts(performanceResults);

    // Draw Engine Curves
    const engineInputs = {
        mcr: Number(document.getElementById("engineMCR").value),
        sfoc: Number(document.getElementById("engineSFOC").value),
        numEngines: Number(document.getElementById("numEngines").value),
        mechEfficiency: Number(document.getElementById("mechEfficiency").value),
        fuelType: document.getElementById("fuelType").value,
        fuelPrice: Number(document.getElementById("fuelPrice").value),
        voyageDist: Number(document.getElementById("voyageDist").value)
    };
    const speedVals = performanceResults.map(r => r.speed);
    const pbVals = performanceResults.map(r => r.PB / 1000);
    drawEnginePerformanceCharts(speedVals, pbVals, engineInputs);

    // Draw Environmental Curves
    const envInputs = {
        shipType: document.getElementById("envShipType").value,
        gt: Number(document.getElementById("envGT").value),
        dwt: Number(document.getElementById("envDWT").value),
        vref: Number(document.getElementById("envVref").value),
        mcr: Number(document.getElementById("envMEPower").value),
        pAE: Number(document.getElementById("envAEPower").value),
        sfoc: Number(document.getElementById("engineSFOC").value),
        fuelType: document.getElementById("fuelType").value,
        annualDist: Number(document.getElementById("envAnnualDist").value),
        annualFuel: Number(document.getElementById("envAnnualFuel").value)
    };
    drawEnvironmentalPerformanceCharts(speedVals, pbVals, engineInputs, envInputs);
};

function drawCurveCharts(results) {
    const speeds = results.map(r => r.speed.toFixed(1));
    const rtData = results.map(r => r.Rt / 1000);
    const peData = results.map(r => r.PE / 1000);

    // Destroy existing charts
    if (rtCurveChart) rtCurveChart.destroy();
    if (peCurveChart) peCurveChart.destroy();
    if (breakdownCurveChart) breakdownCurveChart.destroy();

    // Chart 1: Rt vs Speed
    const ctx1 = document.getElementById("rtCurveChart").getContext("2d");
    const rtScale = window.getDynamicScale(rtData);
    rtCurveChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: speeds,
            datasets: [{
                label: 'Total Resistance (kN)',
                data: rtData,
                borderColor: '#1e88e5',
                backgroundColor: 'rgba(30, 136, 229, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
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

    // Chart 2: PE/PD/PB vs Speed
    const ctx2 = document.getElementById("peCurveChart").getContext("2d");
    const pbList = results.map(r => r.PB / 1000);
    const pdList = results.map(r => r.PD / 1000);
    const allPowers = [...peData, ...pdList, ...pbList];
    const powerScale = window.getDynamicScale(allPowers);
    peCurveChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: speeds,
            datasets: [
                {
                    label: 'Effective Power (PE) (kW)',
                    data: peData,
                    borderColor: '#4caf50',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Delivered Power (PD) (kW)',
                    data: pdList,
                    borderColor: '#ff9800',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Brake Power (PB) (kW)',
                    data: pbList,
                    borderColor: '#f44336',
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
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

    // Chart 3: Stacked Breakdown vs Speed
    const ctx3 = document.getElementById("breakdownCurveChart").getContext("2d");
    const stackedMaxVal = results.reduce((max, r) => {
        const sum = r.Rt / 1000;
        return sum > max ? sum : max;
    }, 0);
    breakdownCurveChart = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: speeds,
            datasets: [
                { label: 'Friction', data: results.map(r => r.breakdown.friction / 1000), backgroundColor: '#2196F3' },
                { label: 'Viscous Form', data: results.map(r => (r.breakdown.viscous - r.breakdown.friction) / 1000), backgroundColor: '#4CAF50' },
                { label: 'Wave', data: results.map(r => r.breakdown.wave / 1000), backgroundColor: '#FF9800' },
                { label: 'Bulb', data: results.map(r => r.breakdown.bulb / 1000), backgroundColor: '#9C27B0' },
                { label: 'Transom', data: results.map(r => r.breakdown.transom / 1000), backgroundColor: '#FF5722' },
                { label: 'Appendage', data: results.map(r => r.breakdown.appendage / 1000), backgroundColor: '#795548' },
                { label: 'Air', data: results.map(r => r.breakdown.air / 1000), backgroundColor: '#607D8B' },
                { label: 'Correlation', data: results.map(r => r.breakdown.correlation / 1000), backgroundColor: '#E91E63' }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    max: stackedMaxVal * 1.05,
                    ticks: {
                        callback: function(value) {
                            return window.formatChartTicks(value, 'resistance');
                        }
                    }
                }
            }
        }
    });
}

window.exportCurveCsv = function() {
    if (performanceResults.length === 0) {
        alert("Please generate curves first.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Speed (kn),Rt (kN),PE (kW),PD (kW),PB (kW),Friction (kN),Viscous (kN),Wave (kN),Bulb (kN),Transom (kN),Appendage (kN),Air (kN),Correlation (kN)\n";

    performanceResults.forEach(r => {
        csvContent += `${r.speed.toFixed(2)},${(r.Rt/1000).toFixed(3)},${(r.PE/1000).toFixed(3)},${(r.PD/1000).toFixed(3)},${(r.PB/1000).toFixed(3)},${(r.breakdown.friction/1000).toFixed(3)},${(r.breakdown.viscous/1000).toFixed(3)},${(r.breakdown.wave/1000).toFixed(3)},${(r.breakdown.bulb/1000).toFixed(3)},${(r.breakdown.transom/1000).toFixed(3)},${(r.breakdown.appendage/1000).toFixed(3)},${(r.breakdown.air/1000).toFixed(3)},${(r.breakdown.correlation/1000).toFixed(3)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "performance_curves.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.drawEnvironmentalPerformanceCharts = function(speeds, pbList, engineInputs, envInputs) {
    const co2Data = [];
    const ciiData = [];

    speeds.forEach((spd, idx) => {
        const pb = pbList[idx] || 0;
        const engRes = window.calculateEngineSelection(pb, spd, engineInputs);
        const emissions = window.calculateEmissions(engRes.fc_kgh, envInputs.fuelType);

        const annualFuelEstimated = (engRes.fc_day * 365.0 * 0.70); // 70% annual operating factor
        const tempEnvInputs = Object.assign({}, envInputs, { annualFuel: annualFuelEstimated });
        const cii = window.calculateCII({}, tempEnvInputs);

        co2Data.push(emissions.co2);
        ciiData.push(cii.attained);
    });

    const ctx1 = document.getElementById("co2SpeedChart");
    if (ctx1) {
        if (co2SpeedChart) co2SpeedChart.destroy();
        const scale = window.getDynamicScale(co2Data);
        co2SpeedChart = new Chart(ctx1.getContext("2d"), {
            type: 'line',
            data: {
                labels: speeds.map(s => s.toFixed(1)),
                datasets: [{ label: 'CO₂ Emissions (kg/h)', data: co2Data, borderColor: '#e91e63', fill: false }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: scale.min,
                        max: scale.max,
                        suggestedMax: scale.suggestedMax,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2) + " kg/h";
                            }
                        }
                    }
                }
            }
        });
    }

    const ctx2 = document.getElementById("ciiTrendChart");
    if (ctx2) {
        if (ciiTrendChart) ciiTrendChart.destroy();
        const scale = window.getDynamicScale(ciiData);
        ciiTrendChart = new Chart(ctx2.getContext("2d"), {
            type: 'line',
            data: {
                labels: speeds.map(s => s.toFixed(1)),
                datasets: [{ label: 'Attained CII (gCO2/t-nm)', data: ciiData, borderColor: '#9c27b0', fill: false }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: scale.min,
                        max: scale.max,
                        suggestedMax: scale.suggestedMax,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(3) + " g/t-nm";
                            }
                        }
                    }
                }
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const genBtn = document.getElementById("generateCurvesBtn");
    if (genBtn) genBtn.addEventListener("click", window.generatePerformanceCurves);

    const expBtn = document.getElementById("exportCsvBtn");
    if (expBtn) expBtn.addEventListener("click", window.exportCurveCsv);
});
