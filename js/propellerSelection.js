//-----------------------------------------------------
// Holtrop & Mennen Propeller Selection Module
//-----------------------------------------------------

function calculatePropellerSelection(vessel, total) {
    const numProps = vessel.numPropellers || 1;
    const D = vessel.propDiameter || 4.0;
    const PD = vessel.propPitch || 1.0;
    const EAR = vessel.propEAR || 0.55;
    const Z = vessel.propBlades || 4;
    const RPM = vessel.propRPM || 120;
    const w = vessel.wakeFraction || 0.25;
    const t = vessel.thrustDeduction || 0.18;
    const etaR = vessel.rotativeEfficiency || 1.0;

    const rho = 1025.0; // Water density
    const Vs = vessel.speed * 0.514444; // Speed in m/s
    const Va = Vs * (1.0 - w);
    const n = RPM / 60.0; // Revolutions per second

    // Advance coefficient J
    let J = 0;
    if (n > 0 && D > 0) {
        J = Va / (n * D);
    }

    // Standard B-series KT and KQ approximation equations
    const KT = Math.max(0, 0.395 * PD - 0.31 * J - 0.11 * J * J + 0.08 * EAR - 0.005 * Z);
    const KQ = Math.max(0, 0.0535 * PD - 0.038 * J - 0.014 * J * J + 0.012 * EAR - 0.0006 * Z);

    // Thrust Required
    const T_req = total.Rt / (numProps * (1.0 - t)); // in N

    // Torque
    const torque = KQ * rho * n * n * Math.pow(D, 5); // in Nm

    // Open Water Efficiency etaO
    let etaO = 0;
    if (KQ > 0) {
        etaO = (J / (2.0 * Math.PI)) * (KT / KQ);
    }

    // Hull Efficiency etaH
    const etaH = (1.0 - t) / (1.0 - w);

    // Propulsive Coefficient PC
    const PC = etaH * etaO * etaR;

    return {
        Va,
        J,
        KT,
        KQ,
        thrust: T_req,
        torque,
        etaO,
        etaH,
        PC
    };
}
