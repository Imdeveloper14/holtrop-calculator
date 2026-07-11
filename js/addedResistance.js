//-----------------------------------------------------
// Holtrop & Mennen Added Resistance in Waves Module
//-----------------------------------------------------

window.calculateAddedWaveResistance = function(vessel, totalCalm, inputs) {
    const Hs = inputs.waveHeight || 0.0;
    const Tp = inputs.wavePeriod || 6.0;
    const encounterAngle = inputs.encounterAngle || 0.0; // 0 is head seas
    const seaState = inputs.seaState || 0;

    // Validation
    let warning = "";
    if (Hs < 0) {
        warning += "Significant wave height cannot be negative. ";
    }
    if (encounterAngle < 0 || encounterAngle > 180) {
        warning += "Encounter angle should be between 0° and 180°. ";
    }

    if (seaState === 0 || Hs <= 0) {
        return {
            Raw: 0.0,
            RtWaves: totalCalm.Rt,
            peWaves: totalCalm.effectivePower,
            speedLoss: 0.0,
            addFuelPct: 0.0,
            warning
        };
    }

    const rho = 1025.0;
    const g = 9.81;
    const B = vessel.beam;
    const L = vessel.lwl;

    // STAwave-1 head seas approximation:
    // Raw = 1/16 * rho * g * Hs^2 * B * sqrt(B/L) * cos^2(angle)
    const angleRad = (encounterAngle * Math.PI) / 180.0;
    const cosAngle = Math.cos(angleRad);
    
    let Raw = 0.0625 * rho * g * Hs * Hs * B * Math.sqrt(B / L) * cosAngle * cosAngle;
    if (cosAngle < 0) {
        Raw = Math.max(0, Raw);
    }

    const RtWaves = totalCalm.Rt + Raw;
    const Vs = vessel.speed * 0.514444;
    const peWaves = RtWaves * Vs;

    // Speed loss estimation:
    let speedLoss = 0;
    if (totalCalm.Rt > 0) {
        speedLoss = 10.0 * (Raw / totalCalm.Rt) * (Hs / L) * 100;
        speedLoss = Math.min(25, Math.max(0, speedLoss)); // Capped at 25% max speed loss
    }

    // Additional fuel consumption estimation:
    let addFuelPct = 0;
    if (totalCalm.Rt > 0) {
        addFuelPct = (Raw / totalCalm.Rt) * 100;
    }

    return {
        Raw,
        RtWaves,
        peWaves,
        speedLoss,
        addFuelPct,
        warning
    };
};

let rawHeightChart = null;
let speedLossHeightChart = null;
let powerSeaStateChart = null;

window.drawWaveResistanceCharts = function(vessel, totalCalm, baseInputs) {
    const heights = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0];
    const rawData = [];
    const speedLossData = [];

    heights.forEach(h => {
        const inputs = Object.assign({}, baseInputs, { waveHeight: h, seaState: h > 0 ? 3 : 0 });
        const res = window.calculateAddedWaveResistance(vessel, totalCalm, inputs);
        rawData.push(res.Raw / 1000); // kN
        speedLossData.push(res.speedLoss); // %
    });

    const ctx1 = document.getElementById("rawHeightChart");
    if (ctx1) {
        if (rawHeightChart) rawHeightChart.destroy();
        const scale = window.getDynamicScale(rawData);
        rawHeightChart = new Chart(ctx1.getContext("2d"), {
            type: 'line',
            data: {
                labels: heights.map(h => h + "m"),
                datasets: [{ label: 'Added Wave Resistance (Raw) (kN)', data: rawData, borderColor: '#3f51b5', fill: false }]
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
                                return window.formatChartTicks(value, 'resistance');
                            }
                        }
                    }
                }
            }
        });
    }

    const ctx2 = document.getElementById("speedLossHeightChart");
    if (ctx2) {
        if (speedLossHeightChart) speedLossHeightChart.destroy();
        const scale = window.getDynamicScale(speedLossData);
        speedLossHeightChart = new Chart(ctx2.getContext("2d"), {
            type: 'line',
            data: {
                labels: heights.map(h => h + "m"),
                datasets: [{ label: 'Speed Loss (%)', data: speedLossData, borderColor: '#e91e63', fill: false }]
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

    // Power vs Sea State (0 to 6)
    const seaStates = [0, 1, 2, 3, 4, 5, 6];
    const powerData = [];
    const waveHeights = [0.0, 0.5, 1.25, 2.0, 3.0, 4.0, 6.0]; // Approximate wave height for each sea state

    seaStates.forEach((ss, idx) => {
        const h = waveHeights[idx];
        const inputs = Object.assign({}, baseInputs, { waveHeight: h, seaState: ss });
        const res = window.calculateAddedWaveResistance(vessel, totalCalm, inputs);
        powerData.push(res.peWaves / 1000); // kW
    });

    const ctx3 = document.getElementById("powerSeaStateChart");
    if (ctx3) {
        if (powerSeaStateChart) powerSeaStateChart.destroy();
        const scale = window.getDynamicScale(powerData);
        powerSeaStateChart = new Chart(ctx3.getContext("2d"), {
            type: 'line',
            data: {
                labels: seaStates.map(s => "SS " + s),
                datasets: [{ label: 'Required Power (kW)', data: powerData, borderColor: '#4caf50', fill: false }]
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
                                return window.formatChartTicks(value, 'power');
                            }
                        }
                    }
                }
            }
        });
    }
};
