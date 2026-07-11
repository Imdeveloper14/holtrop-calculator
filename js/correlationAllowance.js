function correlationAllowance(vessel, S) {

    const rho = 1025;
    const V = vessel.speed * 0.514444;

    const L = vessel.lwl || 1.0;
    const B = vessel.beam || 1.0;
    const T = vessel.draft || 1.0;
    const Cb = vessel.cb || 0.8;

    // c4 coefficient
    const ratio_TL = T / L;
    const c4 = ratio_TL <= 0.04 ? ratio_TL : 0.04;

    // c3 bulb parameter and c2 coefficient
    const Abt = vessel.abt || 0;
    const hB = vessel.hb || 0;
    let c2 = 1.0;
    if (Abt > 0) {
        const c3 = 0.56 * Math.pow(Abt, 1.5) / (B * T * (0.56 * Math.sqrt(Abt) + T - hB));
        c2 = Math.exp(-1.89 * Math.sqrt(c3));
    }

    // Published Holtrop & Mennen Correlation Allowance Coefficient CA
    const CA = 0.006 * Math.pow(L + 100, -0.16) - 0.00205 + 0.003 * Math.sqrt(L / 7.5) * Math.pow(Cb, 4) * c2 * (0.04 - c4);

    const RA =
        0.5 *
        rho *
        V * V *
        S *
        CA;

    return {

        CA,

        RA

    };

}