let resistanceChart = null;
document.addEventListener("DOMContentLoaded",()=>{

document
.getElementById("calculateBtn")
.addEventListener("click",calculate);

});

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

speed:Number(document.getElementById("speed").value)

};

const S = wettedSurface(vessel);
const coeff = hullCoefficients(vessel);
const hc = holtropCoefficients(vessel);
const friction = frictionResistance(
    S,
    vessel.lwl,
    vessel.speed
);
const ff = formFactor(vessel);

const viscousResistance =
    (1 + ff.k1) *
    friction.Rf;
const wave =
    holtropWaveResistance(vessel);
const air =
    airResistance(vessel);
const appendage =
    appendageResistance(vessel);
const correlation =
    correlationAllowance(
        vessel,
        S
    );
const total =totalResistance(
        vessel,
        friction,
        viscousResistance,
        wave
    );
const power =
    effectivePower(
        vessel,
        total.Rt
    );
const propulsionData =
    propulsion(power);
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

document.getElementById("raResult").textContent =
    (total.airResistance / 1000).toFixed(2);

document.getElementById("rappResult").textContent =
    (total.appendageResistance / 1000).toFixed(2);

document.getElementById("caResult").textContent =
    (total.correlationAllowance / 1000).toFixed(2);

document.getElementById("rtResult").textContent =
    (total.Rt / 1000).toFixed(2);

document.getElementById("peResult").textContent =
    (total.effectivePower / 1000).toFixed(2);

document.getElementById("raResult").textContent =
    (air.Ra / 1000).toFixed(2);

document.getElementById("caResult").textContent =
    (correlation.RA / 1000).toFixed(2);

document.getElementById("peResult").textContent =
    (power.PE / 1000).toFixed(2);

document.getElementById("etaHResult").textContent =
    propulsionData.hullEfficiency.toFixed(3);

document.getElementById("etaOResult").textContent =
    propulsionData.propellerEfficiency.toFixed(3);

document.getElementById("pdResult").textContent =
    (propulsionData.deliveredPower / 1000).toFixed(2);

document.getElementById("pbResult").textContent =
    (propulsionData.brakePower / 1000).toFixed(2);

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

drawResistanceChart(
    friction,
    viscousResistance,
    wave
);
}
function drawResistanceChart(friction, viscous, wave) {

    const ctx = document
        .getElementById("resistanceChart")
        .getContext("2d");

    if (resistanceChart) {
        resistanceChart.destroy();
    }

    resistanceChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: [
                "Friction",
                "Viscous",
                "Wave"
            ],

            datasets: [{

                label: "Resistance (kN)",
                backgroundColor: [
                        "#2196F3",
                        "#4CAF50",
                        "#FF9800"
                ],
                data: [
                    Number(friction.Rf / 1000),
                    Number(viscous / 1000),
                    Number(wave.Rw / 1000)
                ]

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
                    beginAtZero: true
                }
            }

        }

    });

}