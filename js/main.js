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
    calculateWaveResistance(vessel);

// Display Results
console.log(document.getElementById("reResult"));
console.log(document.getElementById("fnResult"));
console.log(document.getElementById("cfResult"));
console.log(document.getElementById("rfResult"));
console.log(document.getElementById("sResult"));
console.log(document.getElementById("cpResult"));
console.log(document.getElementById("k1Result"));
console.log(document.getElementById("rvResult"));
console.log(document.getElementById("rwResult"));

console.log("Friction:", friction);
console.log("Wave:", wave);
console.log("Chart:", typeof Chart);
console.log("Canvas:", document.getElementById("resistanceChart"));
console.log("rwResult:", document.getElementById("rwResult"));

console.log("Canvas:", document.getElementById("resistanceChart"));
console.log("Chart:", typeof Chart);
console.log("Wave:", wave);
console.log("Friction:", friction);
console.log("Rf =", friction.Rf);
console.log("Viscous =", viscousResistance);
console.log("Rw =", wave.Rw);
console.log("Rf =", friction.Rf);
console.log("Viscous =", viscousResistance);
console.log("Rw =", wave.Rw);

console.log({
    friction: friction.Rf / 1000,
    viscous: viscousResistance / 1000,
    wave: wave.Rw / 1000
});
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