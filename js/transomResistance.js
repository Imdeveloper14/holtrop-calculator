//-----------------------------------------------------
// Holtrop & Mennen Immersed Transom Stern Resistance
//-----------------------------------------------------

function transomResistance(vessel) {
    const At = vessel.at || 0; // Transom area

    if (At === 0) {
        return { Rtr: 0 };
    }

    const rho = 1025.0;
    const g = 9.81;
    const V = vessel.speed * 0.514444;

    const B = vessel.beam || 1.0;
    const Cwp = vessel.cwp || 0.8;

    // Transom Froude Number FnT
    const hT = At / (B * (1 + Cwp));
    const FnT = V / Math.sqrt(2 * g * hT);

    // Coefficient c6
    let c6 = 0;
    if (FnT < 5) {
        c6 = 0.2 * (1 - 0.2 * FnT);
    }

    const Rtr = 0.5 * rho * V * V * At * c6;

    return { Rtr };
}
