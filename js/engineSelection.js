//-----------------------------------------------------
// Holtrop & Mennen Engine Selection & Fuel Module
//-----------------------------------------------------

const engines_db = [
    { manufacturer: "Wärtsilä", model: "12V31DF", mcr: 7200, sfoc: 175, type: "MDO" },
    { manufacturer: "MAN Energy Solutions", model: "9S50ME-C9", mcr: 9900, sfoc: 165, type: "HFO" },
    { manufacturer: "Caterpillar", model: "3516C", mcr: 2240, sfoc: 195, type: "MDO" }
];

window.calculateEngineSelection = function(pb_kW, speedKnots, inputs) {
    const mcr = inputs.mcr || 5000;
    const sfoc = inputs.sfoc || 190;
    const numEng = inputs.numEngines || 1;
    const etaMech = inputs.mechEfficiency || 0.97;
    const fuelPrice = inputs.fuelPrice || 600;
    const dist = inputs.voyageDist || 500;
    const fuelType = inputs.fuelType || "MDO";

    // Engine Load (%)
    const totalMcr = numEng * mcr;
    let load = 0;
    if (totalMcr > 0) {
        load = (pb_kW / (totalMcr * etaMech)) * 100;
    }

    // Fuel Consumption (kg/h)
    const fc_kgh = pb_kW * sfoc * 0.001 / etaMech;

    // Fuel Consumption (ton/day)
    const fc_day = (fc_kgh * 24.0) / 1000.0;

    // Voyage Fuel
    let voyageHours = 0;
    if (speedKnots > 0) {
        voyageHours = dist / speedKnots;
    }
    const voyageFuel = (fc_kgh * voyageHours) / 1000.0;

    // Daily Fuel Cost
    const dailyCost = fc_day * fuelPrice;

    // CO2 emissions
    const emissionFactor = (fuelType === "HFO") ? 3.114 : 3.206;
    const co2_kgh = fc_kgh * emissionFactor;

    // Warnings
    let warning = "PASS";
    if (load > 100) {
        warning = "OVERLOAD WARNING: Load is " + load.toFixed(1) + "% (>100%)";
    } else if (load < 40 && load > 0) {
        warning = "LOW LOAD WARNING: Load is " + load.toFixed(1) + "% (<40% MCR)";
    }

    return {
        load,
        totalMcr,
        fc_kgh,
        fc_day,
        voyageHours,
        voyageFuel,
        dailyCost,
        co2_kgh,
        warning
    };
};

// Static chart instances
let fcSpeedChart = null;
let loadSpeedChart = null;
let costSpeedChart = null;

window.drawEnginePerformanceCharts = function(speeds, pbList, inputs) {
    const fcData = [];
    const loadData = [];
    const costData = [];

    speeds.forEach((spd, idx) => {
        const pb = pbList[idx] || 0;
        const res = window.calculateEngineSelection(pb, spd, inputs);
        fcData.push(res.fc_day);
        loadData.push(res.load);
        costData.push(res.dailyCost);
    });

    const ctx1 = document.getElementById("fcSpeedChart");
    if (ctx1) {
        if (fcSpeedChart) fcSpeedChart.destroy();
        const scale = window.getDynamicScale(fcData);
        fcSpeedChart = new Chart(ctx1.getContext("2d"), {
            type: 'line',
            data: {
                labels: speeds.map(s => s.toFixed(1)),
                datasets: [{ label: 'Daily Fuel (tons/day)', data: fcData, borderColor: '#ff5722', fill: false }]
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
                                return window.formatChartTicks(value, 'fuel');
                            }
                        }
                    }
                }
            }
        });
    }

    const ctx2 = document.getElementById("loadSpeedChart");
    if (ctx2) {
        if (loadSpeedChart) loadSpeedChart.destroy();
        const scale = window.getDynamicScale(loadData);
        loadSpeedChart = new Chart(ctx2.getContext("2d"), {
            type: 'line',
            data: {
                labels: speeds.map(s => s.toFixed(1)),
                datasets: [{ label: 'Engine Load (%)', data: loadData, borderColor: '#2196f3', fill: false }]
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
                                return value.toFixed(1) + " %";
                            }
                        }
                    }
                }
            }
        });
    }

    const ctx3 = document.getElementById("costSpeedChart");
    if (ctx3) {
        if (costSpeedChart) costSpeedChart.destroy();
        const scale = window.getDynamicScale(costData);
        costSpeedChart = new Chart(ctx3.getContext("2d"), {
            type: 'line',
            data: {
                labels: speeds.map(s => s.toFixed(1)),
                datasets: [{ label: 'Daily Fuel Cost ($/day)', data: costData, borderColor: '#4caf50', fill: false }]
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
                                return window.formatChartTicks(value, 'cost');
                            }
                        }
                    }
                }
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const selector = document.getElementById("engineSelect");
    if (selector) {
        selector.addEventListener("change", (e) => {
            const idx = e.target.selectedIndex - 1;
            if (idx >= 0 && engines_db[idx]) {
                const eng = engines_db[idx];
                document.getElementById("engineMan").value = eng.manufacturer;
                document.getElementById("engineModel").value = eng.model;
                document.getElementById("engineMCR").value = eng.mcr;
                document.getElementById("engineSFOC").value = eng.sfoc;
                document.getElementById("fuelType").value = eng.type;
            }
        });
    }
});
