function holtropWaveResistance(vessel, c1, c2, c5, c15, c16, m1, m2, lambda) {

    const rho = 1025;
    const g = 9.81;

    // 1. Froude Number Calculation
    const V = vessel.speed * 0.514444;
    const Fn = V / Math.sqrt(g * vessel.lwl);
    const Cp = vessel.cb / vessel.cm;
    const displacement = vessel.disp;

    // 2. Bulbous Bow Parameter (c3)
    const c3 = 0.0; // Assuming no bulbous bow details are present

    // 3. Fallbacks and intermediate checks
    const _c1 = (c1 !== undefined) ? c1 : 1.0;
    const _c2 = (c2 !== undefined) ? c2 : Math.exp(-1.89 * Math.sqrt(c3)); // standard c2 with c3
    const _c5 = (c5 !== undefined) ? c5 : 1.0;
    const _m1 = (m1 !== undefined) ? m1 : 0.0;
    const _m2 = (m2 !== undefined) ? m2 : 0.0;
    const _lambda = (lambda !== undefined) ? lambda : 1.0;

    // 4. Wave Resistance Calculation (Rw)
    let Rw = 0;
    if (Fn > 0) {
        // Complete Holtrop & Mennen exponential and cosine correction term
        const exponent = _m1 * Math.pow(Fn, -0.9) + _m2 * Math.cos(_lambda / (Fn * Fn));
        Rw = _c1 * _c2 * _c5 * displacement * rho * g * Math.exp(exponent);
    }

    return {
        Cp,
        Fn,
        Rw
    };

}