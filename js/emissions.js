//-----------------------------------------------------
// Emissions Assessment Module
//-----------------------------------------------------

window.calculateEmissions = function(fc_kgh, fuelType) {
    // Emission factors in g/kg fuel
    const factors = {
        MDO: { co2: 3206, nox: 60, sox: 10, pm: 2 },
        HFO: { co2: 3114, nox: 80, sox: 30, pm: 7 }
    };

    const active = factors[fuelType] || factors.MDO;

    // Output in kg/h
    return {
        co2: (fc_kgh * active.co2) / 1000.0,
        nox: (fc_kgh * active.nox) / 1000.0,
        sox: (fc_kgh * active.sox) / 1000.0,
        pm: (fc_kgh * active.pm) / 1000.0
    };
};

let emissionBreakdownChart = null;

window.drawEmissionBreakdownChart = function(emissions) {
    const ctx = document.getElementById("emissionBreakdownChart");
    if (!ctx) return;

    if (emissionBreakdownChart) {
        emissionBreakdownChart.destroy();
    }

    emissionBreakdownChart = new Chart(ctx.getContext("2d"), {
        type: 'pie',
        data: {
            labels: ['CO₂ (kg/h)', 'NOₓ (kg/h)', 'SOₓ (kg/h)', 'PM (kg/h)'],
            datasets: [{
                data: [emissions.co2, emissions.nox, emissions.sox, emissions.pm],
                backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#9c27b0']
            }]
        },
        options: { responsive: true }
    });
};
