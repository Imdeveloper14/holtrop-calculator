//-----------------------------------------------------
// Holtrop & Mennen c16 Coefficient
//-----------------------------------------------------

function holtropC16(vessel) {
    const Cp = vessel.cb / vessel.cm;
    let c16;

    if (Cp < 0.8) {
        c16 = 8.07981 * Cp - 13.8673 * Math.pow(Cp, 2) + 6.984388 * Math.pow(Cp, 3);
    } else {
        c16 = 1.73014 - 0.7067 * Cp;
    }

    return { c16 };
}
