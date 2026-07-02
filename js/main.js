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

}