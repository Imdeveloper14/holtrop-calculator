//-----------------------------------------------------
// Holtrop & Mennen Performance Curves Module
//-----------------------------------------------------

let rtCurveChart = null;
let peCurveChart = null;
let breakdownCurveChart = null;
let lastCurveData = [];

window.generatePerformanceCurves = function() {
    const start = Number(document.getElementById("curveStart").value) || 0;
    const end = Number(document.getElementById("curveEnd").value) || 0;
    const step = Number(document.getElementById("curveStep").value) || 0.5;

    if (start <= 0 || end <= 0 || end <= start || step <= 0) {
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
        speed: 0 // Will vary
    };

    if (vessel.lwl <= 0 || vessel.beam <= 0 || vessel.draft <= 0) {
        alert("Please enter valid vessel particulars first.");
        return;
    }

    const S = wettedSurface(vessel);
    const coeff = hullCoefficients(vessel);
    const hc = holtropCoefficients(vessel);
    const c16 = holtropC16(vessel);
    const c15 = holtropC15(vessel);
    const ff = formFactor(vessel, S);

    const speeds = [];
    for (let speed = start; speed <= end; speed += step) {
        speeds.push(speed);
    }
    if (speeds[speeds.length - 1] !== end) {
        speeds.push(end);
    }

    const results = [];

    speeds.forEach(spd => {
        vessel.speed = spd;

        const friction = frictionResistance(S, vessel.speed, vessel.lwl);
        const viscousResistance = friction.Rf * (1 + ff.k1);
        
        const m1 = holtropM1(vessel, c15);
        const m2 = holtropM2(vessel, c16);
        const lambda = holtropLambda(vessel, c16);
        const c1 = holtropC1(vessel);
        const c2 = holtropC2(vessel);
        const c5 = holtropC5(vessel);

        const wave = holtropWaveResistance(
            vessel,
            c1.c1,
            c2.c2,
            c5.c5,
            c15.c15,
            c16.c16,
            m1.m1,
            m2.m2,
            lambda.lambda
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

        results.push({
            speed: spd,
            Rt: total.Rt,
            PE: power.PE,
            PD: propulsionData.deliveredPower,
            PB: propulsionData.brakePower,
            breakdown: total.breakdown
        });
    });

    lastCurveData = results;

    // Render Table
    const tbody = document.getElementById("curveTableBody");
    tbody.innerHTML = "";
    results.forEach(res => {
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

    // Draw Charts
    drawCurveCharts(results);
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
        options: { responsive: true }
    });

    // Chart 2: PE/PD/PB vs Speed
    const ctx2 = document.getElementById("peCurveChart").getContext("2d");
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
                    data: results.map(r => r.PD / 1000),
                    borderColor: '#ff9800',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Brake Power (PB) (kW)',
                    data: results.map(r => r.PB / 1000),
                    borderColor: '#f44336',
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: { responsive: true }
    });

    // Chart 3: Stacked Breakdown vs Speed
    const ctx3 = document.getElementById("breakdownCurveChart").getContext("2d");
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
                y: { stacked: true }
            }
        }
    });
}

window.exportCurveCsv = function() {
    if (lastCurveData.length === 0) {
        alert("Please generate curves first.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Speed (kn),Rt (kN),PE (kW),PD (kW),PB (kW),Friction (kN),Viscous (kN),Wave (kN),Bulb (kN),Transom (kN),Appendage (kN),Air (kN),Correlation (kN)\n";

    lastCurveData.forEach(r => {
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

document.addEventListener("DOMContentLoaded", () => {
    const genBtn = document.getElementById("generateCurvesBtn");
    if (genBtn) genBtn.addEventListener("click", window.generatePerformanceCurves);

    const expBtn = document.getElementById("exportCsvBtn");
    if (expBtn) expBtn.addEventListener("click", window.exportCurveCsv);
});
