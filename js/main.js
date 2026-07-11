let resistanceChart = null;
const appendagesList = [];
window.appendagesList = appendagesList;

document.addEventListener("DOMContentLoaded",()=>{

const calc = () => {
    calculate();
};

document.getElementById("calculateBtn").addEventListener("click", calc);
const calcWs = document.getElementById("calculateBtnWorkspace");
if (calcWs) {
    calcWs.addEventListener("click", calc);
}

document.getElementById("appType").addEventListener("change", (e) => {
    const parts = e.target.value.split(",");
    if (parts.length === 2) {
        document.getElementById("appK2").value = parts[1];
    }
});

document.getElementById("propBSeriesType").addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "B3-50") {
        document.getElementById("propBlades").value = 3;
        document.getElementById("propEAR").value = 0.50;
    } else if (val === "B4-55") {
        document.getElementById("propBlades").value = 4;
        document.getElementById("propEAR").value = 0.55;
    } else if (val === "B4-70") {
        document.getElementById("propBlades").value = 4;
        document.getElementById("propEAR").value = 0.70;
    } else if (val === "B5-75") {
        document.getElementById("propBlades").value = 5;
        document.getElementById("propEAR").value = 0.75;
    } else if (val === "B6-80") {
        document.getElementById("propBlades").value = 6;
        document.getElementById("propEAR").value = 0.80;
    } else if (val === "B7-85") {
        document.getElementById("propBlades").value = 7;
        document.getElementById("propEAR").value = 0.85;
    }
});

document.getElementById("addAppBtn").addEventListener("click", () => {
    const select = document.getElementById("appType");
    const name = select.options[select.selectedIndex].text.split(" (")[0];
    const area = Number(document.getElementById("appArea").value) || 0;
    const k2 = Number(document.getElementById("appK2").value) || 1.0;

    if (area > 0) {
        appendagesList.push({ name, area, k2 });
        renderAppendages();
        document.getElementById("appArea").value = 0;
    }
});

});

function renderAppendages() {
    const tbody = document.getElementById("appTableBody");
    tbody.innerHTML = "";
    appendagesList.forEach((app, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${app.name}</td>
            <td>${app.area.toFixed(2)}</td>
            <td>${app.k2.toFixed(2)}</td>
            <td><button type="button" onclick="deleteAppendage(${idx})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}
window.renderAppendages = renderAppendages;

window.deleteAppendage = function(idx) {
    appendagesList.splice(idx, 1);
    renderAppendages();
};

function calculate(){

const vessel={

lpp:Number(document.getElementById("lpp").value),

lwl:Number(document.getElementById("lwl").value),

beam:Number(document.getElementById("beam").value),

draft:Number(document.getElementById("draft").value),

disp:Number(document.getElementById("disp").value),

cb:Number(document.getElementById("cb").value),

cm:Number(document.getElementById("cm").value),

cwp:Number(document.getElementById("cwp").value),

lcb:Number(document.getElementById("lcb").value),

abt:Number(document.getElementById("abt").value),

hb:Number(document.getElementById("hb").value),

at:Number(document.getElementById("at").value),

rhoAir:Number(document.getElementById("rhoAir").value),

windSpeed:Number(document.getElementById("windSpeed").value),

windDir:Number(document.getElementById("windDir").value),

av:Number(document.getElementById("av").value),

cdAir:Number(document.getElementById("cdAir").value),

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

speed:Number(document.getElementById("speed").value)

};

const S = wettedSurface(vessel);
const coeff = hullCoefficients(vessel);
const hc = holtropCoefficients(vessel);
const c16 = holtropC16(vessel);
const c15 = holtropC15(vessel);
const friction = frictionResistance(
    S,
    vessel.lwl,
    vessel.speed
);
const ff = formFactor(vessel);

const viscousResistance =
    (1 + ff.k1) *
    friction.Rf;

// Calculate wave resistance coefficients
const Cp_wave = vessel.cb / vessel.cm;
const Lr_wave = vessel.lwl * (1 - Cp_wave + (0.06 * Cp_wave * vessel.lcb) / (4 * Cp_wave - 1));
const ie_exponent = 
    -Math.pow(vessel.lwl / vessel.beam, 0.80856) *
    Math.pow(1 - vessel.cwp, 0.30484) *
    Math.pow(Math.max(0, 1 - Cp_wave - 0.0225 * vessel.lcb), 0.6367) *
    Math.pow((vessel.lwl - Lr_wave) / vessel.beam, 0.34574) *
    Math.pow(100 * vessel.disp / Math.pow(vessel.lwl, 3), 0.16302);
const ie = 1 + 89 * Math.exp(ie_exponent);

const c1_val = 2223105 * Math.pow(hc.c7, 3.78613) * Math.pow(vessel.draft / vessel.beam, 1.07961) * Math.pow(Math.max(1.0, 90 - ie), -1.37565);
const c1 = { c1: c1_val };
const c2 = { c2: 1.0 };
const c5 = { c5: 1.0 };

const m1 = { m1: 0.0140407 * (vessel.lwl / vessel.draft) - 1.75254 * (Math.pow(vessel.disp, 1/3) / vessel.lwl) - 4.79323 * (vessel.beam / vessel.lwl) - c16.c16 };
const m2 = { m2: c15.c15 * Cp_wave * Cp_wave * Math.exp(-0.1 / (friction.Fn * friction.Fn || 1.0)) };
const lambda = { lambda: (vessel.lwl / vessel.beam < 12) ? (1.446 * Cp_wave - 0.03 * (vessel.lwl / vessel.beam)) : (1.446 * Cp_wave - 0.36) };

const wave =
    holtropWaveResistance(
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
const air =
    airResistance(vessel);
const appendage =
    appendageResistance(vessel, friction.Cf, appendagesList);
const correlation =
    correlationAllowance(
        vessel,
        S
    );
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
const power =
    effectivePower(
        vessel,
        total.Rt
    );
const propulsionData =
    propulsion(power);
const propSelection = calculatePropellerSelection(vessel, total);
const bseriesRes = calculateBSeriesPropeller(vessel, total);

const engineInputs = {
    mcr: Number(document.getElementById("engineMCR").value),
    sfoc: Number(document.getElementById("engineSFOC").value),
    numEngines: Number(document.getElementById("numEngines").value),
    mechEfficiency: Number(document.getElementById("mechEfficiency").value),
    fuelType: document.getElementById("fuelType").value,
    fuelPrice: Number(document.getElementById("fuelPrice").value),
    voyageDist: Number(document.getElementById("voyageDist").value)
};
const pb_kW = propulsionData.brakePower / 1000;
const engineRes = calculateEngineSelection(pb_kW, vessel.speed, engineInputs);

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

const seaStateInputs = {
    seaState: Number(document.getElementById("seaState").value),
    waveHeight: Number(document.getElementById("waveHeight").value),
    wavePeriod: Number(document.getElementById("wavePeriod").value),
    waveDir: Number(document.getElementById("waveDir").value),
    encounterAngle: Number(document.getElementById("encounterAngle").value),
    waveSpectrum: document.getElementById("waveSpectrum").value
};

const eexiRes = calculateEEXI(vessel, envInputs);
const ciiRes = calculateCII(vessel, envInputs);
const emissionRes = calculateEmissions(engineRes.fc_kgh, envInputs.fuelType);
const waveRes = calculateAddedWaveResistance(vessel, total, seaStateInputs);

if (!eexiRes.passed) {
    console.warn("IMO EEXI Compliance Warning: Attained EEXI exceeds Required EEXI!");
}

if (waveRes.warning) {
    console.warn("Wave Resistance Warning: " + waveRes.warning);
}

const voyageInputs = {
    voyageDist: Number(document.getElementById("voyageDistInput").value),
    speed: Number(document.getElementById("voyageSpeed").value),
    currentSpeed: Number(document.getElementById("currentSpeed").value),
    currentDir: Number(document.getElementById("currentDir").value),
    airTemp: Number(document.getElementById("airTemp").value),
    waterTemp: Number(document.getElementById("waterTemp").value),
    waveHeight: Number(document.getElementById("waveHeight").value),
    wavePeriod: Number(document.getElementById("wavePeriod").value),
    encounterAngle: Number(document.getElementById("encounterAngle").value),
    seaState: Number(document.getElementById("seaState").value),
    mcr: Number(document.getElementById("engineMCR").value),
    sfoc: Number(document.getElementById("engineSFOC").value),
    numEngines: Number(document.getElementById("numEngines").value),
    mechEfficiency: Number(document.getElementById("mechEfficiency").value),
    fuelPrice: Number(document.getElementById("fuelPrice").value),
    fuelType: document.getElementById("fuelType").value
};

const voyRes = calculateVoyagePerformance(vessel, total, voyageInputs);

if (voyRes.err) {
    console.error("Voyage performance error: " + voyRes.err);
}

// Display Results

document.getElementById("reResult").textContent =
    friction.Re.toExponential(3);

document.getElementById("fnResult").textContent =
    friction.Fn.toFixed(4);

document.getElementById("cfResult").textContent =
    friction.Cf.toFixed(5);

document.getElementById("rfResult").textContent =
    (friction.Rf / 1000).toFixed(2);

document.getElementById("sResult").textContent =
    S.toFixed(2);

document.getElementById("cpResult").textContent =
    wave.Cp.toFixed(3);

document.getElementById("k1Result").textContent =
    (1 + ff.k1).toFixed(3);

document.getElementById("rvResult").textContent =
    (viscousResistance / 1000).toFixed(2);

document.getElementById("rwResult").textContent =
    (wave.Rw / 1000).toFixed(2);

document.getElementById("rbResult").textContent =
    (total.breakdown.bulb / 1000).toFixed(2);

document.getElementById("rtrResult").textContent =
    (total.breakdown.transom / 1000).toFixed(2);

document.getElementById("raResult").textContent =
    (total.breakdown.air / 1000).toFixed(2);

document.getElementById("rappResult").textContent =
    (total.breakdown.appendage / 1000).toFixed(2);

document.getElementById("caResult").textContent =
    (total.breakdown.correlation / 1000).toFixed(2);

document.getElementById("rtResult").textContent =
    (total.Rt / 1000).toFixed(2);

document.getElementById("peResult").textContent =
    (total.effectivePower / 1000).toFixed(2);

document.getElementById("etaHResult").textContent =
    propulsionData.hullEfficiency.toFixed(3);

document.getElementById("etaOResult").textContent =
    propulsionData.propellerEfficiency.toFixed(3);

document.getElementById("pdResult").textContent =
    (propulsionData.deliveredPower / 1000).toFixed(2);

document.getElementById("pbResult").textContent =
    (propulsionData.brakePower / 1000).toFixed(2);

document.getElementById("propVaResult").textContent = propSelection.Va.toFixed(2);
document.getElementById("propJResult").textContent = propSelection.J.toFixed(3);
document.getElementById("propKTResult").textContent = propSelection.KT.toFixed(4);
document.getElementById("prop10KQResult").textContent = (propSelection.KQ * 10).toFixed(4);
document.getElementById("propThrustResult").textContent = (propSelection.thrust / 1000).toFixed(2);
document.getElementById("propTorqueResult").textContent = (propSelection.torque / 1000).toFixed(2);
document.getElementById("propEtaOResult2").textContent = propSelection.etaO.toFixed(3);
document.getElementById("propPCResult").textContent = propSelection.PC.toFixed(3);

document.getElementById("perfBSeriesName").textContent = vessel.propBSeriesType;
document.getElementById("perfKT").textContent = bseriesRes.KT.toFixed(4);
document.getElementById("perf10KQ").textContent = (bseriesRes.KQ * 10).toFixed(4);
document.getElementById("perfEtaO").textContent = bseriesRes.etaO.toFixed(3);
document.getElementById("perfThrust").textContent = (bseriesRes.thrust / 1000).toFixed(2);
document.getElementById("perfTorque").textContent = (bseriesRes.torque / 1000).toFixed(2);
document.getElementById("perfCavitation").textContent = bseriesRes.cavitationStatus;

document.getElementById("installedPower").textContent = engineRes.totalMcr.toFixed(0) + " kW";
document.getElementById("engineLoad").textContent = engineRes.load.toFixed(1) + " %";
document.getElementById("engineWarning").textContent = engineRes.warning;
document.getElementById("fuelKgh").textContent = engineRes.fc_kgh.toFixed(1) + " kg/h";
document.getElementById("fuelTonday").textContent = engineRes.fc_day.toFixed(2) + " t/day";
document.getElementById("voyageFuel").textContent = engineRes.voyageFuel.toFixed(2) + " tons";
document.getElementById("co2Emissions").textContent = engineRes.co2_kgh.toFixed(1) + " kg/h";
document.getElementById("dailyFuelCost").textContent = "$ " + engineRes.dailyCost.toFixed(2);

document.getElementById("attainedEEXI").textContent = eexiRes.attained.toFixed(3) + " gCO2/t-nm";
document.getElementById("requiredEEXI").textContent = eexiRes.required.toFixed(3) + " gCO2/t-nm";
document.getElementById("eexiStatus").textContent = eexiRes.passed ? "COMPLIANT" : "NON-COMPLIANT";
document.getElementById("eexiStatus").style.color = eexiRes.passed ? "#2e7d32" : "#f44336";

document.getElementById("attainedCII").textContent = ciiRes.attained.toFixed(3) + " gCO2/t-nm";
document.getElementById("requiredCII").textContent = ciiRes.required.toFixed(3) + " gCO2/t-nm";
const ciiEl = document.getElementById("ciiRating");
ciiEl.textContent = ciiRes.rating;
ciiEl.style.backgroundColor = ciiRes.color;
ciiEl.style.color = "#ffffff";

const tooltips = {
    "A": "Excellent environmental performance (well above IMO target)",
    "B": "Better than required efficiency",
    "C": "Meets IMO requirements",
    "D": "Improvement required; may require corrective measures if sustained",
    "E": "Poor performance; mandatory corrective action plan required under IMO regulations"
};
ciiEl.title = tooltips[ciiRes.rating] || "";

document.getElementById("envCO2").textContent = emissionRes.co2.toFixed(2);
document.getElementById("envNOx").textContent = emissionRes.nox.toFixed(2);
document.getElementById("envSOx").textContent = emissionRes.sox.toFixed(2);
document.getElementById("envPM").textContent = emissionRes.pm.toFixed(2);

document.getElementById("calmResistance").textContent = (total.Rt / 1000).toFixed(2);
document.getElementById("addedWaveResistance").textContent = (waveRes.Raw / 1000).toFixed(2);
document.getElementById("totalResistanceWaves").textContent = (waveRes.RtWaves / 1000).toFixed(2);

document.getElementById("calmPower").textContent = (total.effectivePower / 1000).toFixed(2);
document.getElementById("requiredPowerWaves").textContent = (waveRes.peWaves / 1000).toFixed(2);

let seaMargin = 0;
if (total.effectivePower > 0) {
    seaMargin = ((waveRes.peWaves - total.effectivePower) / total.effectivePower) * 100;
}
document.getElementById("seaMargin").textContent = seaMargin.toFixed(1) + " %";
document.getElementById("speedLossWaves").textContent = waveRes.speedLoss.toFixed(1) + " %";
document.getElementById("addFuelConsumption").textContent = waveRes.addFuelPct.toFixed(1) + " %";

drawEmissionBreakdownChart(emissionRes);
drawWaveResistanceCharts(vessel, total, seaStateInputs);
drawVoyageCharts(vessel, total, voyageInputs);

document.getElementById("voyTimeResult").textContent = voyRes.time.toFixed(1) + " hours";
document.getElementById("voySogResult").textContent = voyRes.sog.toFixed(2) + " knots";
document.getElementById("voySeaMargin").textContent = voyRes.seaMargin.toFixed(1) + " %";
document.getElementById("voyWeatherMargin").textContent = voyRes.weatherMargin.toFixed(1) + " %";
document.getElementById("voyFuelResult").textContent = voyRes.fuel.toFixed(2) + " tons";
document.getElementById("voyCostResult").textContent = "$ " + voyRes.cost.toFixed(2);
document.getElementById("voyCO2").textContent = voyRes.co2.toFixed(3);
document.getElementById("voyNOx").textContent = voyRes.nox.toFixed(4);
document.getElementById("voySOx").textContent = voyRes.sox.toFixed(4);
document.getElementById("voyPM").textContent = voyRes.pm.toFixed(4);

drawOpenWaterChart(vessel, bseriesRes.J);

// Hook up export click handler
const expVoyBtn = document.getElementById("exportVoyageCsvBtn");
if (expVoyBtn) {
    // Remove previous listeners if any, or overwrite onclick
    expVoyBtn.onclick = () => {
        window.exportVoyageCsv(vessel, total, voyageInputs);
    };
}

document.getElementById("cpCoeff").textContent =
    coeff.Cp.toFixed(3);

document.getElementById("lbCoeff").textContent =
    coeff.LB.toFixed(2);

document.getElementById("btCoeff").textContent =
    coeff.BT.toFixed(2);

document.getElementById("ltCoeff").textContent =
    coeff.LT.toFixed(2);

document.getElementById("c7Result").textContent =
    hc.c7.toFixed(4);

document.getElementById("c7Coeff").textContent =
    hc.c7.toFixed(4);

document.getElementById("c15Result").textContent =
    c15.c15.toFixed(4);

document.getElementById("c16Result").textContent =
    c16.c16.toFixed(4);

drawResistanceChart(total.breakdown);

// Run applicability check
const checks = checkApplicability(vessel, friction);
const valList = document.getElementById("validationList");
valList.innerHTML = "";

checks.forEach(check => {
    const li = document.createElement("li");
    li.style.margin = "8px 0";
    li.style.padding = "10px";
    li.style.borderRadius = "4px";
    li.style.fontWeight = "bold";
    li.style.listStyleType = "none";

    if (check.status === "PASS") {
        li.style.backgroundColor = "#e8f5e9";
        li.style.color = "#2e7d32";
        li.style.borderLeft = "5px solid #4caf50";
        li.textContent = `[PASS] ${check.name}: ${check.msg}`;
    } else if (check.status === "WARNING") {
        li.style.backgroundColor = "#fffde7";
        li.style.color = "#f57f17";
        li.style.borderLeft = "5px solid #fbc02d";
        li.textContent = `[WARNING] ${check.name}: ${check.msg}`;
    } else if (check.status === "OUT OF RANGE") {
        li.style.backgroundColor = "#ffebee";
        li.style.color = "#c62828";
        li.style.borderLeft = "5px solid #f44336";
        li.textContent = `[OUT OF RANGE] ${check.name}: ${check.msg}`;
    }
    valList.appendChild(li);
});

// Cache variables globally for report generator
window.lastCalculation = {
    vessel,
    friction,
    coeff,
    hc,
    c15,
    c16,
    total,
    power,
    propulsionData,
    checks
};

if (typeof window.autoSaveProject === "function") {
    window.autoSaveProject();
}

}

document.addEventListener("DOMContentLoaded", () => {
    const reportBtn = document.getElementById("generateReportBtn");
    if (reportBtn) {
        reportBtn.addEventListener("click", () => {
            if (typeof generatePDFReport === "function") {
                generatePDFReport();
            } else {
                alert("Please perform a calculation first.");
            }
        });
    }
});
function drawResistanceChart(breakdown) {

    const ctx = document
        .getElementById("resistanceChart")
        .getContext("2d");

    if (resistanceChart) {
        resistanceChart.destroy();
    }

    const dataValues = [
        Number(breakdown.friction / 1000),
        Number(breakdown.viscous / 1000),
        Number(breakdown.wave / 1000),
        Number(breakdown.bulb / 1000),
        Number(breakdown.transom / 1000),
        Number(breakdown.appendage / 1000),
        Number(breakdown.air / 1000),
        Number(breakdown.correlation / 1000)
    ];

    const scale = window.getDynamicScale(dataValues);

    resistanceChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: [
                "Friction",
                "Viscous",
                "Wave",
                "Bulb",
                "Transom",
                "Appendage",
                "Air",
                "Correlation"
            ],

            datasets: [{

                label: "Resistance (kN)",
                backgroundColor: [
                        "#2196F3",
                        "#4CAF50",
                        "#FF9800",
                        "#9C27B0",
                        "#FF5722",
                        "#795548",
                        "#607D8B",
                        "#E91E63"
                ],
                data: dataValues

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    display: false

                }

            },

            scales:{
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