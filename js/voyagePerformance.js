//-----------------------------------------------------
// Holtrop & Mennen Voyage Performance Module
//-----------------------------------------------------

window.calculateVoyagePerformance = function(vessel, calmTotal, inputs) {
    const dist = inputs.voyageDist || 1000;
    const speed = inputs.speed || 15.0;
    
    // Validation
    if (dist <= 0 || speed <= 0) {
        return {
            time: 0,
            sog: 0,
            fuel: 0,
            cost: 0,
            co2: 0,
            nox: 0,
            sox: 0,
            pm: 0,
            seaMargin: 0,
            weatherMargin: 0,
            err: "Voyage distance and speed must be positive numbers."
        };
    }

    // Weather adjustments
    const weather = window.calculateWeatherCorrection(vessel, inputs);
    const SOG = weather.SOG;

    // Added wave resistance
    const waveInputs = {
        waveHeight: inputs.waveHeight || 0.0,
        wavePeriod: inputs.wavePeriod || 6.0,
        encounterAngle: inputs.encounterAngle || 0.0,
        seaState: inputs.seaState || 0
    };
    const waveRes = window.calculateAddedWaveResistance(vessel, calmTotal, waveInputs);

    // Voyage time in hours
    const voyageTime = dist / SOG;

    // Installed power / engine loads
    const pc = vessel.pc || 0.65; // Propulsive coefficient fallback
    const totalRt = calmTotal.Rt + waveRes.Raw;
    const Vs = speed * 0.514444;
    const peRequired = totalRt * Vs;
    const pdRequired = peRequired / pc;

    // Retrieve engine MCR and mechanical efficiency
    const mcr = inputs.mcr || 5000;
    const numEng = inputs.numEngines || 1;
    const etaMech = inputs.mechEfficiency || 0.97;
    const sfoc = inputs.sfoc || 190;
    const fuelPrice = inputs.fuelPrice || 600;
    const fuelType = inputs.fuelType || "MDO";

    // Engine loading
    const totalMcr = numEng * mcr;
    const pbRequired = pdRequired / etaMech;

    // Fuel consumed in kg/h
    const fc_kgh = (pbRequired / 1000.0) * sfoc / etaMech;
    // Total fuel consumed over the voyage in tons
    const voyageFuel = (fc_kgh * voyageTime) / 1000.0;

    // Total fuel cost
    const fuelCost = voyageFuel * fuelPrice;

    // Emissions
    const emissions = window.calculateEmissions(fc_kgh, fuelType);
    const co2_tot = (emissions.co2 * voyageTime) / 1000.0; // tons
    const nox_tot = (emissions.nox * voyageTime) / 1000.0; // tons
    const sox_tot = (emissions.sox * voyageTime) / 1000.0; // tons
    const pm_tot = (emissions.pm * voyageTime) / 1000.0; // tons

    // Margins
    const seaMargin = (waveRes.peWaves > calmTotal.effectivePower) ? 
        ((waveRes.peWaves - calmTotal.effectivePower) / calmTotal.effectivePower) * 100 : 0;
    
    // Weather margin includes wind resistance relative to calm air and wave added resistance
    const weatherMargin = seaMargin; // simplified to wave added margin

    return {
        time: voyageTime,
        sog: SOG,
        fuel: voyageFuel,
        cost: fuelCost,
        co2: co2_tot,
        nox: nox_tot,
        sox: sox_tot,
        pm: pm_tot,
        seaMargin,
        weatherMargin,
        err: ""
    };
};

let voyFuelChart = null;
let voyTimeChart = null;
let voyCostChart = null;
let voyEmissionsChart = null;

window.drawVoyageCharts = function(vessel, calmTotal, baseInputs) {
    // 1. Fuel vs Distance (100 to 1000 nm)
    const distances = [100, 300, 500, 700, 900, 1000];
    const fuelData = [];
    distances.forEach(d => {
        const inputs = Object.assign({}, baseInputs, { voyageDist: d });
        const res = window.calculateVoyagePerformance(vessel, calmTotal, inputs);
        fuelData.push(res.fuel);
    });

    const ctx1 = document.getElementById("voyFuelChart");
    if (ctx1) {
        if (voyFuelChart) voyFuelChart.destroy();
        const scale = window.getDynamicScale(fuelData);
        voyFuelChart = new Chart(ctx1.getContext("2d"), {
            type: 'line',
            data: {
                labels: distances.map(d => d + " nm"),
                datasets: [{ label: 'Voyage Fuel Consumption (tons)', data: fuelData, borderColor: '#f44336', fill: false }]
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

    // 2. Voyage Time vs Speed (10 to 20 knots)
    const speeds = [10, 12, 14, 16, 18, 20];
    const timeData = [];
    const costData = [];
    const emissionsData = [];

    speeds.forEach(s => {
        const inputs = Object.assign({}, baseInputs, { speed: s });
        const res = window.calculateVoyagePerformance(vessel, calmTotal, inputs);
        timeData.push(res.time);
        costData.push(res.cost);
        emissionsData.push(res.co2);
    });

    const ctx2 = document.getElementById("voyTimeChart");
    if (ctx2) {
        if (voyTimeChart) voyTimeChart.destroy();
        const scale = window.getDynamicScale(timeData);
        voyTimeChart = new Chart(ctx2.getContext("2d"), {
            type: 'line',
            data: {
                labels: speeds.map(s => s + " kn"),
                datasets: [{ label: 'Voyage Time (hours)', data: timeData, borderColor: '#2196f3', fill: false }]
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
                                return value.toFixed(1) + " h";
                            }
                        }
                    }
                }
            }
        });
    }

    // 3. Cost vs Speed
    const ctx3 = document.getElementById("voyCostChart");
    if (ctx3) {
        if (voyCostChart) voyCostChart.destroy();
        const scale = window.getDynamicScale(costData);
        voyCostChart = new Chart(ctx3.getContext("2d"), {
            type: 'line',
            data: {
                labels: speeds.map(s => s + " kn"),
                datasets: [{ label: 'Voyage Cost ($)', data: costData, borderColor: '#4caf50', fill: false }]
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

    // 4. CO2 vs Speed
    const ctx4 = document.getElementById("voyEmissionsChart");
    if (ctx4) {
        if (voyEmissionsChart) voyEmissionsChart.destroy();
        const scale = window.getDynamicScale(emissionsData);
        voyEmissionsChart = new Chart(ctx4.getContext("2d"), {
            type: 'line',
            data: {
                labels: speeds.map(s => s + " kn"),
                datasets: [{ label: 'CO₂ Emissions (tons)', data: emissionsData, borderColor: '#ff9800', fill: false }]
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
                                return window.formatChartTicks(value, 'emissions');
                            }
                        }
                    }
                }
            }
        });
    }
};

window.exportVoyageCsv = function(vessel, calmTotal, inputs) {
    const res = window.calculateVoyagePerformance(vessel, calmTotal, inputs);
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Voyage Performance Parameter,Value\n";
    csv += `Voyage Distance (nm),${inputs.voyageDist}\n`;
    csv += `Average Speed (kn),${inputs.speed}\n`;
    csv += `Average SOG (kn),${res.sog.toFixed(2)}\n`;
    csv += `Voyage Time (hours),${res.time.toFixed(1)}\n`;
    csv += `Fuel Consumption (tons),${res.fuel.toFixed(2)}\n`;
    csv += `Fuel Cost ($),${res.cost.toFixed(2)}\n`;
    csv += `CO2 (tons),${res.co2.toFixed(3)}\n`;
    csv += `NOx (tons),${res.nox.toFixed(4)}\n`;
    csv += `SOx (tons),${res.sox.toFixed(4)}\n`;
    csv += `PM (tons),${res.pm.toFixed(4)}\n`;

    const encoded = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", "voyage_performance.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
