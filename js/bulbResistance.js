//-----------------------------------------------------
// Holtrop & Mennen Bulbous Bow Resistance
//-----------------------------------------------------

function bulbResistance(vessel) {
    const Abt = vessel.abt || 0;
    const hB = vessel.hb || 0;
    const T = vessel.draft || 0;

    if (Abt === 0) {
        return { Rb: 0 };
    }

    const rho = 1025.0;
    const g = 9.81;
    const V = vessel.speed * 0.514444;

    // Emergence parameter Pb
    const Pb_denom = T - 1.5 * hB;
    const Pb = 0.56 * Math.sqrt(Abt) / (Pb_denom <= 0 ? 0.01 : Pb_denom);

    // Froude number based on bulb immersion
    const Fni_denom = T - hB - 0.25 * Math.sqrt(Abt);
    const Fni = (V / Math.sqrt(g * Math.max(0.01, Fni_denom))) + 0.15 * V * V;

    // Additional pressure resistance Rb
    const Rb = 0.11 * Math.exp(-3 / (Pb * Pb || 1)) * Math.pow(Fni, 3) * Math.pow(Abt, 1.5) * (rho * g) / (1 + Fni * Fni);

    return { Rb };
}
