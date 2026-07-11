//-----------------------------------------------------
// Multi-Vessel Comparison Charts Engine
//-----------------------------------------------------

let batchRtChart = null;
let batchPeChart = null;
let batchFuelChart = null;
let batchEmissionsChart = null;
let batchEexiChart = null;
let batchCiiChart = null;

window.drawBatchCharts = function(results) {
    const labels = results.map(r => r.name);
    const rtData = results.map(r => r.Rt / 1000); // kN
    const peData = results.map(r => r.PE / 1000); // kW
    const fuelData = results.map(r => r.fuelDay); // t/day
    const co2Data = results.map(r => r.co2); // kg/h
    const eexiData = results.map(r => r.eexi);

    const ctx1 = document.getElementById("batchRtChart");
    if (ctx1) {
        if (batchRtChart) batchRtChart.destroy();
        const scale = window.getDynamicScale(rtData);
        batchRtChart = new Chart(ctx1.getContext("2d"), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Total Resistance (kN)', data: rtData, backgroundColor: '#2196f3' }] },
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

    const ctx2 = document.getElementById("batchPeChart");
    if (ctx2) {
        if (batchPeChart) batchPeChart.destroy();
        const scale = window.getDynamicScale(peData);
        batchPeChart = new Chart(ctx2.getContext("2d"), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Effective Power (PE) (kW)', data: peData, backgroundColor: '#4caf50' }] },
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

    const ctx3 = document.getElementById("batchFuelChart");
    if (ctx3) {
        if (batchFuelChart) batchFuelChart.destroy();
        const scale = window.getDynamicScale(fuelData);
        batchFuelChart = new Chart(ctx3.getContext("2d"), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Fuel Consumption (tons/day)', data: fuelData, backgroundColor: '#ff9800' }] },
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

    const ctx4 = document.getElementById("batchEmissionsChart");
    if (ctx4) {
        if (batchEmissionsChart) batchEmissionsChart.destroy();
        const scale = window.getDynamicScale(co2Data);
        batchEmissionsChart = new Chart(ctx4.getContext("2d"), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'CO₂ Emissions (tons/voyage)', data: co2Data, backgroundColor: '#e91e63' }] },
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

    const ctx5 = document.getElementById("batchEexiChart");
    if (ctx5) {
        if (batchEexiChart) batchEexiChart.destroy();
        const scale = window.getDynamicScale(eexiData);
        batchEexiChart = new Chart(ctx5.getContext("2d"), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Attained EEXI', data: eexiData, backgroundColor: '#9c27b0' }] },
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

    // CII rating distribution pie chart
    const ratings = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    results.forEach(r => {
        if (ratings[r.cii] !== undefined) ratings[r.cii]++;
    });

    const ctx6 = document.getElementById("batchCiiChart");
    if (ctx6) {
        if (batchCiiChart) batchCiiChart.destroy();
        batchCiiChart = new Chart(ctx6.getContext("2d"), {
            type: 'pie',
            data: {
                labels: ['A (Excellent)', 'B', 'C', 'D', 'E (Poor)'],
                datasets: [{
                    data: [ratings.A, ratings.B, ratings.C, ratings.D, ratings.E],
                    backgroundColor: ['#2e7d32', '#4caf50', '#ffc107', '#ff9800', '#d32f2f']
                }]
            },
            options: { responsive: true }
        });
    }
};
